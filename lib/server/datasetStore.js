import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import { loadKnowledgeBase } from '@/lib/retrieval/knowledgeBase.js';

/** @typedef {import('@/lib/types.js').RetrievedDoc} RetrievedDoc */

/**
 * @param {RetrievedDoc[]} documents
 * @returns {RetrievedDoc[]}
 */
const dedupeDocuments = (documents) => {
  const map = new Map();
  for (const doc of documents) {
    map.set(doc.id, doc);
  }

  return Array.from(map.values());
};

export class DatasetStore {
  /**
   * @param {string} filePath
   */
  constructor(filePath) {
    this.filePath = filePath;
    this.documents = [];
    this.loaded = false;
  }

  /**
   * @returns {RetrievedDoc[]}
   */
  load() {
    this.documents = loadKnowledgeBase(this.filePath);
    this.loaded = true;
    return this.documents;
  }

  ensureLoaded() {
    if (!this.loaded) {
      this.load();
    }
  }

  /**
   * @returns {RetrievedDoc[]}
   */
  getDocuments() {
    this.ensureLoaded();
    return this.documents;
  }

  /**
   * @param {RetrievedDoc[]} documents
   * @returns {RetrievedDoc[]}
   */
  replace(documents) {
    this.loaded = true;
    this.documents = dedupeDocuments(documents);
    return this.documents;
  }

  /**
   * @param {RetrievedDoc[]} documents
   * @returns {RetrievedDoc[]}
   */
  append(documents) {
    this.ensureLoaded();
    this.documents = dedupeDocuments([...this.documents, ...documents]);
    return this.documents;
  }

  /**
   * @returns {Promise<void>}
   */
  async persist() {
    this.ensureLoaded();
    const absolutePath = resolve(this.filePath);
    await mkdir(dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, JSON.stringify(this.documents, null, 2), 'utf-8');
  }
}
