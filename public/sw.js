/**
 * Service Worker for KKG Portal PWA
 * Enables offline functionality and smart caching
 * 
 * CACHE STRATEGY:
 * - JS/CSS files: Network-First (always check for updates)
 * - Images/Fonts: Cache-First (rarely change)
 * - API calls: Network-First (dynamic data)
 * - HTML pages: Network-First (SPA, always fresh)
 */

// Cache version - UPDATE THIS when deploying new versions
// Using timestamp ensures cache is always fresh after redeploy
const CACHE_VERSION = '2026-02-10-v2';
const CACHE_NAME = `kkg-portal-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline.html';

// Resources to cache immediately on install
const PRECACHE_RESOURCES = [
    '/',
    '/offline.html',
    '/static/style.css',
    '/static/js/main.js',
    '/static/js/api.js',
    '/static/js/components.js',
    '/static/js/router.js',
    '/static/js/state.js',
    '/static/js/utils.js',
    '/static/js/theme.js',
];

// Cache-first resources (truly static/immutable assets ONLY)
// These are assets that almost NEVER change
const CACHE_FIRST_PATTERNS = [
    /\.(?:png|jpg|jpeg|gif|svg|ico|webp)$/,
    /\.(?:woff|woff2|ttf|otf|eot)$/,
    /fonts\.googleapis\.com/,
    /fonts\.gstatic\.com/,
];

// Network-first resources (JS, CSS, API calls, dynamic content)
// These MUST always check the network first for updates
const NETWORK_FIRST_PATTERNS = [
    /\/api\//,
    /\/static\/js\//,       // All JS files - always check for updates
    /\/static\/style\.css/, // CSS - always check for updates
    /cdn\.tailwindcss\.com/,
    /cdn\.jsdelivr\.net/,
    /cdnjs\.cloudflare\.com/,
];

// Stale-while-revalidate resources (HTML pages)
const STALE_REVALIDATE_PATTERNS = [
    /\/$/,
    /\.html$/,
];

/**
 * Install event - precache resources
 */
self.addEventListener('install', (event) => {
    console.log(`[SW] Installing service worker (${CACHE_VERSION})...`);

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Precaching resources...');
                // Use individual requests to avoid one failure blocking all
                return Promise.allSettled(
                    PRECACHE_RESOURCES.map(url =>
                        cache.add(url).catch(err => {
                            console.warn(`[SW] Failed to precache ${url}:`, err);
                        })
                    )
                );
            })
            .then(() => {
                console.log('[SW] Precaching complete, skipping waiting...');
                // Immediately activate the new service worker
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] Precaching failed:', error);
            })
    );
});

/**
 * Activate event - clean up ALL old caches and take control immediately
 */
self.addEventListener('activate', (event) => {
    console.log(`[SW] Activating service worker (${CACHE_VERSION})...`);

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME)
                        .map((name) => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('[SW] Claiming clients...');
                // Take control of all open tabs immediately
                return self.clients.claim();
            })
            .then(() => {
                // Notify all clients that a new version is active
                return self.clients.matchAll().then(clients => {
                    clients.forEach(client => {
                        client.postMessage({
                            type: 'SW_UPDATED',
                            version: CACHE_VERSION
                        });
                    });
                });
            })
    );
});

/**
 * Fetch event - handle requests with appropriate caching strategy
 */
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip cross-origin requests except for allowed CDNs
    if (url.origin !== location.origin && !isCDNRequest(url)) {
        return;
    }

    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Determine caching strategy
    if (matchesPattern(url, NETWORK_FIRST_PATTERNS)) {
        event.respondWith(networkFirst(event.request));
    } else if (matchesPattern(url, CACHE_FIRST_PATTERNS)) {
        event.respondWith(cacheFirst(event.request));
    } else if (matchesPattern(url, STALE_REVALIDATE_PATTERNS)) {
        event.respondWith(staleWhileRevalidate(event.request));
    } else {
        // Default: network-first for everything else
        event.respondWith(networkFirst(event.request));
    }
});

/**
 * Check if URL matches any pattern in array
 */
function matchesPattern(url, patterns) {
    const fullUrl = url.href;
    const pathname = url.pathname;
    return patterns.some(pattern => pattern.test(fullUrl) || pattern.test(pathname));
}

/**
 * Check if request is to an allowed CDN
 */
function isCDNRequest(url) {
    const allowedCDNs = [
        'cdn.jsdelivr.net',
        'fonts.googleapis.com',
        'fonts.gstatic.com',
        'cdnjs.cloudflare.com',
        'cdn.tailwindcss.com'
    ];
    return allowedCDNs.some(cdn => url.hostname.includes(cdn));
}

/**
 * Cache-first strategy
 * ONLY for truly immutable assets (images, fonts)
 */
async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) {
        return cached;
    }

    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        console.error('[SW] Cache-first fetch failed:', error);
        return new Response('Network error', { status: 503 });
    }
}

/**
 * Network-first strategy
 * For JS, CSS, API calls, and dynamic content
 * Always tries the network first, falls back to cache only if offline
 */
async function networkFirst(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        console.log('[SW] Network failed, trying cache for:', request.url);

        const cached = await caches.match(request);
        if (cached) {
            return cached;
        }

        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
            const offlinePage = await caches.match(OFFLINE_URL);
            if (offlinePage) {
                return offlinePage;
            }
        }

        return new Response(
            JSON.stringify({
                success: false,
                error: { code: 'OFFLINE', message: 'Anda sedang offline' }
            }),
            {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

/**
 * Stale-while-revalidate strategy
 * Show cached content immediately, update cache in background
 */
async function staleWhileRevalidate(request) {
    const cached = await caches.match(request);

    const fetchPromise = fetch(request)
        .then((response) => {
            if (response.ok) {
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(request, response.clone());
                });
            }
            return response;
        })
        .catch(() => cached);

    return cached || fetchPromise;
}

/**
 * Push notification event
 */
self.addEventListener('push', (event) => {
    if (!event.data) return;

    const data = event.data.json();
    const options = {
        body: data.body || 'Notifikasi baru dari Portal KKG',
        icon: '/static/icons/icon-192x192.png',
        badge: '/static/icons/badge-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/'
        },
        actions: [
            { action: 'open', title: 'Buka' },
            { action: 'close', title: 'Tutup' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'Portal KKG', options)
    );
});

/**
 * Notification click event
 */
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'close') return;

    const url = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((windowClients) => {
                // Focus existing window if available
                for (const client of windowClients) {
                    if (client.url === url && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Open new window
                if (clients.openWindow) {
                    return clients.openWindow(url);
                }
            })
    );
});

/**
 * Background sync event
 */
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync:', event.tag);

    if (event.tag === 'sync-pending-data') {
        event.waitUntil(syncPendingData());
    }
});

/**
 * Sync pending data when back online
 */
async function syncPendingData() {
    console.log('[SW] Syncing pending data...');
}

/**
 * Message event - handle messages from main thread
 */
self.addEventListener('message', (event) => {
    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data.type === 'CLEAR_CACHE') {
        caches.keys().then(names => {
            names.forEach(name => caches.delete(name));
        });
        console.log('[SW] All caches cleared');
    }

    if (event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_VERSION });
    }
});

console.log(`[SW] Service worker loaded (${CACHE_VERSION})`);
