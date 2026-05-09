const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('Conectado:', socket.id);

  // Entrar na sala da família
  socket.on('entrarFamilia', (dados) => {
    if(dados.familiaId) {
      socket.join(dados.familiaId);
      console.log(dados.nome + ' entrou na família: ' + dados.familiaId);
    }
  });

  // Emergência — dispara só para a família
  socket.on('emergencia', (dados) => {
    console.log('EMERGÊNCIA:', dados.nome, '| Família:', dados.familiaId, '| Tipo:', dados.tipo);
    if(dados.familiaId) {
      // Envia para todos da família exceto quem disparou
      socket.to(dados.familiaId).emit('alarme', {
        nome: dados.nome,
        tipo: dados.tipo || 'Emergência',
        familia: dados.familia || 'Família',
        hora: new Date().toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})
      });
    } else {
      // Fallback — broadcast geral
      socket.broadcast.emit('alarme', {
        nome: dados.nome || 'Familiar',
        tipo: dados.tipo || 'Emergência',
        familia: dados.familia || 'Família',
        hora: new Date().toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})
      });
    }
  });

  // Chat familiar — só para a família
  socket.on('mensagem', (dados) => {
    if(dados.familiaId) {
      socket.to(dados.familiaId).emit('mensagem', dados);
    } else {
      socket.broadcast.emit('mensagem', dados);
    }
  });

  socket.on('digitando', (dados) => {
    if(dados.familiaId) {
      socket.to(dados.familiaId).emit('digitando', dados);
    } else {
      socket.broadcast.emit('digitando', dados);
    }
  });

  socket.on('entrou', (dados) => {
    if(dados.familiaId) {
      socket.to(dados.familiaId).emit('entrou', dados);
    } else {
      socket.broadcast.emit('entrou', dados);
    }
  });

  socket.on('disconnect', () => {
    console.log('Desconectado:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Cuidar rodando na porta', PORT));
