import { useThree, useFrame } from 'react-three-fiber'
import Util from '../Util'
import { Vector3, Vector2, Quaternion } from 'three'
import usePlayground from '../playground'
import Const from '../constants'

function useDOM(domSelectors, sceneNames) {
    const { scene, size, camera } = useThree()

    useFrame(() => {

        const domNodes = domSelectors.map(s => document.querySelector(s))
        const sceneNodes = []

        sceneNames.forEach(nodeName => {
            scene.traverse(node => {
                if (node.userData.name === nodeName) {
                    sceneNodes.push(node)
                }
            })
        })

        if (domNodes.length === sceneNodes.length) {
            domNodes.forEach((dNode, i) => {
                const sNode = sceneNodes[i]

                const worldPoint = new Vector3()
                sNode.getWorldPosition(worldPoint)

                const screenPoint = Util.vec3ToScreenPoint(worldPoint, camera, size.width, size.height)

                dNode.style.position = "absolute"
                dNode.style.zIndex = "10000"
                dNode.style.transform = "translateX(-50%)"

                dNode.style.left = screenPoint.x + "px"
                dNode.style.top = screenPoint.y + "px"
            })
        }
    })
}

const getGridSnapPoint = (e, partialPoints, cellSize) => {
    const firstPartial = partialPoints[0]

    if (!e.face) {
        console.log("No intersection face", e)
        return e.point
    }

    const relPoint = e.point.clone().sub(firstPartial)
    const objectRotation = e.object.rotation.clone()
    const normal = e.face.normal.clone().applyEuler(objectRotation).normalize()

    // These axis are based on the un-transformed THREE.PlaneGeometry
    const gridPlaneNormal = new Vector3(0, 0, 1)
    const gridPlaneUp = new Vector3(0, 1, 0)
    const gridPlaneRight = new Vector3(1, 0, 0)

    // We rotate the default plane axes to be in line with the surface
    // the snap grid is presently displayed on
    const planeRotation = new Quaternion()
    planeRotation.setFromUnitVectors(gridPlaneNormal, normal)

    gridPlaneUp.applyQuaternion(planeRotation)
    gridPlaneRight.applyQuaternion(planeRotation)

    const u = gridPlaneRight.dot(relPoint)
    const v = gridPlaneUp.dot(relPoint)
    const uv = new Vector2(u + cellSize / 2, v + cellSize / 2)

    const modVec = new Vector2(Math.abs(Util.fract(uv.x / cellSize)) - 0.5, Math.abs(Util.fract(uv.y / cellSize)) - 0.5)
    const inRange = (1 - Util.step(Const.CELL_SNAP_RATIO, modVec.length())) > 0

    if (inRange) {
        // convert snap point from UV to world coords
        const snapU = Math.floor(uv.x / cellSize) * cellSize
        const snapV = Math.floor(uv.y / cellSize) * cellSize
        const rightPoint = gridPlaneRight.clone().multiplyScalar(snapU)
        const upPoint = gridPlaneUp.clone().multiplyScalar(snapV)
        const planePoint = rightPoint.clone().add(upPoint)
        const x = new Vector3(1, 0, 0)
        const y = new Vector3(0, 1, 0)
        const z = new Vector3(0, 0, 1)
        const relWorldSnapPoint = new Vector3(x.dot(planePoint), y.dot(planePoint), z.dot(planePoint))

        const worldSnapPoint = firstPartial.clone().add(relWorldSnapPoint)

        return worldSnapPoint
    } else {
        return null
    }
}

const snap = (state, e) => {
    if (!state.partialPoints) return e.point

    const structures = state.structures
    const partialPoints = state.partialPoints
    const firstPartial = partialPoints[0]
    const cellSize = state.cellSize

    if (firstPartial) {
        const gridSnapPoint = getGridSnapPoint(e, partialPoints, cellSize)
        if (gridSnapPoint) return gridSnapPoint

        return e.point

    } else {
        return e.point
    }
}

export { useDOM, snap}