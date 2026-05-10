const CACHE_NAME = 'cdplus-v3';
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
  e.waitUntil(
    self.registration.showNotification(data.titulo || 'CD+', {
      body: data.corpo || 'Você tem um lembrete.',
      icon: '/icons/icon.svg',
      badge: '/icons/icon.svg',
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

// Recebe medicamentos do app
var medicamentos = [];
var ultimaVerificacao = '';

self.addEventListener('message', function(e) {
  if(e.data && e.data.tipo === 'atualizarMeds') {
    medicamentos = e.data.meds || [];
    console.log('CD+ SW: ' + medicamentos.length + ' medicamentos agendados');
  }
});

// Verifica alarmes a cada minuto via periodicsync ou keepalive
function verificarAlarmes() {
  var agora = new Date();
  var horaAtual = agora.getHours().toString().padStart(2,'0') + ':' + agora.getMinutes().toString().padStart(2,'0');
  
  if(horaAtual === ultimaVerificacao) return;
  ultimaVerificacao = horaAtual;

  medicamentos.forEach(function(med) {
    if(!med.ativo || !med.horarios) return;
    med.horarios.forEach(function(horario) {
      if(horario === horaAtual) {
        self.registration.showNotification('💊 Hora do remédio!', {
          body: med.nome + (med.dosagem ? '\nDose: ' + med.dosagem : ''),
          icon: '/icons/icon.svg',
          badge: '/icons/icon.svg',
          vibrate: [500, 200, 500, 200, 500],
          tag: 'med_' + med.id + '_' + horario,
          requireInteraction: true
        });
      }
    });
  });
}

// Periodic Background Sync (Android Chrome)
self.addEventListener('periodicsync', function(e) {
  if(e.tag === 'verificar-alarmes') {
    e.waitUntil(verificarAlarmes());
  }
