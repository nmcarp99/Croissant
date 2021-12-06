var socket = io();
var params = jQuery.deparam(window.location.search);

//When host connects to server
socket.on('connect', function() {

    document.getElementById('players').value = "";

    const data = {
      id: params.id,
      uid: localStorage.user
    };
    
    //Tell server that it is host connection
    socket.emit('host-join', data);
});

socket.on('showGamePin', function(data){
  let pinText = document.getElementById('gamePinText');

  pinText.innerHTML = data.pin;
  pinText.style.animation = "none";
});

//Adds player's name to screen and updates player count
socket.on('updatePlayerLobby', data => {

  console.log("recieved update player lobby");

  let output = "";
  
  for(var i = 0; i < data.length; i++){
    output += `<h1 class="player" onclick="removePlayer('${data[i].name.toString()}')">${data[i].name}</h1>`;
  }

  document.getElementById('players').innerHTML = output;
});

function removePlayer(button) {
  const data = {
    name: button
  }
  socket.emit('remove-player', data);
}

//Tell server to start game if button is clicked
function startGame(){
    socket.emit('startGame');
}

function endGame(){
    window.location.href = "/";
}

//When server starts the game
socket.on('gameStarted', function(id){
    console.log('Game Started!');
    window.location.href="/host/game/" + "?id=" + id;
});

socket.on('noGameFound', function(){
   window.location.href = '../../404'; //Redirect user to 'join game' page
});

socket.on('doesntOwnGame', data => {
  window.location.href = "../../404";
});