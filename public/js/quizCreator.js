var socket = io();
var questionNum = 0; //Starts at two because question 1 is already present
var socketConnected = false;
var signedIn = false;
var params;
var quiz;

socket.on("connect", () => {
  socketConnected = true;

  loadQuiz();
});

socket.on("returnQuiz", quiz => {
  console.log(quiz);
});

socket.on("noGameFound", () => {
  location.href = '/create';
});

onStateChange = user => {
  if (!user) {
    location.href = "/login";
  }

  signedIn = true;

  loadQuiz();
};

function loadQuiz() {
  params = $.deparam(location.search);

  if (signedIn && socketConnected) {
    socket.emit("getQuiz", { uid: auth.currentUser.uid, id: parseInt(params.id) });
  }
}

function updateDatabase() {
  var questions = [];
  var name = document.getElementById("name").value;
  for (var i = 1; i <= questionNum; i++) {
    var question = document.getElementById("q" + i).value;
    var answer1 = document.getElementById(i + "a1").value;
    var answer2 = document.getElementById(i + "a2").value;
    var answer3 = document.getElementById(i + "a3").value;
    var answer4 = document.getElementById(i + "a4").value;
    var correct = document.getElementById("correct" + i).value;
    var answers = [answer1, answer2, answer3, answer4];
    questions.push({ question: question, answers: answers, correct: correct });
  }

  var quiz = {
    id: 0,
    name: name,
    questions: questions,
    owner: localStorage.getItem("user")
  };
  socket.emit("newQuiz", quiz);
  location.href = "/create";
}

function addQuestion() {
  questionNum += 1;

  var questionsDiv = document.getElementById("allQuestions");

  var newQuestionDiv = document.createElement("div");

  var questionLabel = document.createElement("label");
  var questionField = document.createElement("input");

  var answer1Label = document.createElement("label");
  var answer1Field = document.createElement("input");

  var answer2Label = document.createElement("label");
  var answer2Field = document.createElement("input");

  var answer3Label = document.createElement("label");
  var answer3Field = document.createElement("input");

  var answer4Label = document.createElement("label");
  var answer4Field = document.createElement("input");

  var correctLabel = document.createElement("label");
  var correctField = document.createElement("input");

  questionLabel.innerHTML = "Question " + String(questionNum) + ": ";
  questionField.setAttribute("class", "question");
  questionField.setAttribute("id", "q" + String(questionNum));
  questionField.setAttribute("type", "text");

  answer1Label.innerHTML = "Answer 1: ";
  answer2Label.innerHTML = " Answer 2: ";
  answer3Label.innerHTML = "Answer 3: ";
  answer4Label.innerHTML = " Answer 4: ";
  correctLabel.innerHTML = "Correct Answer (1-4): ";

  answer1Field.setAttribute("id", String(questionNum) + "a1");
  answer1Field.setAttribute("type", "text");
  answer2Field.setAttribute("id", String(questionNum) + "a2");
  answer2Field.setAttribute("type", "text");
  answer3Field.setAttribute("id", String(questionNum) + "a3");
  answer3Field.setAttribute("type", "text");
  answer4Field.setAttribute("id", String(questionNum) + "a4");
  answer4Field.setAttribute("type", "text");

  correctField.setAttribute("id", "correct" + String(questionNum));
  correctField.setAttribute("type", "number");

  newQuestionDiv.setAttribute("id", "question-field"); //Sets class of div

  newQuestionDiv.appendChild(questionLabel);
  newQuestionDiv.appendChild(questionField);
  newQuestionDiv.appendChild(document.createElement("br"));
  newQuestionDiv.appendChild(document.createElement("br"));
  newQuestionDiv.appendChild(answer1Label);
  newQuestionDiv.appendChild(answer1Field);
  newQuestionDiv.appendChild(answer2Label);
  newQuestionDiv.appendChild(answer2Field);
  newQuestionDiv.appendChild(document.createElement("br"));
  newQuestionDiv.appendChild(document.createElement("br"));
  newQuestionDiv.appendChild(answer3Label);
  newQuestionDiv.appendChild(answer3Field);
  newQuestionDiv.appendChild(answer4Label);
  newQuestionDiv.appendChild(answer4Field);
  newQuestionDiv.appendChild(document.createElement("br"));
  newQuestionDiv.appendChild(document.createElement("br"));
  newQuestionDiv.appendChild(correctLabel);
  newQuestionDiv.appendChild(correctField);

  questionsDiv.appendChild(document.createElement("br")); //Creates a break between each question
  questionsDiv.appendChild(newQuestionDiv); //Adds the question div to the screen
}

//Called when user wants to exit quiz creator
function cancelQuiz() {
  if (confirm("Are you sure you want to exit? All work will be DELETED!")) {
    window.location.href = "../";
  }
}
