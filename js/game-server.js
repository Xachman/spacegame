var gameServer  = module.exports = { games : {}, gameCount:0 };
var UUID        = require('node-uuid');
var verbose     = true;

require('./game-master.js');
gameServer.inputs = [];
gameServer.players = [];
gameServer.clientState = {};
gameServer.clientState.players = [];
gameServer.createGame = function(player) {
  var thegame = {
    id: UUID(),
    player_host:player,
    player_client:null,
    player_count:1
  }

  this.games[thegame.id] = thegame;

  this.gameCount++;

  thegame.gameMaster = new GameMaster(thegame);

}
gameServer.findGame = function(player) {
//  console.log(player);
  if(this.gameCount > 0) {
    var joinedGame = false;
  //  console.log('games: '+this.games);
    for (var gameid in this.games) {
      if(this.games[gameid].player_count < 2) {
//console.log('joined');
        joinedGame = true;
        this.joinGame(gameid, player);
      }
    }

    if(!joinedGame) {
      this.createGame(player);
    }
  }else{
    this.createGame(player);
  }
};

gameServer.update  = function() {
  setTimeout(this.update.bind(this), 100);
  if(this.inputs.length > 0) {
    for(var i = 0; i < this.inputs.length; i ++) {
      input = this.inputs[i];
    //  console.log('id: '+input.id+', key: '+input.key+', timestamp: '+input.timestamp);
      this.processPhysics(input.id, input.key);
    }
    this.inputs = [];
  }
//  console.log('update');
};

gameServer.processMessage = function(data) {
  var commands  = data.split('.');
  var command   = commands[0];
  var type      = commands[1];
  switch(command) {
    case 'c':
      switch(type) {
        case 'i':
          this.addInputPool(commands[2], commands[3], commands[4]);
          break;
      }
      break;
  }
};

gameServer.addInputPool = function(id, key, timestamp) {
  var inputs = this.inputs;
  inputs.push({id: id, key: key, timestamp: timestamp});
}

gameServer.playerJoin =  function(player){
  player.clientState = {};
  player.clientState.x = Math.floor((Math.random() * 350) + 1);
  player.clientState.y = Math.floor((Math.random() * 350) + 1);
  player.clientState.id = player.userid;
//  console.log(player);
//  var clientPlayer = {x: player.x, y: player.y, id:player.userid};
    this.players.push(player);
  //  this.addClientPlayer(clientPlayer);
    this.updatedPlayers();
  //  console.log(this.players);

};

gameServer.updatePosition = function(x, y, playerid) {
  //var player =  this.findPlayer(playerid);
  //console.log(player.x);
  // player.x = x;
  // player.y = y;
  //this.updateClientState();
  this.updatedPlayers();
}
gameServer.updatedPlayers = function() {
  var players =  this.players;
  for (var i = 0; i < players.length; i++) {
    var player = players[i];
  //  console.log('sending');
    player.send('s.pu.'+JSON.stringify(this.getClientPlayers()));
  }
}
gameServer.processPhysics = function(userid, key) {
  //console.log(e.keyCode);
  var upArrow = 38;
  var leftArrow = 37;
  var rightArrow = 39;
  var downArrow = 40;
  var spaceBar = 32;
  var player = this.findPlayer(userid);
  player = player.clientState;
console.log('processning phys: '+key);
  switch(parseInt(key)) {
    case upArrow:
    //  console.log('processning up arrow');
      this.updatePosition(player.x, player.y--, player.userid);
      break;
    case leftArrow:
      this.updatePosition(player.x-- , player.y, player.userid);
      break;
    case rightArrow:
      this.updatePosition(player.x++, player.y , player.userid);
      break;
    case downArrow:
      this.updatePosition(player.x, player.y++ , player.userid);
      break;
    case spaceBar:
      break;
  }
}

gameServer.findPlayer = function(id) {
  var players =  this.players;
  for (var i = 0; i < players.length; i++) {
    var player = players[i];
    if(player.userid === id) {
      return player;
    }
  }
}

gameServer.addClientPlayer = function(player) {
  this.clientState.players.push(player);
}
gameServer.getClientPlayers = function() {
  var returnVal = [];
  var players =  this.players;
  for(var i = 0; i < players.length; i ++) {
    returnVal.push(players[i].clientState);
  }
  return returnVal;
}
gameServer.removePlayerById = function(id) {
  var players =  this.players;
  for (var i = 0; i < players.length; i++) {
    var player = players[i];
    if(player.userid === id) {
      players.splice(i,1);
      //this.removeClientPlayerById(id);
      this.updatedPlayers();
      return;
    }
  }
}
