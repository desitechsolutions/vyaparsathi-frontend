import { jwtDecode } from 'jwt-decode';

const AUTH_STORAGE_KEYS = [
  'token',
  'accessToken',
  'refreshToken',
  'user',
  'shopId',
  'subscriptionStatus',
  'razorpayStatus',
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
 * Automatically invokes clearAuthStorage() and returns null if missing, expired, or malformed.
 *
 * @returns {string|null} Valid JWT token string or null.
 */
export function getValidToken() {
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token || typeof token !== 'string') {
      clearAuthStorage();
      return null;
    }

    const decoded = jwtDecode(token);
    if (!decoded || typeof decoded !== 'object' || !decoded.exp) {
      clearAuthStorage();
      return null;
    }

    // exp is in seconds; compare against current time in ms
    if (decoded.exp * 1000 <= Date.now()) {
      clearAuthStorage();
      return null;
    }

    return token;
  } catch (err) {
    // Malformed token string or decoding failure
    clearAuthStorage();
    return null;
  }
}
