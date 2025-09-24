import { describe, expect, it } from 'vitest';

import { buildGeminiRequest, JSON_MODE_SCHEMA } from '../src/gemini/requestBuilder.js';

const sampleDoc = {
  id: '1',
  title: 'Sample',
  url: 'https://example.com',
  text: 'Example text for testing retrieval.',
};

describe('buildGeminiRequest', () => {
  it('creates a markdown request by default', () => {
    const request = buildGeminiRequest({
      question: 'How do I start?',
      retrieved_docs: [sampleDoc],
    });

    expect(request.model).toBe('gemini-2.0-flash-001');
    expect(request.responseMimeType).toBeUndefined();
    expect(request.responseSchema).toBeUndefined();
    expect(request.contents[0].role).toBe('system');
    expect(request.contents[1].parts[0].text).toContain('How do I start?');

    const context = JSON.parse(request.contents[2].parts[0].text);
    expect(context.mode).toBe('markdown');
    expect(context.retrieved_docs).toHaveLength(1);
  });

  it('attaches JSON schema when mode is json', () => {
    const request = buildGeminiRequest({
      question: 'Return JSON',
      retrieved_docs: [sampleDoc],
      mode: 'json',
      model: 'custom-model',
    });

    expect(request.model).toBe('custom-model');
    expect(request.responseMimeType).toBe('application/json');
    expect(request.responseSchema).toEqual(JSON_MODE_SCHEMA);

    const context = JSON.parse(request.contents[2].parts[0].text);
    expect(context.mode).toBe('json');
  });

  it('throws when question is empty', () => {
    expect(() => buildGeminiRequest({ question: '   ' })).toThrow('Question is required');
  });
});
