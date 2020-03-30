import React, { useEffect, useState } from 'react'
import { useFrame, Dom } from 'react-three-fiber'
import ModelFactory from '../ModelFactory'
import Util from '../Util'

function PlayerView({ player }) {
    const [md2, setMd2] = useState(null)
    const [height, setHeight] = useState(0)

    useEffect(() => {
        ModelFactory.getModelInstance().then(instance => {
            const bbox = Util.computeCompositeBoundingBox(instance.root)

            setHeight(bbox.getSize().y)
            setMd2(instance)
        })
    }, [])

    useFrame(info => {
        if (md2) {
            md2.root.position.set(player.position.x, md2.root.position.y, player.position.z)
            md2.update(.012)
        }
    })

    return (
        <mesh>
            {md2 && 
                <>
                    <primitive object={md2.root} />
                    <Dom center position={[player.position.x, player.position.y, player.position.z]}>
                        <div className="scene-label">{player.name}</div>
                    </Dom>
                </>
            }
        </mesh>
    )
}

export default PlayerView