import React, { useRef, useEffect } from 'react'
import {DoubleSide, Vector3, AdditiveBlending} from 'three'

function TangentGrid({position, orientation}) {

    const meshRef = useRef()

    useEffect(() => {
        if (meshRef.current) {
            const laPoint = position.clone().addScaledVector(orientation, 5)
            meshRef.current.lookAt(laPoint)
        }
    }, [position, orientation])

    const uniforms = {
        // phong material uniforms
        Ka: { value: new Vector3(1, 1, 1) },
        Kd: { value: new Vector3(1, 1, 1) },
        Ks: { value: new Vector3(1, 1, 1) },
        LightIntensity: { value: new Vector3(0.5, 0.5, 0.5, 1.0) },
        LightPosition: { value: new Vector3(0.0, 2000.0, 0.0, 1.0) },
        Shininess: { value: 200.0 }
    }

    const fragmentShader = `
        varying vec3 norm;
        varying vec3 pos;
        varying vec2 vUv;

        float gridValue(vec2 coord){
            vec2 nCoord = coord / 20.;
            vec2 grid = abs(fract(nCoord - 10.) - 0.5) / fwidth(nCoord*2.95);
            float line = min(grid.x, grid.y);
            return 1.0 - min(line, 1.0);
        }

        void main() {
            vec4 blue = vec4(0., 0., 1., 0.75);
            float blendFactor = min(2.3 / length(fwidth(vUv)), 1.0);
            float v = gridValue(pos.xy);
            gl_FragColor = blue * v * (1. - smoothstep(0.1, 0.25, length(vUv - 0.5))) * blendFactor;
        }
    `

    const vertexShader = `
        varying vec3 norm;
        varying vec3 pos;
        varying vec2 vUv;
        

        void main() {
            norm = normalize(normalMatrix * normal);
            pos = vec3(modelViewMatrix * vec4(position, 1.0));
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `

    return (
        <mesh ref={meshRef} position={position}>
            <planeGeometry attach="geometry" args={[1000, 1000]}></planeGeometry>
            <shaderMaterial attach="material" extensions={{derivatives: true}} blending={AdditiveBlending} depthTest={true} depthWrite={true} transparent side={DoubleSide} uniforms={uniforms} fragmentShader={fragmentShader} vertexShader={vertexShader} />
        </mesh>
    )
}

export default TangentGrid