import  {Vector3} from "three"
import Util from './Util'

class Player {

    static create(name = Util.randString(5)) {
        return  {
                    name,
                    id: Math.round(Math.random() * 10000),
                    position: new Vector3(Util.rand(-250, 250), 0, Util.rand(-250, 250))
                }
    }

    static addMessage(player, message) {
        const newPlayer = {...player, visibleMessages: [...player.visibleMessages, message]}
        return newPlayer
    }

    static removeOldestMessage(player) {
        const visibleMessages = Player.visibleMessages.slice()
        visibleMessages.unshift()
        return {...player, visibleMessages}
    }
}

export default Player