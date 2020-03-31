import  {Vector3} from "three"
import Util from './Util'

const player_skin_count = 13

class Player {

    static create(name = Util.randString(Util.rand(3, 12))) {
        return  {
                    name,
                    id: ""+Math.round(Math.random() * 10000), //Important this is a string!
                    position: new Vector3(Util.rand(-100, 100), 0, Util.rand(-100, 100)),
                    visibleMessages: [],
                    keyStates: {},
                    target: new Vector3(),
                    skindex: (name.length * 5003) % player_skin_count
                }
    }

    static addMessage(player, message) {
        const newPlayer = {...player, visibleMessages: [...player.visibleMessages, message]}
        return newPlayer
    }

    static removeOldestMessage(player) {
        const visibleMessages = player.visibleMessages.slice()
        visibleMessages.shift()
        return {...player, visibleMessages}
    }
}

export default Player