/* 
 *  Functions to process physics
 */



exports.processPhysics = function(userid, key) {
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

exports.processBullets = function() {
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

exports.moveBullet = function(bullet, index, bullets) {
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