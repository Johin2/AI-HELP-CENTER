import { config as loadEnv } from 'dotenv';

loadEnv();

const DEFAULT_MODEL = 'gemini-2.0-flash-001';
const DEFAULT_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

export const AppConfig = {
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL ?? DEFAULT_MODEL,
    baseUrl: process.env.GEMINI_BASE_URL ?? DEFAULT_BASE_URL,
    embeddingModel: process.env.GEMINI_EMBEDDING_MODEL ?? 'gemini-embedding-001',
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY,
    table: process.env.SUPABASE_KB_TABLE ?? 'knowledge_base',
    repoTable: process.env.SUPABASE_REPO_CHUNKS_TABLE ?? 'repo_code_chunks',
    repoIndexTable: process.env.SUPABASE_REPOSITORIES_TABLE ?? 'repository_indexes',
  },
  knowledgeBasePath: process.env.KB_PATH ?? 'data/knowledgeBase.json',
  githubApp: {
    appId: process.env.GITHUB_APP_ID,
    clientId: process.env.GITHUB_APP_CLIENT_ID,
    clientSecret: process.env.GITHUB_APP_CLIENT_SECRET,
    privateKey: process.env.GITHUB_APP_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    webhookSecret: process.env.GITHUB_APP_WEBHOOK_SECRET,
    apiBaseUrl: process.env.GITHUB_API_URL,
  },
  repositoryIndexing: {
    maxFileSizeBytes: Number.parseInt(process.env.REPO_INDEXING_MAX_FILE_SIZE ?? '262144', 10),
    concurrentBlobRequests: Number.parseInt(process.env.REPO_INDEXING_CONCURRENCY ?? '5', 10),
    chunkLines: Number.parseInt(process.env.REPO_INDEXING_CHUNK_LINES ?? '120', 10),
    chunkOverlapLines: Number.parseInt(process.env.REPO_INDEXING_CHUNK_OVERLAP ?? '20', 10),
    defaultTopK: Number.parseInt(process.env.REPO_RETRIEVAL_TOP_K ?? '8', 10),
  },
};
