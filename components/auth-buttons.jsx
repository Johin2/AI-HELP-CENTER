'use client';

import { useMemo } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';

const providers = [
  { id: 'google', label: 'Google' },
  { id: 'github', label: 'GitHub' },
];

export function AuthButtons() {
  const { data: session, status } = useSession();

  const userDisplayName = useMemo(() => {
    if (!session?.user) return null;
    return session.user.name || session.user.email || 'Signed in user';
  }, [session?.user]);

  if (status === 'loading') {
    return <div className="text-xs text-slate-400">Checking session…</div>;
  }

  if (!session) {
    return (
      <div className="flex items-center gap-2">
        {providers.map((provider) => (
          <button
            key={provider.id}
            type="button"
            onClick={() => signIn(provider.id)}
            className="rounded-full border border-slate-700/80 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:border-brand/50 hover:bg-brand/10 hover:text-white"
          >
            Sign in with {provider.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-medium text-slate-300">
        {userDisplayName ? `Hello, ${userDisplayName}` : 'Signed in'}
      </span>
      <button
        type="button"
        onClick={() => signOut()}
        className="rounded-full border border-brand/60 bg-brand/15 px-3 py-1 text-xs font-semibold text-brand-100 transition hover:border-brand/80 hover:bg-brand/25 hover:text-white"
      >
        Sign out
      </button>
    </div>
  );
}
