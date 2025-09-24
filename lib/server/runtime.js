import { AppConfig } from '@/lib/config.js';
import { GeminiClient } from '@/lib/gemini/client.js';
import { GeminiEmbeddingsClient } from '@/lib/gemini/embeddings.js';
import { SupabaseKnowledgeBase } from '@/lib/retrieval/knowledgeBase.js';
import { createRetriever } from '@/lib/retrieval/retriever.js';
import { RepoRetriever } from '@/lib/retrieval/repoRetriever.js';
import { DatasetStore } from '@/lib/server/datasetStore.js';
import { GitHubApp } from '@/lib/github/app.js';
import { InMemoryCodeChunkStore, SupabaseCodeChunkStore } from '@/lib/indexing/codeChunkStore.js';
import { InMemoryRepositoryStore, SupabaseRepositoryStore } from '@/lib/indexing/repositoryStore.js';
import { RepositoryIndexService } from '@/lib/indexing/indexService.js';

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

const createCodeChunkStore = () => {
  if (AppConfig.supabase.url && AppConfig.supabase.key) {
    return new SupabaseCodeChunkStore({
      url: AppConfig.supabase.url,
      key: AppConfig.supabase.key,
      table: AppConfig.supabase.repoTable,
    });
  }

  return new InMemoryCodeChunkStore();
};

const createRepositoryStore = () => {
  if (AppConfig.supabase.url && AppConfig.supabase.key) {
    return new SupabaseRepositoryStore({
      url: AppConfig.supabase.url,
      key: AppConfig.supabase.key,
      table: AppConfig.supabase.repoIndexTable,
    });
  }

  return new InMemoryRepositoryStore();
};

export const githubApp = new GitHubApp(AppConfig.githubApp);

export const codeChunkStore = createCodeChunkStore();
export const repositoryStore = createRepositoryStore();

export const embeddingsClient = new GeminiEmbeddingsClient({
  apiKey: AppConfig.gemini.apiKey,
  model: AppConfig.gemini.embeddingModel,
  baseUrl: AppConfig.gemini.baseUrl,
});

export const repoRetriever = new RepoRetriever({
  embeddings: embeddingsClient,
  chunkStore: codeChunkStore,
  defaultTopK: AppConfig.repositoryIndexing.defaultTopK,
});

export const repositoryIndexService = new RepositoryIndexService({
  githubApp,
  chunkStore: codeChunkStore,
  repositoryStore,
  embeddings: embeddingsClient,
  config: AppConfig.repositoryIndexing,
});

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

const ensureRepositoriesTracked = async (installationId, repositories, enabled = false) => {
  for (const repo of repositories ?? []) {
    try {
      await repositoryStore.upsertRepository({
        installationId,
        repositoryId: repo.id,
        repositoryName: repo.full_name ?? `${repo.account?.login}/${repo.name}`,
        defaultBranch: repo.default_branch ?? 'main',
        enabled,
        status: 'pending',
      });
    } catch (error) {
      console.error('Failed to upsert repository metadata from webhook:', error);
    }
  }
};

if (githubApp.isConfigured()) {
  githubApp.on('installation', async ({ payload }) => {
    const installationId = payload.installation?.id;
    if (!installationId) {
      return;
    }

    if (payload.action === 'deleted') {
      for (const repo of payload.repositories ?? []) {
        try {
          await repositoryStore.deleteRepository(installationId, repo.id);
          await codeChunkStore.deleteRepository(installationId, repo.id);
        } catch (error) {
          console.error('Failed to clean up repository after uninstall:', error);
        }
      }
      return;
    }

    await ensureRepositoriesTracked(installationId, payload.repositories, false);
  });

  githubApp.on('installation_repositories', async ({ payload }) => {
    const installationId = payload.installation?.id;
    if (!installationId) {
      return;
    }

    if (payload.action === 'removed') {
      for (const repo of payload.repositories_removed ?? []) {
        try {
          await repositoryStore.deleteRepository(installationId, repo.id);
          await codeChunkStore.deleteRepository(installationId, repo.id);
        } catch (error) {
          console.error('Failed to remove repository after webhook update:', error);
        }
      }
    }

    if (payload.action === 'added') {
      await ensureRepositoriesTracked(installationId, payload.repositories_added, false);
    }
  });

  githubApp.on('push', async ({ payload }) => {
    try {
      await repositoryIndexService.handlePushEvent(payload);
    } catch (error) {
      console.error('Failed to process push webhook:', error);
    }
  });
}
