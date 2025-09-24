import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '../src/index.js';

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
