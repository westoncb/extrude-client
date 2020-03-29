import io from "socket.io-client"
import PGRenderer from './PGRenderer'

const isProduction = process.env.NODE_ENV !== 'development'
const port = 3000
const devURL = "localhost:" + port
const prodURL = "https://nameless-depths-23573.herokuapp.com"
const serverURL = isProduction ? prodURL : devURL

class Playground {
    player = null
    socket = null
    renderer = new PGRenderer()
    allPlayers = []

    static RECOGNIZED_KEYS = ["a", "w", "s", "d"]
    static KEY_TO_DIRECTION = { a: 'left', w: "up", s: "down", d: "right"}

    constructor(setPlayers) {
        this.player = {id: 1, name: "weston"}
        this.setPlayers = setPlayers

        console.log("CONSTRUCT!!!")

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
                this.allPlayers = this.allPlayers.concat(event.player)

                console.log("test", this.setPlayers, this.allPlayers)
                if (this.setPlayers) {
                    this.setPlayers(this.allPlayers)
                }
                break;
            case "player_exit":
                
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
            default:
                console.log("unrecognized server event: ", event)
                break;
        }
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