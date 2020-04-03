import React, {useState, useEffect} from 'react'
import { Vector3 } from 'three'
import { extend, useThree, useUpdate } from "react-three-fiber"
import { Line2 } from 'three/examples/jsm/lines/Line2.js'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js'
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js'
import MeshEvents from '../MeshEvents'
import Util from '../Util'

extend({ LineMaterial, LineGeometry, Line2 })

const MAX_POLY_POINTS = 50
const SNAP_RADIUS = 30

function PartialStructure({player, finishStructureFunc}) {
    const [points, setPoints] = useState([])
    const [cursorPoint, setCursorPoint] = useState(null)
    const [inSnapRange, setInSnapRange] = useState(false)
    const { size } = useThree()

    useEffect(() => {
        const handleMeshMouseMove = e => {
            if (points.length > 0) {
                const vec = new Vector3(e.point.x, e.point.y+0.1, e.point.z)
                setCursorPoint(vec)
            }
        }

        const handleMeshClick = e => {
            if (e.shiftKey) return

            const vec = new Vector3(e.point.x, e.point.y, e.point.z)

            let finish = false
            if (points.length > 2) {
                const snapDiffVec = vec.clone().sub(points[0])
                if (snapDiffVec.length() < SNAP_RADIUS) {
                    vec.add(snapDiffVec)
                    finish = true
                }
            }

            vec.y += 0.1

            setPoints([...points, vec])

            if (finish) {

                // This snippet may be useful soon
                // const rotation = e.object.rotation.clone()
                // rotation.x *= -1
                // rotation.y *= -1
                // rotation.z *= -1

                // const normal = e.face.normal.clone().applyEuler(rotation)
                // const centroid = Util.centroid(points)
                // const extrusionLine = {start: centroid, end: centroid.clone().addScaledVector(normal, 10)}

                const structure = { id: Util.generateId(), points, extrusionParams: { depth: 4, row: 0, theta: 0, bevelThickness: 3, bevelSize: 4, bevelSegments: 4, steps: 1} }

                finishStructureFunc(structure)
                setPoints([])
                setInSnapRange(false)
                setCursorPoint(null)
            }
        }

        MeshEvents.listenFor("partial_structure", {
            [MeshEvents.MOUSE_MOVE]: handleMeshMouseMove,
            [MeshEvents.CLICK]: handleMeshClick,
        })

        return () => {
            MeshEvents.removeListener("partial_structure")
        }

    }, [points])

    const ref = useUpdate(geom => {
        if (points.length < 1 || cursorPoint === null) {
            geom.setPositions(new Float32Array(MAX_POLY_POINTS*3))
            return
        }

        const modCursorPoint = cursorPoint.clone()
        if (points.length > 2) {
            const snapDiffVec = points[0].clone().sub(cursorPoint)

            // within snap radius
            if (snapDiffVec.length() < SNAP_RADIUS) {
                modCursorPoint.add(snapDiffVec)
                setInSnapRange(true)
            } else {
                setInSnapRange(false)
            }

            // Check if first and last points overlap
            if (points[0].clone().sub(points[points.length - 1]).length() < 0.1) {
                finishStructureFunc(points)
                setPoints([])
                setInSnapRange(false)
                setCursorPoint(null)
            }
        }
            
        const finalPoints = points.reduce((acc, { x, y, z }) => [...acc, x, y, z], [], [])
        finalPoints.push(modCursorPoint.x, modCursorPoint.y, modCursorPoint.z)

        // The number of points must always be exactly the same,
        // so will fill the end with the last point added repeatedly
        while (finalPoints.length < MAX_POLY_POINTS*3) {
            finalPoints.push(finalPoints[finalPoints.length - 3], finalPoints[finalPoints.length - 2], finalPoints[finalPoints.length - 1])
        }

        finalPoints.length = Math.min(MAX_POLY_POINTS*3, finalPoints.length)

        geom.setPositions(finalPoints)
    }, [points, cursorPoint])

    return  (
        <>
            <line2>
                <lineGeometry attach="geometry" ref={ref} />
                <lineMaterial attach="material" color={0x66ff11} linewidth={10} resolution={[size.width, size.height]} />
            </line2>

            {points.map((point, i) => (
                <mesh key={point.x+point.y+point.z+""} castShadow position={[point.x, point.y, point.z]}>
                    <sphereGeometry attach="geometry" args={[(i === 0 && inSnapRange) ? SNAP_RADIUS : 7, 32, 32]} />
                    <meshPhysicalMaterial attach="material" color={(i === 0 && inSnapRange) ? 0x00ff00 : 0x117700} clearcoat metalness={0.25} clearcoatRoughness={0.75} roughness={0.1}/>
                </mesh>
            ))}
        </>
    )
}

export default PartialStructure