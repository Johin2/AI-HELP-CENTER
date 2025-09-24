import { describe, expect, it, vi } from 'vitest';

import { GeminiEmbeddingsClient } from '@/lib/gemini/embeddings.js';
import { RepoRetriever } from '@/lib/retrieval/repoRetriever.js';

describe('RepoRetriever', () => {
  it('returns empty results when the store is disabled', async () => {
    const embeddings = new GeminiEmbeddingsClient();
    const chunkStore = { isEnabled: () => false };
    const retriever = new RepoRetriever({ embeddings, chunkStore });

    const results = await retriever.retrieve('How does it work?', { installationId: 1 });
    expect(results).toEqual([]);
  });

  it('maps chunks to retrieved docs with GitHub citations', async () => {
    const embeddings = new GeminiEmbeddingsClient();
    const chunkStore = {
      isEnabled: () => true,
      query: vi.fn().mockResolvedValue([
        {
          id: 'chunk-1',
          installationId: 1,
          repositoryId: 2,
          repositoryName: 'acme/widgets',
          branch: 'main',
          path: 'src/index.ts',
          language: 'typescript',
          symbol: 'init',
          startLine: 10,
          endLine: 20,
          commitSha: 'abc123',
          text: 'export function init() {}',
          score: 0.8,
        },
      ]),
    };

    const retriever = new RepoRetriever({ embeddings, chunkStore, defaultTopK: 4 });
    const results = await retriever.retrieve('How does it work?', { installationId: 1, repositoryIds: [2] });

    expect(chunkStore.query).toHaveBeenCalledWith({
      installationId: 1,
      repositoryIds: [2],
      limit: 4,
      embedding: expect.any(Array),
    });

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      id: 'chunk-1',
      title: 'acme/widgets/src/index.ts',
      url: 'https://github.com/acme/widgets/blob/main/src/index.ts#L10-L20',
      text: 'export function init() {}',
      extra: expect.objectContaining({
        repository: 'acme/widgets',
        path: 'src/index.ts',
        start_line: 10,
        end_line: 20,
        language: 'typescript',
        symbol: 'init',
        commit: 'abc123',
      }),
    });
  });
});

