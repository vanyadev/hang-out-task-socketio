const grpNSP = '/privgroup';
const grpSocket = io(grpNSP);

const displayConnectionStatus = (userName) => {
  const connectionStatus = document.getElementById('connectionStatus');
  connectionStatus.innerText = `Hello ${userName}!`;
};

const messaging = (messages, name, message) => {
  const item = document.createElement('li');
  item.textContent = `${name}: ${message}`;
  messages.appendChild(item);
  window.scrollTo(0, document.body.scrollHeight);
};

const leaveGroup = (socket, grpName) => {
  let yes = confirm(`Are you sure you want to leave ${grpName} group?`);

  if (yes) {
    socket.disconnect();
    location.replace('/');
  }
};

grpSocket.on('connect', () => {
  grpSocket.emit('send grp id', grpID);
  grpSocket.userName = prompt('What is your name?');
  displayConnectionStatus(grpSocket.userName);

  grpSocket.emit(
    'send user name and grp name',
    grpSocket.userName,
    grpID,
    grpName
  );

  grpSocket.emit('new user', grpSocket.userName, grpID);
  grpSocket.on('new user', (userName) => {
    alert(`${userName} has joined the chat`);
  });

  grpSocket.on('users list', (users) => {
    let connectedUsers;
    const windowLessThanLarge = window.innerWidth < 992;

    if (windowLessThanLarge) {
      connectedUsers = document.getElementById('connectedUsersGrpMobile');
    } else {
      connectedUsers = document.getElementById('connectedUsers');
    }

    connectedUsers.innerHTML = '';

    for (const id in users) {
      const userName = users[id];
      const user = document.createElement('li');
      user.classList.add('list-group-item');
      user.innerText = userName;
      connectedUsers.appendChild(user);
    }
  });

  const messages = document.getElementById('messages');
  const form = document.getElementById('grpMsgForm');
  const input = document.getElementById('grpMsgInput');
  const leaveGrpBtn = document.getElementById('leaveGroup');

  form.onsubmit = (e) => {
    e.preventDefault();

    if (input.value) {
      const msg = input.value;
      messaging(messages, 'Me: ', msg);
      grpSocket.emit('group message', grpSocket.userName, msg, grpID);
      input.value = '';
    }
  };

  input.oninput = () => {
    grpSocket.emit('userIsTyping', grpSocket.userName, grpID);
  };

  input.onchange = () => {
    grpSocket.emit('userIsNotTyping', grpID);
  };

  leaveGrpBtn.onclick = () => {
    leaveGroup(grpSocket, grpName);
  };

  grpSocket.on('group message', (userName, msg) => {
    messaging(messages, userName, msg);
  });

  grpSocket.on('userIsTyping', (userName) => {
    const typing = document.getElementById('typing');
    typing.innerText = `${userName} is typing...`;
  });

  grpSocket.on('userIsNotTyping', () => {
    const typing = document.getElementById('typing');
    typing.innerText = '';
  });

  grpSocket.on('user left', (userName) => {
    alert(`${userName} has left the group`);
  });
});
