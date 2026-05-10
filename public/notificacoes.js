(function() {

  if('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }

  var alarmeAtivoGlobal = false;
  var ultimaVerificacao = '';
  var sonecaTimers = {};

  function getChaveGlobal() {
    try {
      var membro = JSON.parse(localStorage.getItem('membroAtivo') || 'null');
      if(membro && membro.id) return 'medicamentos_' + membro.id;
    } catch(e) {}
    return 'medicamentos_usuario_principal';
  }

  function getMeds() {
    try { return JSON.parse(localStorage.getItem(getChaveGlobal()) || '[]'); }
    catch(e) { return []; }
  }

  function getHistorico() {
    try { return JSON.parse(localStorage.getItem('historicoMeds') || '[]'); }
    catch(e) { return []; }
  }

  function tocarSomGlobal() {
    try {
      var ctx = new(window.AudioContext || window.webkitAudioContext)();
      function beep(freq,start,dur,vol){
        var osc=ctx.createOscillator(); var gain=ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value=freq; osc.type='sine';
        gain.gain.setValueAtTime(vol||0.3, ctx.currentTime+start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+start+dur);
        osc.start(ctx.currentTime+start); osc.stop(ctx.currentTime+start+dur);
      }
      beep(880,0,0.15,0.4); beep(880,0.2,0.15,0.4); beep(1046,0.4,0.3,0.4);
      beep(880,0.8,0.15,0.4); beep(880,1.0,0.15,0.4); beep(1046,1.2,0.3,0.4);
      beep(880,1.6,0.15,0.4); beep(880,1.8,0.15,0.4); beep(1175,2.0,0.5,0.4);
    } catch(e) {}
    if(navigator.vibrate) navigator.vibrate([500,200,500,200,500,200,1000]);
  }

  function falarRemedioGlobal(nome, dosagem) {
    if(!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    var texto = 'Atenção! Está na hora de tomar ' + nome + '.';
    if(dosagem) texto += ' A dose é ' + dosagem + '.';
    texto += ' Por favor tome o seu comprimido agora.';
    var fala = new SpeechSynthesisUtterance(texto);
    fala.lang='pt-BR'; fala.rate=0.9; fala.pitch=1; fala.volume=1;
    var vozes = window.speechSynthesis.getVoices();
    var vozPT = vozes.find(function(v){ return v.lang.indexOf('pt')!==-1; });
    if(vozPT) fala.voice = vozPT;
    window.speechSynthesis.speak(fala);
  }

  function mostrarAlarmeGlobal(med, horario) {
    // Se já tem alarme ativo na tela de medicamentos, não duplicar
    var overlayMeds = document.getElementById('alarmeOverlay');
    if(overlayMeds && overlayMeds.style.display !== 'none') return;

    alarmeAtivoGlobal = true;

    var overlay = document.getElementById('alarme_med_global');
    if(!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'alarme_med_global';
      overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(26,35,126,0.97);z-index:99998;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:30px;text-align:center;';
      document.body.appendChild(overlay);
    }

    var style = document.createElement('style');
    style.textContent = '@keyframes pulsarMed{0%,100%{transform:scale(1)}50%{transform:scale(1.2)}}';
    document.head.appendChild(style);

    overlay.innerHTML =
      '<div style="font-size:5em;animation:pulsarMed 1s infinite;margin-bottom:20px">💊</div>'+
      '<div style="color:white;font-size:1.4em;font-weight:bold;margin-bottom:10px">⏰ Hora do remédio!</div>'+
      '<div style="color:#90caf9;font-size:1.8em;font-weight:bold;margin-bottom:8px">'+med.nome+'</div>'+
      '<div style="color:white;font-size:1.1em;margin-bottom:8px;opacity:0.9">'+(med.dosagem?'Dose: '+med.dosagem:'')+'</div>'+
      '<div style="color:rgba(255,255,255,0.6);font-size:0.9em;margin-bottom:30px">🕐 Horário: '+horario+'</div>'+
      '<div style="display:flex;flex-direction:column;gap:12px;width:100%;max-width:300px">'+
        '<button onclick="confirmarRemedioGlobal(\''+med.id+'\',\''+med.nome+'\',\''+horario+'\')" style="padding:18px;background:#4caf50;color:white;border:none;border-radius:16px;font-size:1.1em;font-weight:bold;cursor:pointer">✅ Tomei agora!</button>'+
        '<button onclick="sonecaRemedioGlobal(\''+med.id+'\',\''+horario+'\')" style="padding:14px;background:rgba(255,255,255,0.15);color:white;border:2px solid rgba(255,255,255,0.3);border-radius:16px;font-size:0.95em;cursor:pointer">😴 Lembrar em 15 min</button>'+
        '<button onclick="fecharAlarmeRemedioGlobal()" style="padding:14px;background:rgba(198,40,40,0.5);color:white;border:none;border-radius:16px;font-size:0.95em;cursor:pointer">⏭️ Vou pular essa dose</button>'+
      '</div>'+
      '<div style="color:rgba(255,255,255,0.4);font-size:0.8em;margin-top:20px">🔔 Repetindo a cada 2 minutos até confirmar</div>';

    overlay.style.display = 'flex';
    tocarSomGlobal();
    setTimeout(function(){ falarRemedioGlobal(med.nome, med.dosagem); }, 800);

    window._alarmeRepetirGlobal = setInterval(function(){
      tocarSomGlobal();
      falarRemedioGlobal(med.nome, med.dosagem);
    }, 120000);
  }

  window.confirmarRemedioGlobal = function(id, nome, horario) {
    fecharAlarmeRemedioGlobal();
    var agora = new Date();
    var historico = getHistorico();
    historico.unshift({
      medId: parseInt(id), medNome: nome, status: 'tomou',
      data: agora.toLocaleDateString('pt-BR'),
      hora: agora.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}),
      motivo: '', obs: ''
    });
    localStorage.setItem('historicoMeds', JSON.stringify(historico));
    alert('✅ '+nome+' registrado como tomado!');
  };

  window.sonecaRemedioGlobal = function(id, horario) {
    fecharAlarmeRemedioGlobal();
    var chave = id+'_'+horario;
    sonecaTimers[chave] = setTimeout(function(){
      delete sonecaTimers[chave];
      var meds = getMeds();
      var med = meds.find(function(m){ return String(m.id)===String(id); });
      if(med) mostrarAlarmeGlobal(med, horario);
    }, 15*60*1000);
    alert('😴 Soneca ativada! Você será lembrado em 15 minutos.');
  };

  window.fecharAlarmeRemedioGlobal = function() {
    if(window._alarmeRepetirGlobal){ clearInterval(window._alarmeRepetirGlobal); window._alarmeRepetirGlobal=null; }
    if(window.speechSynthesis) window.speechSynthesis.cancel();
    if(navigator.vibrate) navigator.vibrate(0);
    var overlay = document.getElementById('alarme_med_global');
    if(overlay) overlay.style.display = 'none';
    alarmeAtivoGlobal = false;
  };

  function verificarAlarmes() {
    if(alarmeAtivoGlobal) return;
    var agora = new Date();
    var horaAtual = agora.getHours().toString().padStart(2,'0')+':'+agora.getMinutes().toString().padStart(2,'0');
    if(horaAtual === ultimaVerificacao) return;
    ultimaVerificacao = horaAtual;

    var meds = getMeds();
    var historico = getHistorico();
    var hojeStr = agora.toLocaleDateString('pt-BR');

    meds.forEach(function(med) {
      if(!med.ativo || !med.horarios) return;
      med.horarios.forEach(function(horario) {
        if(horario === horaAtual) {
          var jaConfirmado = historico.some(function(h){
            return h.medId===med.id && h.data===hojeStr && h.hora===horario && (h.status==='tomou'||h.status==='pulou');
          });
          var chave = med.id+'_'+horario;
          if(!jaConfirmado && !sonecaTimers[chave]) {
            mostrarAlarmeGlobal(med, horario);
          }
        }
      });
    });
  }

  setInterval(verificarAlarmes, 30000);
  verificarAlarmes();

})();
