var GameServer;
(function (GameServer) {
    class Game {
        constructor(uuid, host, player_client, player_count) {
            this.uuid = uuid;
            this.host = host;
            this.player_client = player_client;
            this.player_count = player_count;
        }
        getUUID() {
            return this.uuid;
        }
    }
    GameServer.Game = Game;
})(GameServer || (GameServer = {}));
//# sourceMappingURL=Game.js.map