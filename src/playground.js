import io from "socket.io-client"
import Player from './PlayerData'
import {throttle} from 'lodash-es'

const isProduction = process.env.NODE_ENV !== 'development'
const port = 3000
const devURL = "localhost:" + port
const prodURL = "https://nameless-depths-23573.herokuapp.com"
const serverURL = isProduction ? prodURL : devURL

class Playground {
    localPlayerId
    socket = null
    state = {players: {}}
    messages = []

    static RECOGNIZED_KEYS = ["a", "w", "s", "d", "f", "e", "q", " "]
    static KEY_TO_DIRECTION = { a: 'left', w: "up", s: "down", d: "right"}

    constructor(player, updatePlayers, updateMessagesFunc) {
        this.localPlayerId = player.id
        this.updatePlayers = updatePlayers
        this.updateMessagesFunc = updateMessagesFunc
        this.state.players[player.id] = player

        this.connectToServer(player)
    }

    connectToServer(player) {
        this.socket = io(serverURL)
        this.socket.emit("event", { type: "player_enter_request", player })

        this.socket.on("event", data => {
            // console.log("server event: ", data)

            this.handleServerEvent(data)
        })

        this.socket.on("disconnect", data => {
            // This is a hack: it's not a server event, but we
            // want to use the same logic for now
            this.handleServerEvent({type: "player_exit", player})
        })

        this.socket.on("reconnect", data => {
            this.socket.emit("event", { type: "player_enter_request", player })
        })

        this.sendMouseMove = throttle(() => this.socket.emit("event", { type: "player_target_change", playerId: this.localPlayerId, target: this.getLocalPlayer().target }), 500)
    }

    handleServerEvent(event) {
        
        let player
        if (event.playerId)
            player = this.state.players[event.playerId]

        switch (event.type) {
            case "player_enter":
                console.log("player_enter: ", event.player)
                this.state.players[event.player.id] = event.player
                this.updatePlayers(this.getPlayersArray())
                break;
            case "player_exit":
                if (this.state.players[event.player.id] && event.player.id !== this.localPlayerId) {
                    delete this.state.players[event.player.id]
                    this.updatePlayers(this.getPlayersArray())
                }
                break;
            case "full_state_request":
                this.socket.emit("event", { type: "full_state_response", state: this.state})
                break;
            case "full_state_update":
                this.state = event.state
                this.updatePlayers(this.getPlayersArray())
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
            case "chat_message":
                if ((event.playerId && !this.state.players[event.playerId])) {
                    break
                }

                const message = {...event, player}
                const messageDisplayTime = 5000 + (1000 * Math.floor(message.message.length / 100))
                this.state.players = { ...this.state.players, [event.playerId]: Player.addMessage(player, message)}

                setTimeout(() => {
                    this.state.players = { ...this.state.players, [event.playerId]: Player.removeOldestMessage(this.state.players[event.playerId])}
                    this.updatePlayers(Object.values(this.state.players))
                }, messageDisplayTime)

                this.messages = this.messages.concat(message)
                this.updateMessagesFunc(this.messages)
                this.updatePlayers(Object.values(this.state.players))
                break;
            case "player_target_change":
                if ((event.playerId && !this.state.players[event.playerId])) {
                    break
                }

                this.state.players = { ...this.state.players, [event.playerId]: {...player, target: event.target} }
                this.updatePlayers(Object.values(this.state.players))
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
        if (event.playerId === this.localPlayerId)
            return

        const key = event.key
        this.state.players[event.playerId].keyStates[key] = true
    }

    serverKeyUp(event) {
        if (event.playerId === this.localPlayerId)
            return

        const key = event.key
        this.state.players[event.playerId].keyStates[key] = false
    }

    /////
    // Local input handlers
    ////

    localKeyDown(e) {
        const key = e.key

        if (!Playground.RECOGNIZED_KEYS.includes(key))
            return

        this.state.players[this.localPlayerId].keyStates[key] = true

        this.socket.emit("event", { type: "input_key_down", playerId: this.localPlayerId, key })
    }

    localKeyUp(e) {
        const key = e.key

        if (!Playground.RECOGNIZED_KEYS.includes(key))
            return

        this.state.players[this.localPlayerId].keyStates[key] = false

        this.socket.emit("event", { type: "input_key_up", playerId: this.localPlayerId, key })
    }

    localMouseMove(e) {
        this.sendMouseMove()
    }

    localClick(e) {
        this.socket.emit("event", { type: "input_click", playerId: this.localPlayerId})
    }

    sendChatMessage(message) {
        this.socket.emit("event", {type: "chat_message", message, playerId: this.localPlayerId, time: new Date()})
    }

    getLocalPlayer() {
        return this.state.players[this.localPlayerId]
    }
}

export default Playground