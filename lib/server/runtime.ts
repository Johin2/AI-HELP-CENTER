import { AppConfig } from '@/lib/config';
import { GeminiClient } from '@/lib/gemini/client';
import { loadKnowledgeBase, SupabaseKnowledgeBase } from '@/lib/retrieval/knowledgeBase';
import { createRetriever } from '@/lib/retrieval/retriever';

export const retriever = createRetriever([]);

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
        return;
      }

      console.warn('Supabase knowledge base returned no documents. Retrieval will rely on user-provided context.');
      return;
    } catch (error) {
      console.error('Unable to initialize Supabase knowledge base:', error);
    }
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

export const geminiClient = new GeminiClient({
  apiKey: AppConfig.gemini.apiKey,
  model: AppConfig.gemini.model,
  baseUrl: AppConfig.gemini.baseUrl,
});
