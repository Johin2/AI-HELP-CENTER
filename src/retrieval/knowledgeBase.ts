import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type { RetrievedDoc } from '../types.js';

export function loadKnowledgeBase(filePath: string): RetrievedDoc[] {
  try {
    const absolutePath = resolve(filePath);
    const raw = readFileSync(absolutePath, 'utf-8');
    const parsed = JSON.parse(raw) as RetrievedDoc[];
    return parsed;
  } catch (error) {
    console.warn(`Unable to load knowledge base from ${filePath}:`, error);
    return [];
  }
}
