var socket = io();

var params = jQuery.deparam(window.location.search); //Gets the id from url

var timerInterval;

var currentTimerValue = -1;

//When host connects to server
socket.on("connect", function() {
  //Tell server that it is host connection from game view
  socket.emit("host-join-game", params);
});

socket.on("gameQuestions", data => {
  $("#questionText").text(data.question);
  $("#questionImage").css("background-image", `url('${data.image}')`);
  
  startTimer();
});

socket.on("noGameFound", () => {
  window.location.href = "/"; //Redirect user to 'join game' page
});

socket.on("getTime", function(player) {
  socket.emit("time", {
    player: player,
    time: currentTimerValue
  });
});

socket.on("GameOver", winners => {
  var winnerText = "";

  Object.values(winners).forEach(winner => {
    winnerText += `<li>${winner.name}: ${winner.score}</li>`;
  });

  $("#winners").html(winnerText);
  $(".winners").css("display", "flex");
});

socket.on("questionOver", (selectedAnswers, answers) => {
  stopTimer();
  
  $("#questionEnd").fadeTo(1000, 1.0);
  
  var totalAnswers = 0;
  
  Object.keys(selectedAnswers).forEach(key => {
    totalAnswers += selectedAnswers[key];
  });
  
  var graphs = Array.from(document.getElementsByClassName("graph"));
  
  graphs.forEach((graph, i) => {
    graph.style.height = ((Object.values(selectedAnswers)[i] / totalAnswers) * 100) + "%";
  });
  
  var answerTexts = Array.from(document.getElementsByClassName("answerText"));
  
  answerTexts.forEach((text, i) => {
    text.innerHTML = answers[i];
  });
});

function nextQuestion() {
  socket.emit("nextQuestion");
  $("#questionEnd").fadeTo(1000, 0.0);
}

function updateTimerValue() {
  $("#timerText").html(currentTimerValue);
  currentTimerValue--;

  if (currentTimerValue == -1) {
    clearInterval(timerInterval);
    
    socket.emit("timeUp");
  }
}

function startTimer() {
  if (currentTimerValue != -1) return;
  
  currentTimerValue = 20;
  
  $("#timerText").html(currentTimerValue);
  
  $("#countdownCircle").css("transition", "all 1s ease");
  
  $("#countdownCircle").attr("stroke-dasharray", "283 283");
  
  setTimeout(() => {
    $("#countdownCircle").css("transition", "all 20s linear");

    $("#countdownCircle").attr("stroke-dasharray", "0 283");

    updateTimerValue();

    timerInterval = setInterval(() => {
      updateTimerValue();
    }, 1000);
  }, 1000); 
}

function stopTimer() {
  clearInterval(timerInterval);
  currentTimerValue = -1;
}

/*var socket = io();

var params = jQuery.deparam(window.location.search); //Gets the id from url

var timer;

var time = 20;

//When host connects to server
socket.on("connect", function() {
  //Tell server that it is host connection from game view
  socket.emit("host-join-game", params);
});

socket.on("noGameFound", () => {
  window.location.href = "/"; //Redirect user to 'join game' page
});

socket.on("gameQuestions", function(data) {
  document.getElementById("question").innerHTML = data.question + `<img src="${data.image}" style="height: 200px; width: 200px; overflow: hidden;">`;
  document.getElementById("answer1").innerHTML = data.answers[0];
  document.getElementById("answer2").innerHTML = data.answers[1];
  document.getElementById("answer3").innerHTML = data.answers[2];
  document.getElementById("answer4").innerHTML = data.answers[3];
  var correctAnswer = data.correct;
  document.getElementById("playersAnswered").innerHTML =
    "Players Answered 0 / " + data.playersInGame;
  updateTimer();
});

socket.on("updatePlayersAnswered", function(data) {
  document.getElementById("playersAnswered").innerHTML =
    "Players Answered " + data.playersAnswered + " / " + data.playersInGame;
});

socket.on("questionOver", function(playerData, correct) {
  // end the timer
  clearInterval(timer);
  
  var answer1 = 0;
  var answer2 = 0;
  var answer3 = 0;
  var answer4 = 0;
  var total = 0;
  //Hide elements on page
  document.getElementById("playersAnswered").style.display = "none";
  document.getElementById("timerText").style.display = "none";

  //Shows user correct answer with effects on elements
  if (correct == 1) {
    document.getElementById("answer2").style.filter = "grayscale(50%)";
    document.getElementById("answer3").style.filter = "grayscale(50%)";
    document.getElementById("answer4").style.filter = "grayscale(50%)";
    var current = document.getElementById("answer1").innerHTML;
    document.getElementById("answer1").innerHTML = "&#10004" + " " + current;
  } else if (correct == 2) {
    document.getElementById("answer1").style.filter = "grayscale(50%)";
    document.getElementById("answer3").style.filter = "grayscale(50%)";
    document.getElementById("answer4").style.filter = "grayscale(50%)";
    var current = document.getElementById("answer2").innerHTML;
    document.getElementById("answer2").innerHTML = "&#10004" + " " + current;
  } else if (correct == 3) {
    document.getElementById("answer1").style.filter = "grayscale(50%)";
    document.getElementById("answer2").style.filter = "grayscale(50%)";
    document.getElementById("answer4").style.filter = "grayscale(50%)";
    var current = document.getElementById("answer3").innerHTML;
    document.getElementById("answer3").innerHTML = "&#10004" + " " + current;
  } else if (correct == 4) {
    document.getElementById("answer1").style.filter = "grayscale(50%)";
    document.getElementById("answer2").style.filter = "grayscale(50%)";
    document.getElementById("answer3").style.filter = "grayscale(50%)";
    var current = document.getElementById("answer4").innerHTML;
    document.getElementById("answer4").innerHTML = "&#10004" + " " + current;
  }

  for (var i = 0; i < playerData.length; i++) {
    if (playerData[i].gameData.answer == 1) {
      answer1 += 1;
    } else if (playerData[i].gameData.answer == 2) {
      answer2 += 1;
    } else if (playerData[i].gameData.answer == 3) {
      answer3 += 1;
    } else if (playerData[i].gameData.answer == 4) {
      answer4 += 1;
    }
    total += 1;
  }

  //Gets values for graph
  answer1 = (answer1 / total) * 100;
  answer2 = (answer2 / total) * 100;
  answer3 = (answer3 / total) * 100;
  answer4 = (answer4 / total) * 100;

  document.getElementById("square1").style.display = "inline-block";
  document.getElementById("square2").style.display = "inline-block";
  document.getElementById("square3").style.display = "inline-block";
  document.getElementById("square4").style.display = "inline-block";

  document.getElementById("square1").style.height = answer1 + "px";
  document.getElementById("square2").style.height = answer2 + "px";
  document.getElementById("square3").style.height = answer3 + "px";
  document.getElementById("square4").style.height = answer4 + "px";

  document.getElementById("nextQButton").style.display = "block";
  document.getElementById("openShopButton").style.display = "block";
  document.getElementById("closeShopButton").style.display = "none";
});

function openShop() {
  document.getElementById("openShopButton").style.display = "none";
  document.getElementById("closeShopButton").style.display = "block";
  document.getElementById("nextQButton").style.display = "none";
  document.getElementById("square1").style.display = "none";
  document.getElementById("square2").style.display = "none";
  document.getElementById("square3").style.display = "none";
  document.getElementById("square4").style.display = "none";

  document.getElementById("answer1").style.display = "none";
  document.getElementById("answer2").style.display = "none";
  document.getElementById("answer3").style.display = "none";
  document.getElementById("answer4").style.display = "none";

  document.getElementById("shop").style.display = "block";
  socket.emit("openShop");
}

function closeShop() {
  document.getElementById("shop").style.display = "none";
  document.getElementById("openShopButton").style.display = "none";
  document.getElementById("closeShopButton").style.display = "none";
  document.getElementById("nextQButton").style.display = "block";

  document.getElementById("square1").style.display = "inline-block";
  document.getElementById("square2").style.display = "inline-block";
  document.getElementById("square3").style.display = "inline-block";
  document.getElementById("square4").style.display = "inline-block";

  document.getElementById("answer1").style.display = "block";
  document.getElementById("answer2").style.display = "block";
  document.getElementById("answer3").style.display = "block";
  document.getElementById("answer4").style.display = "block";
}

function nextQuestion() {
  document.getElementById("nextQButton").style.display = "none";
  document.getElementById("openShopButton").style.display = "none";
  document.getElementById("closeShopButton").style.display = "none";

  document.getElementById("square1").style.display = "none";
  document.getElementById("square2").style.display = "none";
  document.getElementById("square3").style.display = "none";
  document.getElementById("square4").style.display = "none";

  document.getElementById("answer1").style.filter = "none";
  document.getElementById("answer2").style.filter = "none";
  document.getElementById("answer3").style.filter = "none";
  document.getElementById("answer4").style.filter = "none";

  document.getElementById("playersAnswered").style.display = "block";
  document.getElementById("timerText").style.display = "block";
  document.getElementById("num").innerHTML = " 20";
  socket.emit("nextQuestion"); //Tell server to start new question
}

function updateTimer() {
  time = 20;
  clearInterval(timer);
  timer = setInterval(() => {
    time -= 1;
    $("#num").html(time);
    if (time == 0) {
      clearInterval(timer);
      socket.emit("timeUp");
    }
  }, 1000);
}
socket.on("GameOver", function(data) {
  document.getElementById("nextQButton").style.display = "none";
  document.getElementById("square1").style.display = "none";
  document.getElementById("square2").style.display = "none";
  document.getElementById("square3").style.display = "none";
  document.getElementById("square4").style.display = "none";

  document.getElementById("answer1").style.display = "none";
  document.getElementById("answer2").style.display = "none";
  document.getElementById("answer3").style.display = "none";
  document.getElementById("answer4").style.display = "none";
  document.getElementById("timerText").innerHTML = "";
  document.getElementById("question").innerHTML = "GAME OVER";
  document.getElementById("playersAnswered").innerHTML = "";

  document.getElementById("winner1").style.display = "block";
  document.getElementById("winner2").style.display = "block";
  document.getElementById("winner3").style.display = "block";
  document.getElementById("winner4").style.display = "block";
  document.getElementById("winner5").style.display = "block";
  document.getElementById("winnerTitle").style.display = "block";

  document.getElementById("winner1").innerHTML = "1. " + data.num1.name + ": " + data.num1.score;
  document.getElementById("winner2").innerHTML = "2. " + data.num2.name + ": " + data.num2.score;
  document.getElementById("winner3").innerHTML = "3. " + data.num3.name + ": " + data.num3.score;
  document.getElementById("winner4").innerHTML = "4. " + data.num4.name + ": " + data.num4.score;
  document.getElementById("winner5").innerHTML = "5. " + data.num5.name + ": " + data.num5.score;
});

socket.on("getTime", function(player) {
  socket.emit("time", {
    player: player,
    time: time
  });
});
*/
