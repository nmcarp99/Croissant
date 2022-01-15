// initialize .env file
require("dotenv").config();

//Import dependencies
const path = require("path");
const http = require("http");
const express = require("express");
const socketIO = require("socket.io");

// set port to run webserver on
const port = 3000;

//Import classes
const { LiveGames } = require("./utils/liveGames");
const { Players } = require("./utils/players");

const publicPath = path.join(__dirname, "../public");
var app = express();
var server = http.createServer(app);
var io = socketIO(server);
var games = new LiveGames();
var players = new Players();

//Mongodb setup
const { MongoClient } = require("mongodb");
var mongoose = require("mongoose");
const url = process.env.MONGO_URL;
const client = new MongoClient(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

client.connect((err) => {
  if (err) throw err;
});

function doesGameExist(game_code) {
  return this.games.filter((game) => game.pin == game_code)[0];
}

function sendPlayerQuestionResults(game) {
  var playerList = players.getPlayers(game.hostId);
  
  var correctAnswers = game.quiz.questions[game.gameData.question - 1].correct;

  playerList.forEach((player) => {
    var status = "";
    
    var numCorrect = 0;
    
    var selectedAnswers = player.gameData.answer;

    if (selectedAnswers.length) {
      selectedAnswers.forEach((answer) => {
        if (correctAnswers.includes(answer.toString())) {
          numCorrect++;
        }
      });
    }

    if (numCorrect == 0) {
      status = 'incorrect';
    } else if (numCorrect != correctAnswers.length) {
      status = 'partialCorrect';
    } else {
      status = 'correct';
    }
    
    io.to(player.playerId).emit('questionOver', status);
  });
}

function sendQuestion(game, playerData) {
  if (game.quiz.questions.length >= game.gameData.question) {
    var questionNum = game.gameData.question;
    questionNum = questionNum - 1;
    var question = game.quiz.questions[questionNum].question;
    var answers = game.quiz.questions[questionNum].answers;
    var correctAnswer = game.quiz.questions[questionNum].correct;

    io.to(game.pin).emit("gameQuestions", {
      question: question,
      answers: answers,
      image: game.quiz.questions[questionNum].image,
      playersInGame: playerData.length,
      multipleChoice: game.quiz.questions[questionNum].correct.length != 1,
    });
  } else {
    var playersInGame = players.getPlayers(game.hostId);
    var first = { name: "", score: 0 };
    var second = { name: "", score: 0 };
    var third = { name: "", score: 0 };
    var fourth = { name: "", score: 0 };
    var fifth = { name: "", score: 0 };

    playersInGame.sort((a, b) => {
      if (a.gameData.score > b.gameData.score) {
        return -1;
      }
      return 1;
    });

    first.name = playersInGame[0] ? playersInGame[0].name : "";
    second.name = playersInGame[1] ? playersInGame[1].name : "";
    third.name = playersInGame[2] ? playersInGame[2].name : "";
    fourth.name = playersInGame[3] ? playersInGame[3].name : "";
    fifth.name = playersInGame[4] ? playersInGame[4].name : "";

    first.score = playersInGame[0] ? playersInGame[0].gameData.score : 0;
    second.score = playersInGame[1] ? playersInGame[1].gameData.score : 0;
    third.score = playersInGame[2] ? playersInGame[2].gameData.score : 0;
    fourth.score = playersInGame[3] ? playersInGame[3].gameData.score : 0;
    fifth.score = playersInGame[4] ? playersInGame[4].gameData.score : 0;

    io.to(game.pin).emit("GameOver", {
      num1: first,
      num2: second,
      num3: third,
      num4: fourth,
      num5: fifth,
    });
  }
}

app.use(express.static(publicPath));

app.get("/*", (req, res) => {
  res.status(404).send("<script>location.href='/404';</script>").end();
});

//Starting server
server.listen(port, () => {
  console.log("Server started on port " + port);
});

//When a connection to server is made from client
io.on("connection", (socket) => {
  socket.on("getGameQuestion", () => {
    var player = players.getPlayer(socket.id);

    if (!player) {
      console.log("Could not find player in getGameQuestion...");
      return;
    }

    var game = games.getGame(player.hostId);

    if (!game) {
      console.log("Could not get game in getGameQuestion");
      return;
    }

    socket.emit(
      "returnGameQuestion",
      game.quiz.questions[game.gameData.question - 1]
    );
  });

  socket.on("isValidCode", (code) => {
    var game = games.getGameByPin(parseInt(code));

    if (game == null || game == undefined) {
      socket.emit("invalidPin");
      return;
    } else {
      socket.emit("validCode");
    }
  });
  //When host connects for the first time
  socket.on("host-join", (data) => {
    //Check to see if id passed in url corresponds to id of kahoot game in database

    console.log(data.uid);

    var dbo = client.db("kahootDB");
    var query = { id: parseInt(data.id), owner: data.uid };
    dbo
      .collection("kahootGames")
      .find(query)
      .toArray(function (err, result) {
        if (err) throw err;

        //A kahoot was found await client.db("admin").command({ ping: 1 });with the id passed in url
        if (result[0] !== undefined) {
          var gamePin = Math.floor(Math.random() * 90000) + 10000; //new pin for game

          var game = games.addGame(gamePin, socket.id, false, {
            playersAnswered: 0,
            questionLive: false,
            gameid: data.id,
            question: 1,
          }); //Creates a game with pin and host id

          game.quiz = result[0];

          socket.join(parseInt(game.pin)); //The host is joining a room based on the pin

          // console.log('Game Created with pin:', game.pin);

          //Sending game pin to host so they can display it for players to join
          socket.emit("showGamePin", {
            pin: game.pin,
          });
        } else {
          socket.emit("noGameFound");
        }
      });
  });

  socket.on("remove-player", (data) => {
    var game = games.getGame(socket.id);

    if (!game) {
      console.log(
        "Player tried to remove another player... Request blocked successfully."
      );
      return;
    }

    var player = players.getPlayerByName(data.name, game.hostId);

    if (!player) {
      console.log("could not find player to remove...");
      return;
    }

    players.removePlayer(player.playerId);

    console.log(
      'removed player "' + player.name + '" from host "' + game.hostId + '"'
    );

    var playersInGame = players.getPlayers(game.hostId); //Getting all players in game

    console.log("Sending updatePlayerLobby to " + game.pin);
    io.to(player.playerId).emit("player-disconnect", data.name);
    io.to(parseInt(game.pin)).emit("updatePlayerLobby", playersInGame);
  });

  //When the host connects from the game view
  socket.on("host-join-game", (data) => {
    var oldHostId = data.id;
    var game = games.getGame(oldHostId); //Gets game with old host id
    if (game) {
      game.hostJoined = true;
      game.hostId = socket.id; //Changes the game host id to new host id
      socket.join(parseInt(game.pin));
      var playerData = players.getPlayers(oldHostId); //Gets player in game
      for (var i = 0; i < Object.keys(players.players).length; i++) {
        if (players.players[i].hostId == oldHostId) {
          players.players[i].hostId = socket.id;
        }
      }

      players.players.forEach((player) => {
        if (player.hostId == socket.id) {
          player.joining = true;
        }
      });

      sendQuestion(game, playerData);

      io.to(game.pin).emit("gameStartedPlayer");
      game.gameData.questionLive = true;
    } else {
      socket.emit("noGameFound"); //No game was found, redirect user
    }
  });

  //When player connects for the first time
  socket.on("player-join", (params) => {
    // console.log("Player attempting to join a game with pin of " + params.pin);

    var game = games.getGameByPin(parseInt(params.pin));

    if (!game || game == null) {
      // console.log("Attempted to join a nonexistent game... Threat has been neutralized.");
      socket.emit("noGameFound");
      return;
    }

    var hostId = game.hostId; //Get the id of host of game

    var failed = false;

    players.players.forEach((player) => {
      if (player.hostId != hostId) return;

      if (player.name == params.name) {
        socket.emit("nameExists");

        // console.log("PLAYER ALREADY EXISTS: " + params.name);
        // console.log("Threat neutralized.");

        failed = true;
      }
    });

    if (failed) return;

    players.addPlayer(hostId, socket.id, params.name, { score: 0, answer: 0 }); //add player to game

    socket.join(parseInt(params.pin)); //Player is joining room based on pin

    console.log("player" + socket.id + " is in rooms: ");

    var playersInGame = players.getPlayers(hostId); //Getting all players in game

    // console.log('Sending updatePlayerLobby to ' + params.pin);
    io.to(parseInt(params.pin)).emit("updatePlayerLobby", playersInGame);

    // check if game has already started
    if (game.gameLive) {
      io.to(game.pin).emit("gameStartedPlayer");
    }
  });

  //When the player connects from game view
  socket.on("player-join-game", (data) => {
    var player = players.getPlayer(data.socketId);
    if (player) {
      var game = games.getGame(player.hostId);
      socket.join(parseInt(game.pin));
      player.playerId = socket.id;

      var playersInGame = players.getPlayers(game.hostId); //Getting all players in game

      sendQuestion(game, playersInGame);
    } else {
      console.log("player tried to join nonexistant game...");
      socket.emit("noGameFound"); //No player found
    }
  });

  //When a host or player leaves the site
  socket.on("disconnect", () => {
    var game = games.getGame(socket.id); //Finding game with socket.id
    //If a game hosted by that id is found, the socket disconnected is a host
    if (game) {
      //Checking to see if host was disconnected or was sent to game view
      if (game.hostJoined == true || game.gameLive == false) {
        games.removeGame(socket.id); //Remove the game from games class
        console.log("Game ended with pin:", game.pin);

        var playersToRemove = players.getPlayers(game.hostId); //Getting all players in the game

        //For each player in the game
        for (var i = 0; i < playersToRemove.length; i++) {
          players.removePlayer(playersToRemove[i].playerId); //Removing each player from player class
        }

        io.to(game.pin).emit("hostDisconnect"); //Send player back to 'join' screen
        socket.leave(game.pin); //Socket is leaving room
      }
    } else {
      //No game has been found, so it is a player socket that has disconnected
      var player = players.getPlayer(socket.id); //Getting player with socket.id
      //If a player has been found with that id
      if (player) {
        if (player.joining) {
          player.joining = false;
          return;
        }

        var hostId = player.hostId; //Gets id of host of the game
        var game = games.getGame(hostId); //Gets game data with hostId

        if (!game || game == null) {
          console.log("Game not found...");
          socket.emit("noGameFound");
          return;
        }

        var pin = game.pin; //Gets the pin of the game

        if (game.gameLive == false) {
          players.removePlayer(socket.id); //Removes player from players class
          var playersInGame = players.getPlayers(hostId); //Gets remaining players in game

          io.to(pin).emit("updatePlayerLobby", playersInGame); //Sends data to host to update screen
          socket.leave(pin);
        }
      }
    }
  });

  //Sets data in player class to answer from player
  socket.on("playerAnswer", (playerAnswers) => {
    // >>> CHECK IF PLAYER HAS ALREADY ANSWERED

    var player = players.getPlayer(socket.id);

    if (!player) {
      console.log("could not find player in playeranswer");
      return;
    }

    var hostId = player.hostId;
    var playerNum = players.getPlayers(hostId);
    var game = games.getGame(hostId);

    if (!game) {
      console.log("could not find game in playeranswer");
      return;
    }

    if (game.gameData.questionLive == true) {
      //if the question is still live
      player.gameData.answer = playerAnswers;
      game.gameData.playersAnswered += 1;

      var gameQuestion = game.gameData.question;
      var gameid = game.gameData.gameid;
      var correctAnswers = game.quiz.questions[gameQuestion - 1].correct;

      //Checks player answer with correct answer

      var numCorrect = 0;

      playerAnswers.forEach((answer) => {
        game.selectedAnswers[answer]++;
        if (correctAnswers.includes(answer.toString())) {
          numCorrect++;
        }
      });

      if (numCorrect != 0) {
        io.to(game.pin).emit("getTime", socket.id);
        player.gameData.score += 100 * numCorrect;
      }

      //Checks if all players answered
      if (game.gameData.playersAnswered == playerNum.length) {
        game.gameData.questionLive = false; //Question has been ended bc players all answered under time
        io.to(game.hostId).emit(
          "questionOver",
          game.selectedAnswers,
          game.quiz.questions[game.gameData.question - 1].answers
        ); //Tell everyone that question is over
        sendPlayerQuestionResults(game);
        game.selectedAnswers = { 1: 0, 2: 0, 3: 0, 4: 0 };
      } else {
        //update host screen of num players answered
        io.to(game.pin).emit("updatePlayersAnswered", {
          playersInGame: playerNum.length,
          playersAnswered: game.gameData.playersAnswered,
        });
      }
    }
  });

  socket.on("getScore", () => {
    var player = players.getPlayer(socket.id);
    socket.emit("newScore", player.gameData.score);
  });

  socket.on("time", function (data) {
    var time = data.time / 20;
    time = time * 100;
    var playerid = data.player;
    var player = players.getPlayer(playerid);
    player.gameData.score += time;
  });

  socket.on("timeUp", () => {
    var game = games.getGame(socket.id);
    game.gameData.questionLive = false;
    io.to(game.hostId).emit(
      "questionOver",
      game.selectedAnswers,
      game.quiz.questions[game.gameData.question - 1].answers
    ); //Tell everyone that question is over
    sendPlayerQuestionResults(game);
    game.selectedAnswers = { 1: 0, 2: 0, 3: 0, 4: 0 };
  });

  socket.on("nextQuestion", function () {
    var playerData = players.getPlayers(socket.id);
    //Reset players current answer to 0
    for (var i = 0; i < Object.keys(players.players).length; i++) {
      if (players.players[i].hostId == socket.id) {
        players.players[i].gameData.answer = 0;
      }
    }

    var game = games.getGame(socket.id);
    game.gameData.playersAnswered = 0;
    game.gameData.questionLive = true;
    game.gameData.question += 1;

    sendQuestion(game, playerData);
  });

  socket.on("openShop", () => {
    var game = games.getGame(socket.id);

    if (!game) {
      console.log("Player tried to open shop... Declined.");
      return;
    }

    io.to(game.pin).emit("openShopPlayer");
  });

  //When the host starts the game
  socket.on("startGame", () => {
    var game = games.getGame(socket.id); //Get the game based on socket.id

    if (!game) return;
    if (players.getPlayers(socket.id) == {}) return;

    game.gameLive = true;
    socket.emit("gameStarted", game.hostId); //Tell player and host that game has started
  });

  //Give user game names data
  socket.on("requestDbNames", (data) => {
    var id = data;
    var dbo = client.db("kahootDB");

    const result = dbo
      .collection("kahootGames")
      .find({ owner: id })
      .toArray(function (err, res) {
        if (err) throw err;
        socket.emit("gameNamesData", res);
        return;
      });
  });

  socket.on("getQuiz", (data) => {
    (async () => {
      var dbo = client.db("kahootDB");

      const result = await dbo
        .collection("kahootGames")
        .find({ owner: data.uid, id: data.id })
        .toArray();

      if (result.length == 0) {
        socket.emit("noGameFound");
      } else {
        socket.emit("returnQuiz", result[0]);
      }
    })();
  });

  socket.on("newQuiz", (owner) => {
    (async () => {
      var dbo = client.db("kahootDB");

      var documents = await dbo.collection("kahootGames").find().toArray();

      var newId = 1;

      if (documents.length > 0) {
        newId = documents[documents.length - 1].id + 1;
      }

      dbo.collection("kahootGames").insertOne(
        {
          name: "",
          questions: [
            {
              question: "",
              answers: ["", "", "", ""],
              correct: [],
              image: "",
            },
          ],
          id: newId,
          owner: owner,
        },
        (err, res) => {
          if (err) throw err;

          socket.emit("createdQuiz", newId);
        }
      );
    })();
  });

  socket.on("deleteQuiz", (data) => {
    //id, owner

    var dbo = client.db("kahootDB");

    dbo.collection("kahootGames").deleteOne({
      id: data.id,
      owner: data.owner,
    });
  });

  socket.on("updateQuiz", (data) => {
    var dbo = client.db("kahootDB");

    dbo.collection("kahootGames").updateOne(
      { id: data.id, owner: data.owner },
      {
        $set: data.quiz,
      }
    );

    socket.emit("quizUpdated");
  });
});
