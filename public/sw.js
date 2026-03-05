/* Minimal service worker for push subscription storage.
 * Actual push handling will be implemented in a later milestone.
 */

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', () => {
  // No-op for now.
})

