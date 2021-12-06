var socket = io();

// load params from url
var params = $.deparam(location.search);

socket.on('connect', function() {
    
    //Tell server that it is player connection
    socket.emit('player-join', params); // it is now redirecting me to the home page.
});

//Boot player back to join screen if game pin has no match
socket.on('noGameFound', function(){
    window.location.href = '/';
    // this is being called. yea look at my cursor for a sec
});
socket.on('nameExists', () => {
  location.href = '/?alert=nameExists';
});
//If the host disconnects, then the player is booted to main screen
socket.on('hostDisconnect', function(){
    window.location.href = '../';
});

//When the host clicks start game, the player screen changes
socket.on('gameStartedPlayer', function(){
  let newParams = params;

  newParams.socketId = socket.id;
  window.location.href = "/player/game/?" + $.param(newParams);
});

// when the host kicks a player
socket.on('player-disconnect', () => {
  location.href = '/';
});