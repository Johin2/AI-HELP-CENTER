import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import { loadKnowledgeBase } from '@/lib/retrieval/knowledgeBase';
import type { RetrievedDoc } from '@/lib/types';

const dedupeDocuments = (documents: RetrievedDoc[]): RetrievedDoc[] => {
  const map = new Map<string, RetrievedDoc>();
  for (const doc of documents) {
    map.set(doc.id, doc);
  }

  return Array.from(map.values());
};

export class DatasetStore {
  private documents: RetrievedDoc[] = [];
  private loaded = false;

  constructor(private readonly filePath: string) {}

  public load(): RetrievedDoc[] {
    this.documents = loadKnowledgeBase(this.filePath);
    this.loaded = true;
    return this.documents;
  }

  private ensureLoaded() {
    if (!this.loaded) {
      this.load();
    }
  }

  public getDocuments(): RetrievedDoc[] {
    this.ensureLoaded();
    return this.documents;
  }

  public replace(documents: RetrievedDoc[]): RetrievedDoc[] {
    this.loaded = true;
    this.documents = dedupeDocuments(documents);
    return this.documents;
  }

  public append(documents: RetrievedDoc[]): RetrievedDoc[] {
    this.ensureLoaded();
    this.documents = dedupeDocuments([...this.documents, ...documents]);
    return this.documents;
  }

  public async persist(): Promise<void> {
    this.ensureLoaded();
    const absolutePath = resolve(this.filePath);
    await mkdir(dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, JSON.stringify(this.documents, null, 2), 'utf-8');
  }
}
