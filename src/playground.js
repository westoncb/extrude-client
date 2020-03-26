import {Object3D} from 'three'
import io from "socket.io-client"

class Playground {
    root = new Object3D()
    player = null
    socket = null

    constructor(player) {
        this.player = player

        this.socket = io("http://localhost:3000")
        this.socket.emit("player_action", {test: "testlblah"})

        this.socket.once("player_event", data => {
            console.log("player_event", data)
        })
    }
}

export default Playground