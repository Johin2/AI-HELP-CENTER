import { Buffer } from 'node:buffer';
import tar from 'tar';

/** @typedef {import('@/lib/indexing/types.js').RepositorySnapshotFile} RepositorySnapshotFile */

const toBuffer = async (data) => {
  if (!data) {
    return Buffer.alloc(0);
  }

  if (Buffer.isBuffer(data)) {
    return data;
  }

  if (ArrayBuffer.isView(data)) {
    return Buffer.from(data.buffer);
  }

  if (data instanceof ArrayBuffer) {
    return Buffer.from(data);
  }

  if (typeof data === 'string') {
    return Buffer.from(data, 'utf8');
  }

  if (typeof data.arrayBuffer === 'function') {
    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  if (Symbol.asyncIterator in Object(data)) {
    const chunks = [];
    for await (const chunk of data) {
      chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  throw new Error('Unsupported archive response format.');
};

/**
 * @param {unknown} archiveData
 * @returns {Promise<RepositorySnapshotFile[]>}
 */
export const listTarEntries = async (archiveData) => {
  const buffer = await toBuffer(archiveData);
  const entries = [];

  await tar
    .list({
      onentry: (entry) => {
        if (entry.type !== 'File') {
          entry.resume();
          return;
        }

        const parts = entry.path.split('/');
        parts.shift();
        const relativePath = parts.join('/');

        if (!relativePath) {
          entry.resume();
          return;
        }

        const chunks = [];
        entry.on('data', (chunk) => {
          chunks.push(Buffer.from(chunk));
        });
        entry.on('end', () => {
          const fileBuffer = Buffer.concat(chunks);
          entries.push({
            path: relativePath,
            content: fileBuffer.toString('utf8'),
            sha: entry.header?.cksum?.toString() ?? '',
            size: fileBuffer.length,
          });
        });
      },
    })
    .end(buffer);

  return entries;
};

