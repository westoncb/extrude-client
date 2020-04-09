import React, { useRef, useEffect, useMemo } from 'react'
import {DoubleSide, Vector3, Vector2, AdditiveBlending} from 'three'
import {useThree, useFrame} from 'react-three-fiber'
import Util from '../Util'
import Const from "../constants"

const plane_size = 10000
const pointerUV = new Vector2()
const lastOrientation = new Vector3()
let time = 0

function TangentGrid({position, orientation, target, targetUV, mouse, cellSize}) {
    const { size } = useThree()
    const meshRef = useRef()

    useEffect(() => {
        if (meshRef.current) {
            const laPoint = position.clone().addScaledVector(orientation, 5)
            meshRef.current.lookAt(laPoint)
            
        }
        if (!Util.vecsEqual3D(orientation, lastOrientation)) {
            time = 0
        }
        lastOrientation.copy(orientation)
    }, [position, orientation])

    const uniforms = useMemo(() => {
        return {
            vTarget: { value: target },
            planeSize: { value: new Vector2(plane_size, plane_size) },
            mouse: { value: mouse },
            cellSize: { value: cellSize},
            targetUV: { value: pointerUV},
            time: {value: time}
        }
    }, [])

    useFrame((info, delta) => {
        uniforms.mouse.value.x = mouse.x
        uniforms.mouse.value.y = size.height - mouse.y
        uniforms.cellSize.value = cellSize
        uniforms.vTarget.value = target
        uniforms.targetUV.value = pointerUV

        time += delta
        uniforms.time.value = time
    })

    const onPointerMove = e => {
        pointerUV.x = e.uv.x
        pointerUV.y = e.uv.y
    }

    const fragmentShader = `
        varying vec3 norm;
        varying vec2 pos;
        varying vec2 vUv;
        varying vec2 wTargetUV;

        uniform vec2 planeSize;
        uniform vec2 mouse;
        uniform float cellSize;
        uniform float time;

        const float PI = 3.1418;

        float gridValue(vec2 coord){
            vec2 nCoord = (coord / cellSize);
            vec2 grid = abs(fract(nCoord) - 0.5) / fwidth(nCoord*2.95);
            float line = min(grid.x, grid.y);
            return 1.0 - min(line, 1.0);
        }

        void main() {
            vec4 blue = vec4(0., 0., 1.5, 0.75 * (clamp(0., 1., 3.*log(time + 0.9))));
            float blendFactor = min(2.3 / length(fwidth(vUv)), 1.0);
            float gridVal = gridValue(pos);
            
            // shift the 'spotlight' based on mouse pos
            vec2 mouseOffset = (gl_FragCoord.xy - mouse) / planeSize.x;

            
            vec2 pointToJunction = abs(fract(pos / cellSize)) - 0.5;
            float edgeDist = length(pointToJunction);
            float steppedEdgeDist = (1. - smoothstep(${Const.CELL_SNAP_RATIO-0.03}, ${Const.CELL_SNAP_RATIO}, edgeDist));

            vec2 mouseToEdge = abs(fract(wTargetUV / cellSize)) - 0.5;
            float steppedMouseDist = 1. - smoothstep(${Const.CELL_SNAP_RATIO-0.03}, ${Const.CELL_SNAP_RATIO}, length(mouseToEdge));

            vec2 mouseIndex = floor(wTargetUV / cellSize);
            vec2 posIndex = floor(pos / cellSize);

            // toggle snap point rendering depending on whether mouse and current
            // pixel are near the same grid vertex
            float toggle = 1. - clamp(0., 1., length(mouseIndex - posIndex));
            vec2 mouseToPoint = pos - wTargetUV;
            float rings = clamp(0., 1., mod(edgeDist*5. * (PI/2.) * 7. + time*4., 2.*PI) - 2.);
            float snapVal = min(steppedMouseDist, steppedEdgeDist)*toggle*rings;

            float spotlight = (1. - smoothstep(0.04, 0.065, length(vUv - 0.5 + mouseOffset)));

            gl_FragColor = (1.-snapVal) * blue * gridVal * spotlight * blendFactor + vec4(1.0, 0., 1.0, 0.7) * snapVal;
        }
    `

    const vertexShader = `
        varying vec3 norm;
        varying vec2 pos;
        varying vec2 wTargetUV;
        varying vec2 vUv;
        
        uniform float time;

        uniform vec2 planeSize;
        uniform vec2 mouse;
        uniform vec2 targetUV;
        uniform float cellSize;

        void main() {
            norm = normalize(normalMatrix * normal);
            pos = (((uv - 0.5) * planeSize) + cellSize/2.);
            wTargetUV = ((targetUV - 0.5) * planeSize) + cellSize/2.;
            vUv = uv;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `

    return (
        <mesh ref={meshRef} position={position} onPointerMove={onPointerMove}>
            <planeGeometry attach="geometry" args={[plane_size, plane_size]}></planeGeometry>
            <shaderMaterial attach="material" extensions={{derivatives: true}} blending={AdditiveBlending} depthTest={true} depthWrite={true} transparent side={DoubleSide} uniforms={uniforms} fragmentShader={fragmentShader} vertexShader={vertexShader} />
        </mesh>
    )
}

export default TangentGrid