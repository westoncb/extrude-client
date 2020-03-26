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
        this.socket.emit("player_input", {test: "testlblah"})

        this.socket.on("player_input_relay", data => {
            switch (data.input_type) {
                case "key_down":
                    this.serverKeyDown(data.key)
                    break;
                case "key_up":
                    this.serverKeyUp(data.key)
                    break;
                case "mouse_move":

                    break;
                case "click":

                    break;
                default:
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

        this.socket.emit("player_input", { input_type: "key_down", key })
    }

    handleKeyUp(e) {
        const key = e.key

        if (!Playground.RECOGNIZED_KEYS.includes(key))
            return

        this.socket.emit("player_input", { input_type: "key_up", key })
    }

    handleMouseMove(e) {
        this.socket.emit("player_input", { input_type: "mouse_move" })
    }

    handleClick(e) {
        this.socket.emit("player_input", {input_type: "click"})
    }
}

export default Playground