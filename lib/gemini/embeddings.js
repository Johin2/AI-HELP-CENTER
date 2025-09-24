import { createHash } from 'node:crypto';

const DEFAULT_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

/**
 * Lightweight Gemini embeddings client that supports sequential single-text requests.
 */
export class GeminiEmbeddingsClient {
  /**
   * @param {{ apiKey?: string; model?: string; baseUrl?: string; fetchFn?: typeof fetch }} [config]
   */
  constructor(config = {}) {
    this.apiKey = config.apiKey;
    this.model = config.model ?? 'gemini-embedding-001';
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '');
    this.fetchFn = config.fetchFn ?? fetch;
  }

  /**
   * @returns {boolean}
   */
  isConfigured() {
    return Boolean(this.apiKey);
  }

  /**
   * @param {string} text
   * @returns {number[]}
   */
  buildDeterministicEmbedding(text) {
    const hash = createHash('sha256').update(text).digest();
    const dimension = 768;
    const vector = new Array(dimension).fill(0);

    for (let index = 0; index < hash.length; index += 1) {
      vector[index % dimension] += hash[index] / 255;
    }

    const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));

    if (magnitude === 0) {
      return vector;
    }

    return vector.map((value) => value / magnitude);
  }

  /**
   * @param {string} text
   * @returns {Promise<number[]>}
   */
  async embedText(text) {
    if (!this.isConfigured()) {
      return this.buildDeterministicEmbedding(text);
    }

    const endpoint = `${this.baseUrl}/models/${this.model}:embedContent`;
    const response = await this.fetchFn(`${endpoint}?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: `models/${this.model}`,
        content: {
          parts: [{ text }],
        },
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      const errorMessage = payload?.error?.message ?? 'Gemini embeddings request failed.';
      const error = new Error(errorMessage);
      error.status = response.status;
      throw error;
    }

    const values = payload?.embedding?.values;

    if (!Array.isArray(values)) {
      throw new Error('Gemini embeddings response missing embedding values.');
    }

    return values;
  }

  /**
   * @param {string[]} texts
   * @returns {Promise<number[][]>}
   */
  async embedTexts(texts) {
    const embeddings = [];

    for (const text of texts) {
      // gemini-embedding-001 accepts a single text per request, so we sequentially process them.
      // Batching occurs at the application layer by reusing the same HTTP client and model configuration.
      // eslint-disable-next-line no-await-in-loop
      const embedding = await this.embedText(text);
      embeddings.push(embedding);
    }

    return embeddings;
  }
}

