'use client';

import { useMemo, useState } from 'react';

import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { useSession } from '@/components/session-provider';

const providers = [
  { id: 'google', label: 'Google' },
];

const supabase = getSupabaseBrowserClient();

export function AuthButtons() {
  const { session, status, user } = useSession();
  const [error, setError] = useState(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const userDisplayName = useMemo(() => {
    if (!user) return null;
    return user.user_metadata?.full_name || user.email || user.user_metadata?.name || 'Signed in user';
  }, [user]);

  const handleSignIn = async (provider) => {
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        queryParams: { prompt: 'consent' },
      },
    });

    if (signInError) {
      console.error('Supabase sign-in failed', signInError);
      setError(signInError.message);
    }
  };

  const handleSignOut = async () => {
    setError(null);
    setIsSigningOut(true);

    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      console.error('Supabase sign-out failed', signOutError);
      setError(signOutError.message);
    }

    setIsSigningOut(false);
  };

  if (status === 'loading') {
    return <div className="text-xs text-slate-400">Checking session…</div>;
  }

  if (!session) {
    return (
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          {providers.map((provider) => (
            <button
              key={provider.id}
              type="button"
              onClick={() => handleSignIn(provider.id)}
              className="rounded-full border border-slate-700/80 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:border-brand/50 hover:bg-brand/10 hover:text-white"
            >
              Sign in with {provider.label}
            </button>
          ))}
        </div>
        {error ? <p className="text-xs text-rose-400">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-slate-300">
          {userDisplayName ? `Hello, ${userDisplayName}` : 'Signed in'}
        </span>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="rounded-full border border-brand/60 bg-brand/15 px-3 py-1 text-xs font-semibold text-brand-100 transition hover:border-brand/80 hover:bg-brand/25 hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSigningOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
      {error ? <p className="text-xs text-rose-400">{error}</p> : null}
    </div>
  );
}
