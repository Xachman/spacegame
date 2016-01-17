/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

exports.this;
exports.processMessage = function (data) {
    data += '.' + Date.now();
    var commands = data.split('.');
    var command = commands[0];
    var type = commands[1];
    console.log(data);
    switch (command) {
        case 'c':
            switch (type) {
                case 'i':
                    this.processInput(commands[2], commands[3], commands[4], commands[5], commands[6]);
                    break;
                case 'm':
                    this.processMouseInput(commands[2], commands[3], commands[4], commands[5], commands[6], commands[7]);
                    break;
                case 'l':
                    this.processLatency(commands[2]);
                    break;
                case 'in':
                    this.processInit(commands[2], commands[3], commands[4]);
                    break;
            }
            break;
    }
};
exports.processInit = function (color, name, uid) {
    console.log('The id: ' + uid);
    var player = this.findPlayer(uid);
    console.log(name);
    player.atts.color = color;
    player.atts.name = name;
}
exports.processLatency = function (id) {
    var player = this.findPlayer(id);
    player.clientState.ping = Date.now() - this.pingPlayersTime;
}
exports.processMouseInput = function (id, mouse, condition, x, y, timestamp) {
    // console.log(x);
    var player = this.findPlayer(id);
    //console.log(player.atts.alive);
    if (!player.atts.alive.condition)
        return;
    var bullet = this.findBullet(id);
    if (bullet) {
        bullet.x = parseFloat(x);
        bullet.y = parseFloat(y);
        bullet.condition = 0;
        bullet.timestamp = timestamp - bullet.timestamp;
    } else {
        //console.log(parseFloat(y) );
        //console.log(parseFloat(x) );
        //console.log(timestamp);
        this.bullets.push({id: id, mouse: mouse, condition: parseInt(condition), x: parseFloat(x), y: parseFloat(y), timestamp: timestamp, width: 10, height: 10});
    }
}
exports.processInput = function(id, key, condition, inputId, timestamp){
  //console.log(inputId);
  inputId = parseInt(inputId);
  var player = this.findPlayer(id);
  var con = parseInt(condition);
  if(con === 1 && this.checkKey(player, key)) {
    player.atts.inputs.push({key: key, timestamp: timestamp, condition: con});
  }else if(con === 0){
    var input  = this.findPlayerInput(player, key, 1);
    input.condition = con;
    input.endTime =  timestamp;
    input.inputId = inputId;
  }
};



