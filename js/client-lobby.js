var con = new Connection();
//This is all that needs
con.connectToServer();

$('#createGame').on('click', function() {
    $('.form-create-game').css({
        top: document.documentElement.clientHeight / 4,
        left: document.documentElement.clientWidth / 2 - $('.form-create-game').width() / 2
    });
});

$('.form-create-game form button').click(function(e){
   e.preventDefault();
   var form = $(this).parent('form')
   var name = form.find('input').val();
    con.socket.send('c.ng.'+name+'.'+con.id);
    
});

function updateLobby() {
    var gamelist = $('#gameList');
    gamelist.html('');
    data = con.lobbyData;
    console.log(data);    
    html = '<div class="games">';
    for(var i = 0; i < data.length; i++) {
        html += '<div class="game">';
        html += '<div class="columns small-6 ">';
        html += '<div class="game-title">'+data[i].name+'</div>';
        html += '<div class="players">'+data[i].players.length+'</div>';
        html += '</div>';
        if(con.findPlayerId(data[i].players)) {
            html += '<div class="columns small-6 ">';
            html += '<button class="tiny start">Start Game</button>';
        }else{
            html += '<div class="columns small-6 ">';
            html += '<button class="tiny join">Join Game</button>';
        }
        html += '</div>';
        html += '</div>';
    }
    html += '</div>';
    gamelist.html(html);
}

function gameCreated(data) {
    var form = $('.form-create-game');
    data = JSON.parse(data);
    if(typeof data.message !== "undefined") {
        form.append('<div class="message"></div>');
        form.find('.message').html(data.message);
        setTimeout(function(){
            form.css({
                top: '-400px'
            });
            form.find('.message').remove();
        }, 1000);
       
    }
}