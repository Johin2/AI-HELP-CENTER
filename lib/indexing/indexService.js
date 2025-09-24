import pLimit from 'p-limit';

import { chunkSourceFile, shouldSkipFile } from '@/lib/indexing/codeChunker.js';

/** @typedef {import('@/lib/indexing/types.js').RepositorySnapshotFile} RepositorySnapshotFile */

export class RepositoryIndexService {
  /**
   * @param {{
   *   githubApp: import('@/lib/github/app.js').GitHubApp | null;
   *   chunkStore: import('@/lib/indexing/codeChunkStore.js').SupabaseCodeChunkStore | import('@/lib/indexing/codeChunkStore.js').InMemoryCodeChunkStore;
   *   repositoryStore: import('@/lib/indexing/repositoryStore.js').SupabaseRepositoryStore | import('@/lib/indexing/repositoryStore.js').InMemoryRepositoryStore;
   *   embeddings: import('@/lib/gemini/embeddings.js').GeminiEmbeddingsClient;
   *   config: {
   *     maxFileSizeBytes: number;
   *     concurrentBlobRequests: number;
   *     chunkLines: number;
   *     chunkOverlapLines: number;
   *     defaultTopK: number;
   *   };
   * }} options
   */
  constructor(options) {
    this.githubApp = options.githubApp;
    this.chunkStore = options.chunkStore;
    this.repositoryStore = options.repositoryStore;
    this.embeddings = options.embeddings;
    this.config = options.config;
  }

  isEnabled() {
    return Boolean(this.githubApp?.isConfigured?.());
  }

  /**
   * @param {number} installationId
   */
  async listRepositories(installationId) {
    if (!this.isEnabled()) {
      return [];
    }

    const [accessibleRepos, stored] = await Promise.all([
      this.githubApp.listInstallationRepositories(installationId),
      this.repositoryStore.listRepositories(installationId),
    ]);

    const storedById = new Map(stored.map((record) => [record.repository_id, record]));

    return accessibleRepos.map((repo) => {
      const storedRecord = storedById.get(repo.id);
      return {
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        default_branch: repo.default_branch,
        private: repo.private,
        updated_at: repo.updated_at,
        enabled: storedRecord ? storedRecord.enabled : false,
        status: storedRecord ? storedRecord.status : 'never_indexed',
        last_indexed_commit: storedRecord ? storedRecord.last_indexed_commit : null,
        indexed_at: storedRecord ? storedRecord.indexed_at : null,
        error: storedRecord ? storedRecord.error : null,
      };
    });
  }

  /**
   * @param {{ installationId: number; repositoryId: number; enabled: boolean }} payload
   */
  async setRepositoryEnabled(payload) {
    if (!this.isEnabled()) {
      return;
    }

    await this.repositoryStore.updateRepository(payload.installationId, payload.repositoryId, {
      enabled: payload.enabled,
    });
  }

  /**
   * @param {number} installationId
   * @param {import('@octokit/rest').RestEndpointMethodTypes['repos']['get']['response']['data']} repo
   */
  async indexRepository(installationId, repo) {
    if (!this.isEnabled()) {
      throw new Error('GitHub App not configured.');
    }

    const octokit = await this.githubApp.getInstallationOctokit(installationId);

    await this.repositoryStore.upsertRepository({
      installationId,
      repositoryId: repo.id,
      repositoryName: repo.full_name,
      defaultBranch: repo.default_branch,
      status: 'indexing',
      enabled: true,
    });

    const branch = await this.githubApp.getBranch(octokit, repo.owner.login, repo.name, repo.default_branch);
    const commitSha = branch.commit.sha;

    const snapshot = await this.githubApp.fetchRepositorySnapshot(octokit, {
      owner: repo.owner.login,
      repo: repo.name,
      ref: commitSha,
      maxFileSize: this.config.maxFileSizeBytes,
      concurrentRequests: this.config.concurrentBlobRequests,
    });

    const chunks = await this.chunkFiles({
      files: snapshot,
      installationId,
      repository: repo,
      commitSha,
    });

    await this.persistChunks(chunks);

    await this.repositoryStore.updateRepository(installationId, repo.id, {
      status: 'indexed',
      lastIndexedCommit: commitSha,
      indexedAt: new Date().toISOString(),
      error: null,
    });

    return { repositoryId: repo.id, chunks: chunks.length };
  }

  /**
   * @param {{
   *   installationId: number;
   *   repository: import('@octokit/rest').RestEndpointMethodTypes['repos']['get']['response']['data'];
   *   ref: string;
   *   paths: string[];
   *   commitSha: string;
   * }} input
   */
  async reindexChangedFiles(input) {
    if (!this.isEnabled()) {
      return;
    }

    const octokit = await this.githubApp.getInstallationOctokit(input.installationId);

    const files = await this.githubApp.fetchFilesForPaths(octokit, {
      owner: input.repository.owner.login,
      repo: input.repository.name,
      ref: input.ref,
      paths: input.paths,
      maxFileSize: this.config.maxFileSizeBytes,
      concurrentRequests: this.config.concurrentBlobRequests,
    });

    const chunks = await this.chunkFiles({
      files,
      installationId: input.installationId,
      repository: input.repository,
      commitSha: input.commitSha,
    });

    await this.persistChunks(chunks);
  }

  /**
   * @param {{
   *   files: RepositorySnapshotFile[];
   *   installationId: number;
   *   repository: import('@octokit/rest').RestEndpointMethodTypes['repos']['get']['response']['data'];
   *   commitSha: string;
   * }} params
   * @returns {Promise<import('@/lib/indexing/types.js').CodeChunkRecord[]>}
   */
  async chunkFiles(params) {
    const { files, installationId, repository, commitSha } = params;
    const chunkInputs = [];

    for (const file of files) {
      if (file.size > this.config.maxFileSizeBytes || shouldSkipFile(file)) {
        continue;
      }

      const chunks = chunkSourceFile({
        path: file.path,
        content: file.content,
        installationId,
        repositoryId: repository.id,
        commitSha,
        maxChunkLines: this.config.chunkLines,
        overlapLines: this.config.chunkOverlapLines,
      });

      for (const chunk of chunks) {
        chunkInputs.push({
          ...chunk,
          repositoryName: repository.full_name,
          branch: repository.default_branch,
        });
      }
    }

    return chunkInputs;
  }

  /**
   * @param {import('@/lib/indexing/types.js').CodeChunkRecord[]} chunks
   */
  async persistChunks(chunks) {
    if (chunks.length === 0) {
      return;
    }

    const limit = pLimit(4);
    const embeddings = await Promise.all(
      chunks.map((chunk) =>
        limit(async () => ({
          id: chunk.id,
          embedding: await this.embeddings.embedText(chunk.text),
        })),
      ),
    );

    const embeddingById = new Map(embeddings.map((item) => [item.id, item.embedding]));

    const enriched = chunks.map((chunk) => ({
      ...chunk,
      embedding: embeddingById.get(chunk.id) ?? [],
    }));

    await this.chunkStore.upsertChunks(enriched);
  }

  /**
   * @param {import('@octokit/webhooks-types').PushEvent} payload
   */
  async handlePushEvent(payload) {
    if (!this.isEnabled()) {
      return;
    }

    const installationId = payload.installation?.id;
    if (!installationId) {
      return;
    }

    const repo = payload.repository;
    const branch = payload.ref.replace('refs/heads/', '');
    const repositoryData = {
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      owner: { login: repo.owner.login },
      default_branch: branch,
    };

    const changedPaths = new Set();
    for (const commit of payload.commits ?? []) {
      for (const filePath of commit.added ?? []) {
        changedPaths.add(filePath);
      }
      for (const filePath of commit.modified ?? []) {
        changedPaths.add(filePath);
      }
    }

    const removedPaths = new Set();
    for (const commit of payload.commits ?? []) {
      for (const filePath of commit.removed ?? []) {
        removedPaths.add(filePath);
      }
    }

    if (removedPaths.size > 0) {
      await this.chunkStore.deleteChunksByPath({
        installationId,
        repositoryId: repo.id,
        paths: Array.from(removedPaths),
      });
    }

    if (changedPaths.size > 0) {
      await this.reindexChangedFiles({
        installationId,
        repository: repositoryData,
        ref: payload.after,
        paths: Array.from(changedPaths),
        commitSha: payload.after,
      });
    }

    await this.repositoryStore.updateRepository(installationId, repo.id, {
      lastIndexedCommit: payload.after,
      indexedAt: new Date().toISOString(),
      status: 'indexed',
    });
  }
}

