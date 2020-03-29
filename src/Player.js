import React, { useMemo, useState } from 'react'
import { MD2CharacterComplex } from 'three/examples/jsm/misc/MD2CharacterComplex.js';
import { useFrame } from 'react-three-fiber'
import { Clock } from 'three'
import ModelFactory from './ModelFactory'
import Util from './Util'

const clock = new Clock();

function Player({ player}) {
    const [md2, setMd2] = useState(null)

    useMemo(() => {
        ModelFactory.getInstance().then(instance => {
            setMd2(instance)
        })
    }, [])

    useFrame(() => {
        var delta = clock.getDelta();
        md2.root.position.set(player.position.x, player.position.y, player.position.z)
        md2.update(delta)
    })

    return (
        <mesh>
            {md2 && 
                <primitive object={md2.root} />
            }
        </mesh>
    )
}

export default Player