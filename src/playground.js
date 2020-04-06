import io from "socket.io-client"
import Player from './PlayerData'
import {throttle} from 'lodash-es'
import { useRef, useEffect, useReducer, useMemo } from "react"

const isProduction = process.env.NODE_ENV !== 'development'
const port = 3000
const devURL = "localhost:" + port
const prodURL = "https://nameless-depths-23573.herokuapp.com"
const serverURL = isProduction ? prodURL : devURL
const PERIODIC_SYNC_TIME = 2000
const TARGET_UPDATE_THROTTLE = 1000

const initialState = {players: {}, structures: {}}
const RECOGNIZED_KEYS = ["a", "w", "s", "d", "f", "e", "q", " ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]

function reducer(state, action) {
    let playerId = action.playerId || (action.player ? action.player.id : undefined)
    let player = playerId ? state.players[playerId] : undefined
    

    switch (action.type) {
        case "update_player":
            console.assert(playerId !== undefined, "Undefined playerId; required for:", action)
            return {...state, players: {...state.players, [playerId]: action.player}}
        case "remove_player":
            console.assert(playerId !== undefined, "Undefined playerId; required for:", action)
            const tempState = { ...state }
            delete tempState.players[playerId]
            return tempState
        case "update_local_player":
            console.assert(playerId !== undefined, "Undefined playerId; required for:", action)
            return { ...state, localPlayerId: playerId, players: { ...state.players, [playerId]: action.player } }
        case "update_structure":
            return { ...state, structures: { ...state.structures, [action.structure.id]: action.structure } }
        case "replace_state":
            return action.state
        case "update_player_key_state":
            console.assert(playerId !== undefined, "Undefined playerId; required for:", action)
            return { ...state, players: { ...state.players, [playerId]: { ...player, keyStates: { ...player.keyStates, [action.key]: action.state}}}}
        case "add_player_message":
            console.assert(playerId !== undefined, "Undefined playerId; required for:", action)
            return { ...state, players: { ...state.players, [playerId]: { ...player, visibleMessages: [...player.visibleMessages, action.message] } } }
        case "remove_oldest_player_message":
            console.assert(playerId !== undefined, "Undefined playerId; required for:", action)
            const visibleMessages = player.visibleMessages.slice()
            visibleMessages.shift()
            return { ...state, players: { ...state.players, [playerId]: { ...player, visibleMessages }}}
        case "update_player_target":
            console.assert(playerId !== undefined, "Undefined playerId; required for:", action)
            return { ...state, players: { ...state.players, [playerId]: { ...player, target: action.target} } }
        default:
            console.log("unrecognized action: ", action)
            return state
    }
}

function usePlayground() {
    const [state, dispatch] = useReducer(reducer, initialState)
    const socketRef = useRef()

    useEffect(() => {
        if (socketRef.current) {
            const socket = socketRef.current
            const localPlayer = state.players[state.localPlayerId]

            initSocketEventHandlers(socket, state, dispatch)

            const periodicSyncInterval = setInterval(() => {
                socketRef.current.emit("event", { type: "update_player", player: localPlayer })
            }, PERIODIC_SYNC_TIME)

            return () => {
                clearInterval(periodicSyncInterval)
            }
        }
    }, [state])

    const throttledEmit = useMemo(() => {
        return throttle(data => socketRef.current.emit("event", data, TARGET_UPDATE_THROTTLE))
    }, [])

    const execute = useMemo(() => {
        return (actionType, data) => {
            executeAction({type: actionType, ...data}, socketRef, state, dispatch, throttledEmit)
        }
    }, [dispatch, state, throttledEmit])

    return {
        execute,
        state
    }
}

function initSocketEventHandlers(socket, state, dispatch) {
    const localPlayerId = state.localPlayerId
    const localPlayer = localPlayerId ? state.players[localPlayerId] : undefined

    socket.removeListener("event")
    socket.removeListener("disconnect")
    socket.removeListener("reconnect")

    socket.on("event", data => {
        handleServerEvent(data, state, dispatch, socket)
    })

    socket.on("disconnect", data => {
        // This is a hack: it's not a server event, but we
        // want to use the same logic for now
        handleServerEvent({ type: "player_exit", localPlayer })
    })

    socket.on("reconnect", data => {
        socket.emit("event", { type: "player_enter_request", localPlayer })
    })
}

function executeAction(action, socketRef, state, dispatch, throttledEmit) {
    const socket = socketRef.current
    const localPlayerId = state.localPlayerId
    const localPlayer = localPlayerId ? state.players[localPlayerId] : undefined

    console.assert(socketRef.current || action.type === "initialize", "tried executing action before initialization: ", action.type)

    // console.log("execute_action: ", action)

    switch (action.type) {
        case "initialize":

            socketRef.current = io(serverURL)
            dispatch({type: "update_local_player", player: action.player})
            socketRef.current.emit("event", { type: "player_enter_request", player: action.player })
            break;
        case "key_down":

            if (!RECOGNIZED_KEYS.includes(action.key))
                return

            dispatch({ type: "update_player_key_state", key: action.key, state: true, playerId: localPlayerId})
            socket.emit("event", { type: "input_key_down", playerId: localPlayerId, key: action.key })
            break;
        case "key_up":

            if (!RECOGNIZED_KEYS.includes(action.key))
                return

            dispatch({ type: "update_player_key_state", key: action.key, state: false, playerId: localPlayerId})
            socket.emit("event", { type: "input_key_up", playerId: localPlayerId, key: action.key })
            break;
        case "update_player_target":
            dispatch({ type: "update_player_target", playerId: localPlayerId, target: action.target })
            throttledEmit({ type: "player_target_change", playerId: localPlayerId, target: action.target })
            break;
        case "send_chat_message":
            socket.emit("event", { type: "chat_message", message: action.message, playerId: localPlayerId, time: new Date() })
            break;
        case "update_structure":
            dispatch(action)
            socket.emit("event", {...action, playerId: localPlayerId})
            break;
        case "update_player":
            dispatch(action)
            socket.emit("event", action)
            break;
        default:
            new Error("unrecognized action:", action)
            break;
    }
}

function handleServerEvent(event, state, dispatch, socket) {

    const localPlayerId = state.localPlayerId
    const localPlayer = localPlayerId ? state.players[localPlayerId] : undefined

    // console.log("server event:", event)

    switch (event.type) {
        case "player_enter":
            console.log("player_enter: ", event.player)
            dispatch({type: "update_player", player: event.player})
            break;
        case "player_exit":
            console.log("player_exit: ", event.player)
            if (state.players[event.player.id] && event.player.id !== localPlayerId) {
                dispatch({ type: "remove_player", playerId: event.player.id})
            }
            break;
        case "full_state_request":
            socket.emit("event", { type: "full_state_response", state })
            break;
        case "full_state_update":
            dispatch({ type: "replace_state", state: { ...event.state, localPlayerId}})
            break;
        case "input_key_down":
            if (event.playerId === localPlayerId)
                return

            dispatch({ type: "update_player_key_state", key: event.key, state: true, playerId: event.playerId})
            break;
        case "input_key_up":
            if (event.playerId === localPlayerId)
                return

            dispatch({ type: "update_player_key_state", key: event.key, state: false, playerId: event.playerId })
            break;
        case "chat_message":

            if ((event.playerId && !state.players[event.playerId])) {
                break
            }


            const messageDisplayTime = 5000 + (1000 * Math.floor(event.message.length / 100))
            dispatch({ type: "add_player_message", playerId: event.playerId, message: {...event}})

            setTimeout(() => {
                dispatch({ type: "remove_oldest_player_message", playerId: event.playerId})
            }, messageDisplayTime)
            
            break;
        case "player_target_change":
            if ((event.playerId && !state.players[event.playerId]) || event.playerId === state.localPlayerId) {
                break
            }

            dispatch({type: "update_player_target", playerId: event.playerId, target: event.target})
            break;
        case "update_player":

            if (event.player.id === localPlayerId)
                break
            dispatch({type: "update_player", player: event.player})
            break;
        case "update_structure":
            if (event.playerId === localPlayerId)
                break
            dispatch({ type: "update_structure", structure: event.structure})
            break;
        default:
            console.log("unrecognized server event: ", event)
            break;
        }
}

export default usePlayground