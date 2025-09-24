export interface Workspace {
  name: string;
  brand?: string;
  tone?: 'friendly' | 'neutral' | 'formal' | string;
  locale?: string;
  [key: string]: unknown;
}

export interface RetrievedDoc {
  id: string;
  title: string;
  url: string;
  text: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface PolicySet {
  [key: string]: unknown;
}

export type ResponseMode = 'markdown' | 'json';

export interface AskRequestPayload {
  question: string;
  workspace?: Workspace;
  retrieved_docs?: RetrievedDoc[];
  policies?: PolicySet;
  mode?: ResponseMode;
}

export interface GeminiRequestOptions extends AskRequestPayload {
  model?: string;
}

export interface GeminiResponseSchema {
  type: 'object';
  properties: Record<string, unknown>;
  required: string[];
  [key: string]: unknown;
}

export interface GeminiGenerateRequest {
  model: string;
  contents: Array<{
    role: string;
    parts: Array<{ text: string }>;
  }>;
  responseMimeType?: string;
  responseSchema?: GeminiResponseSchema;
  safetySettings?: unknown[];
}

export interface GeminiClientConfig {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  safetySettings?: unknown[];
  fetchFn?: typeof fetch;
}

export interface GeminiGenerationResult {
  candidates?: unknown[];
  promptFeedback?: unknown;
  [key: string]: unknown;
}
