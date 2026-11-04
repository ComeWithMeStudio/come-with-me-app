/* Isolated PWA smoke test: network-only, no cache or fetch interception. */
self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",event=>event.waitUntil(self.clients.claim()));
