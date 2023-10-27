const socket = io();
const usersTalkingPrivately = {};

const messaging = (messages, name, message) => {
  const item = document.createElement("li");
  item.textContent = `${name}: ${message}`;
  messages.appendChild(item);
  window.scrollTo(0, document.body.scrollHeight);
};

const displayConnectionStatus = (userName) => {
  const connectionStatus = document.getElementById("connectionStatus");
  connectionStatus.innerText = `Hello ${userName}!`;
};

const createMessageArea = (privMsgs, senderID, senderName, msg) => {
  usersTalkingPrivately[senderID] = senderName;
  const privMsgArea = document.createElement("ul");
  privMsgArea.id = senderID;
  privMsgArea.classList.value = "privMsg p-0";
  const privHeading = document.createElement("h1");
  const inputGroup = document.createElement("div");
  inputGroup.classList.value = "input-group mb-2";
  const input = document.createElement("input");
  input.classList.value = "form-control";
  input.placeholder = "Message";
  const sendBtn = document.createElement("button");
  sendBtn.type = "submit";
  sendBtn.innerText = "Send";
  sendBtn.classList.value = "btn btn-outline-secondary";
  privHeading.innerText = `Private messages between you and ${senderName}`;
  privHeading.classList.value = "fs-3 mt-2 mb-2";
  inputGroup.appendChild(input);
  inputGroup.appendChild(sendBtn);
  privMsgArea.appendChild(privHeading);
  privMsgArea.appendChild(inputGroup);
  privMsgs.appendChild(privMsgArea);

  if (msg) {
    messaging(privMsgArea, senderName, msg);
  }

  sendBtn.onclick = (e) => {
    e.preventDefault();
    const msg = input.value;
    const msgArea = document.getElementById(senderID);
    socket.emit("sendPrivateMsg", socket.id, senderID, socket.userName, msg);
    messaging(msgArea, "Me: ", msg);
    input.value = "";
  };
};

socket.on("connect", () => {
  socket.userName = prompt("What is your name?");
  displayConnectionStatus(socket.userName);
  socket.emit("new user", socket.userName || "Anonymous User");

  const messages = document.getElementById("messages");
  const form = document.getElementById("grpMsgForm");
  const input = document.getElementById("grpMsgInput");

  form.onsubmit = (e) => {
    e.preventDefault();

    if (input.value) {
      const msg = input.value;
      messaging(messages, "Me", msg);
      socket.emit("group message", socket.userName, msg);
    }
    input.value = "";
  };

  input.oninput = () => {
    socket.emit("userIsTyping", socket.userName);
  };

  input.onchange = () => {
    socket.emit("userIsNotTyping");
  };

  socket.on("new user", (userName) => {});

  socket.on("group message", (userName, msg) => {
    messaging(messages, userName, msg);
  });

  socket.on("userIsTyping", (userName) => {
    const typing = document.getElementById("typing");
    typing.innerText = `${userName} is typing...`;
  });

  socket.on("userIsNotTyping", () => {
    const typing = document.getElementById("typing");
    typing.innerText = "";
  });

  socket.on("usersList", (users) => {
    let connectedUsers;
    const windowLessThanLarge = window.innerWidth < 992;
    if (windowLessThanLarge) {
      connectedUsers = document.getElementById("connectedUsersMobile");
    } else {
      connectedUsers = document.getElementById("connectedUsers");
    }

    connectedUsers.innerHTML = "";

    for (const id in users) {
      const userName = users[id];
      const userElement = document.createElement("li");
      const userNameElement = document.createElement("span");
      userNameElement.innerText = userName;
      userElement.setAttribute("name", userName);
      userElement.classList.add("list-group-item");
      userElement.classList.add("d-flex");
      userElement.classList.add("justify-content-between");
      userElement.classList.add("align-items-center");
      userElement.appendChild(userNameElement);
      connectedUsers.appendChild(userElement);
      const dmButton = document.createElement("button");
      dmButton.innerText = "Send a message";
      dmButton.classList.value = "btn btn-outline-success";

      if (id !== socket.id) {
        userElement.appendChild(dmButton);
      }
      const privateMsgs = document.getElementById("privateMsgs");

      dmButton.onclick = () => {
        if (!usersTalkingPrivately[id]) {
          createMessageArea(privateMsgs, id, userName);

          if (windowLessThanLarge) {
            const closeModalBtn = document.getElementById("modalCloseUsers");
            closeModalBtn.click();
          }

          window.scrollTo(0, document.body.scrollHeight);
        } else {
          alert(`You are already talking with ${userName}`);
        }
      };
    }
  });

  socket.on("recPrivateMsg", (senderID, senderName, msg) => {
    if (!usersTalkingPrivately[senderID]) {
      const privateMsgs = document.getElementById("privateMsgs");
      createMessageArea(privateMsgs, senderID, senderName, msg);
    } else {
      const msgArea = document.getElementById(senderID);
      messaging(msgArea, senderName, msg);
    }
  });

  socket.on("user disconnected", (userName) => {
    const userOnlineItem = document.querySelector(
      `#connectedUsers li[name='${userName}']`
    );
    userOnlineItem?.remove();
  });
});

const createGrpBtn = document.getElementById("createGrp");
const modalCloseBtn = document.getElementById("modalClose");
const grpNameInput = document.getElementById("grpName");
const createGrpForm = document.getElementById("createGrpForm");
createGrpBtn.onclick = () => {
  const grpName = grpNameInput.value;

  if (!grpName) {
    createGrpForm.classList.add("was-validated");
  } else {
    modalCloseBtn.click();
    createGrpForm.classList.remove("was-validated");
    const url = `/privGroup/${grpName}`;
    window.open(url, "_blank");
    grpNameInput.value = "";
  }
};
