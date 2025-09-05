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

// Remove token and expiry, redirect to login
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('tokenExpiry');
  // Navigation is handled by the calling component (e.g., in AuthContext or Header)
};

let inactivityTimeout;
const INACTIVITY_LIMIT = 5 * 60 * 1000; // 5 minutes

export function startInactivityTimer(onTimeout) {
  const resetTimer = () => {
    clearTimeout(inactivityTimeout);
    inactivityTimeout = setTimeout(onTimeout, INACTIVITY_LIMIT);
  };

  const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
  events.forEach(event => window.addEventListener(event, resetTimer, { passive: true }));

  resetTimer(); // Initialize timer

  // Return a cleanup function to be called on component unmount
  return () => {
    clearTimeout(inactivityTimeout);
    events.forEach(event => window.removeEventListener(event, resetTimer));
  };
}