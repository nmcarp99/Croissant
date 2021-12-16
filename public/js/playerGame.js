var socket = io();
var playerAnswered = true;
var correct = false;
var name;
var score = 0;
var selectedAnswers = [];
var isMultipleChoice = false;

// get params from url
var params = $.deparam(location.search);

function submitAnswer() {
  playerAnswered = true;

  socket.emit("playerAnswer", selectedAnswers);
}

function selectAnswer(answer, i) {
  if (selectedAnswers.includes(i + 1)) {
    selectedAnswers.splice(selectedAnswers.indexOf(i + 1), 1);
    answer.getElementsByTagName("input")[0].checked = false;
  } else {
    selectedAnswers.push(i + 1);
    answer.getElementsByTagName("input")[0].checked = true;
  }

  console.log(selectedAnswers);
}

function clearMessages() {
  Array.from(document.getElementsByClassName("message")).forEach(message => {
    message.style.display = "none";
  });
}

socket.on("connect", () => {
  //Tell server that it is host connection from game view
  socket.emit("player-join-game", params);
});

socket.on("openShopPlayer", () => {
  $("#shop").show();
  console.log($("#shop"));
});

socket.on("noGameFound", () => {
  window.location.href = "/"; //Redirect user to 'join game' page
  var alertList = document.querySelectorAll(".alert");
  var alerts = [].slice.call(alertList).map(function(element) {
    return new bootstrap.Alert(element);
  });
});

socket.on("questionOver", (playerData, correctAnswers) => {
  $(".submitted").hide();

  let numCorrect = 0;

  if (selectedAnswers != []) {
    selectedAnswers.forEach(answer => {
      if (correctAnswers.includes(answer.toString())) {
        numCorrect++;
      }
    });
  }

  if (numCorrect == 0 || !playerAnswered) {
    $(".incorrect").css("display", "flex");
  } else if (numCorrect != correctAnswers.length) {
    $(".partialCorrect").css("display", "flex");
  } else {
    $(".correct").css("display", "flex");
  }

  selectedAnswers = [];

  socket.emit("getScore");
});

socket.on("newScore", score => {
  $("#score").html(score);
});

socket.on("gameQuestions", question => {
  playerAnswered = false;

  if (question.multipleChoice) {
    $(".submitMultipleChoice").show();
  } else {
    $(".submitMultipleChoice").hide();
  }

  isMultipleChoice = question.multipleChoice;

  clearMessages(); // hide all the messages

  $("#question").html(question.question);
  $("#questionImage").attr("src", question.image);

  Array.from(document.getElementsByClassName("answer")).forEach((answer, i) => {
    if (question.answers[i] != "") {
      answer.innerHTML =
        question.answers[i] +
        (isMultipleChoice
          ? `
        <label class="container">
          <input type="checkbox" />
          <span class="checkmark"></span>
        </label>
      `
          : "");

      if (isMultipleChoice) {
        answer.getElementsByTagName("span")[0].addEventListener("click", e => {
          e.stopPropagation();
        });
      }
      answer.style.display = "";
    } else {
      answer.style.display = "none";
    }
  });
});

socket.on("hostDisconnect", () => {
  window.location.href = "/";
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

socket.on("GameOver", winners => {
  var winnerText = "";
  
  Object.values(winners).forEach(winner => {
    winnerText += winner;
  });
  
  alert(winnerText);
});

$(() => {
  $("#shop").hide();
  $(".message").hide();

  Array.from(document.getElementsByClassName("answer")).forEach((answer, i) => {
    answer.addEventListener("click", () => {
      if (playerAnswered == false) {
        if (isMultipleChoice) {
          selectAnswer(answer, i);
        } else {
          selectedAnswers = [i + 1];

          submitAnswer();

          $(".submitted").css("display", "flex");
        }
      }
    });
  });
});
