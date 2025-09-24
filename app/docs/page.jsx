import { DocsSection } from '@/components/docs-section';

export const metadata = {
  title: 'Documentation | AI Help Center',
  description: 'Read the complete AI Help Center SDK guide, including setup steps, environment variables, and integration examples.',
};

export default function DocsPage() {
  return (
    <main className="relative mx-auto min-h-screen max-w-5xl px-6 pb-20 pt-24">
      <div className="pointer-events-none absolute inset-x-0 -top-32 -z-10 flex justify-center">
        <div className="h-64 w-full max-w-5xl rounded-full bg-brand/30 blur-3xl" />
      </div>

      <header className="space-y-4 text-center sm:text-left">
        <span className="inline-flex rounded-full border border-brand/50 bg-brand/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-brand">
          Documentation
        </span>
        <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">All of the answers, in one place.</h1>
        <p className="text-base text-slate-300 sm:text-lg">
          Explore configuration steps, SDK usage, and integration tips without leaving the page. Everything you need to ship the
          AI Help Center lives below.
        </p>
      </header>

      <div className="mt-12">
        <DocsSection />
      </div>
    </main>
  );
}
