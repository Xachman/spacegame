var gameServer  = module.exports = { games : {}, gameCount:0 };
var UUID        = require('node-uuid');
var verbose     = true;

require('./game-master.js');
gameServer.board = {
  width: 1300,
  height: 755
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
          this.processInput(commands[2], commands[3], commands[4], commands[5], commands[6]);
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
   // console.log(x);
  var player = this.findPlayer(id);
  //console.log(player.atts.alive);
  if(!player.atts.alive.condition) return;
  var bullet = this.findBullet(id);
  if(bullet){
    bullet.x = parseFloat(x);
    bullet.y = parseFloat(y);
    bullet.condition = 0;
    bullet.timestamp = timestamp - bullet.timestamp;
  }else {
    //console.log(parseFloat(y) );
    //console.log(parseFloat(x) );
    //console.log(timestamp);
    this.bullets.push({id: id, mouse: mouse, condition: parseInt(condition), x:parseFloat(x), y:parseFloat(y), timestamp: timestamp, width: 10, height: 10});
  }
}
gameServer.processBullets = function() {
  var theBullets =  this.bullets;
  for (var i = 0; i < theBullets.length;  i++) {
    var bullet = theBullets[i];
    if(bullet.condition === 0) {
      //console.log('bullet fired');
      bullet.condition = 'fired';
      var player = this.findPlayer(bullet.id);
      var x = bullet.x - (player.clientState.x);
      var y = bullet.y - (player.clientState.y);
      bullet.x =  player.clientState.x;
      bullet.y =  player.clientState.y;
      bullet.angle = Math.atan2(y, x);
      
      var holdTime = bullet.timestamp;
      //console.log(holdTime);
      if(holdTime > 4000) {
          holdTime = 4000;
      }else if(holdTime < 1000) {
          holdTime = 1000;
      }
      holdTime = holdTime / 1000;
      bullet.baseSpeed = 20;
      bullet.speed = bullet.baseSpeed * holdTime;
      bullet.vx = Math.cos(bullet.angle) * bullet.speed;
     //console.log(bullet.vx );
      bullet.vy = Math.sin(bullet.angle) * bullet.speed;
     //console.log(bullet.vy );
      this.moveBullet(bullet, i, theBullets);
      this.checkBulletCollision(bullet, i);
    }else if(bullet.condition === 'fired') {
      this.moveBullet(bullet, i, theBullets);
      this.checkBulletCollision(bullet, i);
    }
  }
};
gameServer.checkBulletCollision = function(bullet, index) {
  var players = this.players;
  var count = 0;
  for(var i = 0; i < players.length; i++) {
    var player =  players[i];
    count++;
   // console.log(player.userid !== bullet.id);
    if(player.userid !== bullet.id && player.atts.alive.condition === true) {
      //console.log('collision check')
      playerPos = player.clientState;
      var times = Math.round(bullet.speed / bullet.baseSpeed);
      var difx = (bullet.x - bullet.lastX) / times;
      var dify = (bullet.y - bullet.lastY) / times;
      //console.log(bullet.speed / bullet.baseSpeed);
//      var bulletLastx2 = bullet.lastX + bullet.width;
//      var bulletLasty2 = bullet.lastY + bullet.height;
      for(var x = 0; x <= times; x++) {
        var changeX = difx * x;
        var changeY = dify * x;
        var bulletx2 = bullet.lastX + bullet.width;
        var bullety2 = bullet.lastY + bullet.height;
        var playerx2 = playerPos.x + player.atts.width;
        var playery2 = playerPos.y + player.atts.height;
        //console.log(playerx2);
        //console.log(playerPos.x);

        if(playerPos.y <  (bullety2 + changeY) && playerPos.x < (bulletx2 + changeX)&& playerx2 > (bullet.lastX + changeX) && playery2 > (bullet.lastY + changeY) ){
          this.processHit(player.userid, bullet);
        }
      }
      
     // if(bullet.x + 10 <= playerPos.x + 50 && bullet.x + 10 <= playerPos.x + 50)
    }
  }
  //console.log(count);
}
gameServer.processHit = function(id, bullet) {
  var player = this.findPlayer(id);
  player.atts.alive.condition = false;
  player.atts.alive.time = Date.now();
  bullet.destroy = true;
}
gameServer.moveBullet = function(bullet, index, bullets) {
  bullet.lastX = bullet.x;
  bullet.lastY = bullet.y;
  bullet.x += bullet.vx;
  bullet.y += bullet.vy;
  if(bullet.x < 0 || bullet.x > this.board.width) {
    bullet.destroy = true;
  }
  if(bullet.y < 0 || bullet.y > this.board.height) {
    bullet.destroy = true;
  }
}
gameServer.bulletCleanup = function() {
  var theBullets = this.bullets;
  for(var i = 0; i < theBullets.length; i++) {
    var bullet = theBullets[i];     
    if(bullet.destroy) {
      theBullets.splice(i, 1);
    }
  }
} 
gameServer.findBullet = function(id) {
  var bullets =  this.bullets;
  for (var i = 0; i < bullets.length; i++) {
    var bullet = bullets[i];
    if(bullet.id === id  && bullet.condition === 1) {
      return bullet;
    }
  }
  return false;
}

gameServer.processInput = function(id, key, condition, inputId, timestamp){
  //console.log(inputId);
  inputId = parseInt(inputId);
  var player = this.findPlayer(id);
  var con = parseInt(condition);
  if(con === 1 && this.checkKey(player, key)) {
    player.atts.inputs.push({key: key, timestamp: timestamp, condition: con});
  }else if(con === 0){
    var input  = this.findPlayerInput(player, key, 1);
    input.condition = con;
    input.endTime =  timestamp
    input.inputId = inputId;
  }
};
gameServer.findPlayerInput =  function(player, key, condition) {
    var inputs = player.atts.inputs;
    for (var i = 0; i < inputs.length; i++) {
        var input = inputs[i]; 
        if(input.key === key && input.condition === condition) {
            return input;
        }
    }
    return false;
}
gameServer.processInputs = function() {
  var players = this.players;
  for(var i = 0; i < players.length; i++) {
    var player = players[i];
    var inputs = player.atts.inputs;
    for(var x = 0; x < inputs.length; x++) {
      player.atts.inputId = inputs[x].inputId;
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
      inputs.splice(i,1);
      return;
    }
  }
}
gameServer.clearPlayerInputs = function() {
    var players =  this.players;
    for(var i = 0; i < players.length; i++){
        this.clearInputs(players[i]);
    }
}
gameServer.clearInputs = function(player) {
    var inputs =  player.atts.inputs;
   // console.log(inputs);
    for(var i = 0; i < inputs.length; i++){
        var input = inputs[i];
        if(input.condition === 0) {
            inputs.splice(i,1);
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
    inputId: 0,
    alive: {condition: true, time: 0}
  }
  player.clientState.width = player.atts.width;
  player.clientState.height = player.atts.height;
  player.clientState.atts = player.atts;
    this.players.push(player);
    this.updatedPlayers();
};
gameServer.updatedPlayers = function() {
  this.checkPlayerAlive();
  this.processInputs();
  this.clearPlayerInputs();
  this.processBullets();
  this.bulletCleanup();
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
  var upArrow = 38;
  var leftArrow = 37;
  var rightArrow = 39;
  var downArrow = 40;
  var wkey = 87;
  var akey =65;
  var dkey = 68;
  var skey = 83;
  var spaceBar = 32;
  var player = this.findPlayer(userid);
  var input = this.findInput(userid, key);
  if(input.condition === 1){
    var dif =  Date.now() - input.timestamp;
    input.timestamp = Date.now();
  }else{
    var dif = input.endTime - input.timestamp;
  }
 
//  console.log(dif);
  var speed = player.atts.speed;
  //console.log(player.userid);
  
  player = player.clientState;
  //console.log(parseInt(key) === upArrow);
    switch(parseInt(key)) {
      case upArrow:
      case wkey:
        var calc = (player.y - (speed * (dif / 1000)))
        player.y = calc;
      //  console.log(calc);
      //  this.updatePosition(player.x, calc, player.userid);
        break;
      case leftArrow:
      case akey:
       // console.log('left arrow');
        var calc = (player.x - (speed * (dif / 1000)))
        player.x = calc;
      //  this.updatePosition(calc, player.y, player.userid);
        break;
      case rightArrow:
      case dkey:
      //  console.log('right arrow');
        var calc = (player.x + (speed * (dif / 1000)))
        player.x = calc;
      //  this.updatePosition(calc, player.y , player.userid);
        break;
      case downArrow:
      case skey:
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
