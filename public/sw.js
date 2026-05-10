const CACHE_NAME = 'cdplus-v1';
const URLS_CACHE = [
  '/', '/index.html', '/cadastro.html', '/medicamentos.html',
  '/calendario.html', '/dashboard.html', '/vacinas.html',
  '/financeiro.html', '/diario.html', '/membros.html',
  '/manifest.json', '/perfil_ativo.js'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(URLS_CACHE);
    })
  );
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
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request).then(function(response) {
        return caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, response.clone());
          return response;
        });
      });
    }).catch(function() {
      return caches.match('/index.html');
    })
  );
});

self.addEventListener('push', function(e) {
  var data = e.data ? e.data.json() : {};
  var titulo = data.titulo || 'CD+ Cuidado Digital';
  var corpo = data.corpo || 'Você tem um lembrete.';
  e.waitUntil(
    self.registration.showNotification(titulo, {
      body: corpo,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      vibrate: [200, 100, 200],
      tag: data.tag || 'cdplus',
      requireInteraction: data.importante || false
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

self.addEventListener('message', function(e) {
  if(e.data && e.data.tipo === 'agendarMedicamento') {
    var med = e.data.med;
    var horarios = med.horarios || [];
    horarios.forEach(function(horario) {
      agendarAlarme(med, horario);
    });
  }
});

function agendarAlarme(med, horario) {
  var partes = horario.split(':');
  var agora = new Date();
  var alarme = new Date();
  alarme.setHours(parseInt(partes[0]), parseInt(partes[1]), 0, 0);
  if(alarme <= agora) alarme.setDate(alarme.getDate() + 1);
  var diff = alarme.getTime() - agora.getTime();
  setTimeout(function() {
    self.registration.showNotification('💊 Hora do remédio!', {
      body: med.nome + (med.dosagem ? ' — ' + med.dosagem : ''),
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      vibrate: [500, 200, 500, 200, 500],
      tag: 'med_' + med.id + '_' + horario,
      requireInteraction: true
    });
    agendarAlarme(med, horario);
  }, diff);
}
