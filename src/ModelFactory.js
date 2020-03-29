import { MD2CharacterComplex } from 'three/examples/jsm/misc/MD2CharacterComplex.js';

const MD2_SCALE = 4
const MD2_CONTROLS = {
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
    crouch: false,
    jump: false,
    attack: false
}

class ModelFactory {
    static base
    static skinCount
    static instanceIndex = 1

    static init() {
        

        const configOgro = {

            baseUrl: "models/ogro/",

            body: "ogro.md2",
            skins: ["grok.jpg", "ogrobase.png", "arboshak.png", "ctf_r.png", "ctf_b.png", "darkam.png", "freedom.png",
                "gib.png", "gordogh.png", "igdosh.png", "khorne.png", "nabogro.png",
                "sharokh.png"],
            weapons: [["weapon.md2", "weapon.jpg"]],
            animations: {
                move: "run",
                idle: "stand",
                jump: "jump",
                attack: "attack",
                crouchMove: "cwalk",
                crouchIdle: "cstand",
                crouchAttach: "crattack"
            },

            walkSpeed: 350,
            crouchSpeed: 175

        }

        this.skinCount = configOgro.skins.length

        this.base = new MD2CharacterComplex()
        this.base.scale = MD2_SCALE;
        this.basePromise = new Promise((resolve, reject) => {
            this.base.onLoadComplete = () => {
                this.base.enableShadows(true)
                this.base.setWeapon(0);
                this.base.setSkin(2);
                resolve(this.base)
            }
        })
        this.base.loadParts(configOgro);
    }

    static async getInstance(skin = this.instanceIndex+=2 % this.skinCount) {
        const instance = new MD2CharacterComplex()
        instance.scale = MD2_SCALE
        instance.controls = this.getControlsCopy()
        instance.id = Math.random()

        return await this.basePromise.then(base => {
            instance.shareParts(base)
            instance.enableShadows(true);
            instance.setWeapon(0)
            instance.setSkin(skin)

            return instance
        })
    }

    static getControlsCopy() {
        const controls = {}
        Object.keys(MD2_CONTROLS).forEach(key => controls[key] = MD2_CONTROLS[key])
        return controls
    }
}

ModelFactory.init()

export default ModelFactory