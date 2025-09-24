import { AppConfig } from '@/lib/config.js';

/** @typedef {import('@/lib/types.js').RetrievedDoc} RetrievedDoc */

export class RepoRetriever {
  /**
   * @param {{
   *   embeddings: import('@/lib/gemini/embeddings.js').GeminiEmbeddingsClient;
   *   chunkStore: import('@/lib/indexing/codeChunkStore.js').SupabaseCodeChunkStore | import('@/lib/indexing/codeChunkStore.js').InMemoryCodeChunkStore;
   *   defaultTopK?: number;
   * }} options
   */
  constructor(options) {
    this.embeddings = options.embeddings;
    this.chunkStore = options.chunkStore;
    this.defaultTopK = options.defaultTopK ?? AppConfig.repositoryIndexing.defaultTopK ?? 8;
  }

  isEnabled() {
    return this.chunkStore?.isEnabled?.();
  }

  /**
   * @param {string} question
   * @param {{ installationId: number; repositoryIds?: number[]; limit?: number }} options
   * @returns {Promise<RetrievedDoc[]>}
   */
  async retrieve(question, options) {
    if (!this.isEnabled()) {
      return [];
    }

    const embedding = await this.embeddings.embedText(question);
    const results = await this.chunkStore.query({
      installationId: options.installationId,
      repositoryIds: options.repositoryIds,
      limit: options.limit ?? this.defaultTopK,
      embedding,
    });

    return results.map((chunk, index) => {
      const url = `https://github.com/${chunk.repositoryName}/blob/${chunk.branch}/${chunk.path}#L${chunk.startLine}-L${chunk.endLine}`;
      return {
        id: chunk.id,
        title: `${chunk.repositoryName}/${chunk.path}`,
        url,
        text: chunk.text,
        extra: {
          repository: chunk.repositoryName,
          path: chunk.path,
          start_line: chunk.startLine,
          end_line: chunk.endLine,
          language: chunk.language,
          symbol: chunk.symbol,
          commit: chunk.commitSha,
          score: chunk.score ?? 1 / (index + 1),
        },
      };
    });
  }
}

