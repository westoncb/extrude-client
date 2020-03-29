import  {Vector3} from "three"
import Util from './Util'

class Player {
    static generatePlayer(name = Util.randString(5)) {
        return { name, id: ""+Math.round(Math.random() * 10000), position: new Vector3(Util.rand(-250, 250), 0, Util.rand(-250, 250)) }
    }
}

export default Player