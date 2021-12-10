var socket = io();

function nameExists() {
  $("#pinMessage").html("That name already exists...");
  $("#invalidPin").animate(
    {
      right: "10px"
    },
    1000
  );
}

function invalidPin() {
  $("#pinMessage").html(
    "We could not locate a game with that PIN, please check and try again."
  );
  $("#invalidPin").animate(
    {
      right: "10px"
    },
    1000
  );
}

function closeInvalidPin() {
  $("#invalidPin").animate(
    {
      right: "-" + document.getElementById("invalidPin").offsetWidth + "px"
    },
    1000
  );
}

function ifGameExists() {
  var code = document.getElementById("pin").value;

  if (code == null || code == undefined || code == "") {
    invalidPin();
    return;
  }
  socket.emit("isValidCode", code);
}

function switchToUsername() {
  $("#gamePinForm").hide();
  $("#userNameForm").show();
  $("#name").focus();
}

function joinGame() {
  var params = {
    pin: document.getElementById("pin").value,
    name: document.getElementById("name").value,
    socketId: socket.id
  };

  window.location.href = "../player/?" + $.param(params);
}

socket.on("invalidPin", () => {
  invalidPin();
});
socket.on("validCode", () => {
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
  });

  let params = $.deparam(location.search);

  if (params.alert) {
    if (params.alert == "nameExists") {
      nameExists();
    }
  }
});

function getCookieValue(name) {
  let result = document.cookie.match(
    "(^|[^;]+)\\s*" + name + "\\s*=\\s*([^;]+)"
  );
  return result ? result.pop() : "";
}

function myAccount() {
  location.href = '/myaccount';
}

onStateChange = user => {
  if (user) {
    $("#header").html(`
      <button onclick='myAccount()'>My Account</button>
      <button onclick='signOut()'>Sign Out</button>
    `);
  }
};