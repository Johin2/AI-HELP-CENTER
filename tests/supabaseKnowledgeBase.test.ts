import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SupabaseClient } from '@supabase/supabase-js';

import { SupabaseKnowledgeBase } from '../src/retrieval/knowledgeBase.js';

const createClientStub = () => {
  const select = vi.fn();
  const from = vi.fn(() => ({ select }));

  return {
    client: { from } as unknown as SupabaseClient,
    select,
    from,
  };
};

describe('SupabaseKnowledgeBase', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns normalized documents from Supabase response', async () => {
    const stub = createClientStub();

    stub.select.mockResolvedValue({
      data: [
        {
          id: 1,
          title: 'Getting started',
          text: 'Install dependencies with npm install.',
          url: 'https://example.com/start',
          created_at: '2024-01-01T00:00:00Z',
          product: 'docs',
        },
      ],
      error: null,
    });

    const knowledgeBase = new SupabaseKnowledgeBase({
      url: 'https://example.supabase.co',
      key: 'test-key',
      table: 'knowledge_base',
      client: stub.client,
    });

    const documents = await knowledgeBase.fetchDocuments();

    expect(documents).toEqual([
      {
        id: '1',
        title: 'Getting started',
        text: 'Install dependencies with npm install.',
        url: 'https://example.com/start',
        created_at: '2024-01-01T00:00:00Z',
        product: 'docs',
      },
    ]);
    expect(stub.from).toHaveBeenCalledWith('knowledge_base');
    expect(stub.select).toHaveBeenCalledWith('id, title, text, url, created_at');
  });

  it('filters out rows that miss required fields', async () => {
    const stub = createClientStub();
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    stub.select.mockResolvedValue({
      data: [
        { id: 2, text: 'Missing title', url: 'https://example.com/title' },
        { id: 3, title: 'Missing url', text: 'No URL provided', url: null },
      ],
      error: null,
    });

    const knowledgeBase = new SupabaseKnowledgeBase({
      url: 'https://example.supabase.co',
      key: 'test-key',
      table: 'knowledge_base',
      client: stub.client,
    });

    const documents = await knowledgeBase.fetchDocuments();

    expect(documents).toEqual([]);
  });

  it('returns an empty array when Supabase responds with an error', async () => {
    const stub = createClientStub();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    stub.select.mockResolvedValue({
      data: null,
      error: { message: 'permission denied' },
    });

    const knowledgeBase = new SupabaseKnowledgeBase({
      url: 'https://example.supabase.co',
      key: 'test-key',
      table: 'knowledge_base',
      client: stub.client,
    });

    const documents = await knowledgeBase.fetchDocuments();

    expect(documents).toEqual([]);
    expect(consoleError).toHaveBeenCalled();
  });
});
