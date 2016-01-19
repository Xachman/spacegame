var UUID = require('node-uuid');
var messages = require('./message-processes.js');
var gameServer = {};

gameServer = Object.assign(gameServer, messages);

gameServer.players = [];

gameServer.games = [];
gameServer.clientState = {};
gameServer.clientState.players = [];
gameServer.pingPlayersTime = 0;
// gameServer.playerAtts = {
//   speed: 50,
//   inputs: []
// };
gameServer.createGame = function (name, uid) {
    var player = this.findPlayer(uid);
    if(player.joinedGame){
        player.send('s.ng.'+'{"message":"You already made a game."}');
        return;
    }
    var game = {
        id: UUID(),
        name: name,
        players: [],
        started: false
    }
    game.players.push(uid);
    this.addGame(game);
   // console.log(this.games);
    this.gameCount++;
    player.send('s.ng.'+'{"message":"'+name+' was created"}');
    this.updateGames();
    player.atts.joinedGame = true;
    this.updatePlayerInfo(player);
}
gameServer.joinGame = function(playerid, gameid) {
    var player = this.findPlayer(playerid);
    var game = this.findGame(gameid);
    game.players.push(player);
    player.joinedGame = true;
    this.updatePlayerInfo(player);
}
gameServer.findGame = function(gameid) {
    var games = this.games;
    for(var i = 0; i < games.length; i++) {
        var game = games[i];
        if(gameid === game.id) {
            return game;
        }
    }
    return false;
}
gameServer.updateGames = function() {
    var players = this.players;
    for(var i = 0; i < players.length; i++) {
        var player = players[i];
        player.send('s.gu.'+JSON.stringify(this.games));
    }
}

gameServer.sendGames = function(player) {
    player.send('s.gu.'+JSON.stringify(this.games));
}

gameServer.addGame = function(game) {
    this.games.push(game);
}
gameServer.checkGames = function() {
    var games = this.games;
     
    for(var index = 0; index < games.length; index++){
        var game = games[index];
        //if game has no players remove
        //console.log(games.length)
        var hasPlayers = false;
         //console.log(game.toString())
        for(var i = 0; i < game.players.length; i++ ){
            var playerid = game.players[i];
            var player = this.findPlayer(playerid);
           // console.log(player);
            if(player !== false){
                hasPlayers = true;
                break;
            }
        }
        if(!hasPlayers) {
            this.removeGame(index);
            this.updateGames();
        }
    }
}

gameServer.removeGame = function(i) {
    this.games.splice(i,1);
}

gameServer.findPlayer = function (id) {
    var players = this.players;
    for (var i = 0; i < players.length; i++) {
        var player = players[i];
        if (player.userid === id) {
            return player;
        }
    }
    return false;
}

gameServer.playerJoin = function(player) {
    player.atts = { joinedGame: false};
    this.players.push(player);
    this.updatePlayerInfo(player);
    this.sendGames(player);
}

gameServer.updatePlayerInfo = function(player) {
    output = {self:player.atts};
    player.send('s.pu.' + JSON.stringify(output));
}

gameServer.removePlayerById = function (id) {
    var players = this.players;
    for (var i = 0; i < players.length; i++) {
        var player = players[i];
        if (player.userid === id) {
            players.splice(i, 1);
            //this.removeClientPlayerById(id);
            return;
        }
    }
}

module.exports = gameServer;
