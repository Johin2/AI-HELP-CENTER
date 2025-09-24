import { AppConfig } from '@/lib/config';
import { GeminiClient } from '@/lib/gemini/client';
import { SupabaseKnowledgeBase } from '@/lib/retrieval/knowledgeBase';
import { createRetriever } from '@/lib/retrieval/retriever';
import { DatasetStore } from '@/lib/server/datasetStore';

export const retriever = createRetriever([]);

export const datasetStore = new DatasetStore(AppConfig.knowledgeBasePath);

export const supabaseKnowledgeBase =
  AppConfig.supabase.url && AppConfig.supabase.key
    ? new SupabaseKnowledgeBase({
        url: AppConfig.supabase.url,
        key: AppConfig.supabase.key,
        table: AppConfig.supabase.table,
      })
    : null;

const initializeKnowledgeBase = async () => {
  if (supabaseKnowledgeBase) {
    try {
      const documents = await supabaseKnowledgeBase.fetchDocuments();

      if (documents.length > 0) {
        retriever.updateDocuments(documents);
        console.log(`Loaded ${documents.length} knowledge base documents from Supabase.`);
        return;
      }

      console.warn(
        'Supabase knowledge base returned no documents. Falling back to local JSON knowledge base if available.',
      );
    } catch (error) {
      console.error('Unable to initialize Supabase knowledge base:', error);
    }
  }

  const fallbackDocuments = datasetStore.load();

  if (fallbackDocuments.length > 0) {
    retriever.updateDocuments(fallbackDocuments);
    const fallbackReason = supabaseKnowledgeBase
      ? 'Supabase returned no documents. Using local JSON knowledge base for retrieval.'
      : 'Supabase configuration missing. Using local JSON knowledge base for development.';
    console.warn(fallbackReason);
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
