import React from 'react';
import usePermissions from '../../hooks/usePermissions';

/**
 * Renders {@code children} only if the current user holds the required
 * permission(s) in their active shop. Otherwise renders {@code fallback}
 * (default: nothing).
 *
 *   &lt;PermissionGate code="SALES_CREATE"&gt;
 *     &lt;Button&gt;New sale&lt;/Button&gt;
 *   &lt;/PermissionGate&gt;
 *
 * Mirrors the backend {@code @RequirePermission} annotation so the same
 * mental model applies on both sides.
 */
export default function PermissionGate({ code, anyOf, allOf, fallback = null, children }) {
  const { has, hasAny, hasAll, loading } = usePermissions();

  // While permissions are loading we hide the gated node to avoid a flash
  // of "clickable" state before the check completes. Loading is typically
  // sub-100ms because the hook caches in sessionStorage.
  if (loading) return null;

  let allowed = true;
  if (code) allowed = has(code);
  else if (Array.isArray(anyOf) && anyOf.length > 0) allowed = hasAny(...anyOf);
  else if (Array.isArray(allOf) && allOf.length > 0) allowed = hasAll(...allOf);

  return allowed ? children : fallback;
}
