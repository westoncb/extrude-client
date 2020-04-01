import React, {useState, useEffect} from 'react'
import { Shape } from 'three'
import { extend, useThree, useUpdate } from "react-three-fiber"
import { Line2 } from 'three/examples/jsm/lines/Line2.js'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js'
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js'
import MeshEvents from '../MeshEvents'

extend({ LineMaterial, LineGeometry, Line2 })

const MAX_POLY_POINTS = 50

function PartialStructure() {
    const [points, setPoints] = useState([])
    const [cursorPoint, setCursorPoint] = useState(null)
    const { size } = useThree()

    useEffect(() => {
        const handleMeshMouseMove = e => {
            if (points.length > 0) {
                setCursorPoint({ ...e.point, y: e.point.y+0.1})
            }
        }

        const handleMeshClick = e => {
            setPoints([...points, { ...e.point, y: e.point.y + 0.1 }])
        }

        MeshEvents.listenFor({
            [MeshEvents.MOUSE_MOVE]: handleMeshMouseMove,
            [MeshEvents.CLICK]: handleMeshClick,
        })
    }, [points])

    const ref = useUpdate(geom => {
        if (points.length < 1 || cursorPoint === null) {
            geom.setPositions(new Float32Array(MAX_POLY_POINTS*3))
            return
        }
            
        const finalPoints = points.reduce((acc, { x, y, z }) => [...acc, x, y, z], [], [])
        finalPoints.push(cursorPoint.x, cursorPoint.y, cursorPoint.z)

        // The number of points always has to be exactly the same,
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
                <lineMaterial attach="material" color={0xffff11} linewidth={5} resolution={[size.width, size.height]} />
            </line2>

            {points.map(point => (
                <mesh key={point.x+point.y+point.z+""} position={[point.x, point.y, point.z]}>
                    <sphereGeometry attach="geometry" args={[7, 32, 32]} />
                    <meshPhysicalMaterial attach="material" color={0xffff11} clearcoat metalness={0.99} clearcoatRoughness={0.25} roughness={0} emmissive={0xffffff}/>
                </mesh>
            ))}
        </>
    )
}

export default PartialStructure