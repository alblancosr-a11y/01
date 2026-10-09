const CACHE_NAME = 'madarij-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const data = event.notification.data;
  let url = '/';
  
  if (data && data.poemId) {
    url = `/?action=study&poemId=${data.poemId}&verseIndex=${data.verseIndex}&reason=${data.reason}`;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(location.origin) && 'focus' in client) {
          // Send message to the client to handle navigation without full reload if possible
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            data: data
          });
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
