import  {Vector3} from "three"
import Util from './Util'

class Player {

    static create(name = Util.randString(5)) {
        return  {
                    name,
                    id: ""+Math.round(Math.random() * 10000), //Important this is a string!
                    position: new Vector3(Util.rand(-250, 250), 0, Util.rand(-250, 250)),
                    visibleMessages: []
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