var express = require('express');
var io      = require('socket.io');
var UUID    = require('node-uuid');
var http    = require('http');
var app     = express();
var server  = http.createServer(app);
var bodyParser = require('body-parser');
var jade = require('jade');
//var players = [];
app.use(bodyParser.urlencoded({ extended: false }));
var gameServer  = require('./serverjs/game-server.js');
app.set('view engine', 'jade');
app.get('/', function(req, res) {
  //res.sendFile(__dirname+'/public/start.html');
  res.render('index');
});

app.post('/lobby', function(req, res) {
    res.render('lobby', req.body );
});
app.get('/*', function(req, res){
  var file = req.params[0];
  //console.log('\t :: Express :: file requested : ' + file);
  res.sendFile( __dirname + '/' + file );
});



sio = io.listen(server);
gameServer.io =  sio;
sio.on('connection', function(client) {
  client.userid = UUID();
  //console.log(client);
//  players.push(client.userid); test
  client.emit('onconnected', { id: client.userid } );
  //gameServer.findGame(client);
  gameServer.playerJoin(client);
            //Useful to know when someone connects
  console.log('\t socket.io:: player ' + client.userid + ' connected');

      //When this client disconnects
  client.on('disconnect', function () {
    console.log('\t socket.io:: client disconnected ' + client.userid );
    gameServer.removePlayerById(client.userid);
  });
  //console.log(players);
  client.on('message', function(data){
    // TODO: Find client by id stop sending ids from clients
    //console.log(client);
    gameServer.processMessage(data);
  });

})
//gameServer.update();
server.listen(80);
