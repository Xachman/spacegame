con = new Connection();
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

$(document).on('gamecreated', function() {
    $('.form-create-game').css({
        top: '-400px'
    });
});

function updateLobby(data) {
    var gamelist = $('#gameList');
    gamelist.html('');
    data = JSON.parse(data);
    console.log(data);
    html = '<div class="games">';
    for(var i = 0; i < data.length; i++) {
        html += '<div class="game">';
        html += '<div class="game-title">'+data[i].name+'</div>';
        html += '<div class="players">'+data[i].players.length+'</div>';
        html += '</div>';
    }
    html += '</div>';
    gamelist.html(html);
}
