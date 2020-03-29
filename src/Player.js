import React, {useMemo} from 'react'
import { MD2CharacterComplex } from 'three/examples/jsm/misc/MD2CharacterComplex.js';
import Util from './Util'

function Player({id, name}) {

    const model = useMemo(() => {
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

        };

        const character = new MD2CharacterComplex()
        character.scale = 4;
        character.onLoadComplete = () => {
            const bbox = Util.computeCompositeBoundingBox(character.root)

            character.root.position.set(Util.rand(-250, 250), bbox.getSize().y / 2, Util.rand(-250, 250) + 400)
            character.enableShadows(true)
            character.setWeapon(0);
            character.setSkin(2);
        }
        character.loadParts(configOgro);

        return character.root
    }, [])

    return (
        <mesh>
            <primitive object={model} position={[0, 0, 0]} />
        </mesh>
    )
}

export default Player