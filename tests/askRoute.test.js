import { describe, expect, it, vi } from 'vitest';

import { GeminiClient } from '@/lib/gemini/client.js';
import { handleAskRequest } from '@/lib/server/ask.js';
import { SimpleRetriever } from '@/lib/retrieval/retriever.js';
import { ZodError } from 'zod';

describe('handleAskRequest', () => {
  it('returns the request payload when the API key is missing', async () => {
    const retriever = new SimpleRetriever([]);
    const client = new GeminiClient();
    const repoRetriever = { retrieve: vi.fn().mockResolvedValue([]) };

    const result = await handleAskRequest(
      { question: 'How do I configure the system?' },
      { client, retriever, repoRetriever },
    );

    expect(result.status).toBe(200);
    expect(result.body.message).toMatch(/not configured/i);
    expect(result.body.request).toBeDefined();
  });

  it('throws a validation error when the payload is invalid', async () => {
    const retriever = new SimpleRetriever([]);
    const client = new GeminiClient();

    await expect(handleAskRequest({ question: '' }, { client, retriever })).rejects.toBeInstanceOf(ZodError);
  });

  it('merges repo retrieval results when scope includes repo', async () => {
    const retriever = new SimpleRetriever([]);
    const client = new GeminiClient();
    const repoDoc = { id: 'repo-1', title: 'Repo Doc', url: 'https://github.com/org/repo/file#L1-L10', text: 'Repo text' };
    const repoRetriever = { retrieve: vi.fn().mockResolvedValue([repoDoc]) };

    const result = await handleAskRequest(
      {
        question: 'How do I configure the system?',
        scope: 'repo',
        repo_context: { installation_id: 123 },
      },
      { client, retriever, repoRetriever },
    );

    expect(repoRetriever.retrieve).toHaveBeenCalledWith('How do I configure the system?', {
      installationId: 123,
      repositoryIds: undefined,
      limit: 8,
    });

    const context = JSON.parse(result.body.request.contents[2].parts[0].text);
    expect(context.retrieved_docs).toEqual([repoDoc]);
  });
});
