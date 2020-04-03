import React, { useState, useEffect, useRef } from 'react'
import { Shape, Vector2, Vector3, Quaternion, LineCurve3, ArrowHelper, CatmullRomCurve3 } from 'three'
import { useUpdate, useFrame } from 'react-three-fiber'
import MeshEvents from '../MeshEvents'
import Const from '../constants'
import Util from '../Util'

const INITIAL_EXTRUSION_DEPTH = 4

function Structure({structure, updateStructure, active, player, onPointerMove, onClick, onPointerOut, mode, setMode, mouseTravel}) {
    const [baseShape, setBaseShape] = useState(null)
    const [overMainFace, setOverMainFace] = useState(false)
    const [dragStartPoint, setDragStartPoint] = useState(null)
    const meshRef = useRef()

    useEffect(() => {
        // const centroid = Util.centroid(structure.points)
        // const shiftedPoints = structure.points.map(p => new Vector3(p.x - centroid.x, p.y - centroid.y, p.z - centroid.z))
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
            if (mode === Const.MODE_DEFAULT) {
                if (e.shiftKey) {
                    setMode(Const.MODE_EXTRUDE, structure.id)
                }
            } else if (active && mode === Const.MODE_EXTRUDE) {
                updateStructure(structure)
            }
        }

        if (meshRef.current) {
            MeshEvents.listenFor("structure_" + structure.id, {
                [MeshEvents.MOUSE_MOVE]: handleMeshMouseMove,
                [MeshEvents.CLICK]: handleMeshClick,
                [MeshEvents.POINTER_OUT]: handlePointerOut,
                [MeshEvents.POINTER_OVER]: handleMeshMouseMove
            }, [meshRef.current.id])
        }
    }, [meshRef.current, overMainFace, structure, mode, active])

    const showNormalMaterial = active && mode === Const.MODE_EXTRUDE

    return (
        <>
            {baseShape &&
                <mesh ref={meshRef} rotation-x={Math.PI/2} position-y={structure.extrusionParams.depth} castShadow receiveShadow onPointerMove={onPointerMove} onClick={onClick} onPointerOut={onPointerOut}>
                <extrudeGeometry attach="geometry" args={[baseShape, structure.extrusionParams]} />
                    
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

            {/* <ArrowHelper/> */}

            {baseShape && overMainFace && mode === Const.MODE_DEFAULT &&
                <mesh rotation-x={Math.PI / 2} position-y={structure.extrusionParams.depth + 3.1}>
                    <extrudeBufferGeometry attach="geometry" args={[baseShape, {depth: 2, bevelSize: 1, bevelThickness: 1, bevelSegments: 2}]} />
                    <meshPhysicalMaterial attach="material" color={0x0033dd} metalness={0.9} roughness={0.1} clearcoat clearcoatRoughness={0.25} />
                </mesh>
            }
        </>
    )

    function computeParams(params, mouseTravel) {
        const normal = new Vector3(0, 1, 0) //cheat with y-axis for now
        const row = ( Math.PI / 2 ) * (mouseTravel.y / 800)
        const theta = (Math.PI / 2) * (mouseTravel.x / 800)
        // console.log("row, theta", mouseTravel.y, mouseTravel.x)
        const quat1 = new Quaternion()
        const quat2 = new Quaternion()
        const rotation = new Quaternion()
        quat1.setFromAxisAngle(new Vector3(0, 0, -1), theta)
        quat2.setFromAxisAngle(new Vector3(1, 0, 0), row)
        rotation.multiplyQuaternions(quat1, quat2)
        rotation.normalize()
        normal.applyQuaternion(rotation)
        const centroid = Util.centroid(structure.points)
        centroid.y = 0
        const endPoint = centroid.clone().addScaledVector(normal, params.depth)
        // console.log("centroid", centroid, endPoint)
        const line = new LineCurve3(centroid, endPoint)

        return {...params, extrudePath: line}
    }

    function mainPolyVertexCount(pointCount) {
        // This is something I just worked out by observing
        // different instances of ExtrudeBufferGeometry. It
        // depends on the internals of ExtrudeBufferGeometry.
        return (pointCount-2)*6
    }
}

export default Structure