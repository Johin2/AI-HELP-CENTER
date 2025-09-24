import { z } from 'zod';

import type { GeminiClient } from '@/lib/gemini/client';
import type { SimpleRetriever } from '@/lib/retrieval/retriever';
import type { RetrievedDoc } from '@/lib/types';

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

export const askSchema = z.object({
  question: z.string().min(1),
  workspace: workspaceSchema.optional(),
  policies: z.record(z.unknown()).optional(),
  retrieved_docs: z.array(retrievedDocSchema).optional(),
  mode: z.enum(['markdown', 'json']).optional(),
});

export interface AskHandlerDependencies {
  client: GeminiClient;
  retriever: SimpleRetriever;
}

export interface AskHandlerResult {
  status: number;
  body: Record<string, unknown>;
}

export async function handleAskRequest(
  payload: unknown,
  { client, retriever }: AskHandlerDependencies,
): Promise<AskHandlerResult> {
  const input = askSchema.parse(payload);
  const autoRetrievedDocs: RetrievedDoc[] = input.retrieved_docs ?? retriever.retrieve(input.question, 3);
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
