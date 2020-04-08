import React, {useState, useEffect} from 'react'
import { Vector3, Vector2 } from 'three'
import { extend, useThree, useUpdate, useFrame } from "react-three-fiber"
import { Line2 } from 'three/examples/jsm/lines/Line2.js'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js'
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js'
import MeshEvents from '../MeshEvents'
import Util from '../Util'
import TangentGrid from './TangentGrid'
import { mousePos} from '../global'
import { intersections } from '../global'
import usePlayground from '../playground'

extend({ LineMaterial, LineGeometry, Line2 })

const MAX_POLY_POINTS = 50
const SNAP_RADIUS = 22

function PartialStructure({player, finishStructureFunc}) {
    const [cursorPoint, setCursorPoint] = useState(null)
    const [inSnapRange, setInSnapRange] = useState(false)
    const [gridConfig, setGridConfig] = useState({position: new Vector3(), target: new Vector2(), orientation: new Vector3(), mouse: new Vector2()})
    const [parentNormal, setParentNormal] = useState(new Vector3())
    const [parentObject, setParentObject] = useState(null)
    const { size } = useThree()
    const { state, dispatch } = usePlayground()

    const visible = state.partialPoints.length > 0
    
    useEffect(() => {
        dispatch({ type: "update_cell_size", cellSize: 40})
    }, [dispatch])

    const updateGridConfig = (e, points) => {
        const rotation = e.object.rotation.clone()
        const normal = e.face.normal.clone().applyEuler(rotation)

        const zFightingShift = normal.clone().multiplyScalar(0.2)
        const firstPointPos = points[0].clone().add(zFightingShift)
        const cursorPos = e.point.clone().add(zFightingShift)
        const sameNormals = normal.clone().sub(parentNormal).length() < 0.1
        const thePosition = e.object === parentObject && sameNormals ? firstPointPos : cursorPos

        setGridConfig({
            ...gridConfig,
            position: thePosition,
            orientation: normal.clone(),
            target: e.point.clone(),
            mouse: new Vector2(mousePos.x, mousePos.y),
            cellSize: state.cellSize,
            targetUV: e.uv.clone()
        })
    }

    useFrame(() => {

        if (visible) {

            const inter = intersections.filter(i => i.object.userData.name === "main_plane" || i.object.userData.name === "structure")

            if (inter[0] && inter[0].face) {
                setCursorPoint(inter[0].point.clone())

                if (state.partialPoints.length > 0) {
                    if (cursorPoint) {
                        updateGridConfig(inter[0], state.partialPoints)
                    }
                }
            }
        }
    })

    useEffect(() => {
        const handleMeshMouseMove = e => {
            
        }

        const handleMeshClick = e => {
            if (e.shiftKey) return

            const vec = new Vector3(e.point.x, e.point.y, e.point.z)
            const rotation = e.object.rotation.clone()
            const normal = e.face.normal.clone().applyEuler(rotation)

            if (state.partialPoints.length === 0) {
                console.log("setting that parent normal", normal)
                setParentNormal(normal.clone())
                setParentObject(e.object)
            } else {
                console.log("state.partialPoints", state.partialPoints)
            }

            let finish = false
            if (state.partialPoints.length > 2) {
                const snapDiffVec = vec.clone().sub(state.partialPoints[0])
                if (snapDiffVec.length() < SNAP_RADIUS) {
                    vec.add(snapDiffVec)
                    finish = true
                }
            }

            const newPoints = [...state.partialPoints, vec]
            dispatch({ type: "update_partial_points", points: newPoints })

            updateGridConfig(e, newPoints)

            if (finish) {

                const structure = { id: Util.generateId(), owner: player.id, points: state.partialPoints, normal, extrusionParams: { depth: 4, row: 0, theta: 0, bevelThickness: 3, bevelSize: 4, bevelSegments: 4, steps: 1} }

                finishStructureFunc(structure)
                dispatch({ type: "update_partial_points", points: [] })
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

    }, [state.partialPoints])

    const ref = useUpdate(geom => {
        if (state.partialPoints.length < 1 || cursorPoint === null) {
            geom.setPositions(new Float32Array(MAX_POLY_POINTS*3))
            return
        }

        const modCursorPoint = cursorPoint.clone()
        if (state.partialPoints.length > 2) {
            const snapDiffVec = state.partialPoints[0].clone().sub(cursorPoint)

            // within snap radius
            if (snapDiffVec.length() < SNAP_RADIUS) {
                modCursorPoint.add(snapDiffVec)
                setInSnapRange(true)
            } else {
                setInSnapRange(false)
            }

            // Check if first and last points overlap
            if (state.partialPoints[0].clone().sub(state.partialPoints[state.partialPoints.length - 1]).length() < 0.1) {
                finishStructureFunc(state.partialPoints)
                dispatch({ type: "update_partial_points", points: [] })
                setInSnapRange(false)
                setCursorPoint(null)
            }
        }
            
        const finalPoints = state.partialPoints.reduce((acc, { x, y, z }) => [...acc, x, y, z], [], [])
        finalPoints.push(modCursorPoint.x, modCursorPoint.y, modCursorPoint.z)

        // The number of points must always be exactly the same,
        // so will fill the end with the last point added repeatedly
        while (finalPoints.length < MAX_POLY_POINTS*3) {
            finalPoints.push(finalPoints[finalPoints.length - 3], finalPoints[finalPoints.length - 2], finalPoints[finalPoints.length - 1])
        }

        finalPoints.length = Math.min(MAX_POLY_POINTS*3, finalPoints.length)

        geom.setPositions(finalPoints)
    }, [state.partialPoints, cursorPoint])

    return  (
        <>
            <line>
                <lineGeometry attach="geometry" ref={ref} />
                <lineMaterial attach="material" color={0x66ff11} linewidth={1} resolution={[size.width, size.height]} />
            </line>

            {state.partialPoints.map((point, i) => (
                <mesh key={point.x+point.y+point.z+""} castShadow position={[point.x, point.y, point.z]}>
                    <sphereGeometry attach="geometry" args={[(i === 0 && inSnapRange) ? SNAP_RADIUS : 7, 32, 32]} />
                    <meshPhysicalMaterial attach="material" color={(i === 0 && inSnapRange) ? 0x00ff00 : 0x117700} clearcoat metalness={0.25} clearcoatRoughness={0.75} roughness={0.1}/>
                </mesh>
            ))}

            {visible &&
                <TangentGrid
                    position={gridConfig.position}
                    orientation={gridConfig.orientation}
                    target={gridConfig.target}
                    mouse={gridConfig.mouse}
                    cellSize={gridConfig.cellSize}
                    targetUV={gridConfig.targetUV}
                />
            }
        </>
    )
}

export default PartialStructure