const CACHE_NAME = 'cdplus-v5';

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

// PUSH — abre app automaticamente com dados do medicamento
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
      vibrate: [500,200,500,200,500,200,1000],
      tag: data.tag || 'cdplus',
      requireInteraction: true,
      data: data
    }).then(function() {
      // Abre o app automaticamente com os dados do alarme
      var url = '/?alarme=1&med=' + encodeURIComponent(data.med_nome || '') +
                '&dosagem=' + encodeURIComponent(data.med_dosagem || '') +
                '&horario=' + encodeURIComponent(data.horario || '') +
                '&medId=' + encodeURIComponent(data.med_id || '');
      return clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(function(list) {
          if(list.length > 0) {
            list[0].focus();
            list[0].postMessage({ tipo: 'alarme', data: data });
            return;
          }
          return clients.openWindow(url);
        });
    })
  );
});

self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  var data = e.notification.data || {};
  var url = '/?alarme=1&med=' + encodeURIComponent(data.med_nome || '') +
            '&dosagem=' + encodeURIComponent(data.med_dosagem || '') +
            '&horario=' + encodeURIComponent(data.horario || '') +
            '&medId=' + encodeURIComponent(data.med_id || '');
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list) {
      if(list.length > 0) {
        list[0].focus();
        list[0].postMessage({ tipo: 'alarme', data: data });
        return;
      }
      return clients.openWindow(url);
    })
  );
});

// Recebe mensagem do app
self.addEventListener('message', function(e) {
  if(e.data && e.data.tipo === 'ping') {
    e.source.postMessage({ tipo: 'pong' });
  }
});
