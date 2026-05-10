(function() {
  if(typeof io === 'undefined') return;
  var usuario = JSON.parse(localStorage.getItem('usuarioCuidar') || 'null');
  var familiaId = localStorage.getItem('familiaId') || '';
  if(!familiaId || !usuario) return;

  var socket = io();
  var alarmeInterval = null;

  socket.on('connect', function() {
    socket.emit('entrarFamilia', { familiaId: familiaId, nome: usuario.nome });
  });

  function tocarSom() {
    try {
      var ctx = new(window.AudioContext || window.webkitAudioContext)();
      if(ctx.state === 'suspended') ctx.resume();
      [880,660,880,660,1046].forEach(function(freq, i) {
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = freq;
        var t = ctx.currentTime + i * 0.22;
        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.start(t); osc.stop(t + 0.22);
      });
    } catch(e) {}
    if(navigator.vibrate) navigator.vibrate([500,200,500,200,500,200,1000]);
  }

  function falarEmergencia(nome, tipo) {
    if(!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    var texto = 'Atenção! ' + nome + ' está em emergência! Ocorrência: ' + tipo + '! Por favor ajude imediatamente!';
    var fala = new SpeechSynthesisUtterance(texto);
    fala.lang = 'pt-BR'; fala.rate = 0.9; fala.volume = 1;
    var vozes = window.speechSynthesis.getVoices();
    var vozPT = vozes.find(function(v){ return v.lang.indexOf('pt') !== -1; });
    if(vozPT) fala.voice = vozPT;
    window.speechSynthesis.speak(fala);
  }

  function pararAlarme() {
    if(alarmeInterval) { clearInterval(alarmeInterval); alarmeInterval = null; }
    if(window.speechSynthesis) window.speechSynthesis.cancel();
    if(navigator.vibrate) navigator.vibrate(0);
  }

  socket.on('alarme', function(dados) {
    // Vibração imediata — sempre funciona
    if(navigator.vibrate) navigator.vibrate([500,200,500,200,500,200,1000,500,500]);

    // Notificação do sistema — tem som nativo
    if(Notification.permission === 'granted') {
      new Notification('🆘 EMERGÊNCIA — ' + dados.nome, {
        body: '⚠️ ' + dados.tipo + ' — Toque para abrir',
        requireInteraction: true,
        vibrate: [500,200,500]
      });
    } else {
      Notification.requestPermission();
    }

    // Monta overlay
    var overlay = document.getElementById('alarme_global_overlay');
    if(!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'alarme_global_overlay';
      overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(198,40,40,0.97);z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;text-align:center;padding:30px';
      document.body.appendChild(overlay);
    }

    var style = document.createElement('style');
    style.textContent = '@keyframes pulsar{0%,100%{transform:scale(1)}50%{transform:scale(1.2)}}';
    document.head.appendChild(style);

    overlay.innerHTML =
      '<div style="font-size:5em;animation:pulsar 0.5s infinite">🆘</div>' +
      '<div style="font-size:2em;font-weight:bold;margin:16px 0 8px">' + dados.nome + '</div>' +
      '<div style="background:rgba(255,255,255,0.2);padding:8px 20px;border-radius:20px;font-size:1em;margin-bottom:8px">' + dados.tipo + '</div>' +
      '<div style="font-size:0.85em;opacity:0.7;margin-bottom:8px">🕐 ' + dados.hora + '</div>' +
      '<div style="background:rgba(255,255,255,0.15);border:2px solid white;border-radius:14px;padding:12px 20px;font-size:0.9em;margin-bottom:20px;cursor:pointer" onclick="ativarSomAlarme(\'' + dados.nome + '\',\'' + dados.tipo + '\')">' +
      '🔊 Toque aqui para ativar o som</div>' +
      '<button onclick="fecharAlarmeGlobal()" ' +
      'style="background:white;color:#c62828;border:none;border-radius:50px;padding:16px 32px;font-size:1em;font-weight:bold;cursor:pointer;margin-bottom:10px">✅ Estou indo ajudar!</button>' +
      '<button onclick="window.open(\'tel:192\')" style="background:rgba(255,255,255,0.15);border:2px solid white;color:white;border-radius:14px;padding:12px 24px;font-size:0.95em;cursor:pointer">🚑 Ligar SAMU 192</button>';

    overlay.style.display = 'flex';

    // Tenta tocar som automaticamente
    tocarSom();
    falarEmergencia(dados.nome, dados.tipo);

    // Repete a cada 3 segundos
    alarmeInterval = setInterval(function() {
      tocarSom();
    }, 3000);
  });

  window.ativarSomAlarme = function(nome, tipo) {
    tocarSom();
    falarEmergencia(nome, tipo);
    alarmeInterval = setInterval(function() {
      tocarSom();
    }, 3000);
  };

  window.fecharAlarmeGlobal = function() {
    pararAlarme();
    var overlay = document.getElementById('alarme_global_overlay');
    if(overlay) overlay.remove();
  };
})();
