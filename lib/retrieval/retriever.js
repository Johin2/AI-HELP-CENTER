/** @typedef {import('@/lib/types.js').RetrievedDoc} RetrievedDoc */

const TITLE_WEIGHT = 2;
const TEXT_WEIGHT = 1;

/**
 * @param {string} value
 * @returns {string[]}
 */
const tokenize = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter(Boolean);

/**
 * @param {RetrievedDoc} doc
 * @param {string[]} tokens
 * @returns {number}
 */
const scoreDocument = (doc, tokens) => {
  const titleTokens = tokenize(doc.title);
  const textTokens = tokenize(doc.text);
  const titleMatches = tokens.filter((token) => titleTokens.includes(token)).length;
  const textMatches = tokens.filter((token) => textTokens.includes(token)).length;
  return titleMatches * TITLE_WEIGHT + textMatches * TEXT_WEIGHT;
};

export class SimpleRetriever {
  /**
   * @param {RetrievedDoc[]} [documents]
   */
  constructor(documents = []) {
    this.documents = documents;
  }

  /**
   * @param {RetrievedDoc[]} documents
   */
  updateDocuments(documents) {
    this.documents = documents;
  }

  /**
   * @param {string} question
   * @param {number} [limit]
   * @returns {RetrievedDoc[]}
   */
  retrieve(question, limit = 3) {
    const tokens = tokenize(question);
    if (tokens.length === 0) {
      return [];
    }

    return this.documents
      .map((doc) => ({ doc, score: scoreDocument(doc, tokens) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((entry) => entry.doc);
  }
}

/**
 * @param {RetrievedDoc[]} documents
 * @returns {SimpleRetriever}
 */
export const createRetriever = (documents) => new SimpleRetriever(documents);
