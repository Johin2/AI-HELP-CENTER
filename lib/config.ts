import { config as loadEnv } from 'dotenv';

loadEnv();

const DEFAULT_MODEL = 'gemini-2.0-flash-001';
const DEFAULT_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

export const AppConfig = {
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL ?? DEFAULT_MODEL,
    baseUrl: process.env.GEMINI_BASE_URL ?? DEFAULT_BASE_URL,
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY,
    table: process.env.SUPABASE_KB_TABLE ?? 'knowledge_base',
  },
  knowledgeBasePath: process.env.KB_PATH ?? 'data/knowledgeBase.json',
};
