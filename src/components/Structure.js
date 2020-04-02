import React, { useState, useEffect, useRef } from 'react'
import { Shape, Vector2 } from 'three'
import { useUpdate } from 'react-three-fiber'
import MeshEvents from '../MeshEvents'

function Structure({points, extrusionLine, onPointerMove, onClick}) {
    const [bPoints, setBPoints] = useState(points)
    const [tPoints, setTPoints] = useState([])
    const [baseShape, setBaseShape] = useState(null)
    const [extrudeSettings, setExtrudeSettings] = useState({steps: 1, depth: 8})
    const [clickedIndex, setClickedIndex] = useState(-1)
    const [restructured, setRestructured] = useState(false)
    const meshRef = useRef()

    useEffect(() => {
        const extrusionOffset = extrusionLine.end.clone().sub(extrusionLine.start)
        setTPoints(bPoints.map(p => p.clone().add(extrusionOffset)))

        setBaseShape(new Shape(bPoints.map(p => new Vector2(p.x, p.z))))
    }, [bPoints, extrusionLine])

    const geoRef = useUpdate(geo => {
        if (!restructured) {
            const groups = []

            groups.push({ start: 0, count: (points.length - 2) * 6, materialIndex: 0 })

            for (let i = 0; i < points.length; i++) {
                const start = (points.length - 2) * 6 + i * 42
                groups.push({ start, count: 42, materialIndex: 0 })
            }

            geo.clearGroups()
            groups.forEach(g => geo.addGroup(g.start, g.count, g.materialIndex))
            setRestructured(true)
        }

        if (clickedIndex > -1) {
            for (let i = 0; i < geo.groups.length; i++) {
                const group = geo.groups[i]
                if (clickedIndex >= group.start && clickedIndex <= group.start + group.count) {
                    group.materialIndex = 1
                } else {
                    group.materialIndex = 0
                }
            }
        }
    }, [bPoints, extrusionLine, clickedIndex])

    useEffect(() => {
        const handleMeshMouseMove = e => {
            if (e.object.id !== meshRef.current.id) {
                setClickedIndex(-1)
                return
            }
            setClickedIndex(e.face.a)
        }

        const handleMeshClick = e => {
            console.log("CLICK", e)
            if (e.object.id !== meshRef.current.id)
                return

            setClickedIndex(e.faceIndex)
        }

        MeshEvents.listenFor("partial_structure", {
            [MeshEvents.MOUSE_MOVE]: handleMeshMouseMove,
            [MeshEvents.CLICK]: handleMeshClick,
        })
    }, [])

    return (
        <>
            {baseShape &&
                <mesh ref={meshRef} rotation-x={Math.PI/2} position-y={4} castShadow onPointerMove={onPointerMove} onClick={onClick}>
                    <extrudeBufferGeometry ref={geoRef} attach="geometry" args={[baseShape, extrudeSettings]} />
                    <meshPhysicalMaterial attachArray="material" color={0xffffff} metalness={0.9} roughness={0} clearcoat clearcoatRoughness={0.25} />
                    <meshPhysicalMaterial attachArray="material" color={0x33ff33} metalness={0.9} roughness={0.1} clearcoat clearcoatRoughness={0.25} />
                </mesh>
            }
        </>
    )
}

export default Structure