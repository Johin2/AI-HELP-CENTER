import { SYSTEM_PROMPT } from '@/lib/prompt/systemPrompt.js';

/** @typedef {import('@/lib/types.js').GeminiGenerateRequest} GeminiGenerateRequest */
/** @typedef {import('@/lib/types.js').GeminiRequestOptions} GeminiRequestOptions */
/** @typedef {import('@/lib/types.js').GeminiResponseSchema} GeminiResponseSchema */

/** @type {GeminiResponseSchema} */
export const JSON_MODE_SCHEMA = {
  type: 'object',
  properties: {
    answer_markdown: { type: 'string' },
    citations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          index: { type: 'integer' },
          title: { type: 'string' },
          url: { type: 'string', format: 'uri' },
        },
        required: ['index', 'title', 'url'],
      },
    },
    followups: {
      type: 'array',
      items: { type: 'string' },
      maxItems: 3,
    },
    safety: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['ok', 'refuse'] },
        reason: { type: 'string' },
      },
      required: ['status'],
    },
  },
  required: ['answer_markdown', 'citations', 'safety'],
};

/**
 * @param {GeminiRequestOptions} options
 * @returns {GeminiGenerateRequest}
 */
export const buildGeminiRequest = (options) => {
  const {
    question,
    retrieved_docs = [],
    workspace,
    policies,
    mode = 'markdown',
    scope = 'docs',
    repo_context,
    model = 'gemini-2.0-flash-001',
  } = options;

  if (!question?.trim()) {
    throw new Error('Question is required');
  }

  const contextualPayload = JSON.stringify(
    {
      retrieved_docs,
      workspace,
      policies,
      mode,
      scope,
      repo_context,
    },
    null,
    2,
  );

  const request = {
    model,
    contents: [
      { role: 'system', parts: [{ text: SYSTEM_PROMPT }] },
      { role: 'user', parts: [{ text: question }] },
      { role: 'user', parts: [{ text: contextualPayload }] },
    ],
  };

  if (mode === 'json') {
    request.responseMimeType = 'application/json';
    request.responseSchema = JSON_MODE_SCHEMA;
  }

  return request;
};
