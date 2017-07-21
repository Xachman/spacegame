var UUID = require('node-uuid');
var verbose = true;
var physics = require('./physics.js');
var messages = require('./message-processes.js');
var GameServer;
(function (GameServer_1) {
    class GameServer {
        constructor() {
            this.inputs = [];
            this.players = [];
            this.bullets = [];
            this.clientState = {
                players: []
            };
            this.pingPlayersTime = 0;
            this.board = {
                width: 1300,
                height: 755
            };
            this.inputs = [];
            this.createGame = function (player) {
                var thegame = new GameServer_1.Game(UUID(), player, null, 1);
                this.games[thegame.getUUID()] = thegame;
                this.gameCount++;
                thegame.gameMaster = new GameServer_1.GameMaster(thegame);
            };
            this.update = function () {
                setTimeout(this.update.bind(this), 100);
                this.updatedPlayers();
            };
            this.checkBulletCollision = function (bullet, index) {
                var players = this.players;
                var count = 0;
                for (var i = 0; i < players.length; i++) {
                    var player = players[i];
                    count++;
                    if (player.userid !== bullet.id && player.atts.alive.condition === true) {
                        playerPos = player.clientState;
                        var times = Math.round(bullet.speed / bullet.baseSpeed);
                        var difx = (bullet.x - bullet.lastX) / times;
                        var dify = (bullet.y - bullet.lastY) / times;
                        for (var x = 0; x <= times; x++) {
                            var changeX = difx * x;
                            var changeY = dify * x;
                            var bulletx2 = bullet.lastX + bullet.width;
                            var bullety2 = bullet.lastY + bullet.height;
                            var playerx2 = playerPos.x + player.atts.width;
                            var playery2 = playerPos.y + player.atts.height;
                            if (playerPos.y < (bullety2 + changeY) && playerPos.x < (bulletx2 + changeX) && playerx2 > (bullet.lastX + changeX) && playery2 > (bullet.lastY + changeY)) {
                                this.processHit(player.userid, bullet);
                            }
                        }
                    }
                }
            };
            this.processHit = function (id, bullet) {
                var player = this.findPlayer(id);
                player.atts.alive.condition = false;
                player.atts.alive.time = Date.now();
                bullet.destroy = true;
            };
            this.bulletCleanup = function () {
                var theBullets = this.bullets;
                for (var i = 0; i < theBullets.length; i++) {
                    var bullet = theBullets[i];
                    if (bullet.destroy) {
                        theBullets.splice(i, 1);
                    }
                }
            };
            this.findBullet = function (id) {
                var bullets = this.bullets;
                for (var i = 0; i < bullets.length; i++) {
                    var bullet = bullets[i];
                    if (bullet.id === id && bullet.condition === 1) {
                        return bullet;
                    }
                }
                return false;
            };
            this.findPlayerInput = function (player, key, condition) {
                var inputs = player.atts.inputs;
                for (var i = 0; i < inputs.length; i++) {
                    var input = inputs[i];
                    if (input.key === key && input.condition === condition) {
                        return input;
                    }
                }
                return false;
            };
            this.processInputs = function () {
                var players = this.players;
                for (var i = 0; i < players.length; i++) {
                    var player = players[i];
                    var inputs = player.atts.inputs;
                    for (var x = 0; x < inputs.length; x++) {
                        player.atts.inputId = inputs[x].inputId;
                        this.processPhysics(player.userid, inputs[x].key);
                    }
                }
            };
            this.checkKey = function (player, key) {
                var inputs = player.atts.inputs;
                for (var i = 0; i < inputs.length; i++) {
                    if (inputs[i].key === key) {
                        return false;
                    }
                }
                return true;
            };
            this.findInput = function (id, key) {
                var player = this.findPlayer(id);
                var inputs = player.atts.inputs;
                for (var i = 0; i < inputs.length; i++) {
                    if (inputs[i].key === key) {
                        return inputs[i];
                    }
                }
            };
            this.clearInput = function (player, key) {
                var inputs = player.atts.inputs;
                for (var i = 0; i < inputs.length; i++) {
                    if (inputs[i].key === key) {
                        inputs.splice(i, 1);
                        return;
                    }
                }
            };
            this.clearPlayerInputs = function () {
                var players = this.players;
                for (var i = 0; i < players.length; i++) {
                    this.clearInputs(players[i]);
                }
            };
            this.clearInputs = function (player) {
                var inputs = player.atts.inputs;
                for (var i = 0; i < inputs.length; i++) {
                    var input = inputs[i];
                    if (input.condition === 0) {
                        inputs.splice(i, 1);
                    }
                }
            };
            this.playerJoin = function (player) {
                player.clientState = {};
                player.clientState.x = Math.floor((Math.random() * this.board.width) + 1);
                player.clientState.y = Math.floor((Math.random() * this.board.height) + 1);
                player.clientState.id = player.userid;
                player.atts = {
                    width: 50,
                    height: 50,
                    speed: 50,
                    inputs: [],
                    color: '#' + Math.floor(Math.random() * 16777215).toString(16),
                    inputId: 0,
                    alive: { condition: true, time: 0 }
                };
                player.clientState.width = player.atts.width;
                player.clientState.height = player.atts.height;
                player.clientState.atts = player.atts;
                this.players.push(player);
                this.updatedPlayers();
            };
            this.updatedPlayers = function () {
                this.checkPlayerAlive();
                this.processInputs();
                this.clearPlayerInputs();
                this.processBullets();
                this.bulletCleanup();
                var players = this.players;
                var output = {
                    players: this.getClientPlayers(),
                    bullets: this.getFiredBullets(),
                    board: this.board,
                    ping: 0
                };
                if (Date.now() - this.pingPlayersTime > 2000 && this.players.length > 0) {
                    this.pingPlayersTime = Date.now();
                    output.ping = 1;
                }
                for (var i = 0; i < players.length; i++) {
                    var player = players[i];
                    player.send('s.pu.' + JSON.stringify(output));
                }
            };
            this.getFiredBullets = function () {
                var bullets = this.bullets;
                var returnVal = [];
                for (var i = 0; i < bullets.length; i++) {
                    var bullet = bullets[i];
                    if (bullet.condition === 'fired') {
                        returnVal.push(bullet);
                    }
                }
                return returnVal;
            };
            this.findPlayer = function (id) {
                var players = this.players;
                for (var i = 0; i < players.length; i++) {
                    var player = players[i];
                    if (player.userid === id) {
                        return player;
                    }
                }
            };
            this.addClientPlayer = function (player) {
                this.clientState.players.push(player);
            };
            this.getClientPlayers = function () {
                var returnVal = [];
                var players = this.players;
                for (var i = 0; i < players.length; i++) {
                    var player = players[i];
                    if (player.atts.alive.condition === true) {
                        returnVal.push(players[i].clientState);
                    }
                }
                return returnVal;
            };
            this.checkPlayerAlive = function () {
                var players = this.players;
                for (var i = 0; i < players.length; i++) {
                    var player = players[i];
                    if (player.atts.alive.condition === false && Date.now() - player.atts.alive.time >= 3000) {
                        player.atts.alive.condition = true;
                        player.clientState.x = Math.floor((Math.random() * 350) + 1);
                        player.clientState.y = Math.floor((Math.random() * 350) + 1);
                    }
                }
            };
            this.removePlayerById = function (id) {
                var players = this.players;
                for (var i = 0; i < players.length; i++) {
                    var player = players[i];
                    if (player.userid === id) {
                        players.splice(i, 1);
                        this.updatedPlayers();
                        return;
                    }
                }
            };
        }
    }
    GameServer_1.GameServer = GameServer;
    Object.assign(prototype, physics, messages);
})(GameServer || (GameServer = {}));
//# sourceMappingURL=GameServer.js.map