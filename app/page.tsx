import Link from 'next/link';

import { AskForm } from '@/components/ask-form';
import knowledgeBase from '@/data/knowledgeBase.json';
import type { RetrievedDoc } from '@/lib/types';

const documents = knowledgeBase as RetrievedDoc[];

export default function HomePage() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl space-y-16 px-6 py-16">
      <div className="flex flex-col gap-12 lg:flex-row lg:gap-16">
        <section className="lg:w-3/5">
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
          </header>

          <div className="mt-12 rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl shadow-black/40 backdrop-blur">
            <AskForm />
          </div>
        </section>

        <aside className="lg:w-2/5">
          <div className="sticky top-16 space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
              <h2 className="text-lg font-semibold text-slate-100">Knowledge base preview</h2>
              <p className="mt-2 text-sm text-slate-400">
                The retriever loads documents from Supabase when configured, with a JSON fallback for local development. Here are
                the sample entries bundled with the project.
              </p>
              <ul className="mt-6 space-y-4 text-sm text-slate-300">
                {documents.slice(0, 5).map((doc) => (
                  <li key={doc.id} className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
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
          </div>
        </aside>
      </div>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl shadow-black/40 backdrop-blur">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold text-white sm:text-3xl">Explore the full documentation</h2>
            <p className="text-sm text-slate-300 sm:max-w-xl sm:text-base">
              Dive deeper into the SDK setup, environment variables, and integration examples on the dedicated documentation
              page. Everything you need to launch the AI Help Center lives there—no scrolling required.
            </p>
          </div>

          <Link
            href="/docs"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-2 text-sm font-semibold text-brand-foreground shadow-glow transition hover:bg-brand/90"
          >
            Read the docs
            <span aria-hidden className="text-base">↗</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
