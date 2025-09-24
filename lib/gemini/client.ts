import { buildGeminiRequest } from '@/lib/gemini/requestBuilder';
import type {
  GeminiClientConfig,
  GeminiGenerationResult,
  GeminiGenerateRequest,
  GeminiRequestOptions,
} from '@/lib/types';

const DEFAULT_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_MODEL = 'gemini-2.0-flash-001';

export class GeminiClient {
  private readonly fetchFn: typeof fetch;
  private readonly baseUrl: string;
  private readonly defaultModel: string;

  constructor(private readonly config: GeminiClientConfig = {}) {
    const fetchImpl = config.fetchFn ?? fetch;

    if (!fetchImpl) {
      throw new Error('Fetch API is not available in this environment. Provide a fetch implementation.');
    }

    this.fetchFn = fetchImpl;
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.defaultModel = config.model ?? DEFAULT_MODEL;
  }

  public isConfigured(): boolean {
    return Boolean(this.config.apiKey);
  }

  public buildRequest(options: GeminiRequestOptions): GeminiGenerateRequest {
    const request = buildGeminiRequest({
      ...options,
      model: options.model ?? this.defaultModel,
    });

    if (this.config.safetySettings) {
      request.safetySettings = this.config.safetySettings;
    }

    return request;
  }

  public async generate(options: GeminiRequestOptions): Promise<GeminiGenerationResult> {
    if (!this.isConfigured()) {
      throw new Error('Gemini API key is not configured.');
    }

    const request = this.buildRequest(options);
    const { model, ...body } = request;
    const url = `${this.baseUrl}/models/${encodeURIComponent(model)}:generateContent?key=${this.config.apiKey}`;

    let response: Response;

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
      return (await response.json()) as GeminiGenerationResult;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Gemini API error: Failed to parse JSON response: ${message}`);
    }
  }
}
