import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// ── Service Worker registration ────────────────────────────────────────────
// In production the SW is registered unconditionally.
// In development it is skipped by default to avoid interfering with HMR;
// set enableInDev: true below to test offline behaviour locally.
serviceWorkerRegistration.register({
  // Called once when the app shell is successfully cached for the first time.
  onSuccess: (_registration) => {
    console.log('[SW] App is ready for offline use.');
  },

  // Called when a new SW version has been installed and is waiting.
  // We dispatch a DOM event so the React app can react (toast, banner, etc.)
  // without coupling this bootstrap file to any UI library.
  onUpdate: (registration) => {
    console.log('[SW] A new version is available.');

    // The 'sw-update-available' event is picked up by the global listener
    // below and by any component listening via useEffect / custom hook.
    window.dispatchEvent(
      new CustomEvent('sw-update-available', { detail: { registration } })
    );
  },

  // Uncomment to enable SW in development (useful for testing offline mode):
  // enableInDev: true,
});

// ── Global update notification (vanilla JS fallback) ──────────────────────
// Shows a simple, accessible reload prompt if no React UI component is
// listening to the 'sw-update-available' event.  React components should
// prefer the event directly (e.g. via useEffect) for a richer UX.
window.addEventListener('sw-update-available', (event) => {
  // Give React a tick to mount its own handler first.
  setTimeout(() => {
    if (event.defaultPrevented) return; // React already handled it

    const shouldReload = window.confirm(
      'A new version of VyaparSathi is available.\n\nReload now to update?'
    );
    if (shouldReload) {
      const { registration } = event.detail || {};
      if (registration?.waiting) {
        // Tell the waiting SW to take over, then reload on controllerchange.
        registration.waiting.postMessage('SKIP_WAITING');
      } else {
        window.location.reload();
      }
    }
  }, 500);
});

// ── Web Vitals ────────────────────────────────────────────────────────────
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
reportWebVitals();