import { createClient } from '@supabase/supabase-js';

export class SupabaseRepositoryStore {
  /**
   * @param {{ url?: string; key?: string; table?: string }} config
   */
  constructor(config = {}) {
    this.table = config.table ?? 'repository_indexes';
    this.client = config.url && config.key ? createClient(config.url, config.key) : null;
  }

  isEnabled() {
    return Boolean(this.client);
  }

  /**
   * @param {number} installationId
   * @returns {Promise<Record<string, any>[]>}
   */
  async listRepositories(installationId) {
    if (!this.isEnabled()) {
      return [];
    }

    const { data, error } = await this.client
      .from(this.table)
      .select('*')
      .eq('installation_id', installationId);

    if (error) {
      throw new Error(`Failed to list repositories: ${error.message}`);
    }

    return data ?? [];
  }

  /**
   * @param {{
   *   installationId: number;
   *   repositoryId: number;
   *   repositoryName: string;
   *   defaultBranch: string;
   *   enabled?: boolean;
   *   status?: string;
   *   lastIndexedCommit?: string;
   *   indexedAt?: string;
   *   error?: string | null;
   * }} payload
   * @returns {Promise<void>}
   */
  async upsertRepository(payload) {
    if (!this.isEnabled()) {
      return;
    }

    const record = {
      installation_id: payload.installationId,
      repository_id: payload.repositoryId,
      repository_name: payload.repositoryName,
      default_branch: payload.defaultBranch,
      enabled: payload.enabled ?? true,
      status: payload.status ?? 'pending',
      last_indexed_commit: payload.lastIndexedCommit ?? null,
      indexed_at: payload.indexedAt ?? null,
      error: payload.error ?? null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await this.client
      .from(this.table)
      .upsert(record, { onConflict: 'installation_id,repository_id' });

    if (error) {
      throw new Error(`Failed to upsert repository: ${error.message}`);
    }
  }

  /**
   * @param {number} installationId
   * @param {number} repositoryId
   * @param {Partial<{ enabled: boolean; status: string; lastIndexedCommit: string; indexedAt: string; error: string | null }>} updates
   */
  async updateRepository(installationId, repositoryId, updates) {
    if (!this.isEnabled()) {
      return;
    }

    const record = { updated_at: new Date().toISOString() };

    if (typeof updates.enabled === 'boolean') {
      record.enabled = updates.enabled;
    }

    if (typeof updates.status === 'string') {
      record.status = updates.status;
    }

    if (typeof updates.lastIndexedCommit === 'string') {
      record.last_indexed_commit = updates.lastIndexedCommit;
    }

    if (typeof updates.indexedAt === 'string') {
      record.indexed_at = updates.indexedAt;
    }

    if (updates.error !== undefined) {
      record.error = updates.error;
    }

    const { error } = await this.client
      .from(this.table)
      .update(record)
      .match({ installation_id: installationId, repository_id: repositoryId });

    if (error) {
      throw new Error(`Failed to update repository: ${error.message}`);
    }
  }

  /**
   * @param {number} installationId
   * @param {number} repositoryId
   * @returns {Promise<void>}
   */
  async deleteRepository(installationId, repositoryId) {
    if (!this.isEnabled()) {
      return;
    }

    const { error } = await this.client
      .from(this.table)
      .delete()
      .match({ installation_id: installationId, repository_id: repositoryId });

    if (error) {
      throw new Error(`Failed to delete repository: ${error.message}`);
    }
  }
}

export class InMemoryRepositoryStore {
  constructor() {
    this.records = new Map();
  }

  isEnabled() {
    return true;
  }

  async listRepositories(installationId) {
    return Array.from(this.records.values()).filter((record) => record.installation_id === installationId);
  }

  async upsertRepository(payload) {
    this.records.set(`${payload.installationId}:${payload.repositoryId}`, {
      installation_id: payload.installationId,
      repository_id: payload.repositoryId,
      repository_name: payload.repositoryName,
      default_branch: payload.defaultBranch,
      enabled: payload.enabled ?? true,
      status: payload.status ?? 'pending',
      last_indexed_commit: payload.lastIndexedCommit ?? null,
      indexed_at: payload.indexedAt ?? null,
      error: payload.error ?? null,
    });
  }

  async updateRepository(installationId, repositoryId, updates) {
    const key = `${installationId}:${repositoryId}`;
    const existing = this.records.get(key) ?? {};
    this.records.set(key, {
      ...existing,
      enabled: updates.enabled ?? existing.enabled,
      status: updates.status ?? existing.status,
      last_indexed_commit: updates.lastIndexedCommit ?? existing.last_indexed_commit,
      indexed_at: updates.indexedAt ?? existing.indexed_at,
      error: updates.error ?? existing.error,
    });
  }

  async deleteRepository(installationId, repositoryId) {
    this.records.delete(`${installationId}:${repositoryId}`);
  }
}

