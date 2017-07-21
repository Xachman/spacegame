var GameServer;
(function (GameServer) {
    class GameMaster {
        constructor(instance) {
            this.drawBullets = function () {
                var bullets = this.bullets;
                for (var i = 0; i < bullets.length; i++) {
                    var bullet = bullets[i];
                    var player = this.findPlayer(bullet.id);
                    if (typeof player.atts !== 'undefined')
                        var color = player.atts.color;
                    else
                        var color = '#fff';
                    this.ctx.fillStyle = color;
                    this.moveBullet(bullet);
                    this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
                    this.ctx.beginPath();
                    this.ctx.moveTo(bullet.x, bullet.y);
                    this.ctx.lineTo(bullet.x + bullet.width, bullet.y);
                    this.ctx.lineTo(bullet.x + bullet.width, bullet.y + bullet.height);
                    this.ctx.lineTo(bullet.x, bullet.y + bullet.height);
                    this.ctx.lineTo(bullet.x, bullet.y);
                    this.ctx.strokeStyle = "#7CFC00";
                    this.ctx.stroke();
                }
            };
            this.moveBullet = function (bullet) {
                var dt = this.dt;
                var totalVX = (bullet.vx * 10) / 1000;
                var totalVY = (bullet.vy * 10) / 1000;
                bullet.x += totalVX * dt;
                bullet.y += totalVY * dt;
            };
            this.updatePlayers = function (data) {
                var data = JSON.parse(data);
                var players = data.players;
                this.bullets = data.bullets;
                this.packages.push(data);
                if (this.packages.length > 2) {
                    this.packages.shift();
                }
                if (data.ping === 1) {
                    this.pingServer();
                }
                var x = 0;
                var y = 0;
                if (this.canvas.width !== data.board.width || this.canvas.height !== data.board.height) {
                    console.log('board changed');
                    this.canvas.width = data.board.width;
                    this.canvas.height = data.board.height;
                    this.board = data.board;
                }
                if (this.players.length > 0) {
                    var self = this.findPlayer(this.self);
                    if (self) {
                        x = self.x;
                        y = self.y;
                    }
                }
                this.playersPos = this.packages[0].players;
                this.players = players;
                var servSelf = this.findPlayer(this.self);
                if (self && this.players.length > 0 && self.atts.inputId !== this.inputId) {
                    servSelf.x = x;
                    servSelf.y = y;
                }
                else {
                }
                if (data.ping === 1) {
                    this.pingServer();
                }
            };
            this.clientOnNetMessage = function (data) {
                var commands = data.split('.', 2);
                var command = commands[0];
                var subcommand = commands[1] || null;
                var commanddata = this.truncateMessage(data);
                switch (command) {
                    case 's':
                        switch (subcommand) {
                            case 'h':
                                this.clientOnHostGame(commanddata);
                                break;
                            case 'j':
                                this.clientOnJoinGame(commanddata);
                                break;
                            case 'r':
                                this.client_onreadygame(commanddata);
                                break;
                            case 'e':
                                this.client_ondisconnect(commanddata);
                                break;
                            case 'p':
                                this.client_onping(commanddata);
                                break;
                            case 'c':
                                this.client_on_otherclientcolorchange(commanddata);
                                break;
                            case 'u':
                                this.processUpdate(commanddata);
                                break;
                            case 'pu':
                                this.updatePlayers(commanddata);
                                break;
                        }
                        break;
                }
            };
            this.interpolate = function (dt) {
                var positions = this.playersPos;
                var self = this.findPlayer(this.self);
                for (var i = 0; i < positions.length; i++) {
                    var currentPos = this.playersPos[i];
                    if (self && currentPos.id === self.id)
                        continue;
                    var endPos = this.findPlayer(currentPos.id);
                    if (typeof currentPos.total === "undefined") {
                        var xDif = (endPos.x - currentPos.x) / 100;
                        var yDif = (endPos.y - currentPos.y) / 100;
                        currentPos.total = {
                            x: xDif,
                            y: yDif,
                        };
                    }
                    var travelX = currentPos.total.x * dt;
                    var travelY = currentPos.total.y * dt;
                    currentPos.x += travelX;
                    currentPos.y += travelY;
                }
            };
            this.truncateMessage = function (str) {
                var count = 0;
                for (var i = 0; i < str.length; i++) {
                    if (str.charAt(i) === '.') {
                        count++;
                    }
                    if (count === 2) {
                        return str.substring(i + 1, str.length);
                    }
                }
            };
            this.clientConnectServer = function (data) {
                this.socket = io.connect();
                var player = this.self;
                var sio = this.socket;
                var GM = this;
                sio.on('onconnected', function (data) {
                    console.log('Connected successfully to the socket.io server. My server side ID is ' + data.id);
                    player.id = data.id;
                    GM.onconnect(data);
                    GM.draw();
                    GM.sendInit(playerColor, playerName, data.id);
                });
                sio.on('message', this.clientOnNetMessage.bind(this));
            };
            this.clientOnJoinGame = function (data) {
                var player = this.players.self;
                player.host = false;
                player.state = 'connected.joined.waiting';
                player.infoColor = '#00bb00';
            };
            this.clientOnHostGame = function (data) {
                this.players.self.host = true;
                this.players.self.state = 'hosting.waiting for a player';
                this.players.self.info_color = '#cc0000';
            };
            this.keyPress = function (e) {
                this.sendToServer(e.keyCode, 1);
                this.processPlayerInput(e.keyCode, 1);
            };
            this.keyUp = function (e) {
                this.sendToServer(e.keyCode, 0);
                this.processPlayerInput(e.keyCode, 0);
            };
            this.sendToServer = function (key, condition) {
                this.inputId++;
                var inputId = this.inputId;
                this.socket.send('c.i.' + this.self + '.' + key + '.' + condition + '.' + inputId);
            };
            this.sendMouseToServer = function (key, condition, x, y) {
                this.socket.send('c.m.' + this.self + '.' + key + '.' + condition + '.' + x + '.' + y);
            };
            this.sendInit = function (color, name, id) {
                this.socket.send('c.in.' + color + '.' + name + '.' + id);
            };
            this.updateLoop = function () {
                requestAnimationFrame(this.updateLoop.bind(this));
                var now = new Date().getTime();
                var dt = now - (this.time || now);
                this.dt = dt;
                this.time = now;
                this.processPhysics(dt);
            };
            this.addTiledBackground = function (url, x, y, width, height) {
                if (typeof this.backgroundImage === 'undefined') {
                    var img = new Image();
                    img.src = url;
                    this.backgroundImage = img;
                }
                posX = 0;
                posY = 0;
                count = 0;
                while (posY < this.canvas.height) {
                    while (posX < this.canvas.width) {
                        this.ctx.drawImage(this.backgroundImage, x, y, width, height, posX, posY, width, height);
                        posX += width;
                    }
                    posY += height;
                    posX = 0;
                }
            };
            this.processPhysics = function (dt) {
                this.processPlayerSelfPhysics(dt);
                this.interpolate(dt);
                this.reDraw();
            };
            this.processPlayerSelfPhysics = function (dt) {
                var speed = 50;
                var player = this.findPlayer(this.self);
                var inputs = this.player.inputs;
                keys = Object.keys(inputs);
                for (var i = 0; i < keys.length; i++) {
                    var input = inputs[keys[i]];
                    if (input.condition === true) {
                        this.processPlayerPhysics(input, dt);
                    }
                }
            };
            this.processPlayerPhysics = function (input, dt) {
                var player = this.findPlayer(this.self);
                if (!player)
                    return;
                var upArrow = 38;
                var leftArrow = 37;
                var rightArrow = 39;
                var downArrow = 40;
                var wkey = 87;
                var akey = 65;
                var dkey = 68;
                var skey = 83;
                var speed = player.atts.speed / 1000;
                switch (input.key) {
                    case upArrow:
                    case wkey:
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
            };
            this.processPlayerInput = function (key, condition) {
                var upArrow = 38;
                var leftArrow = 37;
                var rightArrow = 39;
                var downArrow = 40;
                var wkey = 87;
                var akey = 65;
                var dkey = 68;
                var skey = 83;
                var spaceBar = 32;
                switch (key) {
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
            };
            this.updateKeyCondition = function (playerInput, condition) {
                if (condition === 1) {
                    playerInput.condition = true;
                }
                else {
                    playerInput.condition = false;
                }
            };
            this.findPlayer = function (id) {
                var players = this.players;
                for (var i = 0; i < players.length; i++) {
                    var player = players[i];
                    if (player.id === id) {
                        return player;
                    }
                }
                return false;
            };
            this.mouseDown = function (event) {
                this.sendMouseToServer('mousedown', 1, event.clientX, event.clientY);
            };
            this.mouseUp = function (event) {
                this.sendMouseToServer('mousedown', 0, event.clientX, event.clientY);
            };
            this.pingServer = function () {
                var player = this.self;
                this.socket.send('c.l.' + player);
            };
            this.hudInit = function () {
                var hud = this.hud;
                hud.height = 20;
            };
            this.hudUpdate = function (data) {
                var hud = this.hud;
                var ctx = this.ctx;
                hud.latency = this.findPlayer(this.self).ping + 'ms';
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, this.board.width, 30);
                ctx.fillStyle = 'green';
                ctx.font = "14px Verdana";
                ctx.fillText('lat: ' + hud.latency, 10, 20);
            };
            this.instance = instance;
            this.server = this.instance !== "undefined";
            this.inputId = 0;
            this.packages = [];
            this.playersPos = [];
            this.players = [];
            this.self = 0;
            this.hud = {};
            this.board = { width: 0 };
            this.player = new GameServer.Player();
            this.bullets = [];
            this.onconnect = function (data) {
                console.log(data);
                this.self = data.id;
            };
        }
        startGame() {
            if (this.server) {
            }
            else {
                this.draw();
            }
        }
        draw() {
            this.canvas = document.getElementById('gameCan');
            this.ctx = this.canvas.getContext("2d");
            var ctx = this.ctx;
            ctx.fillStyle = "#fff";
            ctx.fillRect(0, 0, 50, 50);
            this.hudInit();
        }
        reDraw() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.addTiledBackground('/assets/metal_floor_tiles.jpg', 118, 58, 58, 58);
            var players = this.playersPos;
            var self = this.findPlayer(this.self);
            for (var i = 0; i < players.length; i++) {
                var player = players[i];
                if (player.id === self.id) {
                    player = self;
                }
                else {
                }
                var name = "test";
                if (typeof player.atts !== 'undefined')
                    var color = player.atts.color;
                if (typeof player.atts !== 'undefined')
                    name = player.atts.name;
                else
                    var color = '#fff';
                this.ctx.fillStyle = color;
                this.ctx.fillRect(player.x, player.y, player.width, player.height);
                this.ctx.beginPath();
                this.ctx.moveTo(player.x, player.y);
                this.ctx.lineTo(player.x + player.width, player.y);
                this.ctx.lineTo(player.x + player.width, player.y + player.height);
                this.ctx.lineTo(player.x, player.y + player.height);
                this.ctx.lineTo(player.x, player.y);
                this.ctx.strokeStyle = "#7CFC00";
                this.ctx.stroke();
                this.ctx.strokeText(name, (player.x + player.width / 2) - this.ctx.measureText(name).width / 2, player.y - 10);
            }
            this.drawBullets();
            this.hudUpdate();
        }
    }
    GameServer.GameMaster = GameMaster;
})(GameServer || (GameServer = {}));
//# sourceMappingURL=GameMaster.js.map