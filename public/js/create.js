var socket = io();

socket.on("connect", function() {
  socket.emit("requestDbNames", localStorage.getItem("user")); //Get database names to display to user
});

socket.on("gameNamesData", function(data) {
  var allButtons = "";
  
  for (var i = 0; i < Object.keys(data).length; i++) {
    var newButton = `
      <div onclick="location.href='/host/?id=${data[i].id}'" class="gameButton">
        <a href="/host/?id=${data[i].id}">${data[i].name}</a>
        <div class="gameButtonIcons">
          <ion-icon name="create-outline" onclick="location.href='/create/quiz-creator/?id=${data[i].id}'"></ion-icon>
          <ion-icon name="trash-outline"></ion-icon>
        </div>
      </div>
    `;

    allButtons += newButton;
  }
  
  $("#game-list").html(allButtons);
  
  var iconButtons = Array.from(document.getElementsByName("create-outline"));
  iconButtons = iconButtons.concat(Array.from(document.getElementsByName("trash-outline")));
  
  iconButtons.forEach(button => {
    button.addEventListener("click", e => {
      e.stopPropagation();
    });
  })

  if (Object.keys(data).length == 0) {
    $("#game-list").html(`
        <h4>You haven't created any games yet...</h4>
      `);
  }
});

onStateChange = user => {
  if (!user) {
    location.href = "/login";
  }
};
