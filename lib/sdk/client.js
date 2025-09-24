/** @typedef {import('../types.js').AskRequestPayload} AskRequestPayload */
/** @typedef {import('../types.js').RetrievedDoc} RetrievedDoc */

/**
 * @typedef {Object} AiHelpCenterClientConfig
 * @property {string} baseUrl
 * @property {string} [askPath]
 * @property {string} [datasetPath]
 * @property {typeof fetch} [fetch]
 * @property {Record<string, string>} [defaultHeaders]
 */

/** @typedef {Omit<AskRequestPayload, 'question'>} AskOptions */
/** @typedef {Omit<RetrievedDoc, 'id'> & { id?: string }} DatasetDocumentInput */
/** @typedef {{ mode?: 'append' | 'replace' }} DatasetUploadOptions */

export class AiHelpCenterClient {
  /**
   * @param {AiHelpCenterClientConfig} config
   */
  constructor(config) {
    const trimmedBaseUrl = config.baseUrl?.trim();

    if (!trimmedBaseUrl) {
      throw new Error('baseUrl is required to initialize the AI Help Center client.');
    }

    const fetchImpl = config.fetch ?? globalThis.fetch ?? fetch;
    if (!fetchImpl) {
      throw new Error('Fetch API is not available in this environment. Provide a fetch implementation.');
    }

    this.baseUrl = trimmedBaseUrl.replace(/\/+$/, '');
    this.askPath = config.askPath ?? '/api/ask';
    this.datasetPath = config.datasetPath ?? '/api/datasets';
    this.fetchImpl = fetchImpl;
    this.defaultHeaders = config.defaultHeaders ?? {};
  }

  /**
   * @param {string} question
   * @param {AskOptions} [options]
   */
  async ask(question, options = {}) {
    if (!question || question.trim().length === 0) {
      throw new Error('question is required when calling ask().');
    }

    /** @type {AskRequestPayload} */
    const payload = {
      ...options,
      question,
    };

    return this.postJson(this.askPath, payload, 'Failed to submit ask request');
  }

  /**
   * @param {DatasetDocumentInput[]} documents
   * @param {DatasetUploadOptions} [options]
   */
  async uploadDataset(documents, options = {}) {
    if (!Array.isArray(documents) || documents.length === 0) {
      throw new Error('At least one document is required when uploading a dataset.');
    }

    const payload = {
      documents,
      mode: options.mode ?? 'append',
    };

    return this.postJson(this.datasetPath, payload, 'Failed to upload dataset');
  }

  /**
   * @param {string} path
   * @param {unknown} body
   * @param {string} errorContext
   */
  async postJson(path, body, errorContext) {
    let response;

    try {
      response = await this.fetchImpl(this.buildUrl(path), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.defaultHeaders,
        },
        body: JSON.stringify(body),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`${errorContext}: ${message}`);
    }

    if (!response.ok) {
      let errorDetail;
      try {
        errorDetail = await response.text();
      } catch {
        errorDetail = response.statusText;
      }

      throw new Error(`${errorContext} (status ${response.status}): ${errorDetail}`);
    }

    try {
      return await response.json();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`${errorContext}: Failed to parse JSON response: ${message}`);
    }
  }

  /**
   * @param {string} path
   * @returns {string}
   */
  buildUrl(path) {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }

    if (!path.startsWith('/')) {
      return `${this.baseUrl}/${path}`;
    }

    return `${this.baseUrl}${path}`;
  }
}
