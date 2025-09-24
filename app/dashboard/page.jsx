import { RepoDashboard } from '@/components/repo-dashboard.jsx';

export const metadata = {
  title: 'Repository Indexing',
};

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-10 px-4 py-12">
      <div className="space-y-3 text-center">
        <h1 className="text-3xl font-semibold text-slate-100">GitHub Repo Q&amp;A</h1>
        <p className="text-sm text-slate-400">
          Connect your GitHub App installation, index code with Gemini embeddings + Supabase pgvector, and switch chat scope
          between docs, repo, or both for precise answers with citations.
        </p>
      </div>
      <RepoDashboard />
    </main>
  );
}

