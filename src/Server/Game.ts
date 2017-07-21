module GameServer {
    export class Game {
        private uuid: string
        private host: any;
        private player_client: any
        private player_count: number


        constructor(uuid: string, host: any, player_client: any, player_count: number) {
            this.uuid = uuid;
            this.host = host;
            this.player_client = player_client;
            this.player_count = player_count;
        }

        getUUID() : string {
            return this.uuid;
        }
    }
}