import React, { useEffect, useState } from 'react'
import {useThree, useFrame} from 'react-three-fiber'
import Util from '../Util'
import { Vector3 } from 'three'

function useDOM(domSelectors, sceneNames) {
    const {scene, size, camera} = useThree()
    const [nodeMap, setNodeMap] = useState(null)

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

export {useDOM}