import React, { useState, useEffect, useRef } from 'react'
import { Shape, Vector2 } from 'three'
import { useUpdate } from 'react-three-fiber'
import MeshEvents from '../MeshEvents'
import Const from '../constants'

function Structure({points, extrusionLine, onPointerMove, onClick, onPointerOut, id, playerMode, setPlayerMode}) {
    const [bPoints, setBPoints] = useState(points)
    const [tPoints, setTPoints] = useState([])
    const [baseShape, setBaseShape] = useState(null)
    const [extrudeSettings, setExtrudeSettings] = useState({steps: 1, depth: 4, bevelThickness: 3, bevelSize: 4, bevelSegments: 4})
    const [hoverFaceIndex, setHoverFaceIndex] = useState(-1)
    const [overMainFace, setOverMainFace] = useState(false)
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
            const validMode = playerMode === Const.PLAYER_MODE_EDIT || playerMode === Const.PLAYER_MODE_DRAG

            if (hack && validMode && hoverFaceIndex >= group.start && hoverFaceIndex <= group.start + group.count) {
                group.materialIndex = 1
                setOverMainFace(true)
            } else {
                group.materialIndex = 0
            }
        }
    }, [bPoints, extrusionLine, hoverFaceIndex, playerMode])

    useEffect(() => {
        const handleMeshMouseMove = e => {
            // faces have three verts a, b, c.
            // We use the first arbitrarily
            setHoverFaceIndex(e.face.a)
        }
        const handlePointerOut = e => {
            setHoverFaceIndex(-1)
        }

        const handleMeshClick = e => {
            if (playerMode === Const.PLAYER_MODE_EDIT && overMainFace) {
                setPlayerMode(Const.PLAYER_MODE_DRAG)
            }
        }

        if (meshRef.current) {
            MeshEvents.listenFor("structure_" + id, {
                [MeshEvents.MOUSE_MOVE]: handleMeshMouseMove,
                [MeshEvents.CLICK]: handleMeshClick,
                [MeshEvents.POINTER_OUT]: handlePointerOut
            }, [meshRef.current.id])
        }
    }, [meshRef.current, overMainFace, playerMode])

    useEffect(() => {
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
    }, [geoRef.current])

    return (
        <>
            {baseShape &&
                <mesh ref={meshRef} rotation-x={Math.PI/2} position-y={2} castShadow receiveShadow onPointerMove={onPointerMove} onClick={onClick} onPointerOut={onPointerOut}>
                    <extrudeBufferGeometry ref={geoRef} attach="geometry" args={[baseShape, extrudeSettings]} />
                    <meshPhysicalMaterial attachArray="material" color={0xffffff} metalness={0.9} roughness={0} clearcoat clearcoatRoughness={0.25} />
                    <meshPhysicalMaterial attachArray="material" color={0x33ff33} metalness={0.9} roughness={0.1} clearcoat clearcoatRoughness={0.25} />
                </mesh>
            }
        </>
    )
}

export default Structure