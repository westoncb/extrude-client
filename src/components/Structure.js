import React, { useState, useEffect, useRef } from 'react'
import { Shape, Vector2, Vector3 } from 'three'
import { useUpdate, useFrame } from 'react-three-fiber'
import MeshEvents from '../MeshEvents'
import Const from '../constants'

const INITIAL_EXTRUSION_DEPTH = 4

function Structure({structure, updateStructure, active, player, onPointerMove, onClick, onPointerOut, mode, setMode}) {
    const [baseShape, setBaseShape] = useState(null)
    const [overMainFace, setOverMainFace] = useState(false)
    const [dragStartPoint, setDragStartPoint] = useState(null)
    const meshRef = useRef()

    useEffect(() => {
        setBaseShape(new Shape(structure.points.map(p => new Vector2(p.x, p.z))))
    }, [structure.points])

    useEffect(() => {
        const handleMeshMouseMove = e => {
            if (!e.shiftKey)
                return

            // faces have three verts a, b, c.
            // We use the first arbitrarily
            const hoverFaceIndex = e.face.a

            if (hoverFaceIndex >= 0 && hoverFaceIndex <= mainPolyVertexCount(structure.points.length)) {
                setOverMainFace(true)
            } else {
                setOverMainFace(false)
            }
        }
        const handlePointerOut = e => {
            setOverMainFace(false)
        }

        const handleMeshClick = e => {
            if (!active) {
                if (!e.shiftKey)
                    return
            } else if (active && mode === Const.MODE_EXTRUDE) {
                updateStructure(structure)
            }
        }

        if (meshRef.current) {
            MeshEvents.listenFor("structure_" + structure.id, {
                [MeshEvents.MOUSE_MOVE]: handleMeshMouseMove,
                [MeshEvents.CLICK]: handleMeshClick,
                [MeshEvents.POINTER_OUT]: handlePointerOut
            }, [meshRef.current.id])
        }
    }, [meshRef.current, overMainFace, structure])

    const showNormalMaterial = active && mode === Const.MODE_EXTRUDE

    return (
        <>
            {baseShape &&
                <mesh ref={meshRef} rotation-x={Math.PI/2} position-y={structure.extrusionParams.depth} castShadow receiveShadow onPointerMove={onPointerMove} onClick={onClick} onPointerOut={onPointerOut}>
                    <extrudeBufferGeometry attach="geometry" args={[baseShape, structure.extrusionParams]} />
                    
                    {showNormalMaterial &&
                        <meshPhysicalMaterial attach="material" color={0x111111} emissive={0xaa00} emissiveIntensity={1} metalness={0.9} roughness={0.1} clearcoat clearcoatRoughness={0.25} />
                    }

                    {!showNormalMaterial &&
                        // Nice white
                        // <meshPhysicalMaterial attach="material" color={0xffffff} metalness={0.9} roughness={0} clearcoat clearcoatRoughness={0.25} />

                        // Nice black
                        <meshPhysicalMaterial attach="material" color={0x000000} emmissive={0x00ff00} metalness={0.9} roughness={0.1} clearcoat clearcoatRoughness={0.25} />
                    }
                </mesh>
            }

            {baseShape && overMainFace &&
                <mesh rotation-x={Math.PI / 2} position-y={structure.extrusionParams.depth + 3.1}>
                    <extrudeBufferGeometry attach="geometry" args={[baseShape, {depth: 2, bevelSize: 1, bevelThickness: 1, bevelSegments: 2}]} />
                    <meshPhysicalMaterial attach="material" color={0x0033dd} metalness={0.9} roughness={0.1} clearcoat clearcoatRoughness={0.25} />
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