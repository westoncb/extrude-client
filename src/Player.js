import React, { useMemo, useState } from 'react'
import { MD2CharacterComplex } from 'three/examples/jsm/misc/MD2CharacterComplex.js';
import { useFrame } from 'react-three-fiber'
import { Clock } from 'three'
import Util from './Util'

const clock = new Clock();

function Player({ player}) {
    const [md2Controls, setMd2Controls] = useState({
        moveForward: false,
        moveBackward: false,
        moveLeft: false,
        moveRight: false,
        crouch: false,
        jump: false,
        attack: false
    })

    const md2 = useMemo(() => {
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
            character.root.position.set(player.position.x, 0, player.position.z)
            character.enableShadows(true)
            character.setWeapon(0);
            character.setSkin(2);
            character.controls = md2Controls
        }
        character.loadParts(configOgro);

        return character
    }, [])

    useFrame(() => {
        var delta = clock.getDelta();
        md2.root.position.set(player.position.x, player.position.y, player.position.z)

        md2.controls = md2Controls
        md2.update(delta)
    })

    return (
        <mesh>
            <primitive object={md2.root} />
        </mesh>
    )
}

export default Player