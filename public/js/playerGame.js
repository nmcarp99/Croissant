var socket = io();
var playerAnswered = false;
var correct = false;
var name;
var score = 0;

// get params from url
var params = $.deparam(location.search);

socket.on("connect", function() {
  //Tell server that it is host connection from game view
  socket.emit("player-join-game", params);
});

socket.on("openShopPlayer", () => {
  $("#shop").show();
  console.log($("#shop"));
});

socket.on("noGameFound", function() {
  window.location.href = "../../"; //Redirect user to 'join game' page
  var alertList = document.querySelectorAll(".alert");
  var alerts = [].slice.call(alertList).map(function(element) {
    return new bootstrap.Alert(element);
  });
});

//Get results on last question
socket.on("answerResult", function(data) {
  if (data == true) {
    correct = true;
  }
});

socket.on("questionOver", function(data) {
  if (correct == true) {
    document.body.style.backgroundColor = "#4CAF50";
    document.getElementById("message").style.display = "block";
    document.getElementById("message").innerHTML = "Correct!";
  } else {
    document.body.style.backgroundColor = "#f94a1e";
    document.getElementById("message").style.display = "block";
    document.getElementById("message").innerHTML = "Incorrect!";
  }
  document.getElementById("answer1").style.visibility = "hidden";
  document.getElementById("answer2").style.visibility = "hidden";
  document.getElementById("answer3").style.visibility = "hidden";
  document.getElementById("answer4").style.visibility = "hidden";
  socket.emit("getScore");
});

socket.on("newScore", function(data) {
  document.getElementById("scoreText").innerHTML = "Score: " + data;
});

socket.on("gameQuestions", question => {
  $("#question").html(question.question);
  $("#questionImage").attr("src", question.image);

  Array.from(document.getElementsByClassName("answer")).forEach((answer, i) => {
    if (question.answers[i] != "") {
      answer.innerHTML = question.answers[i];
      answer.style.display = "";
    } else {
      answer.style.display = "none";
    }
  });
});

socket.on("hostDisconnect", function() {
  window.location.href = "../../";
});

socket.on("player-disconnect", data => {
  console.log("player-disconnect triggered");
  console.log(data + " and params.name is " + name);
  if (data == params.name) {
    socket.leave(parseInt(params.pin));
    window.location.href = "/";
  }
});

socket.on("updatePlayerData", player => {
  console.log("update player data here...");
});

socket.on("GameOver", function() {
  document.body.style.backgroundColor = "#FFFFFF";
  document.getElementById("answer1").style.visibility = "hidden";
  document.getElementById("answer2").style.visibility = "hidden";
  document.getElementById("answer3").style.visibility = "hidden";
  document.getElementById("answer4").style.visibility = "hidden";
  document.getElementById("message").style.display = "block";
  document.getElementById("message").innerHTML = "GAME OVER";
});

$(() => {
  $("#shop").hide();

  Array.from(document.getElementsByClassName("answer")).forEach((answer, i) => {
    answer.addEventListener("click", () => {
      if (playerAnswered == false) {
        playerAnswered = true;

        socket.emit("playerAnswer", i); //Sends player answer to server
      }
    });
  });
});
