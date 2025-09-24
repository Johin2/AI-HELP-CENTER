import type { Metadata } from 'next';
import Link from 'next/link';

import { DocsSection } from '@/components/docs-section';

export const metadata: Metadata = {
  title: 'Documentation | AI Help Center',
  description:
    'Read the complete AI Help Center SDK guide, including setup steps, environment variables, and integration examples.',
};

export default function DocsPage() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-16">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:text-white"
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
