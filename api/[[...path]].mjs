import app, { knowledgeReady } from '../dist/index.js';

export default async function handler(req, res) {
  try {
    await knowledgeReady;
  } catch (error) {
    console.error('Knowledge base initialization failed before handling request:', error);
  }

  return app(req, res);
}
