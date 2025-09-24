/**
 * @typedef {Object} Workspace
 * @property {string} name
 * @property {string} [brand]
 * @property {string} [tone]
 * @property {string} [locale]
 * @property {Record<string, unknown>} [extra]
 */

/**
 * @typedef {Object} RetrievedDoc
 * @property {string} id
 * @property {string} title
 * @property {string} url
 * @property {string} text
 * @property {string} [created_at]
 * @property {Record<string, unknown>} [extra]
 */

/** @typedef {Record<string, unknown>} PolicySet */

/** @typedef {'markdown' | 'json'} ResponseMode */

/**
 * @typedef {Object} AskRequestPayload
 * @property {string} question
 * @property {Workspace} [workspace]
 * @property {RetrievedDoc[]} [retrieved_docs]
 * @property {PolicySet} [policies]
 * @property {ResponseMode} [mode]
 */

/**
 * @typedef {AskRequestPayload & { model?: string }} GeminiRequestOptions
 */

/**
 * @typedef {Object} GeminiResponseSchema
 * @property {'object'} type
 * @property {Record<string, unknown>} properties
 * @property {string[]} required
 * @property {Record<string, unknown>} [extra]
 */

/**
 * @typedef {Object} GeminiGenerateRequest
 * @property {string} model
 * @property {{ role: string; parts: Array<{ text: string }> }[]} contents
 * @property {string} [responseMimeType]
 * @property {GeminiResponseSchema} [responseSchema]
 * @property {unknown[]} [safetySettings]
 */

/**
 * @typedef {Object} GeminiClientConfig
 * @property {string} [apiKey]
 * @property {string} [model]
 * @property {string} [baseUrl]
 * @property {unknown[]} [safetySettings]
 * @property {typeof fetch} [fetchFn]
 */

/**
 * @typedef {Object} GeminiGenerationResult
 * @property {unknown[]} [candidates]
 * @property {unknown} [promptFeedback]
 * @property {Record<string, unknown>} [extra]
 */

export {};
