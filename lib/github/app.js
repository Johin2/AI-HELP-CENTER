import { App } from '@octokit/app';
import { Octokit } from '@octokit/rest';
import { paginateRest } from '@octokit/plugin-paginate-rest';
import { Webhooks } from '@octokit/webhooks';
import { listTarEntries } from '@/lib/github/archive.js';
import { fetchRepositoryFilesFromTree, fetchRepositoryTree } from '@/lib/github/tree.js';
import { fetchFilesByPath } from '@/lib/github/files.js';

const PaginatedOctokit = Octokit.plugin(paginateRest);

export class GitHubApp {
  /**
   * @param {{
   *   appId?: string;
   *   clientId?: string;
   *   clientSecret?: string;
   *   privateKey?: string;
   *   webhookSecret?: string;
   *   apiBaseUrl?: string;
   * }} config
   */
  constructor(config = {}) {
    this.config = config;

    if (this.isConfigured()) {
      this.app = new App({
        appId: config.appId,
        privateKey: config.privateKey,
        oauth: {
          clientId: config.clientId,
          clientSecret: config.clientSecret,
        },
        webhooks: config.webhookSecret ? { secret: config.webhookSecret } : undefined,
        Octokit: PaginatedOctokit.defaults({ baseUrl: config.apiBaseUrl }),
      });
      this.webhooks = new Webhooks({ secret: config.webhookSecret ?? 'development' });
    } else {
      this.app = null;
      this.webhooks = null;
    }
  }

  isConfigured() {
    return Boolean(this.config.appId && this.config.privateKey && this.config.clientId && this.config.clientSecret);
  }

  /**
   * @param {number} installationId
   * @returns {Promise<InstanceType<typeof Octokit>>}
   */
  async getInstallationOctokit(installationId) {
    if (!this.app) {
      throw new Error('GitHub App is not configured.');
    }
    return this.app.getInstallationOctokit(installationId);
  }

  /**
   * @param {number} installationId
   */
  async listInstallationRepositories(installationId) {
    const octokit = await this.getInstallationOctokit(installationId);
    const repositories = await octokit.paginate(octokit.rest.apps.listReposAccessibleToInstallation, {
      per_page: 100,
    });

    return repositories.map((repo) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      owner: repo.owner,
      private: repo.private,
      default_branch: repo.default_branch,
      updated_at: repo.updated_at,
    }));
  }

  /**
   * @param {InstanceType<typeof Octokit>} octokit
   * @param {string} owner
   * @param {string} repo
   * @param {string} branch
   */
  async getBranch(octokit, owner, repo, branch) {
    const { data } = await octokit.rest.repos.getBranch({ owner, repo, branch });
    return data;
  }

  /**
   * @param {InstanceType<typeof Octokit>} octokit
   * @param {{ owner: string; repo: string; ref: string; maxFileSize: number; concurrentRequests: number }} options
   * @returns {Promise<import('@/lib/indexing/types.js').RepositorySnapshotFile[]>}
   */
  async fetchRepositorySnapshot(octokit, options) {
    const tree = await fetchRepositoryTree(octokit, {
      owner: options.owner,
      repo: options.repo,
      ref: options.ref,
    });

    if (tree.truncated) {
      const archive = await octokit.request('GET /repos/{owner}/{repo}/tarball/{ref}', {
        owner: options.owner,
        repo: options.repo,
        ref: options.ref,
      });

      const entries = await listTarEntries(archive.data);
      return entries.filter((entry) => entry.size <= options.maxFileSize);
    }

    return fetchRepositoryFilesFromTree(octokit, {
      owner: options.owner,
      repo: options.repo,
      tree,
      maxFileSize: options.maxFileSize,
      concurrentRequests: options.concurrentRequests,
    });
  }

  /**
   * @param {InstanceType<typeof Octokit>} octokit
   * @param {{ owner: string; repo: string; ref: string; paths: string[]; maxFileSize: number; concurrentRequests: number }} options
   * @returns {Promise<import('@/lib/indexing/types.js').RepositorySnapshotFile[]>}
   */
  async fetchFilesForPaths(octokit, options) {
    return fetchFilesByPath(octokit, options);
  }

  /**
   * @param {string} event
   * @param {(payload: any) => Promise<void> | void} handler
   */
  on(event, handler) {
    this.webhooks?.on(event, handler);
  }

  /**
   * @param {{ id: string; name: string; signature256?: string; payload: string }} event
   */
  async verifyWebhook(event) {
    if (!this.webhooks) {
      throw new Error('GitHub webhooks not configured.');
    }

    await this.webhooks.verifyAndReceive({
      id: event.id,
      name: event.name,
      signature: event.signature256,
      payload: event.payload,
    });
  }
}

