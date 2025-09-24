import { describe, expect, it } from 'vitest';

import { GeminiClient } from '@/lib/gemini/client.js';
import { handleAskRequest } from '@/lib/server/ask.js';
import { SimpleRetriever } from '@/lib/retrieval/retriever.js';
import { ZodError } from 'zod';

describe('handleAskRequest', () => {
  it('returns the request payload when the API key is missing', async () => {
    const retriever = new SimpleRetriever([]);
    const client = new GeminiClient();

    const result = await handleAskRequest({ question: 'How do I configure the system?' }, { client, retriever });

    expect(result.status).toBe(200);
    expect(result.body.message).toMatch(/not configured/i);
    expect(result.body.request).toBeDefined();
  });

  it('throws a validation error when the payload is invalid', async () => {
    const retriever = new SimpleRetriever([]);
    const client = new GeminiClient();

    await expect(handleAskRequest({ question: '' }, { client, retriever })).rejects.toBeInstanceOf(ZodError);
  });
});
