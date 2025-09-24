import { Router } from 'express';
import { z } from 'zod';

import { GeminiClient } from '../gemini/client.js';
import type { RetrievedDoc } from '../types.js';
import { SimpleRetriever } from '../retrieval/retriever.js';

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

const askSchema = z.object({
  question: z.string().min(1),
  workspace: workspaceSchema.optional(),
  policies: z.record(z.unknown()).optional(),
  retrieved_docs: z.array(retrievedDocSchema).optional(),
  mode: z.enum(['markdown', 'json']).optional(),
});

export const createAskRouter = (client: GeminiClient, retriever: SimpleRetriever) => {
  const router = Router();

  router.post('/ask', async (req, res, next) => {
    try {
      const input = askSchema.parse(req.body);
      const autoRetrievedDocs: RetrievedDoc[] = input.retrieved_docs ?? retriever.retrieve(input.question, 3);
      const requestOptions = {
        ...input,
        retrieved_docs: autoRetrievedDocs,
      };

      if (!client.isConfigured()) {
        const request = client.buildRequest(requestOptions);
        res.status(200).json({
          message: 'Gemini API key not configured. Returning request payload for debugging.',
          request,
        });
        return;
      }

      const response = await client.generate(requestOptions);
      res.status(200).json({
        response,
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
};
