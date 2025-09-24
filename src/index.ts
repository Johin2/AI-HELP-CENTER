import express from 'express';

import { AppConfig } from './config.js';
import { GeminiClient } from './gemini/client.js';
import { loadKnowledgeBase, SupabaseKnowledgeBase } from './retrieval/knowledgeBase.js';
import { createRetriever } from './retrieval/retriever.js';
import { createAskRouter } from './routes/ask.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();
app.use(express.json());

const retriever = createRetriever([]);

const initializeKnowledgeBase = async () => {
  if (AppConfig.supabase.url && AppConfig.supabase.key) {
    try {
      const supabaseKnowledgeBase = new SupabaseKnowledgeBase({
        url: AppConfig.supabase.url,
        key: AppConfig.supabase.key,
        table: AppConfig.supabase.table,
      });

      const documents = await supabaseKnowledgeBase.fetchDocuments();

      if (documents.length > 0) {
        retriever.updateDocuments(documents);
        console.log(`Loaded ${documents.length} knowledge base documents from Supabase.`);
      } else {
        console.warn('Supabase knowledge base returned no documents. Retrieval will rely on user-provided context.');
      }
    } catch (error) {
      console.error('Unable to initialize Supabase knowledge base:', error);
    }

    return;
  }

  const fallbackDocuments = loadKnowledgeBase(AppConfig.knowledgeBasePath);

  if (fallbackDocuments.length > 0) {
    retriever.updateDocuments(fallbackDocuments);
    console.warn('Supabase configuration missing. Using local JSON knowledge base for development.');
  } else {
    console.warn('No knowledge base documents loaded. Configure Supabase or provide retrieved_docs in requests.');
  }
};

export const knowledgeReady = initializeKnowledgeBase().catch((error) => {
  console.error('Knowledge base initialization failed:', error);
});

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
  knowledgeReady
    .catch(() => {
      // initialization errors are already logged above
    })
    .finally(() => {
      app.listen(AppConfig.port, () => {
        console.log(`AI Help-Center server running on port ${AppConfig.port}`);
        if (!geminiClient.isConfigured()) {
          console.warn('Gemini API key not configured. The /api/ask endpoint will return request payloads only.');
        }
      });
    });
}

export default app;
