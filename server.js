const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Pool } = require('pg');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static('public'));

// Conexão PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://cuidar_db_afpl_user:aEQOyVwWBCGCGCF5ijYayN1yDadnTUh7@dpg-d7vu0au7r5hc73b4jtkg-a/cuidar_db_afpl',
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Criar tabelas
async function criarTabelas() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS familias (
        id SERIAL PRIMARY KEY,
        codigo VARCHAR(20) UNIQUE NOT NULL,
        nome VARCHAR(100),
        criado_em TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS membros (
        id SERIAL PRIMARY KEY,
        familia_id VARCHAR(20),
        nome VARCHAR(100),
        relacao VARCHAR(50),
        tipo VARCHAR(20) DEFAULT 'adulto',
        tel VARCHAR(20),
        admin BOOLEAN DEFAULT false,
        foto TEXT,
        data_nascimento DATE,
        id_medico VARCHAR(20) UNIQUE,
        criado_em TIMESTAMP DEFAULT NOW()
      );
      -- Adicionar coluna se não existir
      ALTER TABLE membros ADD COLUMN IF NOT EXISTS id_medico VARCHAR(20) UNIQUE;

      CREATE TABLE IF NOT EXISTS medicamentos (
        id SERIAL PRIMARY KEY,
        familia_id VARCHAR(20),
        membro_id INTEGER,
        nome VARCHAR(100),
        dosagem VARCHAR(100),
        horarios TEXT,
        via VARCHAR(50),
        estoque INTEGER DEFAULT 0,
        alerta_estoque INTEGER DEFAULT 10,
        validade VARCHAR(20),
        armazenamento VARCHAR(100),
        obs TEXT,
        ativo BOOLEAN DEFAULT true,
        criado_em TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS historico_meds (
        id SERIAL PRIMARY KEY,
        familia_id VARCHAR(20),
        membro_id INTEGER,
        med_id INTEGER,
        med_nome VARCHAR(100),
        status VARCHAR(20),
        motivo VARCHAR(200),
        obs TEXT,
        data VARCHAR(20),
        hora VARCHAR(10),
        criado_em TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS eventos (
        id SERIAL PRIMARY KEY,
        familia_id VARCHAR(20),
        membro_id INTEGER,
        titulo VARCHAR(200),
        data VARCHAR(20),
        hora VARCHAR(10),
        tipo VARCHAR(50),
        obs TEXT,
        criado_em TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS mensagens (
        id SERIAL PRIMARY KEY,
        familia_id VARCHAR(20),
        autor VARCHAR(100),
        texto TEXT,
        categoria VARCHAR(50),
        criado_em TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS gastos (
        id SERIAL PRIMARY KEY,
        familia_id VARCHAR(20),
        descricao VARCHAR(200),
        valor NUMERIC(10,2),
        categoria VARCHAR(50),
        responsavel VARCHAR(100),
        data VARCHAR(20),
        criado_em TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS sinais_vitais (
        id SERIAL PRIMARY KEY,
        familia_id VARCHAR(20),
        membro_id INTEGER,
        tipo VARCHAR(50),
        valor VARCHAR(50),
        data VARCHAR(20),
        hora VARCHAR(10),
        obs TEXT,
        criado_em TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS vacinas (
        id SERIAL PRIMARY KEY,
        familia_id VARCHAR(20),
        membro_id INTEGER,
        nome VARCHAR(100),
        data VARCHAR(20),
        doses INTEGER DEFAULT 1,
        status VARCHAR(20),
        obs TEXT,
        criado_em TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ PostgreSQL conectado e tabelas criadas!');
  } catch(e) {
    console.log('❌ Erro PostgreSQL:', e.message);
  }
}
criarTabelas();

// ===== ROTAS API =====

// FAMÍLIA
app.post('/api/familia/criar', async (req, res) => {
  try {
    const { codigo, nome } = req.body;
    const existe = await pool.query('SELECT id FROM familias WHERE codigo=$1', [codigo]);
    if(existe.rows.length > 0) return res.json({ ok: false, erro: 'Código já existe' });
    const r = await pool.query('INSERT INTO familias (codigo,nome) VALUES ($1,$2) RETURNING *', [codigo, nome]);
    res.json({ ok: true, familia: r.rows[0] });
  } catch(e) { res.json({ ok: false, erro: e.message }); }
});

app.get('/api/familia/:codigo', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM familias WHERE codigo=$1', [req.params.codigo]);
    if(r.rows.length === 0) return res.json({ ok: false, erro: 'Família não encontrada' });
    res.json({ ok: true, familia: r.rows[0] });
  } catch(e) { res.json({ ok: false, erro: e.message }); }
});

// MEMBROS
app.post('/api/membros/salvar', async (req, res) => {
  try {
    const { familia_id, nome, relacao, tipo, tel, admin, foto, data_nascimento } = req.body;
    // Gerar ID médico único
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const prefix = nome.replace(/[^a-zA-Z]/g,'').toUpperCase().substring(0,3) || 'MBR';
    let idMedico = prefix + '-';
    for(let i=0; i<5; i++) idMedico += chars.charAt(Math.floor(Math.random()*chars.length));
    // Verificar unicidade
    const existe = await pool.query('SELECT id FROM membros WHERE id_medico=$1', [idMedico]);
    if(existe.rows.length > 0) idMedico = prefix + '-' + Date.now().toString(36).toUpperCase();
    const r = await pool.query(
      'INSERT INTO membros (familia_id,nome,relacao,tipo,tel,admin,foto,data_nascimento,id_medico) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [familia_id, nome, relacao, tipo||'adulto', tel, admin||false, foto, data_nascimento, idMedico]
    );
    res.json({ ok: true, membro: r.rows[0] });
  } catch(e) { res.json({ ok: false, erro: e.message }); }
});

app.get('/api/membros/:familiaId', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM membros WHERE familia_id=$1 ORDER BY criado_em', [req.params.familiaId]);
    res.json({ ok: true, membros: r.rows });
  } catch(e) { res.json({ ok: false, erro: e.message }); }
});

app.post('/api/membros/excluir', async (req, res) => {
  try {
    await pool.query('DELETE FROM membros WHERE id=$1', [req.body.id]);
    res.json({ ok: true });
  } catch(e) { res.json({ ok: false, erro: e.message }); }
});

// MEDICAMENTOS
app.get('/api/medicamentos/:familiaId', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM medicamentos WHERE familia_id=$1 AND ativo=true ORDER BY criado_em', [req.params.familiaId]);
    res.json({ ok: true, meds: r.rows });
  } catch(e) { res.json({ ok: false, erro: e.message }); }
});

app.get('/api/medicamentos/:familiaId/:membroId', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM medicamentos WHERE familia_id=$1 AND membro_id=$2 AND ativo=true', [req.params.familiaId, req.params.membroId]);
    res.json({ ok: true, meds: r.rows });
  } catch(e) { res.json({ ok: false, erro: e.message }); }
});

app.post('/api/medicamentos/salvar', async (req, res) => {
  try {
    const { familia_id, membro_id, nome, dosagem, horarios, via, estoque, alerta_estoque, validade, armazenamento, obs } = req.body;
    const r = await pool.query(
      'INSERT INTO medicamentos (familia_id,membro_id,nome,dosagem,horarios,via,estoque,alerta_estoque,validade,armazenamento,obs) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *',
      [familia_id, membro_id, nome, dosagem, JSON.stringify(horarios), via, estoque, alerta_estoque, validade, armazenamento, obs]
    );
    res.json({ ok: true, med: r.rows[0] });
  } catch(e) { res.json({ ok: false, erro: e.message }); }
});

app.post('/api/medicamentos/excluir', async (req, res) => {
  try {
    await pool.query('UPDATE medicamentos SET ativo=false WHERE id=$1', [req.body.id]);
    res.json({ ok: true });
  } catch(e) { res.json({ ok: false, erro: e.message }); }
});

// HISTÓRICO MEDS
app.post('/api/historico/salvar', async (req, res) => {
  try {
    const { familia_id, membro_id, med_id, med_nome, status, motivo, obs, data, hora } = req.body;
    const r = await pool.query(
      'INSERT INTO historico_meds (familia_id,membro_id,med_id,med_nome,status,motivo,obs,data,hora) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [familia_id, membro_id, med_id, med_nome, status, motivo, obs, data, hora]
    );
    res.json({ ok: true, h: r.rows[0] });
  } catch(e) { res.json({ ok: false, erro: e.message }); }
});

app.get('/api/historico/:familiaId', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM historico_meds WHERE familia_id=$1 ORDER BY criado_em DESC LIMIT 100', [req.params.familiaId]);
    res.json({ ok: true, h: r.rows });
  } catch(e) { res.json({ ok: false, erro: e.message }); }
});

// EVENTOS
app.get('/api/eventos/:familiaId', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM eventos WHERE familia_id=$1 ORDER BY data', [req.params.familiaId]);
    res.json({ ok: true, eventos: r.rows });
  } catch(e) { res.json({ ok: false, erro: e.message }); }
});

app.post('/api/eventos/salvar', async (req, res) => {
  try {
    const { familia_id, membro_id, titulo, data, hora, tipo, obs } = req.body;
    const r = await pool.query(
      'INSERT INTO eventos (familia_id,membro_id,titulo,data,hora,tipo,obs) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [familia_id, membro_id, titulo, data, hora, tipo, obs]
    );
    res.json({ ok: true, evento: r.rows[0] });
  } catch(e) { res.json({ ok: false, erro: e.message }); }
});

app.post('/api/eventos/excluir', async (req, res) => {
  try {
    await pool.query('DELETE FROM eventos WHERE id=$1', [req.body.id]);
    res.json({ ok: true });
  } catch(e) { res.json({ ok: false, erro: e.message }); }
});

// CHAT
app.get('/api/mensagens/:familiaId', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM mensagens WHERE familia_id=$1 ORDER BY criado_em DESC LIMIT 50', [req.params.familiaId]);
    res.json({ ok: true, msgs: r.rows });
  } catch(e) { res.json({ ok: false, erro: e.message }); }
});

app.post('/api/mensagens/salvar', async (req, res) => {
  try {
    const { familia_id, autor, texto, categoria } = req.body;
    const r = await pool.query(
      'INSERT INTO mensagens (familia_id,autor,texto,categoria) VALUES ($1,$2,$3,$4) RETURNING *',
      [familia_id, autor, texto, categoria]
    );
    res.json({ ok: true, msg: r.rows[0] });
  } catch(e) { res.json({ ok: false, erro: e.message }); }
});

// FINANCEIRO
app.get('/api/gastos/:familiaId', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM gastos WHERE familia_id=$1 ORDER BY criado_em DESC', [req.params.familiaId]);
    res.json({ ok: true, gastos: r.rows });
  } catch(e) { res.json({ ok: false, erro: e.message }); }
});

app.post('/api/gastos/salvar', async (req, res) => {
  try {
    const { familia_id, descricao, valor, categoria, responsavel, data } = req.body;
    const r = await pool.query(
      'INSERT INTO gastos (familia_id,descricao,valor,categoria,responsavel,data) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [familia_id, descricao, valor, categoria, responsavel, data]
    );
    res.json({ ok: true, gasto: r.rows[0] });
  } catch(e) { res.json({ ok: false, erro: e.message }); }
});

app.post('/api/gastos/excluir', async (req, res) => {
  try {
    await pool.query('DELETE FROM gastos WHERE id=$1', [req.body.id]);
    res.json({ ok: true });
  } catch(e) { res.json({ ok: false, erro: e.message }); }
});

// SINAIS VITAIS
app.get('/api/sinais/:familiaId', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM sinais_vitais WHERE familia_id=$1 ORDER BY criado_em DESC LIMIT 100', [req.params.familiaId]);
    res.json({ ok: true, sinais: r.rows });
  } catch(e) { res.json({ ok: false, erro: e.message }); }
});

app.post('/api/sinais/salvar', async (req, res) => {
  try {
    const { familia_id, membro_id, tipo, valor, data, hora, obs } = req.body;
    const r = await pool.query(
      'INSERT INTO sinais_vitais (familia_id,membro_id,tipo,valor,data,hora,obs) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [familia_id, membro_id, tipo, valor, data, hora, obs]
    );
    res.json({ ok: true, sinal: r.rows[0] });
  } catch(e) { res.json({ ok: false, erro: e.message }); }
app.post('/api/sinais/excluir', async (req, res) => {
  try {
    await pool.query('DELETE FROM sinais_vitais WHERE id=$1', [req.body.id]);
    res.json({ ok: true });
  } catch(e) { res.json({ ok: false, erro: e.message }); }
});

});

// VACINAS
app.get('/api/vacinas/:familiaId', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM vacinas WHERE familia_id=$1 ORDER BY criado_em DESC', [req.params.familiaId]);
    res.json({ ok: true, vacinas: r.rows });
  } catch(e) { res.json({ ok: false, erro: e.message }); }
});

app.post('/api/vacinas/salvar', async (req, res) => {
  try {
    const { familia_id, membro_id, nome, data, doses, status, obs } = req.body;
    const r = await pool.query(
      'INSERT INTO vacinas (familia_id,membro_id,nome,data,doses,status,obs) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [familia_id, membro_id, nome, data, doses, status, obs]
    );
    res.json({ ok: true, vacina: r.rows[0] });
  } catch(e) { res.json({ ok: false, erro: e.message }); }
});
app.post('/api/vacinas/excluir', async (req, res) => {
  try {
    await pool.query('DELETE FROM vacinas WHERE id=$1', [req.body.id]);
    res.json({ ok: true });
  } catch(e) { res.json({ ok: false, erro: e.message }); }
});



// ===== ASSISTENTE IA GEMINI =====
app.post('/api/ia/perguntar', async (req, res) => {
  try {
    const { pergunta, contexto } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if(!apiKey) return res.json({ ok: false, erro: 'API key não configurada' });

    const prompt = `Você é um assistente de saúde familiar do app Cuidar, desenvolvido para famílias brasileiras.
Responda sempre em português brasileiro, de forma clara, carinhosa e acessível.
Você pode pesquisar e responder sobre saúde, medicamentos, cuidado de idosos, crianças, primeiros socorros e bem-estar.
IMPORTANTE: Sempre termine com "Consulte sempre um médico para diagnóstico e tratamento."

${contexto ? 'Contexto familiar: ' + contexto : ''}

Pergunta: ${pergunta}`;

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + apiKey,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
        })
      }
    );

    const data = await response.json();
    console.log('Gemini response:', JSON.stringify(data));
    const texto = data.candidates?.[0]?.content?.parts?.[0]?.text || 
                  data.error?.message ||
                  'Não consegui responder. Tente novamente.';
    res.json({ ok: true, resposta: texto, debug: data.error || null });
  } catch(e) {
    res.json({ ok: false, erro: e.message });
  }
});


// ===== GERAR ID MÉDICO PARA MEMBROS SEM ID =====
app.post('/api/membros/gerar-id-medico', async (req, res) => {
  try {
    const { familia_id } = req.body;
    const membros = await pool.query(
      'SELECT * FROM membros WHERE familia_id=$1 AND id_medico IS NULL', [familia_id]
    );
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for(const m of membros.rows) {
      const prefix = m.nome.replace(/[^a-zA-Z]/g,'').toUpperCase().substring(0,3) || 'MBR';
      let idMedico = prefix + '-';
      for(let i=0; i<5; i++) idMedico += chars.charAt(Math.floor(Math.random()*chars.length));
      await pool.query('UPDATE membros SET id_medico=$1 WHERE id=$2', [idMedico, m.id]);
    }
    const atualizados = await pool.query(
      'SELECT id, nome, id_medico FROM membros WHERE familia_id=$1', [familia_id]
    );
    res.json({ ok: true, membros: atualizados.rows });
  } catch(e) { res.json({ ok: false, erro: e.message }); }
});

// ===== LISTAR MEMBROS DA FAMÍLIA PARA MÉDICO =====
app.get('/api/familia/:codigo/membros', async (req, res) => {
  try {
    const codigo = req.params.codigo.toUpperCase();
    // Busca família
    const familia = await pool.query('SELECT * FROM familias WHERE codigo=$1', [codigo]);
    if(familia.rows.length === 0) {
      return res.json({ ok: false, erro: 'Família não encontrada' });
    }
    // Busca membros
    const membros = await pool.query(
      'SELECT id, nome, tipo, relacao, data_nascimento, id_medico FROM membros WHERE familia_id=$1 ORDER BY criado_em',
      [codigo]
    );
    res.json({ ok: true, familia: familia.rows[0], membros: membros.rows });
  } catch(e) { res.json({ ok: false, erro: e.message }); }
});

// ===== ACESSO MÉDICO =====
app.get('/api/medico/:id', async (req, res) => {
  try {
    const id = req.params.id.toUpperCase();

    // Primeiro tenta buscar por ID do membro
    const membroResult = await pool.query(
      'SELECT * FROM membros WHERE id_medico=$1', [id]
    );

    let familiaId, membroId, nomePaciente, tipoAcesso;

    if(membroResult.rows.length > 0) {
      // Acesso por ID do membro específico
      const membro = membroResult.rows[0];
      familiaId = membro.familia_id;
      membroId = membro.id;
      nomePaciente = membro.nome;
      tipoAcesso = 'membro';
    } else {
      // Tenta buscar por código familiar
      const familiaResult = await pool.query(
        'SELECT * FROM familias WHERE codigo=$1', [id]
      );
      if(familiaResult.rows.length === 0) {
        return res.json({ ok: false, erro: 'ID não encontrado. Verifique o código.' });
      }
      familiaId = familiaResult.rows[0].codigo;
      membroId = null;
      nomePaciente = familiaResult.rows[0].nome;
      tipoAcesso = 'familia';
    }

    // Busca dados médicos filtrados por membro se existir
    const medsQuery = membroId
      ? 'SELECT * FROM medicamentos WHERE familia_id=$1 AND membro_id=$2 AND ativo=true'
      : 'SELECT * FROM medicamentos WHERE familia_id=$1 AND ativo=true';
    const medsParams = membroId ? [familiaId, membroId] : [familiaId];

    const sinaisQuery = membroId
      ? 'SELECT * FROM sinais_vitais WHERE familia_id=$1 AND membro_id=$2 ORDER BY criado_em DESC LIMIT 20'
      : 'SELECT * FROM sinais_vitais WHERE familia_id=$1 ORDER BY criado_em DESC LIMIT 20';
    const sinaisParams = membroId ? [familiaId, membroId] : [familiaId];

    const vacinasQuery = membroId
      ? 'SELECT * FROM vacinas WHERE familia_id=$1 AND membro_id=$2 ORDER BY criado_em DESC'
      : 'SELECT * FROM vacinas WHERE familia_id=$1 ORDER BY criado_em DESC';
    const vacinasParams = membroId ? [familiaId, membroId] : [familiaId];

    const meds = await pool.query(medsQuery, medsParams);
    const sinais = await pool.query(sinaisQuery, sinaisParams);
    const vacinas = await pool.query(vacinasQuery, vacinasParams);
    const eventos = await pool.query(
      'SELECT * FROM eventos WHERE familia_id=$1 ORDER BY data DESC LIMIT 10', [familiaId]
    );

    res.json({
      ok: true,
      familia: { nome: nomePaciente, codigo: id },
      membro: membroId ? membroResult.rows[0] : null,
      tipoAcesso: tipoAcesso,
      meds: meds.rows,
      sinais: sinais.rows,
      eventos: eventos.rows,
      vacinas: vacinas.rows
    });
  } catch(e) { res.json({ ok: false, erro: e.message }); }
});

app.post('/api/medico/observacao', async (req, res) => {
  try {
    const { familia_id, medico, texto } = req.body;
    // Salva observação médica nos eventos
    const r = await pool.query(
      'INSERT INTO eventos (familia_id, titulo, tipo, obs) VALUES ($1,$2,$3,$4) RETURNING *',
      [familia_id, 'Observação médica — ' + medico, 'medico', texto]
    );
    res.json({ ok: true, evento: r.rows[0] });
  } catch(e) { res.json({ ok: false, erro: e.message }); }
});

// ===== SOCKET.IO =====
io.on('connection', (socket) => {
  console.log('Conectado:', socket.id);

  socket.on('entrarFamilia', (dados) => {
    if(dados.familiaId) {
      socket.join(dados.familiaId);
      console.log(dados.nome + ' entrou na família: ' + dados.familiaId);
    }
  });

  socket.on('emergencia', (dados) => {
    console.log('EMERGÊNCIA:', dados.nome, '| Família:', dados.familiaId);
    if(dados.familiaId) {
      socket.to(dados.familiaId).emit('alarme', {
        nome: dados.nome,
        tipo: dados.tipo || 'Emergência',
        familia: dados.familia || 'Família',
        hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      });
    } else {
      socket.broadcast.emit('alarme', {
        nome: dados.nome || 'Familiar',
        tipo: dados.tipo || 'Emergência',
        familia: dados.familia || 'Família',
        hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      });
    }
  });

  socket.on('mensagem', (dados) => {
    if(dados.familiaId) socket.to(dados.familiaId).emit('mensagem', dados);
    else socket.broadcast.emit('mensagem', dados);
  });

  socket.on('digitando', (dados) => {
    if(dados.familiaId) socket.to(dados.familiaId).emit('digitando', dados);
    else socket.broadcast.emit('digitando', dados);
  });

  socket.on('entrou', (dados) => {
    if(dados.familiaId) socket.to(dados.familiaId).emit('entrou', dados);
    else socket.broadcast.emit('entrou', dados);
  });

  socket.on('disconnect', () => {
    console.log('Desconectado:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Cuidar rodando na porta', PORT));
