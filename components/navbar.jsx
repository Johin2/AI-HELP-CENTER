'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigationLinks = [
  { href: '/', label: 'Home' },
  { href: '/docs', label: 'Docs' },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 lg:max-w-7xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-brand/50 bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-brand transition hover:border-brand/80 hover:bg-brand/20"
        >
          AI Help Center
        </Link>

        <nav className="flex items-center gap-6 text-sm font-medium">
          {navigationLinks.map(({ href, label }) => {
            const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));

            return (
              <Link
                key={href}
                href={href}
                className={`transition hover:text-white ${
                  isActive ? 'text-white' : 'text-slate-300'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
