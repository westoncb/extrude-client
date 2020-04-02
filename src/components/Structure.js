import React, { useState, useEffect, useRef } from 'react'
import { Shape, Vector2, Vector3 } from 'three'
import { useUpdate, useFrame } from 'react-three-fiber'
import MeshEvents from '../MeshEvents'
import Const from '../constants'

const INITIAL_EXTRUSION_DEPTH = 4

function Structure({points, extrusionLine, player, onPointerMove, onClick, onPointerOut, id, playerMode, setPlayerMode}) {
    const [baseShape, setBaseShape] = useState(null)
    const [extrudeSettings, setExtrudeSettings] = useState({steps: 1, depth: INITIAL_EXTRUSION_DEPTH, bevelThickness: 3, bevelSize: 4, bevelSegments: 4})
    const [overMainFace, setOverMainFace] = useState(false)
    const [dragStartPoint, setDragStartPoint] = useState(null)
    const meshRef = useRef()

    useEffect(() => {
        setBaseShape(new Shape(points.map(p => new Vector2(p.x, p.z))))
    }, [points, extrusionLine])

    const geoRef = useUpdate(geo => {
        for (let i = 0; i < geo.groups.length; i++) {
            const group = geo.groups[i]

            const validMode = playerMode === Const.PLAYER_MODE_EDIT || playerMode === Const.PLAYER_MODE_DRAG

            if (validMode && (overMainFace || playerMode === Const.PLAYER_MODE_DRAG) && (group.start + group.count) <= mainPolyVertexCount(points.length)) {
                group.materialIndex = 0
            } else {
                group.materialIndex = 1
            }
        }
    }, [overMainFace, playerMode, extrudeSettings])

    useFrame(() => {
        if (playerMode === Const.PLAYER_MODE_DRAG && dragStartPoint !== null) {
            const dragLine = new Vector3().copy(player.position).sub(dragStartPoint)
            const normal = new Vector3(0, 1, 0) // cheat and set to Y for now
            const projectedDragLine = normal.clone().multiplyScalar(normal.dot(dragLine))

            const newDepth = projectedDragLine.length() + INITIAL_EXTRUSION_DEPTH
            setExtrudeSettings({...extrudeSettings, depth: newDepth})
        }
    })

    useEffect(() => {
        const handleMeshMouseMove = e => {
            // faces have three verts a, b, c.
            // We use the first arbitrarily
            const hoverFaceIndex = e.face.a

            if (hoverFaceIndex >= 0 && hoverFaceIndex <= mainPolyVertexCount(points.length)) {
                setOverMainFace(true)
            } else {
                setOverMainFace(false)
            }
        }
        const handlePointerOut = e => {
            setOverMainFace(false)
        }

        const handleMeshClick = e => {
            if (playerMode === Const.PLAYER_MODE_EDIT && overMainFace) {
                setPlayerMode(Const.PLAYER_MODE_DRAG)
                setDragStartPoint(new Vector3().copy(player.position))
            } else if (playerMode === Const.PLAYER_MODE_DRAG) {
                setPlayerMode(Const.PLAYER_MODE_EDIT)
                setDragStartPoint(null)
                setOverMainFace(false)
            }
        }

        if (!overMainFace && geoRef.current) {
            const geo = geoRef.current
            for (let i = 0; i < geo.groups.length; i++) {
                const group = geo.groups[i]
                group.materialIndex = 1
            }
        }

        if (meshRef.current) {
            MeshEvents.listenFor("structure_" + id, {
                [MeshEvents.MOUSE_MOVE]: handleMeshMouseMove,
                [MeshEvents.CLICK]: handleMeshClick,
                [MeshEvents.POINTER_OUT]: handlePointerOut
            }, [meshRef.current.id])
        }
    }, [meshRef.current, overMainFace, playerMode, id, setPlayerMode])

    return (
        <>
            {baseShape &&
                <mesh ref={meshRef} rotation-x={Math.PI/2} position-y={extrudeSettings.depth} castShadow receiveShadow onPointerMove={onPointerMove} onClick={onClick} onPointerOut={onPointerOut}>
                    <extrudeBufferGeometry ref={geoRef} attach="geometry" args={[baseShape, extrudeSettings]} />
                    <meshPhysicalMaterial attachArray="material" color={0x33ff33} metalness={0.9} roughness={0.1} clearcoat clearcoatRoughness={0.25} />
                    <meshPhysicalMaterial attachArray="material" color={0xffffff} metalness={0.9} roughness={0} clearcoat clearcoatRoughness={0.25} />
                </mesh>
            }
        </>
    )

    function mainPolyVertexCount(pointCount) {
        // This is something I just worked out by observing
        // different instances of ExtrudeBufferGeometry. It
        // depends on the internals of ExtrudeBufferGeometry.
        return (pointCount-2)*6
    }
}

export default Structure