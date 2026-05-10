const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static('public'));

// Conexão MongoDB
const MONGO_URL = process.env.MONGO_URL || 'mongodb+srv://cuidar_user:Cuidar2026!@cluster0.1xovffx.mongodb.net/cuidar?appName=Cluster0';

mongoose.connect(MONGO_URL)
  .then(() => console.log('✅ MongoDB conectado!'))
  .catch(err => console.log('❌ Erro MongoDB:', err));

// ===== SCHEMAS =====

const FamiliaSchema = new mongoose.Schema({
  codigo: { type: String, unique: true, required: true },
  nome: String,
  criadoEm: { type: Date, default: Date.now }
});

const UsuarioSchema = new mongoose.Schema({
  familiaId: String,
  nome: String,
  relacao: String,
  tel: String,
  admin: Boolean,
  criadoEm: { type: Date, default: Date.now }
});

const MedicamentoSchema = new mongoose.Schema({
  familiaId: String,
  nome: String,
  dosagem: String,
  horarios: [String],
  via: String,
  estoque: Number,
  alertaEstoque: Number,
  validade: String,
  armazenamento: String,
  obs: String,
  ativo: Boolean,
  criadoEm: { type: Date, default: Date.now }
});

const HistoricoMedSchema = new mongoose.Schema({
  familiaId: String,
  medId: String,
  medNome: String,
  status: String,
  motivo: String,
  obs: String,
  data: String,
  hora: String,
  criadoEm: { type: Date, default: Date.now }
});

const EventoSchema = new mongoose.Schema({
  familiaId: String,
  titulo: String,
  data: String,
  hora: String,
  tipo: String,
  obs: String,
  criadoEm: { type: Date, default: Date.now }
});

const MensagemSchema = new mongoose.Schema({
  familiaId: String,
  autor: String,
  texto: String,
  categoria: String,
  criadoEm: { type: Date, default: Date.now }
});

const GastoSchema = new mongoose.Schema({
  familiaId: String,
  descricao: String,
  valor: Number,
  categoria: String,
  responsavel: String,
  data: String,
  criadoEm: { type: Date, default: Date.now }
});

const SinalVitalSchema = new mongoose.Schema({
  familiaId: String,
  tipo: String,
  valor: String,
  data: String,
  hora: String,
  obs: String,
  criadoEm: { type: Date, default: Date.now }
});

const Familia = mongoose.model('Familia', FamiliaSchema);
const Usuario = mongoose.model('Usuario', UsuarioSchema);
const Medicamento = mongoose.model('Medicamento', MedicamentoSchema);
const HistoricoMed = mongoose.model('HistoricoMed', HistoricoMedSchema);
const Evento = mongoose.model('Evento', EventoSchema);
const Mensagem = mongoose.model('Mensagem', MensagemSchema);
const Gasto = mongoose.model('Gasto', GastoSchema);
const SinalVital = mongoose.model('SinalVital', SinalVitalSchema);

// ===== ROTAS API =====

// FAMÍLIA
app.post('/api/familia/criar', async (req, res) => {
  try {
    const { codigo, nome } = req.body;
    const existe = await Familia.findOne({ codigo });
    if (existe) return res.json({ ok: false, erro: 'Código já existe' });
    const familia = await Familia.create({ codigo, nome });
    res.json({ ok: true, familia });
  } catch (e) { res.json({ ok: false, erro: e.message }); }
});

app.get('/api/familia/:codigo', async (req, res) => {
  try {
    const familia = await Familia.findOne({ codigo: req.params.codigo });
    if (!familia) return res.json({ ok: false, erro: 'Família não encontrada' });
    res.json({ ok: true, familia });
  } catch (e) { res.json({ ok: false, erro: e.message }); }
});

// USUÁRIO
app.post('/api/usuario/salvar', async (req, res) => {
  try {
    const usuario = await Usuario.create(req.body);
    res.json({ ok: true, usuario });
  } catch (e) { res.json({ ok: false, erro: e.message }); }
});

app.get('/api/usuarios/:familiaId', async (req, res) => {
  try {
    const usuarios = await Usuario.find({ familiaId: req.params.familiaId });
    res.json({ ok: true, usuarios });
  } catch (e) { res.json({ ok: false, erro: e.message }); }
});

// MEDICAMENTOS
app.get('/api/medicamentos/:familiaId', async (req, res) => {
  try {
    const meds = await Medicamento.find({ familiaId: req.params.familiaId, ativo: true });
    res.json({ ok: true, meds });
  } catch (e) { res.json({ ok: false, erro: e.message }); }
});

app.post('/api/medicamentos/salvar', async (req, res) => {
  try {
    const med = await Medicamento.create(req.body);
    res.json({ ok: true, med });
  } catch (e) { res.json({ ok: false, erro: e.message }); }
});

app.post('/api/medicamentos/excluir', async (req, res) => {
  try {
    await Medicamento.findByIdAndUpdate(req.body.id, { ativo: false });
    res.json({ ok: true });
  } catch (e) { res.json({ ok: false, erro: e.message }); }
});

// HISTÓRICO MEDICAMENTOS
app.post('/api/historico/salvar', async (req, res) => {
  try {
    const h = await HistoricoMed.create(req.body);
    res.json({ ok: true, h });
  } catch (e) { res.json({ ok: false, erro: e.message }); }
});

app.get('/api/historico/:familiaId', async (req, res) => {
  try {
    const h = await HistoricoMed.find({ familiaId: req.params.familiaId }).sort({ criadoEm: -1 }).limit(100);
    res.json({ ok: true, h });
  } catch (e) { res.json({ ok: false, erro: e.message }); }
});

// EVENTOS/AGENDA
app.get('/api/eventos/:familiaId', async (req, res) => {
  try {
    const eventos = await Evento.find({ familiaId: req.params.familiaId }).sort({ data: 1 });
    res.json({ ok: true, eventos });
  } catch (e) { res.json({ ok: false, erro: e.message }); }
});

app.post('/api/eventos/salvar', async (req, res) => {
  try {
    const evento = await Evento.create(req.body);
    res.json({ ok: true, evento });
  } catch (e) { res.json({ ok: false, erro: e.message }); }
});

app.post('/api/eventos/excluir', async (req, res) => {
  try {
    await Evento.findByIdAndDelete(req.body.id);
    res.json({ ok: true });
  } catch (e) { res.json({ ok: false, erro: e.message }); }
});

// CHAT
app.get('/api/mensagens/:familiaId', async (req, res) => {
  try {
    const msgs = await Mensagem.find({ familiaId: req.params.familiaId }).sort({ criadoEm: -1 }).limit(50);
    res.json({ ok: true, msgs });
  } catch (e) { res.json({ ok: false, erro: e.message }); }
});

app.post('/api/mensagens/salvar', async (req, res) => {
  try {
    const msg = await Mensagem.create(req.body);
    res.json({ ok: true, msg });
  } catch (e) { res.json({ ok: false, erro: e.message }); }
});

// FINANCEIRO
app.get('/api/gastos/:familiaId', async (req, res) => {
  try {
    const gastos = await Gasto.find({ familiaId: req.params.familiaId }).sort({ criadoEm: -1 });
    res.json({ ok: true, gastos });
  } catch (e) { res.json({ ok: false, erro: e.message }); }
});

app.post('/api/gastos/salvar', async (req, res) => {
  try {
    const gasto = await Gasto.create(req.body);
    res.json({ ok: true, gasto });
  } catch (e) { res.json({ ok: false, erro: e.message }); }
});

app.post('/api/gastos/excluir', async (req, res) => {
  try {
    await Gasto.findByIdAndDelete(req.body.id);
    res.json({ ok: true });
  } catch (e) { res.json({ ok: false, erro: e.message }); }
});

// SINAIS VITAIS
app.get('/api/sinais/:familiaId', async (req, res) => {
  try {
    const sinais = await SinalVital.find({ familiaId: req.params.familiaId }).sort({ criadoEm: -1 }).limit(100);
    res.json({ ok: true, sinais });
  } catch (e) { res.json({ ok: false, erro: e.message }); }
});

app.post('/api/sinais/salvar', async (req, res) => {
  try {
    const sinal = await SinalVital.create(req.body);
    res.json({ ok: true, sinal });
  } catch (e) { res.json({ ok: false, erro: e.message }); }
});

// ===== SOCKET.IO =====
io.on('connection', (socket) => {
  console.log('Conectado:', socket.id);

  socket.on('entrarFamilia', (dados) => {
    if (dados.familiaId) {
      socket.join(dados.familiaId);
      console.log(dados.nome + ' entrou na família: ' + dados.familiaId);
    }
  });

  socket.on('emergencia', (dados) => {
    console.log('EMERGÊNCIA:', dados.nome, '| Família:', dados.familiaId);
    if (dados.familiaId) {
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
    if (dados.familiaId) socket.to(dados.familiaId).emit('mensagem', dados);
    else socket.broadcast.emit('mensagem', dados);
  });

  socket.on('digitando', (dados) => {
    if (dados.familiaId) socket.to(dados.familiaId).emit('digitando', dados);
    else socket.broadcast.emit('digitando', dados);
  });

  socket.on('entrou', (dados) => {
    if (dados.familiaId) socket.to(dados.familiaId).emit('entrou', dados);
    else socket.broadcast.emit('entrou', dados);
  });

  socket.on('disconnect', () => {
    console.log('Desconectado:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Cuidar rodando na porta', PORT));
