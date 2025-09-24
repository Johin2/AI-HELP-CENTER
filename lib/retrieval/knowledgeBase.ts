import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

import type { RetrievedDoc } from '@/lib/types';

export interface SupabaseKnowledgeBaseConfig {
  url: string;
  key: string;
  table: string;
  client?: SupabaseClient;
}

type SupabaseRow = {
  id: string | number | null;
  title?: string | null;
  text?: string | null;
  url?: string | null;
  created_at?: string | null;
  [key: string]: unknown;
};

export class SupabaseKnowledgeBase {
  private readonly table: string;
  private readonly client: SupabaseClient;

  constructor(private readonly config: SupabaseKnowledgeBaseConfig) {
    if (!config.url) {
      throw new Error('Supabase URL is required to load the knowledge base.');
    }

    if (!config.key) {
      throw new Error('Supabase key is required to load the knowledge base.');
    }

    this.table = config.table;
    this.client =
      config.client ??
      createClient(config.url, config.key, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
  }

  public async fetchDocuments(): Promise<RetrievedDoc[]> {
    try {
      const { data, error } = await this.client.from(this.table).select('id, title, text, url, created_at');

      if (error) {
        console.error('Failed to query Supabase knowledge base:', error);
        return [];
      }

      if (!data) {
        return [];
      }

      const documents: RetrievedDoc[] = [];

      for (const row of data as SupabaseRow[]) {
        const document = this.toRetrievedDoc(row);
        if (document) {
          documents.push(document);
        }
      }

      return documents;
    } catch (error) {
      console.error('Unexpected error while loading knowledge base from Supabase:', error);
      return [];
    }
  }

  private toRetrievedDoc(row: SupabaseRow): RetrievedDoc | null {
    const { id, title, text, url, created_at, ...rest } = row;

    if (!id || typeof title !== 'string' || typeof text !== 'string' || typeof url !== 'string') {
      console.warn('Skipping Supabase knowledge base row with missing required fields.', {
        id,
        title,
        url,
      });
      return null;
    }

    const base: RetrievedDoc = {
      id: String(id),
      title,
      text,
      url,
    };

    if (typeof created_at === 'string' && created_at.length > 0) {
      base.created_at = created_at;
    }

    return { ...rest, ...base } as RetrievedDoc;
  }
}

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
