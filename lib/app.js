var express = require('express');
var io = require('socket.io');
var UUID = require('node-uuid');
var http = require('http');
var app = express();
var server = http.createServer(app);
var bodyParser = require('body-parser');
var jade = require('jade');
app.use(bodyParser.urlencoded({ extended: false }));
var gameServer = require('./js/game-server.js');
console.log(gameServer);
app.set('view engine', 'jade');
app.get('/', function (req, res) {
    res.render('index');
});
app.post('/start', function (req, res) {
    res.render('start', req.body);
});
app.get('/*', function (req, res) {
    var file = req.params[0];
    res.sendFile(__dirname + '/' + file);
});
var sio = io.listen(server);
gameServer.io = sio;
sio.on('connection', function (client) {
    client.userid = UUID();
    client.emit('onconnected', { id: client.userid });
    gameServer.playerJoin(client);
    console.log('\t socket.io:: player ' + client.userid + ' connected');
    client.on('disconnect', function () {
        console.log('\t socket.io:: client disconnected ' + client.userid);
        gameServer.removePlayerById(client.userid);
    });
    client.on('message', function (client) {
        gameServer.processMessage(client);
    });
});
gameServer.update();
server.listen(3000);
//# sourceMappingURL=app.js.map