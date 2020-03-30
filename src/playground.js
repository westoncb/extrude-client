import io from "socket.io-client"
import PGRenderer from './PGRenderer'
import Player from './Player'

const isProduction = process.env.NODE_ENV !== 'development'
const port = 3000
const devURL = "localhost:" + port
const prodURL = "https://nameless-depths-23573.herokuapp.com"
const serverURL = isProduction ? prodURL : devURL

class Playground {
    player = null
    socket = null
    renderer = new PGRenderer()
    state = {players: {}}

    static RECOGNIZED_KEYS = ["a", "w", "s", "d"]
    static KEY_TO_DIRECTION = { a: 'left', w: "up", s: "down", d: "right"}

    constructor(player, setPlayers) {
        this.player = player
        this.setPlayers = setPlayers

        this.connectToServer(this.player)    
    }

    connectToServer(player) {
        this.socket = io(serverURL)
        this.socket.emit("event", { type: "player_enter_request", player })

        this.socket.on("event", data => {
            console.log("server event: ", data)

            this.handleServerEvent(data)
        })
    }

    handleServerEvent(event) {
        switch (event.type) {
            case "player_enter":
                console.log("player_enter: ", event.player)
                this.state.players[event.player.id] = event.player
                this.setPlayers(this.getPlayersArray())
                break;
            case "player_exit":
                delete this.state.players[event.player.id]
                this.setPlayers(this.getPlayersArray())
                break;
            case "full_state_request":
                this.socket.emit("event", { type: "full_state_response", state: this.state})
                break;
            case "full_state_update":
                this.state = event.state
                this.setPlayers(this.getPlayersArray())
                break;
            case "input_key_down":
                this.serverKeyDown(event)
                break;
            case "input_key_up":
                this.serverKeyUp(event)
                break;
            case "input_mouse_move":

                break;
            case "input_click":

                break;
            case "player_message":

                const player = this.state.players[event.playerId]
                this.state.players[event.playerId] = Player.addMessage(player, event.message)

                setTimeout(() => {
                    this.state.players[event.playerId] = Player.removeOldestMessage(player)
                }, 3000)
                break;
            default:
                console.log("unrecognized server event: ", event)
                break;
        }
    }

    getPlayersArray() {
        return Object.keys(this.state.players).map(key => this.state.players[key])
    }

    /////
    // Server event handlers
    ////

    serverKeyDown(event) {
        this.renderer.startPlayerMovement(event.playerId, Playground.KEY_TO_DIRECTION[event.key])
    }

    serverKeyUp(event) {
        this.renderer.stopPlayerMovement(event.playerId, Playground.KEY_TO_DIRECTION[event.key])
    }

    /////
    // Local input handlers
    ////

    localKeyDown(e) {
        const key = e.key

        if (!Playground.RECOGNIZED_KEYS.includes(key))
            return

        this.socket.emit("event", { type: "input_key_down", playerId: this.player.id, key })
    }

    localKeyUp(e) {
        const key = e.key

        if (!Playground.RECOGNIZED_KEYS.includes(key))
            return

        this.socket.emit("event", { type: "input_key_up", playerId: this.player.id, key })
    }

    localMouseMove(e) {
        this.socket.emit("event", { type: "input_mouse_move", playerId: this.player.id })
    }

    localClick(e) {
        this.socket.emit("event", { type: "input_click", playerId: this.player.id})
    }
}

export default Playground