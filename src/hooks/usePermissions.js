import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchMyPermissions } from '../services/api';
import { useAuthContext } from '../context/AuthContext';

/**
 * Hook: return the current user's effective permission set for the active
 * shop, plus helpers `has`, `hasAny`, `hasAll` for gating UI.
 *
 * Permissions are fetched once per session (per user + shop) and cached
 * in sessionStorage so page navigations don't re-fetch. On sign-out or
 * shop-switch, {@link AuthContext.login}/{@link AuthContext.logout}
 * clear the cache and this hook re-fetches.
 */
export default function usePermissions() {
  const { user } = useAuthContext();
  const [permissions, setPermissions] = useState(() => readCache());
  const [loading, setLoading] = useState(!permissions);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!user) {
      setPermissions(new Set());
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchMyPermissions();
      const list = Array.isArray(res.data?.permissions) ? res.data.permissions : [];
      const set = new Set(list);
      setPermissions(set);
      writeCache(list);
    } catch (err) {
      setError(err);
      setPermissions(new Set()); // fail-closed
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const has    = useCallback((code) => permissions?.has?.(code) === true, [permissions]);
  const hasAny = useCallback((...codes) => codes.some((c) => permissions?.has?.(c)), [permissions]);
  const hasAll = useCallback((...codes) => codes.every((c) => permissions?.has?.(c)), [permissions]);

  return useMemo(() => ({
    permissions, loading, error, refresh: load, has, hasAny, hasAll,
  }), [permissions, loading, error, load, has, hasAny, hasAll]);
}

const CACHE_KEY = 'rbac.permissions.v1';

function readCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return null;
    return new Set(list);
  } catch {
    return null;
  }
}

function writeCache(list) {
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(list)); } catch { /* quota — ignore */ }
}

/** Called by AuthContext on logout / shop switch. */
export const clearPermissionsCache = () => {
  try { sessionStorage.removeItem(CACHE_KEY); } catch { /* ignore */ }
};
