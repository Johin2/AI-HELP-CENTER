import { Buffer } from 'node:buffer';
import pLimit from 'p-limit';

/**
 * @param {InstanceType<import('@octokit/rest').Octokit>} octokit
 * @param {{ owner: string; repo: string; ref: string; paths: string[]; maxFileSize: number; concurrentRequests: number }} options
 */
export const fetchFilesByPath = async (octokit, options) => {
  const limit = pLimit(options.concurrentRequests ?? 5);

  const files = await Promise.all(
    options.paths.map((path) =>
      limit(async () => {
        try {
          const { data } = await octokit.rest.repos.getContent({
            owner: options.owner,
            repo: options.repo,
            path,
            ref: options.ref,
          });

          if (Array.isArray(data) || data.type !== 'file') {
            return null;
          }

          const buffer = Buffer.from(data.content, data.encoding === 'base64' ? 'base64' : 'utf8');

          if (options.maxFileSize && buffer.length > options.maxFileSize) {
            return null;
          }

          return {
            path,
            content: buffer.toString('utf8'),
            size: buffer.length,
            sha: data.sha,
          };
        } catch (error) {
          if (error.status === 404) {
            return null;
          }
          throw error;
        }
      }),
    ),
  );

  return files.filter(Boolean);
};

