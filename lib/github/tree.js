import { Buffer } from 'node:buffer';
import pLimit from 'p-limit';

/**
 * @param {InstanceType<import('@octokit/rest').Octokit>} octokit
 * @param {{ owner: string; repo: string; ref: string }} options
 */
export const fetchRepositoryTree = async (octokit, options) => {
  const { data } = await octokit.rest.git.getTree({
    owner: options.owner,
    repo: options.repo,
    tree_sha: options.ref,
    recursive: 'true',
  });

  return data;
};

/**
 * @param {InstanceType<import('@octokit/rest').Octokit>} octokit
 * @param {{
 *   owner: string;
 *   repo: string;
 *   tree: import('@octokit/openapi-types').components['schemas']['git-tree'];
 *   maxFileSize: number;
 *   concurrentRequests: number;
 * }} options
 */
export const fetchRepositoryFilesFromTree = async (octokit, options) => {
  const blobs = (options.tree.tree ?? []).filter((entry) => entry.type === 'blob');
  const limit = pLimit(options.concurrentRequests ?? 5);

  const results = await Promise.all(
    blobs.map((blob) =>
      limit(async () => {
        if (options.maxFileSize && blob.size && blob.size > options.maxFileSize) {
          return null;
        }

        const { data } = await octokit.rest.git.getBlob({
          owner: options.owner,
          repo: options.repo,
          file_sha: blob.sha,
        });

        const encoding = data.encoding === 'base64' ? 'base64' : 'utf8';
        const buffer = Buffer.from(data.content, encoding);

        if (options.maxFileSize && buffer.length > options.maxFileSize) {
          return null;
        }

        return {
          path: blob.path,
          content: buffer.toString('utf8'),
          size: buffer.length,
          sha: blob.sha,
        };
      }),
    ),
  );

  return results.filter((file) => file !== null);
};

