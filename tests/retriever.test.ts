import { describe, expect, it } from 'vitest';

import { SimpleRetriever } from '@/lib/retrieval/retriever';
import type { RetrievedDoc } from '@/lib/types';

const docs: RetrievedDoc[] = [
  {
    id: 'kb-1',
    title: 'Install the SDK',
    url: 'https://example.com/install',
    text: 'Install the SDK and set your API key.',
  },
  {
    id: 'kb-2',
    title: 'Configure citations',
    url: 'https://example.com/citations',
    text: 'Always include citations in the Sources section.',
  },
];

describe('SimpleRetriever', () => {
  it('returns documents sorted by score', () => {
    const retriever = new SimpleRetriever(docs);
    const results = retriever.retrieve('How do I install the SDK?', 1);

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('kb-1');
  });

  it('returns empty array when no matches', () => {
    const retriever = new SimpleRetriever(docs);
    const results = retriever.retrieve('Unrelated question');

    expect(results).toEqual([]);
  });
});
