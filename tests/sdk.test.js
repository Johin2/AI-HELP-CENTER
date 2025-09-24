import { describe, expect, it, vi } from 'vitest';

import { AiHelpCenterClient } from '@/lib/sdk/client.js';

describe('AiHelpCenterClient', () => {
  it('submits ask requests to the configured endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ response: { message: 'ok' } }),
    });

    const client = new AiHelpCenterClient({ baseUrl: 'https://help-center.example.com', fetch: fetchMock });

    const result = await client.ask('How do I reset my password?', { mode: 'json' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://help-center.example.com/api/ask',
      expect.objectContaining({
        method: 'POST',
      }),
    );

    const [, requestInit] = fetchMock.mock.calls[0];
    expect(requestInit?.headers).toMatchObject({ 'Content-Type': 'application/json' });
    expect(JSON.parse(String(requestInit?.body))).toMatchObject({
      question: 'How do I reset my password?',
      mode: 'json',
    });

    expect(result).toEqual({ response: { message: 'ok' } });
  });

  it('uploads datasets with the selected mode', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ total: 3 }),
    });

    const client = new AiHelpCenterClient({ baseUrl: 'https://hosted.ai', fetch: fetchMock });

    await client.uploadDataset(
      [
        {
          title: 'FAQ',
          text: 'Frequently asked questions',
          url: 'https://example.com/faq',
        },
      ],
      { mode: 'replace' },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'https://hosted.ai/api/datasets',
      expect.objectContaining({ method: 'POST' }),
    );

    const payload = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(payload.mode).toBe('replace');
    expect(payload.documents).toHaveLength(1);
  });

  it('throws when the API responds with an error status', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: async () => 'Server exploded',
    });

    const client = new AiHelpCenterClient({ baseUrl: 'https://hosted.ai', fetch: fetchMock });

    await expect(client.ask('Is the service up?')).rejects.toThrow(/status 500/i);
  });
});
