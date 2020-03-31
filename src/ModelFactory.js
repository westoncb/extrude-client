import { MD2CharacterComplex } from 'three/examples/jsm/misc/MD2CharacterComplex.js';
import { MathUtils, Vector3 } from 'three'
import Util from './Util'

const WEAPONS_ENABLED = true
const MD2_SCALE = 1
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
    static instanceIndex = 2

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

            walkSpeed: 800,
            crouchSpeed: 175
        }

        this.skinCount = configOgro.skins.length

        this.base = new MD2CharacterComplex()
        this.base.scale = MD2_SCALE;
        this.basePromise = new Promise((resolve, reject) => {
            this.base.onLoadComplete = () => {
                this.base.enableShadows(true)
                this.base.setSkin(2);
                resolve(this.base)
            }
        })
        this.base.loadParts(configOgro);
    }

    static customizeMovement(instance) {

        // We use this to override a function defined
        // on MD2CharacterComplex
        const customUpdateMovementModel = self => {
            return delta => {
                self.angularSpeed = 4
                var controls = self.controls;

                // Rotate toward 'target' (where ray cast from cursor hits scene object)
                const forwardVec = new Vector3(0, 0, 1).applyAxisAngle(new Vector3(0, 1, 0), self.bodyOrientation)
                const target = new Vector3(self.target.x, self.target.y, self.target.z)
                const toTarget = target.clone().sub(self.root.position).normalize()
                toTarget.y = 0
                const rotationGap = forwardVec.cross(toTarget).y
                self.bodyOrientation += rotationGap * delta * 10

                // Animate while turning
                if (Math.abs(rotationGap) > 0.2) {
                    self.speed = rotationGap * delta * 10
                    if (rotationGap < 0)
                        controls.moveLeft = true
                    else
                        controls.moveRight = true
                } else {
                    controls.moveLeft = false
                    controls.moveRight = false
                }

                // speed based on controls

                if (controls.crouch) self.maxSpeed = self.crouchSpeed;
                else self.maxSpeed = self.walkSpeed;

                self.maxReverseSpeed = - self.maxSpeed;

                if (controls.moveForward) self.speed = self.maxSpeed//MathUtils.clamp(self.speed + delta * self.frontAcceleration, self.maxReverseSpeed, self.maxSpeed);
                if (controls.moveBackward) self.speed = self.maxReverseSpeed//MathUtils.clamp(self.speed - delta * self.backAcceleration, self.maxReverseSpeed, self.maxSpeed);

                // speed decay

                if (!(controls.moveForward || controls.moveBackward)) {

                    if (self.speed > 0) {

                        const k = Util.exponentialEaseOut(self.speed / self.maxSpeed);
                        self.speed = MathUtils.clamp(self.speed - k * delta * self.frontDecceleration, 0, self.maxSpeed);

                    } else {

                        const k = Util.exponentialEaseOut(self.speed / self.maxReverseSpeed);
                        self.speed = MathUtils.clamp(self.speed + k * delta * self.backAcceleration, self.maxReverseSpeed, 0);

                    }

                }

                // displacement

                const forwardDelta = self.speed * delta / 10;

                self.root.position.x += Math.sin(self.bodyOrientation) * forwardDelta;
                self.root.position.z += Math.cos(self.bodyOrientation) * forwardDelta;

                // steering

                self.root.rotation.y = self.bodyOrientation;
            }
        }

        instance.updateMovementModel = customUpdateMovementModel(instance)
    }

    static async getModelInstance(skin = this.instanceIndex) {
        this.instanceIndex = (this.instanceIndex + 1) % this.skinCount

        const instance = new MD2CharacterComplex()
        instance.scale = MD2_SCALE
        instance.controls = this.getControlsCopy()
        instance.id = Math.random()
        this.customizeMovement(instance)

        return await this.basePromise.then(base => {
            instance.shareParts(base)
            instance.enableShadows(true);
            instance.setSkin(skin)
            instance.target = new Vector3()

            if (WEAPONS_ENABLED)
                instance.setWeapon(0)

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