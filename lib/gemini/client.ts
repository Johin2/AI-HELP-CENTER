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
    this.fetchFn = config.fetchFn ?? fetch;
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '');
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

    const response = await this.fetchFn(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errorText}`);
    }

    return (await response.json()) as GeminiGenerationResult;
  }
}
