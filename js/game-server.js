var gameServer  = module.exports = { games : {}, gameCount:0 };
var UUID        = require('node-uuid');
var verbose     = true;

require('./game-master.js');
gameServer.board = {
  width: 1300,
  height: 768
};
gameServer.inputs = [];
gameServer.players = [];
gameServer.bullets = [];
gameServer.clientState = {};
gameServer.clientState.players = [];
gameServer.pingPlayersTime = 0;
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
        case 'l':
            this.processLatency(commands[2]);
        break;
      }
      break;
  }
};
gameServer.processLatency = function(id) {
  var player = this.findPlayer(id);
  player.clientState.ping = Date.now() - this.pingPlayersTime;
}
gameServer.processMouseInput = function(id, mouse, condition, x, y, timestamp){
  var player = this.findPlayer(id);
  //console.log(player.atts.alive);
  if(!player.atts.alive.condition) return;
  var bullet = this.findBullet(id);
  if(bullet && bullet.condition === 1){
    bullet.x = parseFloat(x);
    bullet.y = parseFloat(y);
    bullet.condition = 0;
    bullet.timestamp = timestamp - bullet.timestamp;
  }else {
    //console.log(parseFloat(y) );
    //console.log(parseFloat(x) );
    this.bullets.push({id: id, mouse: mouse, condition: parseInt(condition), x:parseFloat(x), y:parseFloat(y), timestamp: timestamp, width: 10, height: 10});
  }
}
gameServer.processBullets = function() {
  var bullets =  this.bullets;
  for (var i = 0; i < bullets.length;  i++) {
    var bullet = bullets[i];
    if(bullet.condition === 0) {
      //console.log('bullet fired');
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
      this.moveBullet(bullet, i, bullets);
      this.checkBulletCollision(bullet, i);
    }else if(bullet.condition === 'fired') {
      this.moveBullet(bullet, i, bullets);
      this.checkBulletCollision(bullet, i);
    }
  }
}
gameServer.checkBulletCollision = function(bullet, index) {
  var players = this.players;
  for(var i = 0; i < players.length; i++) {
    var player =  players[i];
    if(player.userid !== bullet.id && player.atts.alive.condition === true) {
      //console.log('collision check')
      playerPos = player.clientState;
      //var bulletLastx2 = bullet.lastX + bullet.width;
      //var bulletLasty2 = bullet.lastY + bullet.height;
      var bulletx2 = bullet.x + bullet.width;
      var bullety2 = bullet.y + bullet.height;
      var playerx2 = playerPos.x + player.atts.width;
      var playery2 = playerPos.y + player.atts.height;
      //console.log(playerx2);
      //console.log(playerPos.x);

      if(playerPos.y < bullet.y && playery2 < bullety2){
       // console.log('player above');
        return;
      }
      if(playerPos.x < bullet.x && playerx2 < bulletx2){
      //  console.log('player left');
        return;
      }

      if(playerPos.x > bullet.x && playerx2 > bulletx2){
       // console.log('player right');
        return;
      }

      if(playerPos.y > bullet.y && playery2 > bullety2){
      //  console.log('player below');
        return;
      }

      this.processHit(player.userid, index);
     // if(bullet.x + 10 <= playerPos.x + 50 && bullet.x + 10 <= playerPos.x + 50)
    }
  }
}
gameServer.processHit = function(id, index) {
  var player = this.findPlayer(id);
  player.atts.alive.condition = false;
  player.atts.alive.time = Date.now();
  this.bullets.splice(index, 1);
}
gameServer.moveBullet = function(bullet, index, bullets) {
  bullet.lastX = bullet.x;
  bullet.lastY = bullet.y;
  bullet.x += bullet.vx;
  bullet.y += bullet.vy;
  if(bullet.x < 0 || bullet.x > this.board.width) {
    bullets.splice(index, 1);
  }
  if(bullet.y < 0 || bullet.y > this.board.height) {
    bullets.splice(index, 1);
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
 // console.log(key);
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
    width: 50,
    height: 50,
    speed: 50,
    inputs: [],
    color: '#'+Math.floor(Math.random()*16777215).toString(16),
    alive: {condition: true, time: 0}
  }
  player.clientState.width = player.atts.width;
  player.clientState.height = player.atts.height;
  player.clientState.atts = player.atts;
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
  this.checkPlayerAlive();
  this.processInputs();
  this.processBullets();
  var players =  this.players;
  var output = {
    players: this.getClientPlayers(),
    bullets: this.getFiredBullets(),
    board: this.board,
    ping: 0
  }
  if(Date.now() - this.pingPlayersTime > 2000 && this.players.length > 0) {
    //console.log('ping players');
    this.pingPlayersTime = Date.now();
    output.ping = 1;
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
        //console.log('up arrow');
        var calc = (player.y - (speed * (dif / 1000)))
        player.y = calc;
      //  console.log(calc);
      //  this.updatePosition(player.x, calc, player.userid);
        break;
      case leftArrow:
       // console.log('left arrow');
        var calc = (player.x - (speed * (dif / 1000)))
        player.x = calc;
      //  this.updatePosition(calc, player.y, player.userid);
        break;
      case rightArrow:
      //  console.log('right arrow');
        var calc = (player.x + (speed * (dif / 1000)))
        player.x = calc;
      //  this.updatePosition(calc, player.y , player.userid);
        break;
      case downArrow:
       // console.log('down arrow');
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
    var player = players[i];
    if(player.atts.alive.condition === true) {
      returnVal.push(players[i].clientState);
    }
  }
  return returnVal;
}
gameServer.checkPlayerAlive = function() {
  var players =  this.players;
  for(var i = 0; i < players.length; i ++) {
    var player = players[i];
   // console.log((Date.now() - player.atts.alive.time));
    if(player.atts.alive.condition === false && Date.now() - player.atts.alive.time >= 3000) {
      player.atts.alive.condition = true;
      player.clientState.x = Math.floor((Math.random() * 350) + 1);
      player.clientState.y = Math.floor((Math.random() * 350) + 1);
    }
  }
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
