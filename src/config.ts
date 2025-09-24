import { config as loadEnv } from 'dotenv';

loadEnv();

const DEFAULT_MODEL = 'gemini-2.0-flash-001';
const DEFAULT_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

export const AppConfig = {
  port: Number.parseInt(process.env.PORT ?? '3000', 10),
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL ?? DEFAULT_MODEL,
    baseUrl: process.env.GEMINI_BASE_URL ?? DEFAULT_BASE_URL,
  },
  knowledgeBasePath: process.env.KB_PATH ?? 'data/knowledgeBase.json',
};
