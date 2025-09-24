import type { AskRequestPayload, RetrievedDoc } from '@/lib/types';

export interface AiHelpCenterClientConfig {
  baseUrl: string;
  askPath?: string;
  datasetPath?: string;
  fetch?: typeof fetch;
  defaultHeaders?: Record<string, string>;
}

export type AskOptions = Omit<AskRequestPayload, 'question'>;

export type DatasetDocumentInput = Omit<RetrievedDoc, 'id'> & { id?: string };

export interface DatasetUploadOptions {
  mode?: 'append' | 'replace';
}

export class AiHelpCenterClient {
  private readonly baseUrl: string;
  private readonly askPath: string;
  private readonly datasetPath: string;
  private readonly fetchImpl: typeof fetch;
  private readonly defaultHeaders: Record<string, string>;

  constructor(config: AiHelpCenterClientConfig) {
    const trimmedBaseUrl = config.baseUrl?.trim();

    if (!trimmedBaseUrl) {
      throw new Error('baseUrl is required to initialize the AI Help Center client.');
    }

    const fetchImpl = config.fetch ?? globalThis.fetch;
    if (!fetchImpl) {
      throw new Error('Fetch API is not available in this environment. Provide a fetch implementation.');
    }
    this.baseUrl = trimmedBaseUrl.replace(/\/+$/, '');
    this.askPath = config.askPath ?? '/api/ask';
    this.datasetPath = config.datasetPath ?? '/api/datasets';
    this.fetchImpl = fetchImpl;
    this.defaultHeaders = config.defaultHeaders ?? {};
  }

  public async ask(question: string, options: AskOptions = {}) {
    if (!question || question.trim().length === 0) {
      throw new Error('question is required when calling ask().');
    }

    const payload: AskRequestPayload = {
      ...options,
      question,
    };

    return this.postJson(this.askPath, payload, 'Failed to submit ask request');
  }

  public async uploadDataset(documents: DatasetDocumentInput[], options: DatasetUploadOptions = {}) {
    if (!Array.isArray(documents) || documents.length === 0) {
      throw new Error('At least one document is required when uploading a dataset.');
    }

    const payload = {
      documents,
      mode: options.mode ?? 'append',
    };

    return this.postJson(this.datasetPath, payload, 'Failed to upload dataset');
  }

  private async postJson(path: string, body: unknown, errorContext: string) {
    let response: Response;

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
      let errorDetail: string;
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

  private buildUrl(path: string): string {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }

    if (!path.startsWith('/')) {
      return `${this.baseUrl}/${path}`;
    }

    return `${this.baseUrl}${path}`;
  }
}
