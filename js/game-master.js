function GameMaster(instance) {

  this.instance = instance;
  this.server = this.instance !== "undefined";
  if(!this.server) {
    this.clientConnect();
  }
  this.inputId = 0;
  this.packages = [];
  this.playersPos = [];
  this.players = [];
  this.self = 0;
  this.hud = {};
  this.board = {width: 0};
  this.player = {
    inputs: {
      upArrow: {condition: false, key: 38},
      downArrow: {condition: false, key: 40},
      leftArrow: {condition: false, key: 37},
      rightArrow: {condition: false, key: 39},
    }
  }
  this.bullets = [];
  this.onconnect = function(data) {
    //console.log(data);
    this.self = data.id;
  };

}

GameMaster.prototype.clientConnect = function() {
  this.socket = io();

  this.socket.on('onconnected', function(data){
  //  console.log('hi');
    this.onconnect(data);
  });

};

GameMaster.prototype.startGame = function() {
  if(this.server) {

  }else{
    this.draw();
  }
};

GameMaster.prototype.draw = function() {
  this.canvas = document.getElementById('gameCan');
//  console.log(this.canvas);
  this.ctx = this.canvas.getContext("2d");
  var ctx = this.ctx;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0,0,50,50);
  //console.log('drawn');
  this.hudInit();
};
GameMaster.prototype.reDraw = function() {
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  this.addTiledBackground('/assets/metal_floor_tiles.jpg', 118, 58, 58, 58);
  var players = this.playersPos;
  var self = this.findPlayer(this.self);
  for(var i = 0; i < players.length; i++) {
    var player = players[i];
    if(player.id === self.id) {
      player = self;
    }else{
      //console.log(player.x);
    }
  //  console.log(player.x+', '+player.y);
    if(typeof player.atts !== 'undefined') var color = player.atts.color;
    else var color = '#fff';
    //console.log(player.atts.color);
    this.ctx.fillStyle = color;
    this.ctx.fillRect(player.x, player.y,player.width,player.height);

    this.ctx.beginPath();
    this.ctx.moveTo(player.x,player.y);
    this.ctx.lineTo(player.x + player.width, player.y);
    this.ctx.lineTo(player.x + player.width, player.y + player.height);
    this.ctx.lineTo(player.x, player.y + player.height);
    this.ctx.lineTo(player.x, player.y);
    this.ctx.strokeStyle="#7CFC00";
    this.ctx.stroke();
  }
  this.drawBullets();
  this.hudUpdate();
}
GameMaster.prototype.drawBullets = function() {
  var bullets =  this.bullets;
  for (var i = 0; i < bullets.length; i++) {
    var bullet = bullets[i];
    var player =  this.findPlayer(bullet.id);
    if(typeof player.atts !== 'undefined') var color = player.atts.color
    else var color = '#fff';
    this.ctx.fillStyle = color;
    this.moveBullet(bullet);
    this.ctx.fillRect(bullet.x, bullet.y,bullet.width,bullet.height);
    this.ctx.beginPath();
    this.ctx.moveTo(bullet.x,bullet.y);
    this.ctx.lineTo(bullet.x + bullet.width, bullet.y);
    this.ctx.lineTo(bullet.x + bullet.width, bullet.y + bullet.height);
    this.ctx.lineTo(bullet.x, bullet.y + bullet.height);
    this.ctx.lineTo(bullet.x, bullet.y);
    this.ctx.strokeStyle="#7CFC00";
    this.ctx.stroke();
  }
}
GameMaster.prototype.moveBullet = function(bullet) {
  var dt = this.dt;
  var totalVX = (bullet.vx * 10) / 1000;
  var totalVY = (bullet.vy * 10) / 1000;
  //console.log(dt);
  bullet.x += totalVX * dt;
  bullet.y += totalVY * dt;
}
GameMaster.prototype.updatePlayers = function(data) {

  var data = JSON.parse(data);
  var players = data.players;
  this.bullets = data.bullets;
  this.packages.push(data);
  if(this.packages.length > 2) {
    this.packages.shift();
  }
  //console.log(players);
  if(data.ping === 1) {
    this.pingServer();
  }
  var x = 0;
  var y = 0;
  if(this.canvas.width !== data.board.width || this.canvas.height !== data.board.height){
    console.log('board changed');
    this.canvas.width = data.board.width;
    this.canvas.height = data.board.height;
    this.board =  data.board;
  }
  if(this.players.length > 0) {
    var self = this.findPlayer(this.self);
    if(self) {
      x = self.x;
      y = self.y;
    }
  }
  //console.log(this.packages[0]);
  this.playersPos = this.packages[0].players;

  this.players = players;
  // self from server

  var servSelf = this.findPlayer(this.self);

  //condition = x <= servSelf.x + 10  && x >= servSelf.x - 10 && y <= servSelf.y + 10 && y >= servSelf.y - 10;

//  if(condition ) {
//    servSelf.x = x;
//    servSelf.y = y;

  if(self && this.players.length > 0 && self.atts.inputId !== this.inputId) {
    //console.log('condition met');
    servSelf.x = x;
    servSelf.y = y;
  }else{
    console.log('condition met');
  }
  if(data.ping === 1) {
    this.pingServer();
  }
  
  //this.reDraw();
}
GameMaster.prototype.clientOnNetMessage = function(data) {
  //console.log('message from server');
    var commands = data.split('.', 2);
    var command = commands[0];
    var subcommand = commands[1] || null;
    var commanddata = this.truncateMessage(data);
  //  console.log('server data: '+commanddata);
    switch(command) {
        case 's': //server message

            switch(subcommand) {

                case 'h' : //host a game requested
                    this.clientOnHostGame(commanddata); break;

                case 'j' : //join a game requested
                    this.clientOnJoinGame(commanddata); break;

                case 'r' : //ready a game requested
                    this.client_onreadygame(commanddata); break;

                case 'e' : //end game requested
                    this.client_ondisconnect(commanddata); break;

                case 'p' : //server ping
                    this.client_onping(commanddata); break;

                case 'c' : //other player changed colors
                    this.client_on_otherclientcolorchange(commanddata); break;
                case 'u':
                    this.processUpdate(commanddata);
                    break;
                case 'pu':
                    //if(this.players <= 0)
                    this.updatePlayers(commanddata);
                    break;

            } //subcommand

        break; //'s'
    } //command

}; //cli
GameMaster.prototype.interpolate = function(dt) {
  var positions = this.playersPos;
  var self = this.findPlayer(this.self);
  for(var i = 0; i < positions.length; i++) {
    var currentPos =  this.playersPos[i];
    if(self && currentPos.id === self.id) continue;
    var endPos = this.findPlayer(currentPos.id);

    if(typeof currentPos.total === "undefined") {
      var xDif =  ( endPos.x -  currentPos.x) / 100;
      var yDif = (endPos.y - currentPos.y) / 100;
      currentPos.total = {
        x: xDif,
        y: yDif,
      };
      //console.log('current: '+ currentPos.x);
      //console.log('current + End: '+(currentPos.x + currentPos.total.x * 100));
      //console.log('End: '+endPos.x);
    }
    var travelX = currentPos.total.x * dt;
    var travelY =  currentPos.total.y * dt;
    currentPos.x += travelX;
    currentPos.y += travelY;
  }
}
GameMaster.prototype.truncateMessage = function(str) {
  var count = 0;
  for (var i = 0; i < str.length; i++) {
    if(str.charAt(i) === '.') {

      count++;
    }
    if(count === 2) {
    //  console.log('char');
      return str.substring(i+1, str.length);
    }
  }
}
GameMaster.prototype.clientConnectServer = function(data) {
  this.socket = io.connect();
  var player = this.self;
  var sio = this.socket;
    //Now we can listen for that event
    var GM = this;
  sio.on('onconnected', function( data ) {
    //Note that the data is the object we sent from the server, as is. So we can assume its id exists.
    console.log( 'Connected successfully to the socket.io server. My server side ID is ' + data.id );
    player.id = data.id;
    GM.onconnect(data);
    GM.draw();
  });
  sio.on('message', this.clientOnNetMessage.bind(this));
};
GameMaster.prototype.clientOnJoinGame = function(data) {
  var player = this.players.self;
  player.host = false;
  player.state = 'connected.joined.waiting';
  player.infoColor = '#00bb00';
    //this.clientResetPositions();
};
GameMaster.prototype.clientOnHostGame = function(data) {
  //this.clientResetPositions();
  this.players.self.host = true;

      //Update debugging information to display state
  this.players.self.state = 'hosting.waiting for a player';
  this.players.self.info_color = '#cc0000';
};


GameMaster.prototype.keyPress = function(e) {
//  console.log(e.keyCode);
  this.sendToServer(e.keyCode, 1);
  this.processPlayerInput(e.keyCode, 1);
}
GameMaster.prototype.keyUp = function(e) {
  this.sendToServer(e.keyCode, 0);
  this.processPlayerInput(e.keyCode, 0);
}

GameMaster.prototype.sendToServer = function(key, condition) {
  this.inputId++;
  var inputId = this.inputId;
  this.socket.send('c.i.'+this.self+'.'+key+'.'+condition+'.'+inputId);
}
GameMaster.prototype.sendMouseToServer = function(key, condition, x, y) {
  this.socket.send('c.m.'+this.self+'.'+key+'.'+condition+'.'+x+'.'+y);
}
if( 'undefined' != typeof global ) {
   // module.exports = global.GameMaster = GameMaster;
}

GameMaster.prototype.updateLoop = function() {
  requestAnimationFrame(this.updateLoop.bind(this));
  var now = new Date().getTime();
  var dt = now - (this.time || now);
  this.dt = dt;
  this.time = now;
  
  this.processPhysics(dt);


}
GameMaster.prototype.addTiledBackground = function(url, x, y, width, height) {
  if(typeof this.backgroundImage === 'undefined'){
    var img = new Image();
    img.src = url;
    this.backgroundImage = img;
  }
  posX = 0;
  posY = 0;
  count = 0;
  while(posY < this.canvas.height){
    while(posX < this.canvas.width) {
      this.ctx.drawImage(this.backgroundImage, x, y, width, height, posX, posY, width, height);
      posX += width;
      
      
    }
    posY += height;
    posX = 0;
   
  }
  
  
}
GameMaster.prototype.processPhysics = function(dt) {
  this.processPlayerSelfPhysics(dt);
  this.interpolate(dt);
  this.reDraw();
}
GameMaster.prototype.processPlayerSelfPhysics = function(dt) {
//  console.log('hi');
  var speed = 50;
  var player = this.findPlayer(this.self);
  var inputs = this.player.inputs;
  keys = Object.keys(inputs);
  for(var i = 0; i < keys.length; i++) {
    var input = inputs[keys[i]];

    if(input.condition === true){
      this.processPlayerPhysics(input, dt);
    }
  }
}
GameMaster.prototype.processPlayerPhysics = function(input, dt) {
  var player = this.findPlayer(this.self);
  var upArrow = 38;
  var leftArrow = 37;
  var rightArrow = 39;
  var downArrow = 40;
  var wkey = 87;
  var akey =65;
  var dkey = 68;
  var skey = 83;
  var speed = player.atts.speed / 1000
  switch(input.key) {
    case upArrow: 
    case wkey:
      //console.log((player.y));
      player.y = player.y - (speed * dt);
    break;
    case leftArrow: 
    case akey:
      player.x = player.x - (speed * dt);
    break;
    case rightArrow:
    case dkey:
      player.x = player.x + (speed * dt);
    break;
    case downArrow:
    case skey:
      player.y = player.y + (speed * dt);
    break;
    case spaceBar:

    break;
  }
}
GameMaster.prototype.processPlayerInput = function(key, condition) {
  var upArrow = 38;
  var leftArrow = 37;
  var rightArrow = 39;
  var downArrow = 40;
  var wkey = 87;
  var akey =65;
  var dkey = 68;
  var skey = 83;
  var spaceBar = 32;
  switch(key) {
    case upArrow:
    case wkey:
      this.updateKeyCondition(this.player.inputs.upArrow, condition);
    break;
    case leftArrow:
    case akey:
      this.updateKeyCondition(this.player.inputs.leftArrow, condition);
    break;
    case rightArrow:
    case dkey:
      this.updateKeyCondition(this.player.inputs.rightArrow, condition);
    break;
    case downArrow:
    case skey:
      this.updateKeyCondition(this.player.inputs.downArrow, condition);
    break;
    case spaceBar:

    break;
  }
}

GameMaster.prototype.updateKeyCondition = function(playerInput, condition) {
  if(condition === 1) {
    playerInput.condition = true;
  } else {
    playerInput.condition = false;
  }
}
GameMaster.prototype.findPlayer = function(id) {
  var players = this.players;
  for (var i = 0; i < players.length; i++) {
    var player = players[i];
    if(player.id === id) {
      return player;
    }
  }
  return false;
}
GameMaster.prototype.mouseDown = function(event) {
  this.sendMouseToServer('mousedown', 1, event.clientX, event.clientY);
}
GameMaster.prototype.mouseUp = function(event) {
  this.sendMouseToServer('mousedown', 0, event.clientX, event.clientY);
}
GameMaster.prototype.pingServer = function() {
  var player = this.self;
  this.socket.send('c.l.'+player);
}
GameMaster.prototype.hudInit = function() {
  var hud = this.hud;
  hud.height = 20;
  
};
GameMaster.prototype.hudUpdate =  function(data) {
  var hud = this.hud
  var ctx = this.ctx;
  hud.latency = this.findPlayer(this.self).ping+'ms';
  ctx.fillStyle = '#000';
  ctx.fillRect(0,0,this.board.width, 30);
  ctx.fillStyle = 'green';
  ctx.font="14px Verdana";
  ctx.fillText('lat: '+hud.latency, 10, 20);
} 
