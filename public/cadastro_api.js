// Funções para salvar no banco de dados
function salvarFamiliaDB(codigo, nome) {
  fetch('/api/familia/criar', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ codigo: codigo, nome: nome })
  }).then(function(r){ return r.json(); }).then(function(r){
    console.log('Família no banco:', r);
  }).catch(function(e){ console.log('Erro banco familia:', e); });
}

function salvarMembroDB(familiaId, nome, relacao, tel, admin) {
  fetch('/api/membros/salvar', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      familia_id: familiaId,
      nome: nome,
      relacao: relacao || 'Familiar',
      tipo: 'adulto',
      tel: tel || '',
      admin: admin || false
    })
  }).then(function(r){ return r.json(); }).then(function(r){
    console.log('Membro no banco:', r);
  }).catch(function(e){ console.log('Erro banco membro:', e); });
}
