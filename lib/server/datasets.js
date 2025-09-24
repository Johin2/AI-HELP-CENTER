import { randomUUID } from 'node:crypto';

import { z } from 'zod';

/** @typedef {import('@/lib/types.js').RetrievedDoc} RetrievedDoc */
/** @typedef {import('@/lib/retrieval/retriever.js').SimpleRetriever} SimpleRetriever */
/** @typedef {import('@/lib/retrieval/knowledgeBase.js').SupabaseKnowledgeBase} SupabaseKnowledgeBase */
/** @typedef {import('@/lib/server/datasetStore.js').DatasetStore} DatasetStore */

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

/**
 * @typedef {z.infer<typeof datasetUploadSchema>} DatasetUploadPayload
 */

/**
 * @typedef {Object} DatasetHandlerDependencies
 * @property {SimpleRetriever} retriever
 * @property {DatasetStore} datasetStore
 * @property {SupabaseKnowledgeBase | null | undefined} [supabaseKnowledgeBase]
 */

/**
 * @typedef {Object} DatasetHandlerResult
 * @property {number} status
 * @property {{ message: string; mode: DatasetUploadPayload['mode']; uploaded: number; total: number; source: 'supabase' | 'file' }} body
 */

/**
 * @param {z.infer<typeof datasetDocumentSchema>} doc
 * @returns {RetrievedDoc}
 */
const ensureDocumentId = (doc) => {
  const { id, ...rest } = doc;
  return {
    ...rest,
    id: id && id.length > 0 ? id : randomUUID(),
  };
};

/**
 * @param {unknown} payload
 * @param {DatasetHandlerDependencies} deps
 * @returns {Promise<DatasetHandlerResult>}
 */
export async function handleDatasetUpload(payload, { retriever, datasetStore, supabaseKnowledgeBase }) {
  const input = datasetUploadSchema.parse(payload);
  const normalizedDocuments = input.documents.map(ensureDocumentId);

  let allDocuments = [];
  let source = 'file';

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
