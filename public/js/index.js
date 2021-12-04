var socket = io();

function invalidPin() {
  $("#invalidPin").animate({
    right: "10px"
  }, 1000);
}

function closeInvalidPin() {
  $("#invalidPin").animate({
    right: "-" + document.getElementById("invalidPin").offsetWidth + "px"
  }, 1000);
}

function ifGameExists() {
  var code = document.getElementById('pin').value;

  if (code == null || code == undefined || code == "") {
    invalidPin();
    return;
  }
  socket.emit('isValidCode', code);
}

function switchToUsername() {
  $('#gamePinForm').hide();
  $('#userNameForm').show();
  $('#name').focus();  
}

function joinGame() {
  var params = {
    pin: document.getElementById('pin').value,
    name: document.getElementById('name').value,
    socketId: socket.id
  };

  window.location.href = '../player/?' + $.param(params);
}

socket.on("invalidPin", () => {
  invalidPin();
});
socket.on('validCode', () => {
  switchToUsername();
});

window.addEventListener("load", () => {
  document.getElementById("gamePinForm").addEventListener("keydown", e => {
    if (e.code == "Enter") {
      ifGameExists();
    }
  });
  document.getElementById("userNameForm").addEventListener("keydown", e => {
    if (e.code == "Enter") {
      joinGame();
    }
  })
});