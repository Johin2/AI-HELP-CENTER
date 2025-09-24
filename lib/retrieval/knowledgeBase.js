import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { createClient } from '@supabase/supabase-js';

/** @typedef {import('@/lib/types.js').RetrievedDoc} RetrievedDoc */

/**
 * @typedef {Object} SupabaseKnowledgeBaseConfig
 * @property {string} url
 * @property {string} key
 * @property {string} table
 * @property {import('@supabase/supabase-js').SupabaseClient} [client]
 */

export class SupabaseKnowledgeBase {
  /**
   * @param {SupabaseKnowledgeBaseConfig} config
   */
  constructor(config) {
    this.config = config;

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

  /**
   * @returns {Promise<RetrievedDoc[]>}
   */
  async fetchDocuments() {
    try {
      const { data, error } = await this.client.from(this.table).select('id, title, text, url, created_at');

      if (error) {
        console.error('Failed to query Supabase knowledge base:', error);
        return [];
      }

      if (!data) {
        return [];
      }

      const documents = [];

      for (const row of data) {
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

  /**
   * @param {RetrievedDoc[]} documents
   * @returns {Promise<void>}
   */
  async upsertDocuments(documents) {
    if (documents.length === 0) {
      return;
    }

    const rows = documents.map((doc) => {
      const { id, title, text, url, created_at, ...rest } = doc;
      if (!id) {
        throw new Error('Document id is required when syncing with Supabase.');
      }

      return {
        id,
        title,
        text,
        url,
        created_at: created_at ?? new Date().toISOString(),
        ...rest,
      };
    });

    const { error } = await this.client
      .from(this.table)
      .upsert(rows, { onConflict: 'id' });

    if (error) {
      throw new Error(`Failed to upsert knowledge base documents: ${error.message}`);
    }
  }

  /**
   * @param {RetrievedDoc[]} documents
   * @returns {Promise<void>}
   */
  async replaceDocuments(documents) {
    const { error: deleteError } = await this.client.from(this.table).delete().neq('id', null);

    if (deleteError) {
      throw new Error(`Failed to clear Supabase knowledge base: ${deleteError.message}`);
    }

    await this.upsertDocuments(documents);
  }

  /**
   * @param {Record<string, unknown>} row
   * @returns {RetrievedDoc | null}
   */
  toRetrievedDoc(row) {
    const { id, title, text, url, created_at, ...rest } = row;

    if (!id || typeof title !== 'string' || typeof text !== 'string' || typeof url !== 'string') {
      console.warn('Skipping Supabase knowledge base row with missing required fields.', {
        id,
        title,
        url,
      });
      return null;
    }

    const base = {
      id: String(id),
      title,
      text,
      url,
    };

    if (typeof created_at === 'string' && created_at.length > 0) {
      base.created_at = created_at;
    }

    return { ...rest, ...base };
  }
}

/**
 * @param {string} filePath
 * @returns {RetrievedDoc[]}
 */
export function loadKnowledgeBase(filePath) {
  try {
    const absolutePath = resolve(filePath);
    const raw = readFileSync(absolutePath, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn(`Unable to load knowledge base from ${filePath}:`, error);
    return [];
  }
}
