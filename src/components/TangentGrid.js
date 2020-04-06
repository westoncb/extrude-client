import React, { useRef, useEffect, useMemo } from 'react'
import {DoubleSide, Vector3, Vector2, AdditiveBlending} from 'three'
import {useThree, useFrame} from 'react-three-fiber'

const plane_size = 10000

function TangentGrid({position, orientation, target, mouse}) {
    const { size } = useThree()
    const meshRef = useRef()

    useEffect(() => {
        if (meshRef.current) {
            const laPoint = position.clone().addScaledVector(orientation, 5)
            meshRef.current.lookAt(laPoint)
        }
    }, [position, orientation])

    const uniforms = useMemo(() => {
        return {
            vTarget: { value: target },
            planeSize: { value: new Vector2(plane_size, plane_size) },
            mouse: { value: mouse }
        }
    }, [])

    useFrame(() => {
        uniforms.mouse.value.x = mouse.x
        uniforms.mouse.value.y = size.height - mouse.y
    })

    const fragmentShader = `
        varying vec3 norm;
        varying vec2 pos;
        varying vec2 vUv;
        varying vec2 target;
        uniform vec2 planeSize;

        uniform vec2 mouse;

        float gridValue(vec2 coord){
            vec2 nCoord = coord / 40.;
            vec2 grid = abs(fract(nCoord - 10.) - 0.5) / fwidth(nCoord*2.95);
            float line = min(grid.x, grid.y);
            return 1.0 - min(line, 1.0);
        }

        void main() {
            vec4 blue = vec4(0., 0., 1.5, 0.75);
            float blendFactor = min(2.3 / length(fwidth(vUv)), 1.0);
            float v = gridValue(pos);
            float targetVal = 1. - smoothstep(8., 15., length(mouse - gl_FragCoord.xy));
            vec2 mouseOffset = (gl_FragCoord.xy - mouse) / planeSize.x;
            gl_FragColor = blue * max(v, targetVal) * (1. - smoothstep(0.04, 0.065, length(vUv - 0.5 + mouseOffset))) * blendFactor;
        }
    `

    const vertexShader = `
        varying vec3 norm;
        varying vec2 pos;
        varying vec2 vUv;
        varying vec2 target;

        uniform vec3 vTarget;
        uniform vec2 planeSize;
        uniform vec2 mouse;

        void main() {
            norm = normalize(normalMatrix * normal);
            pos = (uv * planeSize);
            target = vec2(planeSize.x/2., planeSize.y/2.);
            vUv = uv;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `

    return (
        <mesh ref={meshRef} position={position}>
            <planeGeometry attach="geometry" args={[plane_size, plane_size]}></planeGeometry>
            <shaderMaterial attach="material" extensions={{derivatives: true}} blending={AdditiveBlending} depthTest={true} depthWrite={true} transparent side={DoubleSide} uniforms={uniforms} fragmentShader={fragmentShader} vertexShader={vertexShader} />
        </mesh>
    )
}

export default TangentGrid