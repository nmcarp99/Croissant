//Import dependencies
const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');

// set port to run webserver on
const port = 3849;

//Import classes
const { LiveGames } = require('./utils/liveGames');
const { Players } = require('./utils/players');

const publicPath = path.join(__dirname, '../public');
var app = express();
var server = http.createServer(app);
var io = socketIO(server);
var games = new LiveGames();
var players = new Players();

//Mongodb setup
const { MongoClient } = require('mongodb');
var mongoose = require('mongoose');
const url = "mongodb+srv://admin:testing123testing@cluster0.avuwn.mongodb.net/ProjektSpark?retryWrites=true&w=majority";
const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect(err => {
  if (err) throw err;
});

function doesGameExist(game_code) {
    return this.games.filter((game) => game.hostId === hostId)[0]
}


app.use(express.static(publicPath));

//Starting server
server.listen(port, () => {
  console.log("Server started on port " + port);
});

//When a connection to server is made from client
io.on('connection', (socket) => {
  
  socket.on('isValidCode', code => {

    var game = games.getGameByPin(parseInt(code));

    if (game == null || game == undefined) {
      socket.emit('invalidPin');
      console.log("Invalid Pin");
      return;
    }
    else {
      socket.emit('validCode');
    }
  });
  //When host connects for the first time
  socket.on('host-join', (data) => {

    //Check to see if id passed in url corresponds to id of kahoot game in database

    var dbo = client.db("kahootDB");
    var query = { id: parseInt(data.id) };
    dbo.collection('kahootGames').find(query).toArray(function(err, result) {
      if (err) throw err;

      //A kahoot was found await client.db("admin").command({ ping: 1 });with the id passed in url
      if (result[0] !== undefined) {
        var gamePin = Math.floor(Math.random() * 90000) + 10000; //new pin for game

        games.addGame(gamePin, socket.id, false, { playersAnswered: 0, questionLive: false, gameid: data.id, question: 1 }); //Creates a game with pin and host id

        var game = games.getGame(socket.id); //Gets the game data

        socket.join(parseInt(game.pin));//The host is joining a room based on the pin

        console.log("Host is in rooms: ");
        console.log(socket.rooms);

        console.log('Game Created with pin:', game.pin);

        //Sending game pin to host so they can display it for players to join
        socket.emit('showGamePin', {
          pin: game.pin
        });
      } else {
        socket.emit('noGameFound');
      }
    });
  });

  //When the host connects from the game view
  socket.on('host-join-game', (data) => {
    var oldHostId = data.id;
    var game = games.getGame(oldHostId);//Gets game with old host id
    if (game) {
      game.hostId = socket.id;//Changes the game host id to new host id
      socket.join(parseInt(game.pin));
      var playerData = players.getPlayers(oldHostId);//Gets player in game
      for (var i = 0; i < Object.keys(players.players).length; i++) {
        if (players.players[i].hostId == oldHostId) {
          players.players[i].hostId = socket.id;
        }
      }
      var gameid = game.gameData['gameid'];

      var dbo = client.db('kahootDB');
      var query = { id: parseInt(gameid) };
      dbo.collection("kahootGames").find(query).toArray(function(err, res) {
        if (err) throw err;

        var question = res[0].questions[0].question;
        var answer1 = res[0].questions[0].answers[0];
        var answer2 = res[0].questions[0].answers[1];
        var answer3 = res[0].questions[0].answers[2];
        var answer4 = res[0].questions[0].answers[3];
        var correctAnswer = res[0].questions[0].correct;

        socket.emit('gameQuestions', {
          q1: question,
          a1: answer1,
          a2: answer2,
          a3: answer3,
          a4: answer4,
          correct: correctAnswer,
          playersInGame: playerData.length
        });
      });

      players.players.forEach(player => {
        if (player.hostId == socket.id) {
          player.joining = true;
        }
      });

      io.to(game.pin).emit('gameStartedPlayer');
      game.gameData.questionLive = true;
    } else {
      socket.emit('noGameFound');//No game was found, redirect user
    }
  });

  //When player connects for the first time
  socket.on('player-join', (params) => {
    // MAKE SURE TO CHECK THAT THERE IS NOT A DUPLICATE-NAME IN GAME >>>

    console.log("Player attempting to join a game with pin of " + params.pin);

    var game = games.getGameByPin(parseInt(params.pin));
    
    if (!game || game == null) {
      console.log("Attempted to join a nonexistent game... Threat has been neutralized.");
      socket.emit("noGameFound");
      return;
    }

    var hostId = game.hostId; //Get the id of host of game

    players.addPlayer(hostId, socket.id, params.name, { score: 0, answer: 0 }); //add player to game

    socket.join(parseInt(params.pin)); //Player is joining room based on pin

    console.log("player" + socket.id + " is in rooms: ");

    var playersInGame = players.getPlayers(hostId); //Getting all players in game
    
    console.log('Sending updatePlayerLobby to ' + params.pin);
    io.to(parseInt(params.pin)).emit("updatePlayerLobby", playersInGame);

    // check if game has already started
    if (game.gameLive) {
      io.to(game.pin).emit('gameStartedPlayer');
    }
  });

  //When the player connects from game view
  socket.on('player-join-game', (data) => {
    var player = players.getPlayer(data.socketId);
    if (player) {
      var game = games.getGame(player.hostId);
      socket.join(parseInt(game.pin));
      player.playerId = socket.id;

      var playerData = players.getPlayers(game.hostId);
      socket.emit('playerGameData', playerData);
    } else {
      console.log('hmmmmm');
      socket.emit('noGameFound');//No player found
    }
  });

  //When a host or player leaves the site
  socket.on('disconnect', () => {
    var game = games.getGame(socket.id); //Finding game with socket.id
    //If a game hosted by that id is found, the socket disconnected is a host
    if (game) {
      //Checking to see if host was disconnected or was sent to game view
      if (game.gameLive == false) {
        games.removeGame(socket.id);//Remove the game from games class
        console.log('Game ended with pin:', game.pin);

        var playersToRemove = players.getPlayers(game.hostId); //Getting all players in the game

        //For each player in the game
        for (var i = 0; i < playersToRemove.length; i++) {
          players.removePlayer(playersToRemove[i].playerId); //Removing each player from player class
        }

        io.to(game.pin).emit('hostDisconnect'); //Send player back to 'join' screen
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

        var hostId = player.hostId;//Gets id of host of the game
        var game = games.getGame(hostId);//Gets game data with hostId

        if (!game || game == null) {
          console.log("Game not found...");
          socket.emit("noGameFound");
          return;
        }

        var pin = game.pin;//Gets the pin of the game

        if (game.gameLive == false) {
          players.removePlayer(socket.id);//Removes player from players class
          var playersInGame = players.getPlayers(hostId);//Gets remaining players in game

          io.to(pin).emit('updatePlayerLobby', playersInGame);//Sends data to host to update screen
          socket.leave(pin);
        }
      }
    }

  });

  //Sets data in player class to answer from player
  socket.on('playerAnswer', function(num) {
    var player = players.getPlayer(socket.id);
    var hostId = player.hostId;
    var playerNum = players.getPlayers(hostId);
    var game = games.getGame(hostId);
    if (game.gameData.questionLive == true) {//if the question is still live
      player.gameData.answer = num;
      game.gameData.playersAnswered += 1;

      var gameQuestion = game.gameData.question;
      var gameid = game.gameData.gameid;

      var dbo = client.db('kahootDB');
      var query = { id: parseInt(gameid) };
      dbo.collection("kahootGames").find(query).toArray(function(err, res) {
        if (err) throw err;
        var correctAnswer = res[0].questions[gameQuestion - 1].correct;
        //Checks player answer with correct answer
        if (num == correctAnswer) {
          player.gameData.score += 100;
          io.to(game.pin).emit('getTime', socket.id);
          socket.emit('answerResult', true);
        }

        //Checks if all players answered
        if (game.gameData.playersAnswered == playerNum.length) {
          game.gameData.questionLive = false; //Question has been ended bc players all answered under time
          var playerData = players.getPlayers(game.hostId);
          io.to(game.pin).emit('questionOver', playerData, correctAnswer);//Tell everyone that question is over
        } else {
          //update host screen of num players answered
          io.to(game.pin).emit('updatePlayersAnswered', {
            playersInGame: playerNum.length,
            playersAnswered: game.gameData.playersAnswered
          });
        }
      });
    }
  });

  socket.on('getScore', function() {
    var player = players.getPlayer(socket.id);
    socket.emit('newScore', player.gameData.score);
  });

  socket.on('time', function(data) {
    var time = data.time / 20;
    time = time * 100;
    var playerid = data.player;
    var player = players.getPlayer(playerid);
    player.gameData.score += time;
  });



  socket.on('timeUp', function() {
    var game = games.getGame(socket.id);
    game.gameData.questionLive = false;
    var playerData = players.getPlayers(game.hostId);

    var gameQuestion = game.gameData.question;
    var gameid = game.gameData.gameid;

    var dbo = client.db('kahootDB');
    var query = { id: parseInt(gameid) };
    dbo.collection("kahootGames").find(query).toArray(function(err, res) {
      if (err) throw err;
      var correctAnswer = res[0].questions[gameQuestion - 1].correct;
      io.to(game.pin).emit('questionOver', playerData, correctAnswer);
    });
  });

  socket.on('nextQuestion', function() {
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
    var gameid = game.gameData.gameid;

    var dbo = client.db('kahootDB');
    var query = { id: parseInt(gameid) };
    dbo.collection("kahootGames").find(query).toArray(function(err, res) {
      if (err) throw err;

      if (res[0].questions.length >= game.gameData.question) {
        var questionNum = game.gameData.question;
        questionNum = questionNum - 1;
        var question = res[0].questions[questionNum].question;
        var answer1 = res[0].questions[questionNum].answers[0];
        var answer2 = res[0].questions[questionNum].answers[1];
        var answer3 = res[0].questions[questionNum].answers[2];
        var answer4 = res[0].questions[questionNum].answers[3];
        var correctAnswer = res[0].questions[questionNum].correct;

        socket.emit('gameQuestions', {
          q1: question,
          a1: answer1,
          a2: answer2,
          a3: answer3,
          a4: answer4,
          correct: correctAnswer,
          playersInGame: playerData.length
        });
      } else {
        var playersInGame = players.getPlayers(game.hostId);
        var first = { name: "", score: 0 };
        var second = { name: "", score: 0 };
        var third = { name: "", score: 0 };
        var fourth = { name: "", score: 0 };
        var fifth = { name: "", score: 0 };

        playersInGame.sort((a, b) => {
          if (a.gameData.score > b.gamedata.score) {
            return -1;
          }
          return 1;
        });

        first.name = (playersInGame[0] ? playersInGame[0].name : "");
        second.name = (playersInGame[1] ? playersInGame[1].name : "");
        third.name = (playersInGame[2] ? playersInGame[2].name : "");
        fourth.name = (playersInGame[3] ? playersInGame[3].name : "");
        fifth.name = (playersInGame[4] ? playersInGame[4].name : "");

        first.score = (playersInGame[0] ? playersInGame[0].gameData.score : 0);
        second.score = (playersInGame[1] ? playersInGame[1].gameData.score : 0);
        third.score = (playersInGame[2] ? playersInGame[2].gameData.score : 0);
        fourth.score = (playersInGame[3] ? playersInGame[3].gameData.score : 0);
        fifth.score = (playersInGame[4] ? playersInGame[4].gameData.score : 0);

        /*for (var i = 0; i < playersInGame.length; i++) {
          console.log(playersInGame[i].gameData.score);
          if (playersInGame[i].gameData.score > fifth.score) {
            if (playersInGame[i].gameData.score > fourth.score) {
              if (playersInGame[i].gameData.score > third.score) {
                if (playersInGame[i].gameData.score > second.score) {
                  if (playersInGame[i].gameData.score > first.score) {
                    //First Place
                    fifth.name = fourth.name;
                    fifth.score = fourth.score;

                    fourth.name = third.name;
                    fourth.score = third.score;

                    third.name = second.name;
                    third.score = second.score;

                    second.name = first.name;
                    second.score = first.score;

                    first.name = playersInGame[i].name;
                    first.score = playersInGame[i].gameData.score;
                  } else {
                    //Second Place
                    fifth.name = fourth.name;
                    fifth.score = fourth.score;

                    fourth.name = third.name;
                    fourth.score = third.score;

                    third.name = second.name;
                    third.score = second.score;

                    second.name = playersInGame[i].name;
                    second.score = playersInGame[i].gameData.score;
                  }
                } else {
                  //Third Place
                  fifth.name = fourth.name;
                  fifth.score = fourth.score;

                  fourth.name = third.name;
                  fourth.score = third.score;

                  third.name = playersInGame[i].name;
                  third.score = playersInGame[i].gameData.score;
                }
              } else {
                //Fourth Place
                fifth.name = fourth.name;
                fifth.score = fourth.score;

                fourth.name = playersInGame[i].name;
                fourth.score = playersInGame[i].gameData.score;
              }
            } else {
              //Fifth Place
              fifth.name = playersInGame[i].name;
              fifth.score = playersInGame[i].gameData.score;
            }
          }
        }*/

        io.to(game.pin).emit('GameOver', {
          num1: first.name,
          num2: second.name,
          num3: third.name,
          num4: fourth.name,
          num5: fifth.name
        });
      }
    });

    io.to(game.pin).emit('nextQuestionPlayer');
  });

  //When the host starts the game
  socket.on('startGame', () => {
    var game = games.getGame(socket.id);//Get the game based on socket.id

    if (!game) return;

    game.gameLive = true;
    socket.emit('gameStarted', game.hostId);//Tell player and host that game has started
  });

  //Give user game names data
  socket.on('requestDbNames', function() {
    var dbo = client.db('kahootDB');
    dbo.collection("kahootGames").find().toArray(function(err, res) {
      if (err) throw err;
      socket.emit('gameNamesData', res);
    });


  });


  socket.on('newQuiz', data => {
    console.log("newquiz callback");
    var dbo = client.db('kahootDB');
    dbo.collection('kahootGames').find().toArray(function(err, result) {
      if (err) throw err;
      var num = Object.keys(result).length;
      if (num == 0) {
        data.id = 1
        num = 1
      } else {
        data.id = result[num - 1].id + 1;
      }
      var game = data;
      dbo.collection("kahootGames").insertOne(game, function(err, res) {
        if (err) throw err;
      });

      socket.emit('startGameFromCreator', num);
    });
  });
});
