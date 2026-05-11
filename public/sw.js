const CACHE_NAME = 'cdplus-v4';

self.addEventListener('install', function(e) {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  if(e.request.method !== 'GET') return;
  if(e.request.url.includes('/api/')) return;
  if(e.request.url.includes('/socket.io/')) return;
  e.respondWith(fetch(e.request).catch(function() {
    return caches.match(e.request);
  }));
});

// PUSH NOTIFICATIONS
self.addEventListener('push', function(e) {
  var data = {};
  try { data = e.data.json(); } catch(err) {}
  var titulo = data.titulo || 'CD+ Cuidado Digital';
  var corpo = data.corpo || 'Você tem um lembrete.';
  e.waitUntil(
    self.registration.showNotification(titulo, {
      body: corpo,
      icon: '/icons/icon.svg',
      badge: '/icons/icon.svg',
      vibrate: [500,200,500,200,500],
      tag: data.tag || 'cdplus',
      requireInteraction: true
    })
  );
});

self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type:'window', includeUncontrolled:true }).then(function(list) {
      if(list.length > 0) return list[0].focus();
      return clients.openWindow('/');
    })
  );
});
