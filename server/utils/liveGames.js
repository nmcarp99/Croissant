class LiveGames {
    constructor () {
        this.games = [];
    }
    addGame(pin, hostId, gameLive, gameData){
        var game = {pin, hostId, gameLive, gameData, joining: false, selectedAnswers: {1:0, 2:0, 3:0, 4:0} };
        this.games.push(game);
        return game;
    }
    removeGame(hostId){
        var game = this.getGame(hostId);
        
        if(game){
            this.games = this.games.filter((game) => game.hostId !== hostId);
        }
        return game;
    }
    getGame(hostId){
        return this.games.filter((game) => game.hostId === hostId)[0];
    }
    getGameByPin(pin) {
      return this.games.filter((game)=> game.pin == pin)[0];
    }
}

module.exports = {LiveGames};