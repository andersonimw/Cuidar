// familia.js — Gerenciador de sala familiar
// Carregado por todos os módulos que precisam de Socket.io

var FAMILIA_ID = localStorage.getItem('familiaId') || '';
var FAMILIA_NOME = localStorage.getItem('familiaNome') || 'Família';
var USUARIO = JSON.parse(localStorage.getItem('usuarioCuidar') || 'null');

function entrarSalaFamilia(socket) {
  if(!socket || !FAMILIA_ID || !USUARIO) return;
  socket.emit('entrarFamilia', {
    familiaId: FAMILIA_ID,
    nome: USUARIO.nome,
    relacao: USUARIO.relacao || ''
  });
  console.log('Entrou na sala: ' + FAMILIA_ID);
}

function getNomeUsuario() {
  return USUARIO ? USUARIO.nome : 'Familiar';
}

function getFamiliaId() {
  return FAMILIA_ID;
}

function getFamiliaNome() {
  return FAMILIA_NOME;
}
