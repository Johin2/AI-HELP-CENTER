import type { Metadata } from 'next';
import Link from 'next/link';

import { DocsSection, docsOutline } from '@/components/docs-section';

const primaryNavigation = [
  { label: 'AI Help Center', href: '/' },
  { label: 'Documentation', href: '/docs', isActive: true },
  { label: 'Integrations', href: '/#integrations' },
  { label: 'Learn', href: '/#learn' },
  { label: 'Contributing', href: '/#contributing' },
];

const utilityNavigation = [
  { label: 'GitHub', href: 'https://github.com', external: true },
  { label: 'Support', href: 'mailto:support@example.com', external: true },
];

export const metadata: Metadata = {
  title: 'Documentation | AI Help Center',
  description:
    'Read the complete AI Help Center SDK guide, including setup steps, environment variables, and integration examples.',
};

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3 text-sm font-semibold text-white">
              <span className="rounded-full border border-brand/40 bg-brand/10 px-3 py-1 text-xs uppercase tracking-[0.35em] text-brand">
                AI
              </span>
              <span>Help Center</span>
            </Link>
            <nav className="hidden items-center gap-1 rounded-full border border-slate-800 bg-slate-900/60 p-1 text-sm font-medium text-slate-300 lg:flex">
              {primaryNavigation.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`rounded-full px-3 py-1 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                    item.isActive
                      ? 'bg-slate-800 text-white shadow-glow'
                      : 'hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-300">
            {utilityNavigation.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 transition hover:border-slate-700 hover:text-white"
                {...(item.external ? { target: '_blank', rel: 'noreferrer' } : {})}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </header>

      <div className="relative">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.12),_transparent_60%)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-6 py-12">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300 lg:hidden">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">On this page</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {docsOutline.map((section) => (
                <Link
                  key={section.id}
                  href={`#${section.id}`}
                  className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-xs font-medium text-slate-300 transition hover:border-slate-700 hover:text-white"
                >
                  {section.title}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-10 lg:mt-12 lg:flex-row">
            <aside className="hidden w-64 shrink-0 lg:block">
              <div className="sticky top-28 space-y-6">
                <div className="rounded-2xl border border-brand/40 bg-brand/10 p-5 text-brand">
                  <p className="text-xs font-semibold uppercase tracking-[0.4em] text-brand/80">OSS v0-alpha</p>
                  <p className="mt-3 text-sm leading-relaxed text-brand/80">
                    Preview the AI Help Center SDK docs and follow along as the platform evolves toward a stable release.
                  </p>
                </div>

                <nav className="space-y-6 text-sm">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">Documentation</p>
                    <ul className="mt-4 space-y-2">
                      {docsOutline.map((section) => (
                        <li key={section.id}>
                          <Link
                            href={`#${section.id}`}
                            className="group block rounded-xl border border-transparent px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-800 hover:bg-slate-900/60 hover:text-white"
                          >
                            {section.title}
                          </Link>
                          {section.children && (
                            <ul className="mt-1 space-y-1 border-l border-slate-800 pl-4 text-xs text-slate-400">
                              {section.children.map((child) => (
                                <li key={child.id}>
                                  <Link
                                    href={`#${child.id}`}
                                    className="block rounded px-2 py-1 transition hover:bg-slate-900/60 hover:text-slate-200"
                                  >
                                    {child.title}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </nav>
              </div>
            </aside>

            <DocsSection />
          </div>
        </div>
      </div>
    </main>
  );
}
