// Utility for smart idle timeout/session extension
// This tracks user interaction and signals the AuthContext to check token health.

let checkTimer; // Single reference for the check loop
const IDLE_LIMIT = 5 * 60 * 1000; // 5 min
const WARNING_THRESHOLD = 2 * 60 * 1000; // 2 min before expiry

let lastActivity = Date.now();
let onExtendSession = null;
let lastExtensionCall = 0;

/**
 * Throttled activity updater to prevent performance lag
 * and redundant state updates in AuthContext.
 */
function updateLastActivity() {
  lastActivity = Date.now();
  
  // Only trigger the "onExtend" (which triggers silent refresh checks) 
  // once every 30 seconds to save CPU/Network
  if (onExtendSession && (lastActivity - lastExtensionCall > 30000)) {
    lastExtensionCall = lastActivity;
    onExtendSession();
  }
}

/**
 * Starts the idle timer.
 * @param {Function} onTimeout - Called when IDLE_LIMIT is reached.
 * @param {Function} onWarning - Called when user enters the warning zone.
 * @param {Function} onExtend - Called to check if JWT needs refreshing (Silent Refresh).
 */
export function startSmartIdleTimer({ onTimeout, onWarning, onExtend }) {
  onExtendSession = onExtend;
  lastActivity = Date.now(); // Reset on start

  const userEvents = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
  userEvents.forEach((event) => 
    window.addEventListener(event, updateLastActivity, { passive: true })
  );

  // API call activity extension: listen for signals from api.js
  window.addEventListener('apiActivity', updateLastActivity);

  function checkIdle() {
    const now = Date.now();
    const idleTime = now - lastActivity;

    if (idleTime >= IDLE_LIMIT) {
      // USER EXPIRED
      cleanup();
      onTimeout();
      return; // Stop the loop
    } 

    if (idleTime > (IDLE_LIMIT - WARNING_THRESHOLD)) {
      // USER IN WARNING ZONE
      onWarning(IDLE_LIMIT - idleTime); 
      // Check more frequently (every 10s) during warning period
      checkTimer = setTimeout(checkIdle, 10000);
    } else {
      // USER IS ACTIVE
      // Check every 30s to see if they've entered warning zone
      checkTimer = setTimeout(checkIdle, 30000);
    }
  }

  // Start the loop
  checkTimer = setTimeout(checkIdle, 30000);

  function cleanup() {
    clearTimeout(checkTimer);
    userEvents.forEach((event) => 
      window.removeEventListener(event, updateLastActivity)
    );
    window.removeEventListener('apiActivity', updateLastActivity);
  }

  return cleanup;
}

/**
 * Utility for triggering activity from API calls.
 * Used in the API interceptor to signal the app that the user is still interacting with the server.
 */
export function signalApiActivity() {
  window.dispatchEvent(new Event('apiActivity'));
}

/**
 * Manual JWT decoder if jwt-decode library isn't available.
 */
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
    console.error("Manual token decoding failed", e);
    return {};
  }
};