const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('Conectado:', socket.id);

  socket.on('emergencia', (dados) => {
    console.log('EMERGÊNCIA:', dados.nome);
    socket.broadcast.emit('alarme', {
      de: dados.nome || 'Idoso',
      hora: new Date().toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})
    });
  });

  socket.on('mensagem', (dados) => {
    socket.broadcast.emit('mensagem', dados);
  });

  socket.on('digitando', (dados) => {
    socket.broadcast.emit('digitando', dados);
  });

  socket.on('entrou', (dados) => {
    socket.broadcast.emit('entrou', dados);
  });

  socket.on('disconnect', () => {
    console.log('Desconectado:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Cuidar rodando na porta', PORT));
