import { z } from 'zod';

/** @typedef {import('@/lib/gemini/client.js').GeminiClient} GeminiClient */
/** @typedef {import('@/lib/retrieval/retriever.js').SimpleRetriever} SimpleRetriever */
/** @typedef {import('@/lib/types.js').RetrievedDoc} RetrievedDoc */

const retrievedDocSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string().url(),
  text: z.string(),
  created_at: z.string().optional(),
});

const workspaceSchema = z
  .object({
    name: z.string(),
    brand: z.string().optional(),
    tone: z.string().optional(),
    locale: z.string().optional(),
  })
  .catchall(z.unknown());

export const askSchema = z.object({
  question: z.string().min(1),
  workspace: workspaceSchema.optional(),
  policies: z.record(z.unknown()).optional(),
  retrieved_docs: z.array(retrievedDocSchema).optional(),
  mode: z.enum(['markdown', 'json']).optional(),
});

/**
 * @typedef {Object} AskHandlerDependencies
 * @property {GeminiClient} client
 * @property {SimpleRetriever} retriever
 */

/**
 * @typedef {Object} AskHandlerResult
 * @property {number} status
 * @property {Record<string, unknown>} body
 */

/**
 * @param {unknown} payload
 * @param {AskHandlerDependencies} deps
 * @returns {Promise<AskHandlerResult>}
 */
export async function handleAskRequest(payload, { client, retriever }) {
  const input = askSchema.parse(payload);
  const autoRetrievedDocs = input.retrieved_docs ?? retriever.retrieve(input.question, 3);
  const requestOptions = {
    ...input,
    retrieved_docs: autoRetrievedDocs,
  };

  if (!client.isConfigured()) {
    const request = client.buildRequest(requestOptions);
    return {
      status: 200,
      body: {
        message: 'Gemini API key not configured. Returning request payload for debugging.',
        request,
      },
    };
  }

  const response = await client.generate(requestOptions);
  return {
    status: 200,
    body: {
      response,
    },
  };
}
