import React, { useState, useEffect } from 'react'
import { Shape, Vector2 } from 'three'

function Structure({points, extrusionLine}) {
    const [bPoints, setBPoints] = useState(points)
    const [tPoints, setTPoints] = useState([])
    const [baseShape, setBaseShape] = useState(null)
    const [extrudeSettings, setExtrudeSettings] = useState({steps: 1, depth: 8})

    useEffect(() => {
        const extrusionOffset = extrusionLine.end.clone().sub(extrusionLine.start)
        setTPoints(bPoints.map(p => p.clone().add(extrusionOffset)))

        setBaseShape(new Shape(bPoints.map(p => new Vector2(p.x, p.z))))

        console.log("baseShape", baseShape)
    }, [bPoints, extrusionLine])

    return (
        <>
            {baseShape &&
                <mesh rotation-x={Math.PI/2} position-y={4} castShadow>
                    <extrudeBufferGeometry attach="geometry" args={[baseShape, extrudeSettings]} />
                <meshPhysicalMaterial attach="material" color={0xffffff} metalness={0.9} roughness={0} clearcoat clearcoatRoughness={0.5} />
                    {/* <meshPhysicalMaterial attach="material" color={0x000000} metalness={1} roughness={0} clearcoat clearcoatRoughness={0.25} /> */}
                </mesh>
            }
        </>
    )
}

export default Structure