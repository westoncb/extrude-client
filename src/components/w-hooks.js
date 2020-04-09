import { useThree, useFrame } from 'react-three-fiber'
import Util from '../Util'
import { Vector3, Vector2 } from 'three'
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

const snap = (state, e) => {
    if (!state.partialPoints) return e.point

    const structures = state.structures
    const partialPoints = state.partialPoints
    const firstPartial = partialPoints[0]
    const cellSize = state.cellSize

    if (firstPartial) {
        const relPoint = e.point.clone().sub(firstPartial)

        const rotation = e.object.rotation.clone()

        if (!e.face) {
            console.log("No intersection face", e)
            return e.point
        }

        const normal = e.face.normal.clone().applyEuler(rotation)

        // unsure
        const upVec = new Vector3(0, 1, 0).applyEuler(rotation)

        // unsure
        const rightVec = upVec.clone().cross(normal)

        const u = rightVec.dot(relPoint)
        const v = upVec.dot(relPoint)
        const uv = new Vector2(u + cellSize / 2, v + cellSize / 2)

        const modVec = new Vector2(Math.abs(Util.fract(uv.x / cellSize)) - 0.5, Math.abs(Util.fract(uv.y / cellSize)) - 0.5)
        const inRange = (1 - Util.step(Const.CELL_SNAP_RATIO, modVec.length())) > 0

        if (inRange) {

            const snapU = Math.floor(uv.x / cellSize) * cellSize
            const snapV = Math.floor(uv.y / cellSize) * cellSize
            const rightPoint = rightVec.clone().multiplyScalar(snapU)
            const upPoint = upVec.clone().multiplyScalar(snapV)
            const planePoint = rightPoint.clone().add(upPoint)
            const x = new Vector3(1, 0, 0)
            const y = new Vector3(0, 1, 0)
            const z = new Vector3(0, 0, 1)
            const relWorldSnapPoint = new Vector3(x.dot(planePoint), y.dot(planePoint), z.dot(planePoint))

            const worldSnapPoint = firstPartial.clone().add(relWorldSnapPoint)

            return worldSnapPoint
        } else {
            return e.point
        }

    } else {
        return e.point
    }
}

function useSnapping() {
    const {state} = usePlayground()

    return e => {
        // console.log("asdf", firstPartial)

        if (!state.partialPoints) return e

        const structures = state.structures
        const partialPoints = state.partialPoints
        const firstPartial = partialPoints[0]
        const cellSize = state.cellSize

        if (firstPartial) {
            const relPoint = e.point.clone().sub(firstPartial)

            const rotation = e.object.rotation.clone()

            if (!e.face) {
                console.log("No intersection face", e)
                return e.point
            }

            const normal = e.face.normal.clone().applyEuler(rotation)

            // unsure
            const upVec = new Vector3(0, 1, 0).applyEuler(rotation)

            // unsure
            const rightVec = upVec.clone().cross(normal)

            // console.log("coord system", normal, upVec, rightVec)

            const u = rightVec.dot(relPoint)
            const v = upVec.dot(relPoint)
            const uv = new Vector2(u + cellSize / 2, v + cellSize / 2)

            // console.log("uv, cellSize", uv, cellSize)
            const modVec = new Vector2(Math.abs(Util.fract(uv.x / cellSize)) - 0.5, Math.abs(Util.fract(uv.y / cellSize)) - 0.5)
            const inRange = (1 - Util.step(0.25, modVec.length())) > 0

            // console.log("inRange, modVec", inRange, modVec)

            if (inRange) {


                const snapU = Math.floor(uv.x / cellSize) * cellSize
                const snapV = Math.floor(uv.y / cellSize) * cellSize
                const rightPoint = rightVec.clone().multiplyScalar(snapU)
                const upPoint = upVec.clone().multiplyScalar(snapV)
                const planePoint = rightPoint.clone().add(upPoint)
                const x = new Vector3(1, 0, 0)
                const y = new Vector3(0, 1, 0)
                const z = new Vector3(0, 0, 1)
                const relWorldSnapPoint = new Vector3(x.dot(planePoint), y.dot(planePoint), z.dot(planePoint))

                // console.log("planePoint, relWorldSP", planePoint , relWorldSnapPoint)

                const worldSnapPoint = firstPartial.clone().add(relWorldSnapPoint)

                // console.log("e.point, snapPoint", e.point.clone(), firstPartial.clone(), worldSnapPoint.clone())

                return worldSnapPoint
            } else {
                console.log("not in range", modVec)
                return e.point
            }

        } else {
            console.log("no first partial")
            return e.point
        }
    }
}

export { useDOM, useSnapping, snap}