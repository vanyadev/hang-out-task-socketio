require('dotenv').config();
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
const { v4: uuid } = require('uuid');
const port = process.env.PORT || 3000;
const connectedUsers = {};

app.use(express.static('client'));
app.set('view engine', 'ejs');
app.get('/privgroup/:grpName', (req, res) => {
  const grpID = uuid();
  const grpName = req.params.grpName;
  res.redirect(`/privgroup/${grpName}/${grpID}`);
});

app.get('/privgroup/:grpName/:grpID', (req, res) => {
  const grpName = req.params.grpName;
  const grpID = req.params.grpID;
  res.render('group', {
    grpName,
    grpID,
  });
});

io.on('connection', (socket) => {
  socket.on('group message', (userName, msg) => {
    socket.broadcast.emit('group message', userName, msg);
  });

  socket.on('new user', (userName) => {
    socket.userName = userName;
    connectedUsers[socket.id] = socket.userName;
    io.emit('usersList', connectedUsers);
  });

  socket.on('disconnect', () => {
    socket.broadcast.emit('user disconnected', socket.userName);
    delete connectedUsers[socket.id];
    io.emit('usersList', connectedUsers);
  });

  socket.on('userIsTyping', (userName) => {
    socket.broadcast.emit('userIsTyping', userName);
  });

  socket.on('userIsNotTyping', () => {
    socket.broadcast.emit('userIsNotTyping');
  });

  socket.on('sendPrivateMsg', (senderID, recID, senderName, msg) => {
    socket.to(recID).emit('recPrivateMsg', senderID, senderName, msg);
  });
});

const grpNSP = io.of('/privgroup');
grpNSP.on('connection', (grpSocket) => {
  const socketID = grpSocket.id;

  grpSocket.on('send grp id', (grpID) => {
    grpSocket.join(grpID);
  });

  grpSocket.on('send user name and grp name', (userName, grpID, grpName) => {
    grpSocket.userName = userName;

    if (!grpNSP.adapter.rooms.get(grpID).connectedUsers) {
      grpNSP.adapter.rooms.get(grpID).connectedUsers = {};
    }

    grpNSP.adapter.rooms.get(grpID).connectedUsers[socketID] = userName;
    grpNSP
      .to(grpID)
      .emit('users list', grpNSP.adapter.rooms.get(grpID).connectedUsers);

    grpSocket.on('disconnect', () => {
      grpSocket.to(grpID).emit('user left', grpSocket.userName);

      if (grpNSP.adapter.rooms.get(grpID)) {
        delete grpNSP.adapter.rooms.get(grpID).connectedUsers[socketID];

        grpSocket
          .to(grpID)
          .emit('users list', grpNSP.adapter.rooms.get(grpID).connectedUsers);
      }
    });
  });

  grpSocket.on('new user', (userName, grpID) => {
    grpSocket.to(grpID).emit('new user', userName);
  });

  grpSocket.on('group message', (userName, msg, grpID) => {
    grpSocket.to(grpID).emit('group message', userName, msg);
  });

  grpSocket.on('userIsTyping', (userName, grpID) => {
    grpSocket.to(grpID).emit('userIsTyping', userName);
  });

  grpSocket.on('userIsNotTyping', (grpID) => {
    grpSocket.to(grpID).emit('userIsNotTyping');
  });
});

server.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
