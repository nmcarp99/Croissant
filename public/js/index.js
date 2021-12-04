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
  
  $('.webflow-style-input').addClass('hide');
  $('.username').removeClass('hide');
}

function joinGame() {
  var params = [document.getElementById('pin').value, document.getElementById('name').value];
  window.location.href = '../player/?pin=' + params[0] + "&name=" + params[1];
}

socket.on("invalidPin", () => {
  console.log('invalid pin');
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
});