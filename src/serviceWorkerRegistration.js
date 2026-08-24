/**
 * Service Worker registration for VyaparSathi.
 *
 * Usage (in src/index.js):
 *
 *   import * as serviceWorkerRegistration from './serviceWorkerRegistration';
 *
 *   serviceWorkerRegistration.register({
 *     onSuccess: (registration) => { ... },
 *     onUpdate:  (registration) => { ... },
 *   });
 *
 * Adapted from the CRA template but extended with:
 *  - Development-mode registration (opt-in via config.enableInDev)
 *  - Clean error boundaries and console tagging
 *  - A helper to send SKIP_WAITING to the waiting SW (used by the update prompt)
 */

const SW_URL = `${process.env.PUBLIC_URL}/service-worker.js`;

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    // IPv6 loopback
    window.location.hostname === '[::1]' ||
    // IPv4 loopback range 127.x.x.x
    window.location.hostname.match(
      /^127(?:\.(?:25[0-5]|2[0-4]\d|[01]?\d\d?)){3}$/
    )
);

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Register the service worker.
 *
 * @param {object} config
 * @param {function(ServiceWorkerRegistration): void} [config.onSuccess]
 *   Called when the SW is installed and the app is cached for offline use.
 * @param {function(ServiceWorkerRegistration): void} [config.onUpdate]
 *   Called when a new version of the SW is waiting to activate.
 *   Typically used to show a "New version available — Reload?" banner.
 * @param {boolean} [config.enableInDev=false]
 *   Set to true to also register in development (useful for testing offline behaviour).
 */
export function register(config = {}) {
  if (!('serviceWorker' in navigator)) {
    console.info('[SW] Service workers are not supported in this browser.');
    return;
  }

  // The service worker file must be served from the same origin as the page.
  const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
  if (publicUrl.origin !== window.location.origin) {
    // This can happen when PUBLIC_URL is on a CDN.
    console.warn('[SW] PUBLIC_URL is on a different origin — skipping registration.');
    return;
  }

  if (process.env.NODE_ENV === 'development') {
    if (config.enableInDev) {
      console.log('[SW] Development mode — registering service worker for offline testing.');
      window.addEventListener('load', () => registerAndWatch(SW_URL, config));
    } else {
      console.log('[SW] Development mode — service worker NOT registered (set enableInDev: true to override).');
    }
    return;
  }

  // Production: register on page load to avoid delaying first paint.
  window.addEventListener('load', () => registerAndWatch(SW_URL, config));
}

/**
 * Unregister the service worker and delete all caches (e.g. on logout reset).
 */
export async function unregister() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.unregister();
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
    console.log('[SW] Unregistered and caches cleared.');
  } catch (err) {
    console.error('[SW] Unregister failed:', err);
  }
}

/**
 * Tell a waiting service worker to skip waiting and take control immediately.
 * Call this when the user confirms the "Update available" prompt.
 */
export function activatePendingUpdate() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.ready.then((registration) => {
    if (registration.waiting) {
      registration.waiting.postMessage('SKIP_WAITING');
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

function registerAndWatch(swUrl, config) {
  if (isLocalhost) {
    // On localhost, first verify the SW file is reachable before registering
    // to avoid a confusing "failed to register" error in the console.
    checkServiceWorkerValidity(swUrl, config);
    navigator.serviceWorker.ready.then(() => {
      console.log(
        '[SW] This web app is being served cache-first by a service worker. ' +
          'To learn more, visit https://cra.link/PWA'
      );
    });
  } else {
    doRegister(swUrl, config);
  }
}

function doRegister(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      // Poll for updates every hour
      setInterval(() => registration.update(), 60 * 60 * 1000);

      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;

        installingWorker.onstatechange = () => {
          if (installingWorker.state !== 'installed') return;

          if (navigator.serviceWorker.controller) {
            // At this point, the updated precached content has been fetched,
            // but the previous service worker will still serve the older
            // content until all tabs are closed.
            console.log('[SW] New content is available; refresh to update.');

            // Dispatch a DOM event so any React component can listen for it
            window.dispatchEvent(new CustomEvent('sw-update-available', {
              detail: { registration },
            }));

            if (config.onUpdate) config.onUpdate(registration);
          } else {
            // At this point, everything has been precached.
            console.log('[SW] Content is cached for offline use.');
            if (config.onSuccess) config.onSuccess(registration);
          }
        };
      };

      // Listen for controller change (new SW took over after SKIP_WAITING)
      // and reload the page so the user gets the fresh version.
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
    })
    .catch((error) => {
      console.error('[SW] Registration failed:', error);
    });
}

function checkServiceWorkerValidity(swUrl, config) {
  fetch(swUrl, { headers: { 'Service-Worker': 'script' } })
    .then((response) => {
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && !contentType.includes('javascript'))
      ) {
        // SW file not found — unregister any existing SW to clean up
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => window.location.reload());
        });
      } else {
        doRegister(swUrl, config);
      }
    })
    .catch(() => {
      console.log('[SW] No internet connection found. App is running in offline mode.');
    });
}
