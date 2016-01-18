/* 
 * Handels connecting and messaging the server
 */

var Connection = function() {
    this.id = 0;
};

Connection.prototype.connectToServer = function (data) {
    this.socket = io.connect();
    var sio = this.socket;
    //Now we can listen for that event
    var con = this;
    sio.on('onconnected', function (data) {
        //Note that the data is the object we sent from the server, as is. So we can assume its id exists.
        console.log(con);
        console.log('Connected successfully to the socket.io server. My server side ID is ' + data.id);
        con.id = data.id;
        con.sendInit(playerColor, playerName, data.id);
    });
    sio.on('message', this.onNetMessage.bind(this));
}

Connection.prototype.sendInit = function(color, name, id) {
    this.socket.send('c.in.'+color+'.'+name+'.'+id);
    console.log('sent');
};

Connection.prototype.onNetMessage = function(data) {
  //console.log('message from server');
    var commands = data.split('.', 2);
    var command = commands[0];
    var subcommand = commands[1] || null;
    var commanddata = this.truncateMessage(data);
    console.log('server data: '+commanddata);
    switch(command) {
        case 's': //server message
            switch(subcommand) {
                case 'u':
                    this.processUpdate(commanddata);
                    break;
                case 'pu':
                    //if(this.players <= 0)
                    //this.updatePlayers(commanddata);
                    break;
                case 'in':
                    //if(this.players <= 0)
                    this.serverInitResponse(commanddata);
                    break;
                case 'ng':
                    $(document).trigger('gamecreated');
                break;
                case 'gu':
                    updateLobby(commanddata);
                break;
            } //subcommand
        break; //'s'
    } //command

}; //cli
Connection.prototype.truncateMessage = function(str) {
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
Connection.prototype.serverInitResponse = function(data) {
    console.log(data);
}