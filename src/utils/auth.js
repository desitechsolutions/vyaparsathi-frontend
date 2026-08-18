// Bumped from 5 → 30 min in Phase 6. Five minutes turned out to be far
// too aggressive for the workflows that keep an admin on a single screen
// for a while (approving a batch of GRNs, reviewing GST returns, drafting
// a big invoice). Thirty minutes matches the industry norm (Zoho, QBO,
// SAP Business One) and the WARNING_THRESHOLD gives the user a two-minute
// heads-up they can dismiss to stay signed in.
const IDLE_LIMIT = 30 * 60 * 1000; // 30 minutes
const WARNING_THRESHOLD = 2 * 60 * 1000; // 2 minutes

export function startSmartIdleTimer({ onTimeout, onWarning, onExtend }) {
  let lastActivity = Date.now();
  let warningShown = false;
  let intervalId = null;
  let isCleanedUp = false;
  let lastExtendCall = 0; 

  const userEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

  function updateLastActivity() {
    if (isCleanedUp) return;
    lastActivity = Date.now();
    warningShown = false;

    // Throttle the extend check to once every 30 seconds
    if (onExtend && (Date.now() - lastExtendCall > 30000)) {
      onExtend();
      lastExtendCall = Date.now();
    }
  }

  userEvents.forEach((event) =>
    window.addEventListener(event, updateLastActivity, { passive: true })
  );

  function checkIdle() {
    if (isCleanedUp) return;
    const idleTime = Date.now() - lastActivity;

    if (idleTime >= IDLE_LIMIT) {
      cleanup();
      onTimeout();
    } else if (idleTime >= IDLE_LIMIT - WARNING_THRESHOLD && !warningShown) {
      warningShown = true;
      onWarning?.(IDLE_LIMIT - idleTime);
    }
  }

  intervalId = setInterval(checkIdle, 5000);

  function cleanup() {
    isCleanedUp = true;
    clearInterval(intervalId);
    userEvents.forEach((event) =>
      window.removeEventListener(event, updateLastActivity)
    );
  }

  return cleanup;
}

export function signalApiActivity() {
  // Activity signal helper for idle timer
}