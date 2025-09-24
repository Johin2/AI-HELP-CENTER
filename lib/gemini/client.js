import { buildGeminiRequest } from '@/lib/gemini/requestBuilder.js';

/** @typedef {import('@/lib/types.js').GeminiClientConfig} GeminiClientConfig */
/** @typedef {import('@/lib/types.js').GeminiGenerationResult} GeminiGenerationResult */
/** @typedef {import('@/lib/types.js').GeminiGenerateRequest} GeminiGenerateRequest */
/** @typedef {import('@/lib/types.js').GeminiRequestOptions} GeminiRequestOptions */

const DEFAULT_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_MODEL = 'gemini-2.0-flash-001';

export class GeminiClient {
  /**
   * @param {GeminiClientConfig} [config]
   */
  constructor(config = {}) {
    this.config = config;

    const fetchImpl = config.fetchFn ?? globalThis.fetch ?? fetch;
    if (!fetchImpl) {
      throw new Error('Fetch API is not available in this environment. Provide a fetch implementation.');
    }

    this.fetchFn = fetchImpl;
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.defaultModel = config.model ?? DEFAULT_MODEL;
  }

  /**
   * @returns {boolean}
   */
  isConfigured() {
    return Boolean(this.config.apiKey);
  }

  /**
   * @param {GeminiRequestOptions} options
   * @returns {GeminiGenerateRequest}
   */
  buildRequest(options) {
    const request = buildGeminiRequest({
      ...options,
      model: options.model ?? this.defaultModel,
    });

    if (this.config.safetySettings) {
      request.safetySettings = this.config.safetySettings;
    }

    return request;
  }

  /**
   * @param {GeminiRequestOptions} options
   * @returns {Promise<GeminiGenerationResult>}
   */
  async generate(options) {
    if (!this.isConfigured()) {
      throw new Error('Gemini API key is not configured.');
    }

    const request = this.buildRequest(options);
    const { model, ...body } = request;
    const url = `${this.baseUrl}/models/${encodeURIComponent(model)}:generateContent?key=${this.config.apiKey}`;

    let response;

    try {
      response = await this.fetchFn(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Gemini API request failed: ${message}`);
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errorText}`);
    }

    try {
      return await response.json();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Gemini API error: Failed to parse JSON response: ${message}`);
    }
  }
}
