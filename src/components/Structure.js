import React, { useState, useEffect, useRef } from 'react'
import { Shape, Vector2 } from 'three'
import { useUpdate } from 'react-three-fiber'
import MeshEvents from '../MeshEvents'

function Structure({points, extrusionLine, onPointerMove, onClick, onPointerOut, id}) {
    const [bPoints, setBPoints] = useState(points)
    const [tPoints, setTPoints] = useState([])
    const [baseShape, setBaseShape] = useState(null)
    const [extrudeSettings, setExtrudeSettings] = useState({steps: 1, depth: 8})
    const [hoverFaceIndex, setHoverFaceIndex] = useState(-1)
    const meshRef = useRef()

    useEffect(() => {
        const extrusionOffset = extrusionLine.end.clone().sub(extrusionLine.start)
        setTPoints(bPoints.map(p => p.clone().add(extrusionOffset)))

        setBaseShape(new Shape(bPoints.map(p => new Vector2(p.x, p.z))))
    }, [bPoints, extrusionLine])

    const geoRef = useUpdate(geo => {
        for (let i = 0; i < geo.groups.length; i++) {
            const group = geo.groups[i]
            
            // Code here is designed to allow selectng any face, but for now
            // we only want the initial (main) face to be selectable so we
            // restrict it with this hack.
            const hack = group.start === 0

            if (hack && hoverFaceIndex >= group.start && hoverFaceIndex <= group.start + group.count) {
                group.materialIndex = 1
            } else {
                group.materialIndex = 0
            }
        }
    }, [bPoints, extrusionLine, hoverFaceIndex])

    useEffect(() => {
        const handleMeshMouseMove = e => {
            setHoverFaceIndex(e.face.a)
        }
        const handlePointerOut = e => {
            setHoverFaceIndex(-1)
        }

        const handleMeshClick = e => {
            
        }

        if (geoRef.current) {
            const geo = geoRef.current
            const groups = []

            groups.push({ start: 0, count: (points.length - 2) * 6, materialIndex: 0 })

            for (let i = 0; i < points.length; i++) {
                const start = (points.length - 2) * 6 + i * 42
                groups.push({ start, count: 42, materialIndex: 0 })
            }

            geo.clearGroups()
            groups.forEach(g => geo.addGroup(g.start, g.count, g.materialIndex))
        }

        if (meshRef.current) {
            MeshEvents.listenFor("structure_" + id, {
                [MeshEvents.MOUSE_MOVE]: handleMeshMouseMove,
                [MeshEvents.CLICK]: handleMeshClick,
                [MeshEvents.POINTER_OUT]: handlePointerOut
            }, [meshRef.current.id])
        }
    }, [meshRef.current, geoRef.current])

    return (
        <>
            {baseShape &&
                <mesh ref={meshRef} rotation-x={Math.PI/2} position-y={4} castShadow receiveShadow onPointerMove={onPointerMove} onClick={onClick} onPointerOut={onPointerOut}>
                    <extrudeBufferGeometry ref={geoRef} attach="geometry" args={[baseShape, extrudeSettings]} />
                    <meshPhysicalMaterial attachArray="material" color={0xffffff} metalness={0.9} roughness={0} clearcoat clearcoatRoughness={0.25} />
                    <meshPhysicalMaterial attachArray="material" color={0x33ff33} metalness={0.9} roughness={0.1} clearcoat clearcoatRoughness={0.25} />
                </mesh>
            }
        </>
    )
}

export default Structure