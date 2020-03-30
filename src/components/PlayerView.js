import React, { useEffect, useState } from 'react'
import { useFrame, Dom } from 'react-three-fiber'
import ModelFactory from '../ModelFactory'
import Util from '../Util'
import './PlayerView.css'

function PlayerView({ player, messages }) {
    const [md2, setMd2] = useState(null)
    const [height, setHeight] = useState(0)

    useEffect(() => {
        ModelFactory.getModelInstance().then(instance => {
            const bbox = Util.computeCompositeBoundingBox(instance.root)

            setHeight(bbox.getSize().y)
            setMd2(instance)

            instance.root.position.set(player.position.x, instance.root.position.y, player.position.z)
        })
    }, [])

    useFrame(info => {
        if (md2) {
            md2.controls.moveForward = player.keyStates['w']
            md2.controls.moveBackward = player.keyStates['s']
            md2.controls.moveLeft = player.keyStates['a']
            md2.controls.moveRight = player.keyStates['d']
            md2.controls.jump = player.keyStates['q']
            md2.controls.attack = player.keyStates['f']
            md2.update(.016)
            player.position.x = md2.root.position.x
            player.position.z = md2.root.position.z
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

                    {messages.map((message, i) => (
                        <Dom key={message.time} center position={[player.position.x, player.position.y + height*1.25, player.position.z]}>
                            <div style={{transform: `translateY(${-i*2.1}rem)`}} className="speech-bubble">{message.message}</div>
                        </Dom>
                    ))}
                </>
            }
        </mesh>
    )
}

export default PlayerView