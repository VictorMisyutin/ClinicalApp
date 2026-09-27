import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Clinician } from '@/types/domain';
import { onUnauthorized, setAuthToken } from '@/api/handoffs';
import type { LoginResult } from '@/api/handoffs';

/**
 * Session state.
 *
 * Sign-in exchanges employee ID + password for a token (src/api/handoffs.ts's
 * login()). The token itself is not React state — it lives in the api module
 * so every request can reach it — this context just tracks who is signed in
 * and persists the pair to sessionStorage so a refresh mid-shift doesn't force
 * a re-login.
 */

const STORAGE_KEY = 'handoff.session';

interface StoredSession {
  clinician: Clinician;
  token: string;
}

interface SessionValue {
  clinician: Clinician | null;
  signIn: (result: LoginResult) => void;
  signOut: () => void;
}

const SessionContext = createContext<SessionValue | null>(null);

function readStoredSession(): StoredSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [clinician, setClinician] = useState<Clinician | null>(() => {
    const stored = readStoredSession();
    if (stored) setAuthToken(stored.token);
    return stored?.clinician ?? null;
  });

  const signOut = useCallback(() => {
    setAuthToken(null);
    sessionStorage.removeItem(STORAGE_KEY);
    setClinician(null);
  }, []);

  const signIn = useCallback((result: LoginResult) => {
    setAuthToken(result.token);
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ clinician: result.clinician, token: result.token }),
    );
    setClinician(result.clinician);
  }, []);

  // If any request comes back 401 (token expired or rejected), fall back to
  // sign-in rather than leaving the UI stuck on stale data.
  useEffect(() => {
    onUnauthorized(signOut);
    return () => onUnauthorized(null);
  }, [signOut]);

  const value = useMemo(
    () => ({ clinician, signIn, signOut }),
    [clinician, signIn, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside a SessionProvider.');
  return value;
}
