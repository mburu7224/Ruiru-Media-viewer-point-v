// Define a unique name for your cache. Update this version if you change cached files.
const CACHE_NAME = 'ruiru-media-house-viewer-v2'; // Changed cache name for fresh start

// List all the files you want to cache for offline use.
// Make sure these paths are correct relative to your service-worker.js file.
const urlsToCache = [
  './', // Caches the root (index.html)
  './index.html',
  './style.css',
  './script.js',
  // Add paths to your Firebase SDKs (these are CDN links, so no local path needed, just the full URL)
  'https://www.gstatic.com/firebasejs/11.9.0/firebase-app.js',
  'https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js',
  // Add paths for your PWA icons (assuming they are in an 'images' folder)
  './images/icon-192x192.png',
  './images/icon-512x512.png',
  // Add paths for any placeholder images you use (e.g., for navigation icons, search icon, hamburger icon)
  'https://placehold.co/20x20/cccccc/000000?text=H',
  'https://placehold.co/20x20/cccccc/000000?text=S',
  'https://placehold.co/20x20/cccccc/000000?text=E',
  'https://placehold.co/20x20/cccccc/000000?text=B',
  'https://placehold.co/20x20/cccccc/000000?text=V',
  'https://placehold.co/20x20/cccccc/000000?text=A',
  'https://placehold.co/24x24/cccccc/000000?text=%E2%9C%93', // Hamburger icon image
  'https://placehold.co/20x20/cccccc/000000?text=🔍' // Search icon image
];

// 1. Install event: Cache all the defined static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Install event triggered');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching all content for offline use.');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Service Worker: Failed to cache during install:', error);
      })
  );
});

// 2. Fetch event: Intercept network requests. Serve from cache first, then fall back to network.
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip caching for Firebase Firestore connections (they are real-time and handled separately)
  if (event.request.url.includes('firestore.googleapis.com')) {
    return fetch(event.request);
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // If the resource is in the cache, return it
        if (response) {
          return response;
        }
        // If not in cache, try to fetch it from the network
        return fetch(event.request)
          .then(networkResponse => {
            // Optional: Cache new network requests for future use
            // This is a 'cache then network' strategy for dynamic content.
            // Be cautious with caching dynamic content like API responses if they change frequently.
            return caches.open(CACHE_NAME).then(cache => {
                // Ensure response is cloneable before caching
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    cache.put(event.request, networkResponse.clone());
                }
                return networkResponse;
            });
          });
      })
      .catch(error => {
        console.error('Service Worker: Fetch failed for:', event.request.url, error);
        // You could return a custom offline page here if needed
        // For example: return caches.match('/offline.html');
      })
  );
});

// 3. Activate event: Clean up old caches to save space and avoid conflicts
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate event triggered');
  const cacheWhitelist = [CACHE_NAME]; // Only keep the current cache version
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // Delete old caches not in the whitelist
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

