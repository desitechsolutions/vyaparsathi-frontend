import { jwtDecode } from 'jwt-decode';

const AUTH_STORAGE_KEYS = [
  'token',
  'accessToken',
  'refreshToken',
  'user',
  'shopId',
  'subscriptionStatus',
  'razorpayStatus',
  // 'lastUsername' is intentionally NOT listed here. It is a UX convenience
  // (pre-fills the username field for returning users on the same device) and
  // is not an authentication secret. Clearing it on logout would mean the login
  // form is always blank, worsening the UX for shared-device single-user
  // scenarios. However, it is deliberately NOT read for any auth decision.
  // If a stricter privacy posture is required (e.g. GDPR), add it back here.
];

/**
 * Clears all authentication, user, shop, and subscription keys from localStorage and sessionStorage.
 */
export function clearAuthStorage() {
  try {
    AUTH_STORAGE_KEYS.forEach((key) => {
      localStorage.removeItem(key);
    });
    sessionStorage.removeItem('redirectAfterLogin');
  } catch (err) {
    console.error('[authStorage] Failed to clear storage:', err);
  }
}

/**
 * Reads token from localStorage, parses JWT payload, checks expiration and structural validity.
 * Returns the raw token string if valid, or null otherwise.
 *
 * IMPORTANT: This function intentionally does NOT call clearAuthStorage() for most
 * cases. It is called by the Axios request interceptor on every single request,
 * including background polls. Calling clearAuthStorage() here when no token is
 * present (e.g. on the login page before any authentication) would be a no-op in
 * the happy path — but in a logout/login race it could delete a token that was
 * written by a concurrent login call, silently destroying the new user's session.
 *
 * Callers that require a full session wipe on bad state (e.g. AuthContext.init)
 * should call clearAuthStorage() explicitly after receiving null.
 *
 * @returns {string|null} Valid JWT token string or null.
 */
export function getValidToken() {
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    // No token at all — this is normal on the login page and during logout.
    // Do NOT call clearAuthStorage(): that would wipe any other auth keys even
    // though there is nothing wrong. Return null and let the caller decide.
    if (!token || typeof token !== 'string') {
      return null;
    }

    const decoded = jwtDecode(token);
    if (!decoded || typeof decoded !== 'object' || !decoded.exp) {
      // Token exists but is structurally invalid — remove only the bad token
      // key, not the entire auth namespace. Other keys (explicit_logout flag,
      // etc.) must survive.
      localStorage.removeItem('token');
      localStorage.removeItem('accessToken');
      return null;
    }

    // exp is in seconds; compare against current time in ms.
    // Do NOT call clearAuthStorage() here — simply return null so the
    // caller (interceptor or silentRefresh) can decide to refresh or
    // redirect. Clearing storage here would wipe a newly logged-in
    // user's token when a stale interval fires.
    if (decoded.exp * 1000 <= Date.now()) {
      return null;
    }

    return token;
  } catch (err) {
    // Malformed token string — decoding failure. Remove only the token key,
    // not the whole auth namespace (same reasoning as above).
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    return null;
  }
}
