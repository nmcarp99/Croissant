var socket = io();
var params = jQuery.deparam(window.location.search);

//When host connects to server
socket.on('connect', function() {

    document.getElementById('players').value = "";
    
    //Tell server that it is host connection
    socket.emit('host-join', params);
});

socket.on('showGamePin', function(data){
  let pinText = document.getElementById('gamePinText');

  pinText.innerHTML = data.pin;
  pinText.style.animation = "none";
});

//Adds player's name to screen and updates player count
socket.on('updatePlayerLobby', data => {

  let output = "";
  
  for(var i = 0; i < data.length; i++){
    output += "<h1>" + data[i].name + "</h1>";
  }

  document.getElementById('players').innerHTML = output;
});

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
   window.location.href = '../../'; //Redirect user to 'join game' page
});