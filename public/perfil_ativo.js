// perfil_ativo.js — Gerenciador de perfil ativo
// Incluir em todos os módulos que precisam separar dados por membro

function getMembroAtivo() {
  var membro = localStorage.getItem('membroAtivo');
  if(membro) return JSON.parse(membro);
  var usuario = localStorage.getItem('usuarioCuidar');
  if(usuario) {
    var u = JSON.parse(usuario);
    return { id: 'usuario_principal', nome: u.nome, tipo: u.tipo || 'adulto' };
  }
  return { id: 'usuario_principal', nome: 'Usuário', tipo: 'adulto' };
}

function getChave(modulo) {
  var membro = getMembroAtivo();
  return modulo + '_' + membro.id;
}

function getMembroId() {
  var membro = getMembroAtivo();
  return membro.membroIdBanco || null;
}

function getFamiliaId() {
  return localStorage.getItem('familiaId') || '';
}
