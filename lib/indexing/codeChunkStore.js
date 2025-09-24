import { createClient } from '@supabase/supabase-js';

/** @typedef {import('./types.js').CodeChunkRecord} CodeChunkRecord */

export class SupabaseCodeChunkStore {
  /**
   * @param {{ url?: string; key?: string; table?: string }} config
   */
  constructor(config = {}) {
    this.table = config.table ?? 'repo_code_chunks';
    this.client = config.url && config.key ? createClient(config.url, config.key) : null;
    this.matchFunction = config.matchFunction ?? 'match_repo_code_chunks';
  }

  /**
   * @returns {boolean}
   */
  isEnabled() {
    return Boolean(this.client);
  }

  /**
   * @param {CodeChunkRecord[]} chunks
   * @returns {Promise<void>}
   */
  async upsertChunks(chunks) {
    if (!this.isEnabled() || chunks.length === 0) {
      return;
    }

    const payload = chunks.map((chunk) => ({
      id: chunk.id,
      installation_id: chunk.installationId,
      repository_id: chunk.repositoryId,
      repository_name: chunk.repositoryName,
      branch: chunk.branch,
      path: chunk.path,
      language: chunk.language,
      symbol: chunk.symbol,
      start_line: chunk.startLine,
      end_line: chunk.endLine,
      commit_sha: chunk.commitSha,
      content: chunk.text,
      embedding: chunk.embedding,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await this.client.from(this.table).upsert(payload, { onConflict: 'id' });

    if (error) {
      throw new Error(`Failed to upsert code chunks: ${error.message}`);
    }
  }

  /**
   * @param {{ installationId: number; repositoryId: number; paths: string[] }} params
   * @returns {Promise<void>}
   */
  async deleteChunksByPath({ installationId, repositoryId, paths }) {
    if (!this.isEnabled() || !Array.isArray(paths) || paths.length === 0) {
      return;
    }

    const { error } = await this.client
      .from(this.table)
      .delete()
      .match({ installation_id: installationId, repository_id: repositoryId })
      .in('path', paths);

    if (error) {
      throw new Error(`Failed to delete code chunks: ${error.message}`);
    }
  }

  async deleteRepository(installationId, repositoryId) {
    if (!this.isEnabled()) {
      return;
    }

    const { error } = await this.client
      .from(this.table)
      .delete()
      .match({ installation_id: installationId, repository_id: repositoryId });

    if (error) {
      throw new Error(`Failed to delete repository chunks: ${error.message}`);
    }
  }

  /**
   * @param {{
   *   installationId: number;
   *   repositoryIds?: number[];
   *   limit?: number;
   *   embedding: number[];
   *   filters?: { language?: string[]; pathPrefix?: string };
   * }} params
   * @returns {Promise<CodeChunkRecord[]>}
   */
  async query(params) {
    if (!this.isEnabled()) {
      return [];
    }

    const { installationId, repositoryIds, limit = 8, embedding, filters = {} } = params;

    const rpcPayload = {
      query_embedding: embedding,
      match_count: limit,
      installation_identifier: installationId,
      repository_filter: repositoryIds ?? null,
      language_filter: filters.language ?? null,
      path_prefix: filters.pathPrefix ?? null,
    };

    const { data, error } = await this.client.rpc(this.matchFunction, rpcPayload);

    if (error) {
      throw new Error(`Failed to query code chunks: ${error.message}`);
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      installationId: row.installation_id,
      repositoryId: row.repository_id,
      repositoryName: row.repository_name,
      branch: row.branch,
      path: row.path,
      language: row.language,
      symbol: row.symbol,
      startLine: row.start_line,
      endLine: row.end_line,
      commitSha: row.commit_sha,
      text: row.content,
      embedding: row.embedding ?? [],
      score: row.score,
    }));
  }
}

export class InMemoryCodeChunkStore {
  constructor() {
    /** @type {CodeChunkRecord[]} */
    this.chunks = [];
  }

  isEnabled() {
    return true;
  }

  async upsertChunks(chunks) {
    const map = new Map(this.chunks.map((chunk) => [chunk.id, chunk]));
    for (const chunk of chunks) {
      map.set(chunk.id, chunk);
    }
    this.chunks = Array.from(map.values());
  }

  async deleteChunksByPath({ installationId, repositoryId, paths }) {
    const pathSet = new Set(paths);
    this.chunks = this.chunks.filter(
      (chunk) =>
        !(chunk.installationId === installationId && chunk.repositoryId === repositoryId && pathSet.has(chunk.path)),
    );
  }

  async deleteRepository(installationId, repositoryId) {
    this.chunks = this.chunks.filter(
      (chunk) => !(chunk.installationId === installationId && chunk.repositoryId === repositoryId),
    );
  }

  async query({ installationId, repositoryIds, limit = 8 }) {
    return this.chunks
      .filter((chunk) => {
        if (chunk.installationId !== installationId) {
          return false;
        }
        if (Array.isArray(repositoryIds) && repositoryIds.length > 0) {
          return repositoryIds.includes(chunk.repositoryId);
        }
        return true;
      })
      .slice(0, limit)
      .map((chunk) => ({ ...chunk, score: 1 }));
  }
}

