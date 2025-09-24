import Link from 'next/link';

import { DocsSection } from '@/components/docs-section';

export const metadata = {
  title: 'Documentation | AI Help Center',
  description: 'Read the complete AI Help Center SDK guide, including setup steps, environment variables, and integration examples.',
};

export default function DocsPage() {
  return (
    <main className="relative mx-auto min-h-screen max-w-7xl px-6 py-16">
      <div className="pointer-events-none absolute inset-x-0 -top-32 -z-10 flex justify-center">
        <div className="h-64 w-full max-w-5xl rounded-full bg-brand/30 blur-3xl" />
      </div>

      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-slate-800/80 bg-slate-950/60 px-4 py-2 text-sm font-medium text-slate-300 shadow-2xl shadow-black/30 transition hover:border-brand hover:text-white"
        >
          <span aria-hidden>←</span>
          Back to home
        </Link>
      </div>

      <div className="mt-12">
        <DocsSection />
      </div>
    </main>
  );
}
