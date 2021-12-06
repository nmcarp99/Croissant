var socket = io();

socket.on('connect', function(){
    socket.emit('requestDbNames', localStorage.getItem("user"));//Get database names to display to user
});

socket.on('gameNamesData', function(data){
    for(var i = 0; i < Object.keys(data).length; i++){
        var div = document.getElementById('game-list');
        var button = document.createElement('a');
        
        button.innerHTML = data[i].name;
        button.setAttribute('href', "/host/?id=" + data[i].id);
        button.setAttribute('class', 'gameButton');
        
        div.appendChild(button);
    }

    if (Object.keys(data).length == 0) {
      $("#game-list").html(`
        <h4>You haven't created any games yet...</h4>
      `);
    }
});