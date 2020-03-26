import {Object3D} from 'three'
import io from "socket.io-client"

class Playground {
    root = new Object3D()
    player = null
    socket = null

    static RECOGNIZED_KEYS = ['a', "w", "s", "d"]

    constructor(player) {
        this.player = player

        this.socket = io("http://localhost:3000")
        this.socket.emit("event", { type: "player_enter_request"})

        this.socket.on("event", data => {
            console.log("server event: ", data)

            switch (data.type) {
                case "player_enter":
                    this.serverKeyDown(data.key)
                    break;
                case "player_exit":
                    this.serverKeyDown(data.key)
                    break;
                case "input_key_down":
                    this.serverKeyDown(data.key)
                    break;
                case "input_key_up":
                    this.serverKeyUp(data.key)
                    break;
                case "input_mouse_move":

                    break;
                case "input_click":

                    break;
                default:
                    console.log("unrecognized server event: ", data)
                    break;
            }
        })
    }

    serverKeyDown(key) {

    }

    serverKeyUp(key) {

    }

    handleKeyDown(e) {
        const key = e.key

        if (!Playground.RECOGNIZED_KEYS.includes(key))
            return

        this.socket.emit("event", { type: "input_key_down", key })
    }

    handleKeyUp(e) {
        const key = e.key

        if (!Playground.RECOGNIZED_KEYS.includes(key))
            return

        this.socket.emit("event", { type: "input_key_up", key })
    }

    handleMouseMove(e) {
        this.socket.emit("event", { type: "input_mouse_move" })
    }

    handleClick(e) {
        this.socket.emit("event", { type: "input_click"})
    }
}

export default Playground