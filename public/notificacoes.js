// ─── PERMISSÃO ───
function pedirPermissaoNotificacao() {
  if ('Notification' in window) {
    Notification.requestPermission();
  }
}

// ─── ALERTA VISUAL ───
function mostrarAlerta(titulo, msg, cor) {
  var anterior = document.getElementById('alerta-cuidar');
  if (anterior) anterior.remove();
  var div = document.createElement('div');
  div.id = 'alerta-cuidar';
  div.style.cssText =
    'position:fixed;top:0;left:0;width:100%;z-index:9999;' +
    'background:' + (cor || '#2e7d32') + ';color:white;padding:20px;' +
    'text-align:center;box-shadow:0 4px 12px rgba(0,0,0,0.3);';
  div.innerHTML =
    '<div style="font-size:1.2em;font-weight:bold;">' + titulo + '</div>' +
    '<div style="margin-top:6px;font-size:0.95em;">' + msg + '</div>' +
    '<button onclick="this.parentElement.remove()" style="' +
    'margin-top:12px;background:white;color:' + (cor || '#2e7d32') + ';' +
    'border:none;border-radius:20px;padding:8px 24px;font-size:1em;cursor:pointer;font-weight:bold;">' +
    'OK, entendi</button>';
  document.body.appendChild(div);
  if ('Notification' in window && Notification.permission === 'granted') {
    try { new Notification(titulo, { body: msg }); } catch(e) {}
  }
}

// ─── SOM ───
function tocarSom(urgente) {
  try {
    var ctx = new (window.AudioContext || window.webkitAudioContext)();
    var freqs = urgente ? [880,660,880,660,880] : [880];
    freqs.forEach(function(freq, i) {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq;
      var t = ctx.currentTime + i * 0.3;
      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.start(t); osc.stop(t + 0.3);
    });
  } catch(e) {}
}

// ─── ALARME DE MEDICAMENTOS ───
function agendarAlarmesMedicamentos() {
  var medicamentos = JSON.parse(localStorage.getItem('medicamentos') || '[]');
  if (medicamentos.length === 0) return;
  var agora = new Date();

  medicamentos.forEach(function(m) {
    if (!m.horario) return;
    var partes = m.horario.split(':');
    var alvo = new Date();
    alvo.setHours(parseInt(partes[0]), parseInt(partes[1]), 0, 0);

    // Se já passou hoje, agenda para amanhã
    if (alvo <= agora) alvo.setDate(alvo.getDate() + 1);

    var diff = alvo - agora;

    // Alarme no horário exato
    setTimeout(function() {
      if (!m.confirmadoHoje) {
        mostrarAlerta(
          '💊 Hora do remédio!',
          m.nome + ' — ' + m.dose + ' (' + m.horario + ')',
          '#2e7d32'
        );
        tocarSom(false);
      }
    }, diff);

    // Lembrete 10 minutos antes
    if (diff > 600000) {
      setTimeout(function() {
        if (!m.confirmadoHoje) {
          mostrarAlerta(
            '⏰ Remédio em 10 minutos!',
            m.nome + ' — ' + m.dose + ' às ' + m.horario,
            '#e65100'
          );
          tocarSom(false);
        }
      }, diff - 600000);
    }
  });
}

// ─── ALARMES DE CONSULTAS ───
function agendarNotificacoes(consulta) {
  var agora = new Date();
  var dataConsulta = new Date(consulta.data + 'T' + consulta.hora);
  var umDiaAntes = new Date(dataConsulta);
  umDiaAntes.setDate(umDiaAntes.getDate() - 1);
  var duasHorasAntes = new Date(dataConsulta);
  duasHorasAntes.setHours(duasHorasAntes.getHours() - 2);

  var notifs = [
    { tempo: umDiaAntes, titulo: '📅 Consulta amanhã!',
      msg: consulta.especialidade + ' com ' + consulta.medico + ' amanhã às ' + consulta.hora },
    { tempo: duasHorasAntes, titulo: '⏰ Consulta em 2 horas!',
      msg: consulta.especialidade + ' com ' + consulta.medico + ' às ' + consulta.hora },
    { tempo: dataConsulta, titulo: '🚨 Hora da consulta!',
      msg: 'Agora! ' + consulta.especialidade + ' com ' + consulta.medico }
  ];

  notifs.forEach(function(n) {
    var diff = n.tempo - agora;
    if (diff > 0) {
      setTimeout(function() {
        mostrarAlerta(n.titulo, n.msg, '#2e7d32');
        tocarSom(false);
      }, diff);
    }
  });
}

// ─── VERIFICAR AO ABRIR ───
function verificarConsultasAbertura() {
  var consultas = JSON.parse(localStorage.getItem('consultas') || '[]');
  var agora = new Date();
  var hoje = agora.toISOString().split('T')[0];
  consultas.forEach(function(c) {
    if (c.data === hoje) {
      var horaConsulta = new Date(c.data + 'T' + c.hora);
      var diff = horaConsulta - agora;
      if (diff > 0) {
        setTimeout(function() {
          mostrarAlerta('🚨 Hora da consulta!', c.especialidade + ' com ' + c.medico, '#c62828');
          tocarSom(true);
        }, diff);
        if (diff > 7200000) {
          setTimeout(function() {
            mostrarAlerta('⏰ Consulta em 2 horas!', c.especialidade + ' com ' + c.medico + ' às ' + c.hora, '#e65100');
            tocarSom(false);
          }, diff - 7200000);
        }
      }
    }
  });
}

// ─── INICIALIZAR TUDO ───
pedirPermissaoNotificacao();
verificarConsultasAbertura();
agendarAlarmesMedicamentos();
