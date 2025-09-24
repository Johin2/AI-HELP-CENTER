"use client";

import { useCallback, useMemo, useState } from 'react';

const formatDate = (value) => {
  if (!value) {
    return '—';
  }

  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch (error) {
    return value;
  }
};

export function RepoDashboard() {
  const [installationId, setInstallationId] = useState('');
  const [repositories, setRepositories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const hasInstallation = useMemo(() => installationId.trim().length > 0, [installationId]);

  const loadRepositories = useCallback(async () => {
    if (!hasInstallation) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/github/installations/${installationId}/repositories`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to fetch repositories.');
      }

      setRepositories(payload.repositories ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load repositories.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [hasInstallation, installationId]);

  const toggleRepository = useCallback(
    async (repositoryId, enabled) => {
      if (!hasInstallation) {
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch(`/api/github/installations/${installationId}/repositories`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repository_id: repositoryId, enabled }),
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error ?? 'Failed to update repository.');
        }
        setRepositories(payload.repositories ?? []);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to update repository toggle.';
        setToast({ type: 'error', message });
      } finally {
        setIsLoading(false);
      }
    },
    [hasInstallation, installationId],
  );

  const triggerIndexing = useCallback(
    async (repositoryIds) => {
      if (!hasInstallation) {
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch(`/api/github/installations/${installationId}/index`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repository_ids: repositoryIds }),
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error ?? 'Failed to start indexing.');
        }
        setToast({ type: 'success', message: 'Indexing triggered successfully.' });
        await loadRepositories();
        return payload.results ?? [];
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to trigger indexing.';
        setToast({ type: 'error', message });
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [hasInstallation, installationId, loadRepositories],
  );

  return (
    <div className="space-y-8">
      <div className="space-y-4 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-6 shadow-xl">
        <h1 className="text-xl font-semibold text-slate-100">Repository Indexing</h1>
        <p className="text-sm text-slate-400">
          Connect your GitHub App installation, toggle which repositories to index, and monitor status updates. Indexing calls
          Gemini embeddings for each chunk and stores vectors in Supabase.
        </p>

        <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-300">GitHub installation ID</span>
            <input
              value={installationId}
              onChange={(event) => setInstallationId(event.target.value)}
              placeholder="123456"
              inputMode="numeric"
            />
          </label>
          <div className="flex items-end gap-3">
            <button
              type="button"
              onClick={loadRepositories}
              disabled={!hasInstallation || isLoading}
              className="h-10 rounded-full bg-brand px-4 text-sm font-medium text-brand-foreground transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
              {isLoading ? 'Loading…' : 'Load repositories'}
            </button>
            <button
              type="button"
              onClick={() => triggerIndexing(undefined)}
              disabled={!hasInstallation || repositories.length === 0 || isLoading}
              className="h-10 rounded-full border border-slate-700 px-4 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:text-slate-50 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-500"
            >
              Index all
            </button>
          </div>
        </div>

        {error ? <p className="rounded border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p> : null}
        {toast ? (
          <p
            className={`rounded border p-3 text-sm ${
              toast.type === 'error'
                ? 'border-red-500/30 bg-red-500/10 text-red-200'
                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
            }`}
          >
            {toast.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-100">Repositories</h2>
        {repositories.length === 0 ? (
          <p className="text-sm text-slate-400">No repositories loaded yet. Enter an installation ID to fetch your repositories.</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-800/70">
            <table className="min-w-full divide-y divide-slate-800/80 text-sm text-slate-200">
              <thead className="bg-slate-900/70">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-xs text-slate-400">Repository</th>
                  <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-xs text-slate-400">Status</th>
                  <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-xs text-slate-400">Last indexed</th>
                  <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-xs text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {repositories.map((repo) => (
                  <tr key={repo.id}>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-100">{repo.full_name}</span>
                        <span className="text-xs text-slate-500">Default branch: {repo.default_branch}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          repo.status === 'indexed'
                            ? 'bg-emerald-500/10 text-emerald-200'
                            : repo.status === 'indexing'
                              ? 'bg-amber-500/10 text-amber-200'
                              : 'bg-slate-700/40 text-slate-300'
                        }`}
                      >
                        {repo.enabled ? repo.status : 'disabled'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{formatDate(repo.indexed_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleRepository(repo.id, !repo.enabled)}
                          className={`rounded-full border px-3 py-1 text-xs transition ${
                            repo.enabled
                              ? 'border-slate-700 text-slate-300 hover:border-slate-500 hover:text-slate-100'
                              : 'border-brand/70 text-brand hover:border-brand hover:text-brand-foreground'
                          }`}
                        >
                          {repo.enabled ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          type="button"
                          onClick={() => triggerIndexing([repo.id])}
                          className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 transition hover:border-slate-500 hover:text-slate-100"
                        >
                          Re-index
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

