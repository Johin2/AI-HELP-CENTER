import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';

import { SimpleRetriever } from '@/lib/retrieval/retriever.js';
import { DatasetStore } from '@/lib/server/datasetStore.js';
import { handleDatasetUpload } from '@/lib/server/datasets.js';

const createDatasetStore = () => {
  const dir = mkdtempSync(join(tmpdir(), 'ai-help-center-dataset-'));
  const filePath = join(dir, 'knowledgeBase.json');
  writeFileSync(filePath, '[]');
  const store = new DatasetStore(filePath);
  return { dir, filePath, store };
};

describe('handleDatasetUpload', () => {
  it('persists documents to the local dataset store when Supabase is unavailable', async () => {
    const { dir, filePath, store } = createDatasetStore();
    const retriever = new SimpleRetriever([]);

    try {
      const result = await handleDatasetUpload(
        {
          documents: [
            {
              title: 'Getting Started',
              text: 'Install the package and configure an API key.',
              url: 'https://example.com/docs/getting-started',
            },
          ],
        },
        {
          retriever,
          datasetStore: store,
        },
      );

      expect(result.status).toBe(200);
      expect(result.body.source).toBe('file');
      expect(result.body.total).toBe(1);

      const stored = JSON.parse(readFileSync(filePath, 'utf-8'));
      expect(stored).toHaveLength(1);
      expect(stored[0].title).toBe('Getting Started');

      const retrieved = retriever.retrieve('configure');
      expect(retrieved).toHaveLength(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('delegates persistence to Supabase when configured', async () => {
    const { dir, store } = createDatasetStore();
    const retriever = new SimpleRetriever([]);

    const supabase = {
      replaceDocuments: vi.fn().mockResolvedValue(undefined),
      upsertDocuments: vi.fn().mockResolvedValue(undefined),
      fetchDocuments: vi
        .fn()
        .mockResolvedValue([
          {
            id: 'supabase-doc-1',
            title: 'Policies',
            text: 'Respect the community guidelines.',
            url: 'https://example.com/policies',
          },
        ]),
    };

    try {
      const result = await handleDatasetUpload(
        {
          documents: [
            {
              id: 'supabase-doc-1',
              title: 'Policies',
              text: 'Respect the community guidelines.',
              url: 'https://example.com/policies',
            },
          ],
          mode: 'replace',
        },
        {
          retriever,
          datasetStore: store,
          supabaseKnowledgeBase: supabase,
        },
      );

      expect(supabase.replaceDocuments).toHaveBeenCalledTimes(1);
      expect(supabase.fetchDocuments).toHaveBeenCalledTimes(1);
      expect(result.body.source).toBe('supabase');
      expect(result.body.total).toBe(1);
      expect(retriever.retrieve('guidelines')).toHaveLength(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('validates the incoming payload', async () => {
    const { dir, store } = createDatasetStore();
    const retriever = new SimpleRetriever([]);

    await expect(
      handleDatasetUpload(
        { documents: [] },
        {
          retriever,
          datasetStore: store,
        },
      ),
    ).rejects.toBeInstanceOf(ZodError);

    rmSync(dir, { recursive: true, force: true });
  });
});
