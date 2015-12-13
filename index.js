var express = require('express');
var io      = require('socket.io');
var UUID    = require('node-uuid');
var http    = require('http');
var app     = express();
var server  = http.createServer(app);
var players = [];


app.get('/', function(req, res) {
  res.sendFile(__dirname+'/public/index.html');
})


app.get('/*', function(req, res){
  var file = req.params[0];
  //console.log('\t :: Express :: file requested : ' + file);
  res.sendFile( __dirname + '/' + file );
});



sio = io.listen(server);

sio.on('connection', function(client) {
  client.userid = UUID();
  players.push(client.userid);
  client.emit('onconnected', { id: client.userid } );

            //Useful to know when someone connects
  console.log('\t socket.io:: player ' + client.userid + ' connected');

      //When this client disconnects
  client.on('disconnect', function () {
    console.log('\t socket.io:: client disconnected ' + client.userid );

  });
  console.log(players);
})

server.listen(80);
