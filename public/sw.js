const CACHE_NAME = 'cdplus-v7';

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

self.addEventListener('push', function(e) {
  var data = {};
  try { data = e.data.json(); } catch(err) {}

  var nomeRemedio = data.med_nome || 'Medicamento';
  var dosagem = data.med_dosagem || '';
  var horario = data.horario || '';

  var titulo = '💊 Hora do remédio!';
  var corpo = '⏰ Tomar ' + nomeRemedio;
  if(dosagem) corpo += ' — Dose: ' + dosagem;
  if(horario) corpo += ' — Horário: ' + horario;

  e.waitUntil(
    self.registration.showNotification(titulo, {
      body: corpo,
      icon: '/icons/icon.svg',
      badge: '/icons/icon.svg',
      vibrate: [500,200,500,200,500,200,1000],
      tag: 'alarme-' + (data.med_id || 'med'),
      requireInteraction: true,
      silent: false,
      data: data
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

self.addEventListener('message', function(e) {
  if(e.data && e.data.tipo === 'ping') {
    e.source.postMessage({ tipo: 'pong' });
  }
});
