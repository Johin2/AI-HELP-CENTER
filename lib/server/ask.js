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

const repoContextSchema = z.object({
  installation_id: z.number().int(),
  repository_ids: z.array(z.number().int()).optional(),
});

export const askSchema = z.object({
  question: z.string().min(1),
  workspace: workspaceSchema.optional(),
  policies: z.record(z.unknown()).optional(),
  retrieved_docs: z.array(retrievedDocSchema).optional(),
  mode: z.enum(['markdown', 'json']).optional(),
  scope: z.enum(['docs', 'repo', 'both']).optional().default('docs'),
  repo_context: repoContextSchema.optional(),
});

/**
 * @typedef {Object} AskHandlerDependencies
 * @property {GeminiClient} client
 * @property {SimpleRetriever} retriever
 * @property {import('@/lib/retrieval/repoRetriever.js').RepoRetriever | null} [repoRetriever]
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
const mergeDocuments = (documents) => {
  const map = new Map();
  for (const doc of documents) {
    map.set(doc.id, doc);
  }
  return Array.from(map.values());
};

export async function handleAskRequest(payload, { client, retriever, repoRetriever }) {
  const input = askSchema.parse(payload);
  const scope = input.scope ?? 'docs';
  const includeDocs = scope === 'docs' || scope === 'both';
  const includeRepo = scope === 'repo' || scope === 'both';

  const docContext = includeDocs ? retriever.retrieve(input.question, 3) : [];
  const providedDocs = input.retrieved_docs ?? [];
  let repoDocs = [];

  if (includeRepo && repoRetriever && input.repo_context) {
    repoDocs = await repoRetriever.retrieve(input.question, {
      installationId: input.repo_context.installation_id,
      repositoryIds: input.repo_context.repository_ids,
      limit: 8,
    });
  }

  const autoRetrievedDocs = mergeDocuments([...providedDocs, ...docContext, ...repoDocs]);
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
