// Utility for smart idle timeout/session extension

let idleTimeout;
let warningTimeout;
const IDLE_LIMIT = 5 * 60 * 1000; // 5 min
const WARNING_THRESHOLD = 2 * 60 * 1000; // 2 min before expiry

let lastActivity = Date.now();
let onExtendSession = null;

function updateLastActivity() {
  lastActivity = Date.now();
  if (onExtendSession) onExtendSession();
}

export function startSmartIdleTimer({ onTimeout, onWarning, onExtend }) {
  onExtendSession = onExtend;

  const userEvents = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
  userEvents.forEach((event) => window.addEventListener(event, updateLastActivity, { passive: true }));

  // API call activity extension: expose function to call from api.js
  window.addEventListener('apiActivity', updateLastActivity);

  function checkIdle() {
    const now = Date.now();
    const idleTime = now - lastActivity;
    if (idleTime > IDLE_LIMIT) {
      cleanup();
      onTimeout();
    } else if (idleTime > (IDLE_LIMIT - WARNING_THRESHOLD)) {
      onWarning(IDLE_LIMIT - idleTime); // ms left
      warningTimeout = setTimeout(checkIdle, 10 * 1000); // check again in 10s
    } else {
      clearTimeout(warningTimeout);
      warningTimeout = setTimeout(checkIdle, 30 * 1000); // check again in 30s
    }
  }

  idleTimeout = setTimeout(checkIdle, 30 * 1000); // First check in 30s

  function cleanup() {
    clearTimeout(idleTimeout);
    clearTimeout(warningTimeout);
    userEvents.forEach((event) => window.removeEventListener(event, updateLastActivity));
    window.removeEventListener('apiActivity', updateLastActivity);
  }
  return cleanup;
}

// Utility for triggering activity from API calls
export function signalApiActivity() {
  window.dispatchEvent(new Event('apiActivity'));
}

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