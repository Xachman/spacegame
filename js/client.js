gameMaster = new GameMaster();
gameMaster.draw();
//This is all that needs
gameMaster.clientConnectServer();
window.onkeydown = function (e) {
    gameMaster.keyPress(e);
};
window.onkeyup = function (e) {
    gameMaster.keyUp(e);
};
document.getElementById('body').addEventListener('mousedown', function (event) {
    event.preventDefault();
    gameMaster.mouseDown(event);
});
document.getElementById('body').addEventListener('mouseup', function (event) {
    event.preventDefault();
    gameMaster.mouseUp(event);
});
gameMaster.updateLoop();
console.log(gameMaster);