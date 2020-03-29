import React, { useMemo, useState } from 'react'
import { useFrame } from 'react-three-fiber'
import { Clock } from 'three'
import ModelFactory from '../ModelFactory'
import Util from '../Util'

const clock = new Clock();

function PlayerModel({ player}) {
    const [md2, setMd2] = useState(null)
    const [height, setHeight] = useState(0)

    useMemo(() => {
        ModelFactory.getInstance().then(instance => {
            const bbox = Util.computeCompositeBoundingBox(instance.root)

            setHeight(bbox.getSize().y)
            setMd2(instance)
        })
    }, [])

    useFrame(info => {
        if (md2) {
            md2.root.position.set(player.position.x, height / 2 - 15, player.position.z)
            md2.update(.012)
        }
    })

    return (
        <mesh>
            {md2 && 
                <primitive object={md2.root} />
            }
        </mesh>
    )
}

export default PlayerModel