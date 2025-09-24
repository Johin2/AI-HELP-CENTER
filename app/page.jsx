import { AskForm } from '@/components/ask-form';
import knowledgeBase from '@/data/knowledgeBase.json';

const documents = Array.isArray(knowledgeBase) ? knowledgeBase : [];

export default function HomePage() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl space-y-16 px-6 pb-20 pt-24">
      <section className="space-y-10">
        <header className="space-y-4">
          <span className="inline-flex rounded-full border border-brand/50 bg-brand/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-brand">
            AI Help Center
          </span>
          <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
            Ship a production-ready RAG assistant in minutes.
          </h1>
          <p className="max-w-xl text-base text-slate-300 sm:text-lg">
            Ask questions about your product documentation, generate structured JSON responses for chat widgets, and keep
            citations front-and-center. Everything runs on Next.js, Tailwind CSS, and Google Gemini.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-medium text-brand-foreground shadow-glow transition hover:bg-brand/90"
            >
              Manage repo indexing
              <span aria-hidden>↗</span>
            </a>
          </div>
        </header>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl shadow-black/40 backdrop-blur">
          <AskForm />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-lg font-semibold text-slate-100">Knowledge base preview</h2>
          <p className="mt-2 text-sm text-slate-400">
            The retriever loads documents from Supabase when configured, with a JSON fallback for local development. Here are
            the sample entries bundled with the project.
          </p>
          <ul className="mt-6 space-y-4 text-sm text-slate-300">
            {documents.slice(0, 5).map((doc) => (
              <li key={doc.id ?? doc.title} className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">{doc.created_at ?? 'N/A'}</p>
                <p className="mt-1 font-semibold text-slate-100">{doc.title}</p>
                <p className="mt-2 text-slate-400">{doc.text}</p>
                <a href={doc.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm">
                  View document
                  <span aria-hidden className="text-brand">↗</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-brand/40 bg-brand/10 p-6 text-sm text-brand">
          <h3 className="text-base font-semibold text-brand">Deploy-ready architecture</h3>
          <p className="mt-2 text-brand/80">
            This Next.js rewrite keeps the typed Gemini client, retrieval pipeline, and Supabase integration from the original
            Express app while modernizing the UX with Tailwind CSS.
          </p>
          <p className="mt-3 text-brand/80">
            Swap in your credentials, point to your Supabase table, and the assistant is ready for production workloads.
          </p>
        </div>
      </section>
    </main>
  );
}
