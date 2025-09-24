import { AppConfig } from './config.js';
import app, { geminiClient, knowledgeReady } from './index.js';

export const startServer = async () => {
  await knowledgeReady;

  const server = app.listen(AppConfig.port, () => {
    console.log(`AI Help-Center server running on port ${AppConfig.port}`);
    if (!geminiClient.isConfigured()) {
      console.warn('Gemini API key not configured. The /api/ask endpoint will return request payloads only.');
    }
  });

  return server;
};

if (process.env.NODE_ENV !== 'test' && process.env.VERCEL !== '1') {
  startServer().catch((error) => {
    console.error('Failed to start AI Help-Center server:', error);
  });
}
