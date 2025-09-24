"use client";

import { useState } from 'react';

const RESPONSE_MODES = ['markdown', 'json'];

const initialResponse = JSON.stringify(
  {
    prompt: 'Responses will appear here after you ask a question.',
  },
  null,
  2,
);

export function AskForm() {
  const [question, setQuestion] = useState('How do I configure the Help Center?');
  const [workspaceName, setWorkspaceName] = useState('Acme Support Hub');
  const [workspaceTone, setWorkspaceTone] = useState('friendly');
  const [mode, setMode] = useState('markdown');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(initialResponse);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setResult(initialResponse);

    const workspaceEntries = [
      workspaceName.trim() ? ['name', workspaceName.trim()] : null,
      workspaceTone.trim() ? ['tone', workspaceTone.trim()] : null,
    ].filter(Boolean);

    const workspace = Object.fromEntries(workspaceEntries);

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          workspace: workspaceEntries.length > 0 ? workspace : undefined,
          mode,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? 'Unexpected error while contacting the assistant.');
      }

      setResult(JSON.stringify(payload, null, 2));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-2">
        <label htmlFor="question" className="text-sm font-medium text-slate-300">
          Question
        </label>
        <textarea
          id="question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          rows={4}
          placeholder="Ask anything about your knowledge base..."
          className="w-full resize-none"
        />
        <p className="text-xs text-slate-500">
          We automatically retrieve up to three matching documents from your knowledge base when you don’t provide context.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="workspaceName" className="text-sm font-medium text-slate-300">
            Workspace name
          </label>
          <input
            id="workspaceName"
            value={workspaceName}
            onChange={(event) => setWorkspaceName(event.target.value)}
            placeholder="Acme Support Hub"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="workspaceTone" className="text-sm font-medium text-slate-300">
            Preferred tone
          </label>
          <select id="workspaceTone" value={workspaceTone} onChange={(event) => setWorkspaceTone(event.target.value)}>
            <option value="friendly">Friendly</option>
            <option value="neutral">Neutral</option>
            <option value="formal">Formal</option>
            <option value="">No preference</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium text-slate-300">Response format</span>
        <div className="flex gap-3">
          {RESPONSE_MODES.map((value) => (
            <label
              key={value}
              className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 text-sm transition ${
                mode === value
                  ? 'border-brand bg-brand/10 text-brand'
                  : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-500'
              }`}
            >
              <input
                type="radio"
                name="mode"
                value={value}
                checked={mode === value}
                onChange={() => setMode(value)}
                className="sr-only"
              />
              <span className="capitalize">{value}</span>
            </label>
          ))}
        </div>
      </div>

      {error ? <p className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">{error}</p> : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting || question.trim().length === 0}
          className="rounded-full bg-brand px-6 py-2 text-brand-foreground shadow-glow transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
        >
          {isSubmitting ? 'Thinking…' : 'Ask Gemini'}
        </button>
        <button
          type="button"
          onClick={() => {
            setQuestion('');
            setResult(initialResponse);
            setError(null);
          }}
          className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-slate-100"
        >
          Reset
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Response</h2>
          <span className="text-xs text-slate-500">Raw JSON</span>
        </div>
        <pre className="max-h-[400px] overflow-auto rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm leading-relaxed text-slate-200 shadow-inner">
          {result}
        </pre>
      </div>
    </form>
  );
}
