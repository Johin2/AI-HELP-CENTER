import express from 'express';

import { AppConfig } from './config.js';
import { GeminiClient } from './gemini/client.js';
import { loadKnowledgeBase } from './retrieval/knowledgeBase.js';
import { createRetriever } from './retrieval/retriever.js';
import { createAskRouter } from './routes/ask.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();
app.use(express.json());

const knowledgeBase = loadKnowledgeBase(AppConfig.knowledgeBasePath);
const retriever = createRetriever(knowledgeBase);

const geminiClient = new GeminiClient({
  apiKey: AppConfig.gemini.apiKey,
  model: AppConfig.gemini.model,
  baseUrl: AppConfig.gemini.baseUrl,
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', createAskRouter(geminiClient, retriever));

app.use(notFoundHandler);
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(AppConfig.port, () => {
    console.log(`AI Help-Center server running on port ${AppConfig.port}`);
    if (!geminiClient.isConfigured()) {
      console.warn('Gemini API key not configured. The /api/ask endpoint will return request payloads only.');
    }
  });
}

export default app;
