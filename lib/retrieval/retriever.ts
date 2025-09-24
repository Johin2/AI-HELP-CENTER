import type { RetrievedDoc } from '@/lib/types';

const TITLE_WEIGHT = 2;
const TEXT_WEIGHT = 1;

const tokenize = (value: string): string[] =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter(Boolean);

const scoreDocument = (doc: RetrievedDoc, tokens: string[]): number => {
  const titleTokens = tokenize(doc.title);
  const textTokens = tokenize(doc.text);
  const titleMatches = tokens.filter((token) => titleTokens.includes(token)).length;
  const textMatches = tokens.filter((token) => textTokens.includes(token)).length;
  return titleMatches * TITLE_WEIGHT + textMatches * TEXT_WEIGHT;
};

export class SimpleRetriever {
  private documents: RetrievedDoc[];

  constructor(documents: RetrievedDoc[] = []) {
    this.documents = documents;
  }

  public updateDocuments(documents: RetrievedDoc[]) {
    this.documents = documents;
  }

  public retrieve(question: string, limit = 3): RetrievedDoc[] {
    const tokens = tokenize(question);
    if (tokens.length === 0) {
      return [];
    }

    const scored = this.documents
      .map((doc) => ({ doc, score: scoreDocument(doc, tokens) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((entry) => entry.doc);

    return scored;
  }
}

export const createRetriever = (documents: RetrievedDoc[]): SimpleRetriever => new SimpleRetriever(documents);
