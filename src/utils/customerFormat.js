/**
 * Shared formatters + helpers used across the Customer module.
 *
 * <p>Before extraction each of these lived duplicated across 3-4
 * files with subtly different signatures — {@code inr} in one file
 * used {@code maximumFractionDigits:2} only, another set both min +
 * max to 2, giving different display for the same value. Consolidated
 * here so a change lands in one place.</p>
 */

/**
 * Indian-locale rupee formatter with 2-decimal display for both
 * whole and fractional amounts (₹1,234.00 not ₹1,234). Matches
 * the invoice/statement rendering convention.
 */
export const inr = (v) => {
  const n = Number(v || 0);
  return `₹${n.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Deterministic HSL color derived from a string. Used to color
 * avatar initials so the same customer always renders the same
 * color across the app.
 */
export const stringToColor = (string) => {
  if (!string) return '#94A3B8';
  let hash = 0;
  for (let i = 0; i < string.length; i += 1) {
    // eslint-disable-next-line no-bitwise
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 55%, 55%)`;
};

/**
 * Extract the leading initials from a name — "Sharma Traders Pvt Ltd"
 * → "ST". Falls back to a single char for one-word names, or "?"
 * for null/empty.
 */
export const initialsOf = (name) => {
  if (!name || typeof name !== 'string') return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Compact "time ago" — matches the pattern used in ActiveSessionsPage
 * so the customer module and the security module render times the
 * same way.
 */
export const timeAgo = (iso) => {
  if (!iso) return '—';
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return 'just now';
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 48) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
};
