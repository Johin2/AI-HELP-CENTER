import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import app, { knowledgeReady } from '../src/index.js';

beforeAll(async () => {
  await knowledgeReady;
});

describe('POST /api/ask', () => {
  it('returns the request payload when the API key is missing', async () => {
    const response = await request(app)
      .post('/api/ask')
      .send({ question: 'How do I configure the system?' })
      .expect(200);

    expect(response.body.message).toMatch(/not configured/i);
    expect(response.body.request).toBeDefined();
    expect(response.body.request.contents).toHaveLength(3);
  });
});
