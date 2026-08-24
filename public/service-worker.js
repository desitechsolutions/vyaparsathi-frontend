/**
 * VyaparSathi Service Worker
 *
 * Strategy overview:
 *  - Static assets (JS, CSS, images, fonts)  → Cache-first
 *  - API GET requests (/api/*, /auth/*)       → Network-first, short-lived cache fallback
 *  - API mutation requests (POST/PUT/PATCH/DELETE) → Try network, queue to IndexedDB on failure
 *  - Navigation requests when offline          → Serve /offline.html from cache
 *
 * Cache names are versioned so activating a new SW cleans up all old caches.
 * Background Sync replays queued mutations when connectivity is restored.
 */

// ─── Version ─────────────────────────────────────────────────────────────────
// Bump CACHE_VERSION on every deploy to bust stale caches.
const CACHE_VERSION = 'v1';
const STATIC_CACHE  = `vyaparsathi-static-${CACHE_VERSION}`;
const API_CACHE     = `vyaparsathi-api-${CACHE_VERSION}`;
const ALL_CACHES    = [STATIC_CACHE, API_CACHE];

// API cache TTL — 5 minutes. Serve stale data beyond this only when offline.
const API_CACHE_TTL_MS = 5 * 60 * 1000;

// ─── App shell — pre-cached on SW install ────────────────────────────────────
// Hashed JS/CSS bundles are cached on first load by the cache-first handler.
// We only pre-cache stable, un-hashed URLs here.
const SHELL_URLS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
];

// ─── IndexedDB background-sync store ─────────────────────────────────────────
const SYNC_DB_NAME  = 'vyaparsathi-sync-queue';
const SYNC_DB_VER   = 1;
const SYNC_STORE    = 'pending-requests';
const SYNC_TAG      = 'vyaparsathi-bg-sync';

// ─────────────────────────────────────────────────────────────────────────────
// INSTALL — pre-cache the app shell
// ─────────────────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting()) // activate new SW immediately
      .catch((err) => {
        // Non-fatal: shell pre-cache can fail if offline at install time.
        console.warn('[SW] Shell pre-cache failed (likely offline at install):', err);
        return self.skipWaiting();
      })
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVATE — delete old versioned caches + claim all open tabs
// ─────────────────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Remove every cache not in the current version set
      caches.keys().then((names) =>
        Promise.all(
          names
            .filter((n) => !ALL_CACHES.includes(n))
            .map((n) => {
              console.log('[SW] Removing old cache:', n);
              return caches.delete(n);
            })
        )
      ),
      // Purge stale API entries that survived a version bump
      pruneExpiredApiCache(),
      // Take control of all open pages immediately
      self.clients.claim(),
    ])
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// FETCH — route requests to the right strategy
// ─────────────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Ignore non-HTTP(S) requests (e.g. chrome-extension://)
  if (!request.url.startsWith('http')) return;

  let url;
  try {
    url = new URL(request.url);
  } catch (_) {
    return;
  }

  const isApiPath = url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/');

  // ── Mutation requests on API endpoints ────────────────────────────────────
  // Try the network; queue to IndexedDB if offline for background replay.
  if (request.method !== 'GET' && isApiPath) {
    event.respondWith(handleMutation(request));
    return;
  }

  // Skip non-GET requests that are not API mutations (forms, etc.)
  if (request.method !== 'GET') return;

  // ── API GET calls ──────────────────────────────────────────────────────────
  // Network-first: always prefer fresh data; fall back to timed cache.
  if (isApiPath) {
    event.respondWith(networkFirst(request));
    return;
  }

  // ── Static assets + navigation ─────────────────────────────────────────────
  // Cache-first: JS/CSS/image bundles rarely change within a version.
  event.respondWith(cacheFirst(request));
});

// ─────────────────────────────────────────────────────────────────────────────
// BACKGROUND SYNC — replay queued mutations when online
// ─────────────────────────────────────────────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(replayQueue());
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGE — communication channel with the React app
// ─────────────────────────────────────────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (!event.data) return;

  // The app sends 'SKIP_WAITING' when the user accepts an update prompt.
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  // The UI can ask for the current queue depth to show a badge.
  if (event.data?.type === 'GET_SYNC_QUEUE_COUNT') {
    getQueuedRequests()
      .then((items) => {
        if (event.source) {
          event.source.postMessage({
            type: 'SYNC_QUEUE_COUNT',
            count: items.length,
          });
        }
      })
      .catch(() => {});
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Strategy helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cache-first: serve from cache if available, otherwise fetch and cache.
 * Falls back to /offline.html for navigation requests.
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      // Don't cache opaque responses — they bloat the cache with unknowable content.
      if (response.type !== 'opaque') {
        cache.put(request, response.clone());
      }
    }
    return response;
  } catch (_err) {
    // Navigation request with no cache hit → show the offline page
    if (request.mode === 'navigate') {
      const offlinePage = await caches.match('/offline.html');
      if (offlinePage) return offlinePage;
    }
    return offlineJsonResponse();
  }
}

/**
 * Network-first: always try the network; fall back to a timestamped cache
 * entry if the network fails. Caches successful responses for offline use.
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, withCacheTimestamp(response.clone()));
    }
    return response;
  } catch (_err) {
    // Network failed — look for a still-valid cached copy
    const stale = await getTimestampedCache(request);
    if (stale) return stale;

    // Nothing cached → return an offline indicator JSON
    return offlineJsonResponse();
  }
}

/**
 * Handle mutating API calls (POST/PUT/PATCH/DELETE).
 * If the network is unavailable the request is serialised to IndexedDB
 * and a 202 Accepted response is returned so the UI can surface a queued
 * state. The browser's Background Sync API will replay the queue when
 * connectivity is restored.
 */
async function handleMutation(request) {
  // Clone before fetch — the body stream can only be consumed once.
  const clonedRequest = request.clone();

  try {
    return await fetch(request);
  } catch (_err) {
    // Serialise to the sync queue
    await enqueue(clonedRequest);

    // Ask the browser to fire a sync event when back online
    try {
      await self.registration.sync.register(SYNC_TAG);
    } catch (syncErr) {
      // Background Sync API not supported (e.g. Firefox) — we'll still replay
      // the queue on the next successful network-first hit via replayQueue().
      console.warn('[SW] Background Sync registration failed:', syncErr.message);
    }

    return new Response(
      JSON.stringify({
        queued: true,
        message: 'You are offline. This action has been queued and will be sent when you reconnect.',
      }),
      {
        status: 202,
        headers: {
          'Content-Type': 'application/json',
          'X-SW-Queued': 'true',
        },
      }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Background-sync queue replay
// ─────────────────────────────────────────────────────────────────────────────
async function replayQueue() {
  const entries = await getQueuedRequests();
  if (!entries.length) return;

  let synced = 0;

  await Promise.allSettled(
    entries.map(async (entry) => {
      try {
        const init = {
          method:      entry.method,
          headers:     new Headers(entry.headers || {}),
          credentials: 'include',
        };
        if (entry.body !== undefined && entry.body !== null) {
          init.body = typeof entry.body === 'string'
            ? entry.body
            : JSON.stringify(entry.body);
        }

        const response = await fetch(entry.url, init);

        if (response.ok || response.status < 500) {
          // 4xx means the request was received and rejected (e.g. validation),
          // not a transient failure — remove it so we don't loop forever.
          await dequeue(entry.id);
          synced++;
        }
        // 5xx / network errors: leave in queue for the next sync attempt.
      } catch (_err) {
        // Transient failure — leave in queue
      }
    })
  );

  if (synced > 0) {
    broadcastToClients({ type: 'SYNC_COMPLETE', synced });
  }
  // Broadcast current queue depth so UI badges update
  const remaining = await getQueuedRequests();
  broadcastToClients({ type: 'SYNC_QUEUE_COUNT', count: remaining.length });
}

// ─────────────────────────────────────────────────────────────────────────────
// IndexedDB helpers
// ─────────────────────────────────────────────────────────────────────────────

function openSyncDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(SYNC_DB_NAME, SYNC_DB_VER);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(SYNC_STORE)) {
        const store = db.createObjectStore(SYNC_STORE, {
          keyPath:       'id',
          autoIncrement: true,
        });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    req.onsuccess  = () => resolve(req.result);
    req.onerror    = () => reject(req.error);
  });
}

async function enqueue(request) {
  let body = null;
  try {
    const text = await request.clone().text();
    if (text) {
      try {
        body = JSON.parse(text);
      } catch (_) {
        body = text; // store raw text if it's not JSON
      }
    }
  } catch (_) {}

  const entry = {
    url:       request.url,
    method:    request.method,
    headers:   Object.fromEntries(request.headers.entries()),
    body,
    timestamp: Date.now(),
  };

  const db = await openSyncDb();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(SYNC_STORE, 'readwrite');
    const store = tx.objectStore(SYNC_STORE);
    const req   = store.add(entry);
    req.onsuccess  = () => resolve(req.result);
    req.onerror    = () => reject(req.error);
    tx.oncomplete  = () => db.close();
  });
}

async function getQueuedRequests() {
  const db = await openSyncDb();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(SYNC_STORE, 'readonly');
    const store = tx.objectStore(SYNC_STORE);
    const req   = store.getAll();
    req.onsuccess  = () => resolve(req.result || []);
    req.onerror    = () => reject(req.error);
    tx.oncomplete  = () => db.close();
  });
}

async function dequeue(id) {
  const db = await openSyncDb();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(SYNC_STORE, 'readwrite');
    const store = tx.objectStore(SYNC_STORE);
    const req   = store.delete(id);
    req.onsuccess  = () => resolve();
    req.onerror    = () => reject(req.error);
    tx.oncomplete  = () => db.close();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Cache helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Adds an X-SW-Cached-At header so we can enforce TTL later. */
function withCacheTimestamp(response) {
  const headers = new Headers(response.headers);
  headers.set('X-SW-Cached-At', String(Date.now()));
  return new Response(response.body, {
    status:     response.status,
    statusText: response.statusText,
    headers,
  });
}

/** Returns a cached API response only if it's within TTL. */
async function getTimestampedCache(request) {
  const cache    = await caches.open(API_CACHE);
  const response = await cache.match(request);
  if (!response) return null;

  const cachedAt = response.headers.get('X-SW-Cached-At');
  if (cachedAt) {
    const age = Date.now() - parseInt(cachedAt, 10);
    if (age > API_CACHE_TTL_MS) {
      cache.delete(request); // evict expired entry
      return null;
    }
  }
  return response;
}

/** Evicts API cache entries older than TTL. Called on activate. */
async function pruneExpiredApiCache() {
  try {
    const cache    = await caches.open(API_CACHE);
    const requests = await cache.keys();
    const now      = Date.now();
    return Promise.all(
      requests.map(async (req) => {
        const res = await cache.match(req);
        if (!res) return;
        const cachedAt = res.headers.get('X-SW-Cached-At');
        if (cachedAt && now - parseInt(cachedAt, 10) > API_CACHE_TTL_MS) {
          return cache.delete(req);
        }
      })
    );
  } catch (err) {
    console.warn('[SW] API cache prune failed:', err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Standard offline JSON response so API callers get a recognisable shape. */
function offlineJsonResponse() {
  return new Response(
    JSON.stringify({
      error:          'offline',
      message:        'No network connection. Please check your internet and try again.',
      'x-sw-offline': true,
    }),
    {
      status:  503,
      headers: {
        'Content-Type':  'application/json',
        'X-SW-Offline':  'true',
      },
    }
  );
}

/** Post a message to every controlled client tab / window. */
async function broadcastToClients(message) {
  try {
    const clients = await self.clients.matchAll({ includeUncontrolled: true });
    clients.forEach((client) => client.postMessage(message));
  } catch (_) {}
}
