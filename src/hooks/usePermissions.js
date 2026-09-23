import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchMyPermissions } from '../services/api';
import { useAuthContext } from '../context/AuthContext';

/**
 * Hook: return the current user's effective permission set for the active
 * shop, plus helpers `has`, `hasAny`, `hasAll` for gating UI.
 *
 * Permissions are fetched once per (user × shop) pair and cached in
 * sessionStorage keyed by shopId so shop-switches and multi-tab scenarios
 * always get the right permission set. On sign-out or shop-switch,
 * {@link AuthContext.login}/{@link AuthContext.logout} call
 * {@link clearPermissionsCache} which removes every permissions key.
 *
 * RBAC-1 fix: the `load` callback now depends on `shopId` (a scalar from
 * the JWT) instead of the full `user` object. `jwtDecode` returns a new
 * object on every silentRefresh, causing `user` to change reference every
 * 60 s even when the underlying claims are identical. Using `shopId`
 * prevents that spurious re-fetch cycle.
 *
 * RBAC-7 fix: the sessionStorage key includes `shopId` so permissions from
 * Shop A are never served to a session scoped to Shop B.
 */
export default function usePermissions() {
  const { user } = useAuthContext();
  // Derive stable scalar identifiers from the JWT claims.
  const shopId  = user?.shopId  ?? null;
  const userId  = user?.userId  ?? user?.id ?? null;

  const cacheKey = shopId ? `${CACHE_PREFIX}${shopId}` : null;

  const [permissions, setPermissions] = useState(() => cacheKey ? readCache(cacheKey) : null);
  const [loading, setLoading] = useState(!permissions);
  const [error, setError] = useState(null);

  // Track the last (userId, shopId) pair we fetched for so we can detect
  // a genuine identity change vs. a reference-identity change in `user`.
  const lastFetchedRef = useRef({ userId: null, shopId: null });

  const load = useCallback(async () => {
    if (!user || !shopId) {
      setPermissions(new Set());
      setLoading(false);
      return;
    }

    // Skip the network call if we already fetched for this exact (user, shop).
    if (
      lastFetchedRef.current.userId === userId &&
      lastFetchedRef.current.shopId === shopId
    ) {
      return;
    }

    // Try the cache first (covers the same-tab page navigation case).
    const cached = cacheKey ? readCache(cacheKey) : null;
    if (cached) {
      setPermissions(cached);
      setLoading(false);
      lastFetchedRef.current = { userId, shopId };
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetchMyPermissions();
      const list = Array.isArray(res.data?.permissions) ? res.data.permissions : [];
      const set = new Set(list);
      setPermissions(set);
      if (cacheKey) writeCache(cacheKey, list);
      lastFetchedRef.current = { userId, shopId };
    } catch (err) {
      setError(err);
      setPermissions(new Set()); // fail-closed
    } finally {
      setLoading(false);
    }
  }, [user, userId, shopId, cacheKey]);

  useEffect(() => { load(); }, [load]);

  const has    = useCallback((code) => permissions?.has?.(code) === true, [permissions]);
  const hasAny = useCallback((...codes) => codes.some((c) => permissions?.has?.(c)), [permissions]);
  const hasAll = useCallback((...codes) => codes.every((c) => permissions?.has?.(c)), [permissions]);

  return useMemo(() => ({
    permissions, loading, error, refresh: load, has, hasAny, hasAll,
  }), [permissions, loading, error, load, has, hasAny, hasAll]);
}

const CACHE_PREFIX = 'rbac.permissions.v1.shop.';

function readCache(key) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return null;
    return new Set(list);
  } catch {
    return null;
  }
}

function writeCache(key, list) {
  try { sessionStorage.setItem(key, JSON.stringify(list)); } catch { /* quota — ignore */ }
}

/**
 * Called by AuthContext on logout / shop switch.
 * Removes every shopId-keyed permissions entry from sessionStorage.
 */
export const clearPermissionsCache = () => {
  try {
    const toRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith(CACHE_PREFIX)) toRemove.push(k);
    }
    toRemove.forEach((k) => sessionStorage.removeItem(k));
  } catch { /* ignore */ }
};
