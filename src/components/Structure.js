import React, { useState, useEffect, useRef } from 'react'
import { Shape, Vector2, Vector3, Quaternion, LineCurve3, ArrowHelper, CatmullRomCurve3, Object3D } from 'three'
import { useUpdate, useFrame } from 'react-three-fiber'
import MeshEvents from '../MeshEvents'
import Const from '../constants'
import Util from '../Util'

const INITIAL_EXTRUSION_DEPTH = 4

function Structure({structure, updateStructure, active, player, onPointerMove, onClick, onPointerOut, mode, setMode, mouseTravel}) {
    const [baseShape, setBaseShape] = useState(null)
    const [overMainFace, setOverMainFace] = useState(false)
    const [dragStartPoint, setDragStartPoint] = useState(null)
    const [position, setPosition] = useState(new Vector3)
    const meshRef = useRef()

    useEffect(() => {
        const centroid = Util.centroid(structure.points)
        const normal = structure.normal
        const dest = new Vector3(0, 0, 1)
        const quat = new Quaternion()
        quat.setFromUnitVectors(normal, dest)
        const shiftedPoints = structure.points.map(p => new Vector3(p.x - centroid.x, p.y - centroid.y, p.z - centroid.z))
        const rotatedPoints = shiftedPoints.map(p => p.clone().applyQuaternion(quat))
        setBaseShape(new Shape(rotatedPoints.map(p => new Vector2(p.x, p.y))))
        setPosition(centroid)
    }, [structure.points])

    useEffect(() => {
        const handleMeshMouseMove = e => {
            if (!e.shiftKey) {
                setOverMainFace(false)
                return
            }

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

    const showHighlightedMaterial = active && mode === Const.MODE_EXTRUDE
    const highlightExtrusionSurface = baseShape && overMainFace && mode === Const.MODE_DEFAULT

    return (
        <>
            {baseShape &&
                <mesh ref={meshRef} quaternion={rotationFromNormal(structure.normal)} position={position} castShadow receiveShadow onPointerMove={onPointerMove} onClick={onClick} onPointerOut={onPointerOut}>
                <extrudeGeometry attach="geometry" args={[baseShape, structure.extrusionParams]} />
                    
                    {showHighlightedMaterial &&
                        <meshPhysicalMaterial attach="material" color={0x000000} emissive={0x00ff00} emissiveIntensity={0.7} metalness={0.9} roughness={0.1} clearcoat clearcoatRoughness={0.25} />
                    }

                    {!showHighlightedMaterial &&
                        // Nice white
                        // <meshPhysicalMaterial attach="material" color={0xffffff} metalness={0.9} roughness={0} clearcoat clearcoatRoughness={0.25} />

                        // Nice black
                        <meshPhysicalMaterial attach="material" color={0x000000} emmissive={0x00ff00} metalness={0.9} roughness={0.1} clearcoat clearcoatRoughness={0.25} />
                    }
                </mesh>
            }

            {baseShape && mode !== Const.MODE_EXTRUDE &&    
                <mesh quaternion={rotationFromNormal(structure.normal)} position={getIndicatorPosition(position, structure.normal, structure.extrusionParams.depth)}>
                    <extrudeBufferGeometry attach="geometry" args={[baseShape, { depth: 1, bevelSize: 1, bevelThickness: 1, bevelSegments: 2 }]} />

                    {highlightExtrusionSurface &&
                        <meshPhysicalMaterial attach="material" color={0x000000} emissive={0x0033dd} metalness={0.9} roughness={0.1} clearcoat clearcoatRoughness={0.25} />
                    }
                    {!highlightExtrusionSurface &&
                        <meshPhysicalMaterial attach="material" color={0x000000} emissive={0x0033dd} emissiveIntensity={0.025} metalness={0.9} roughness={0.1} clearcoat clearcoatRoughness={0.25} />
                    }

                </mesh>
            }
        </>
    )

    function getIndicatorPosition(position, normal, depth) {
        return position.clone().addScaledVector(normal, depth + 1.5)
    }

    function rotationFromNormal(normal) {
        const quat = new Quaternion()
        quat.setFromUnitVectors(new Vector3(0, 0, 1), normal)

        return quat
    }

    function calcPosition(normal, depth) {
        const rotation = rotationFromNormal(normal)
        const axis = new Vector3(0, 0, 1)
        axis.applyQuaternion(rotation).normalize()

        const transformed = axis.multiplyScalar(depth/2)
        console.log("axis", transformed)

        return transformed
    }

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