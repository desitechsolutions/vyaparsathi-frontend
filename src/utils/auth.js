// Utility functions for authentication and token/session management

// Decode JWT token (returns payload as object)
export const decodeToken = (token) => {
  if (!token) return {};
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return {};
  }
};

// Store token and its expiry in localStorage
export const setToken = (token, refreshToken) => {
  const decoded = decodeToken(token);
  localStorage.setItem('token', token);
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  }
  if (decoded.exp) {
    localStorage.setItem('tokenExpiry', decoded.exp * 1000); // ms
  }
  window.dispatchEvent(new Event('tokenUpdated'));
};

// Check if user is authenticated (token exists and not expired)
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  const expiry = localStorage.getItem('tokenExpiry');
  return expiry ? new Date().getTime() < expiry : false;
};

// Remove token and expiry, redirect to login
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('tokenExpiry');
  // Navigation is handled by the calling component (e.g., in AuthContext or Header)
};

let inactivityTimeout;
const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutes

export function startInactivityTimer(onTimeout) {
  const resetTimer = () => {
    clearTimeout(inactivityTimeout);
    inactivityTimeout = setTimeout(onTimeout, INACTIVITY_LIMIT);
  };

  ['mousemove', 'keydown', 'scroll', 'click'].forEach(event =>
    window.addEventListener(event, resetTimer)
  );

  resetTimer();

  return () => {
    clearTimeout(inactivityTimeout);
    ['mousemove', 'keydown', 'scroll', 'click'].forEach(event =>
      window.removeEventListener(event, resetTimer)
    );
  };
}