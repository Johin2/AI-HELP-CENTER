import { randomUUID } from 'node:crypto';

import { z } from 'zod';

import type { SupabaseKnowledgeBase } from '@/lib/retrieval/knowledgeBase';
import type { SimpleRetriever } from '@/lib/retrieval/retriever';
import type { RetrievedDoc } from '@/lib/types';
import type { DatasetStore } from '@/lib/server/datasetStore';

const datasetDocumentSchema = z
  .object({
    id: z.string().min(1).optional(),
    title: z.string().min(1),
    url: z.string().url(),
    text: z.string().min(1),
    created_at: z.string().optional(),
  })
  .catchall(z.unknown());

export const datasetUploadSchema = z.object({
  documents: z.array(datasetDocumentSchema).min(1),
  mode: z.enum(['append', 'replace']).default('append'),
});

export type DatasetUploadPayload = z.infer<typeof datasetUploadSchema>;

export interface DatasetHandlerDependencies {
  retriever: SimpleRetriever;
  datasetStore: DatasetStore;
  supabaseKnowledgeBase?: SupabaseKnowledgeBase | null;
}

export interface DatasetHandlerResult {
  status: number;
  body: {
    message: string;
    mode: DatasetUploadPayload['mode'];
    uploaded: number;
    total: number;
    source: 'supabase' | 'file';
  };
}

const ensureDocumentId = (doc: z.infer<typeof datasetDocumentSchema>): RetrievedDoc => {
  const { id, ...rest } = doc;
  return {
    ...(rest as Omit<RetrievedDoc, 'id'>),
    id: id && id.length > 0 ? id : randomUUID(),
  } as RetrievedDoc;
};

export async function handleDatasetUpload(
  payload: unknown,
  { retriever, datasetStore, supabaseKnowledgeBase }: DatasetHandlerDependencies,
): Promise<DatasetHandlerResult> {
  const input = datasetUploadSchema.parse(payload);
  const normalizedDocuments = input.documents.map(ensureDocumentId);

  let allDocuments: RetrievedDoc[] = [];
  let source: DatasetHandlerResult['body']['source'] = 'file';

  if (supabaseKnowledgeBase) {
    if (input.mode === 'replace') {
      await supabaseKnowledgeBase.replaceDocuments(normalizedDocuments);
    } else {
      await supabaseKnowledgeBase.upsertDocuments(normalizedDocuments);
    }

    allDocuments = await supabaseKnowledgeBase.fetchDocuments();
    source = 'supabase';
  } else {
    if (input.mode === 'replace') {
      datasetStore.replace(normalizedDocuments);
    } else {
      datasetStore.append(normalizedDocuments);
    }

    await datasetStore.persist();
    allDocuments = datasetStore.getDocuments();
  }

  retriever.updateDocuments(allDocuments);

  return {
    status: 200,
    body: {
      message: 'Dataset updated successfully.',
      mode: input.mode,
      uploaded: normalizedDocuments.length,
      total: allDocuments.length,
      source,
    },
  };
}
