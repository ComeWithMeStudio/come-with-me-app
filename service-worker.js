/* Come With Me Studio PWA: network-only service worker.
 * Deliberately no offline cache while paid-content access is being redesigned.
 */
self.addEventListener("install", () => {
  self.skipWaiting();
});
self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});
