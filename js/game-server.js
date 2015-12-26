var gameServer  = module.exports = { games : {}, gameCount:0 };
var UUID        = require('node-uuid');
var verbose     = true;

require('./game-master.js');
gameServer.board = {
  width: 600,
  height: 600
};
gameServer.inputs = [];
gameServer.players = [];
gameServer.bullets = [];
gameServer.clientState = {};
gameServer.clientState.players = [];
// gameServer.playerAtts = {
//   speed: 50,
//   inputs: []
// };
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
gameServer.time;
gameServer.update  = function() {
  setTimeout(this.update.bind(this), 100);
  this.updatedPlayers();
};

gameServer.processMessage = function(data) {
  data += '.'+Date.now();
  var commands  = data.split('.');
  var command   = commands[0];
  var type      = commands[1];
  switch(command) {
    case 'c':
      switch(type) {
        case 'i':
          this.processInput(commands[2], commands[3], commands[4], commands[5]);
        break;
        case 'm':
            this.processMouseInput(commands[2], commands[3], commands[4], commands[5], commands[6], commands[7]);
        break;
      }
      break;
  }
};
gameServer.processMouseInput = function(id, mouse, condition, x, y, timestamp){
  var bullet = this.findBullet(id);
  if(bullet && bullet.condition === 1){
    bullet.x = parseFloat(x);
    bullet.y = parseFloat(y);
    bullet.condition = 0;
    bullet.timestamp = timestamp - bullet.timestamp;
  }else {
    //console.log(parseFloat(y) );
    //console.log(parseFloat(x) );
    this.bullets.push({id: id, mouse: mouse, condition: parseInt(condition), x:parseFloat(x), y:parseFloat(y), timestamp: timestamp});
  }
}
gameServer.processBullets = function() {
  var bullets =  this.bullets;
  for (var i = 0; i < bullets.length; i++) {
    var bullet = bullets[i];
    if(bullet.condition === 0) {
      console.log('bullet fired');
      bullet.condition = 'fired';
      var player = this.findPlayer(bullet.id);
      var x = bullet.x - (player.clientState.x);
      var y = bullet.y - (player.clientState.y);
      bullet.x =  player.clientState.x;
      bullet.y =  player.clientState.y;
      bullet.angle = Math.atan2(y, x);

      bullet.vx = Math.cos(bullet.angle) * 20;
     //console.log(bullet.vx );
      bullet.vy = Math.sin(bullet.angle) * 20;
     //console.log(bullet.vy );
    }else if(bullet.condition === 'fired') {

      bullet.x += bullet.vx;
      bullet.y += bullet.vy;
      console.log('x: '+bullet.y );
      console.log('y: '+bullet.y );
      if(bullet.x < 0 || bullet.x > this.board.width) {
        bullets.splice(i, 1);
      }
      if(bullet.y < 0 || bullet.y > this.board.height) {
        bullets.splice(i, 1);
      }
    }
  }
}
gameServer.findBullet = function(id) {
  var bullets =  this.bullets;
  for (var i = 0; i < bullets.length; i++) {
    var bullet = bullets[i];
    if(bullet.id === id) {
      return bullet;
    }
  }
  return false;
}

gameServer.processInput = function(id, key, condition, timestamp){
  console.log(key);
  var player = this.findPlayer(id);
  con = parseInt(condition);
  if(con === 1 && this.checkKey(player, key)) {
//  console.log(player.userid);
  player.atts.inputs.push({key: key, timestamp: timestamp});
  //    console.log(player.atts.inputs);
  }else if(con === 0){
  //  this.processPhysics(id, key);
    this.clearInput(player, key);
  }
};
gameServer.processInputs = function() {
  var players = this.players;
  for(var i = 0; i < players.length; i++) {
    var player = players[i];
    var inputs = player.atts.inputs;
  //  console.log(player.userid);
  //  console.log(inputs);
    for(var x = 0; x < inputs.length; x++) {
      //console.log(inputs[x]);
      this.processPhysics(player.userid, inputs[x].key);
    }
  }
}
gameServer.checkKey = function(player ,key) {
  var inputs = player.atts.inputs;
  for(var i = 0; i < inputs.length; i ++) {
    if(inputs[i].key === key) {
      return false;
    }
  }
  return true;
}
gameServer.addInputPool = function(id, key, condition, timestamp) {
  var inputs = this.inputs;
  inputs.push({id: id, key: key, condition: parseInt(condition), timestamp: timestamp});
}
gameServer.findInput = function(id, key) {
  var player = this.findPlayer(id);
  var inputs = player.atts.inputs;
  for(var i = 0; i < inputs.length; i++) {
    if(inputs[i].key === key) {
      return inputs[i];
    }
  }
}
gameServer.clearInput = function(player, key) {
  var inputs = player.atts.inputs;
  for(var i = 0; i < inputs.length; i++) {
    if(inputs[i].key === key) {
      //console.log('input cleared');
      inputs.splice(i,1);
      return;
    }
  }
}
gameServer.playerJoin =  function(player){
  player.clientState = {};
  player.clientState.x = Math.floor((Math.random() * 350) + 1);
  player.clientState.y = Math.floor((Math.random() * 350) + 1);
  player.clientState.id = player.userid;
  player.atts = {
    speed: 50,
    inputs: []
  }
//  console.log(player);
//  var clientPlayer = {x: player.x, y: player.y, id:player.userid};
    this.players.push(player);
  //  this.addClientPlayer(clientPlayer);
    this.updatedPlayers();
  //  console.log(this.players);

};

// gameServer.updatePosition = function(x, y, playerid) {
//   this.updatedPlayers();
// }
gameServer.updatedPlayers = function() {
  this.processInputs();
  this.processBullets();
  var players =  this.players;
  var output = {
    players: this.getClientPlayers(),
    bullets: this.getFiredBullets()
  }
  for (var i = 0; i < players.length; i++) {
    var player = players[i];
  //  console.log('sending');
      player.send('s.pu.'+JSON.stringify(output));
  }
}
gameServer.getFiredBullets = function() {
  var bullets = this.bullets;
  var returnVal = [];
  for (var i = 0; i < bullets.length; i++){
    var bullet = bullets[i];
    if (bullet.condition === 'fired') {
      returnVal.push(bullet);
    }
  }
  return returnVal;
}

gameServer.processPhysics = function(userid, key) {
  //console.log(e.keyCode);
  var upArrow = 38;
  var leftArrow = 37;
  var rightArrow = 39;
  var downArrow = 40;
  var spaceBar = 32;
  var player = this.findPlayer(userid);
  var input = this.findInput(userid, key);
  var dif =  Date.now() - input.timestamp;
//  console.log(dif);
  var speed = player.atts.speed;
  //console.log(player.userid);
  input.timestamp = Date.now();
  player = player.clientState;
  //  console.log('processing phys: '+key);
    switch(parseInt(key)) {
      case upArrow:
      //  console.log('processning up arrow');
        var calc = (player.y - (speed * (dif / 1000)))
        player.y = calc;
      //  console.log(calc);
      //  this.updatePosition(player.x, calc, player.userid);
        break;
      case leftArrow:
        var calc = (player.x - (speed * (dif / 1000)))
        player.x = calc;
      //  this.updatePosition(calc, player.y, player.userid);
        break;
      case rightArrow:
        var calc = (player.x + (speed * (dif / 1000)))
        player.x = calc;
      //  this.updatePosition(calc, player.y , player.userid);
        break;
      case downArrow:
        var calc = (player.y + (speed * (dif / 1000)))
        player.y = calc;
        //this.updatePosition(player.x, calc , player.userid);
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
