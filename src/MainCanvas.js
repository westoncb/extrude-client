import React, {useMemo, useEffect} from 'react'
import * as THREE from 'three'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Canvas, extend, useThree, useUpdate } from 'react-three-fiber'
// import { MD2CharacterComplex } from './jsm/misc/MD2CharacterComplex.js';

import './MainCanvas.css'

extend({ OrbitControls })

// var characters = [];
// var nCharacters = 0;

// var cameraControls;

// var controls = {

//     moveForward: false,
//     moveBackward: false,
//     moveLeft: false,
//     moveRight: false

// };

const SCREEN_WIDTH = window.innerWidth;
const SCREEN_HEIGHT = window.innerHeight;
const stats = new Stats()

const CameraController = () => {
    const { camera, gl } = useThree();
    useUpdate(() => stats.update())
    useEffect(
        () => {
            gl.domElement.appendChild(stats.dom)
            const controls = new OrbitControls(camera, gl.domElement);
            controls.target.set(0, 50, 0)
            return () => {
                controls.dispose();
            };
        },
        [camera, gl]
    );
    return null;
}

function MainCanvas() {
    const grassTexture = useMemo(() => new THREE.TextureLoader().load("grasslight-big.jpg"), [])

    return (
        <Canvas style={{backgroundColor: "#123"}} gl={{ antialias: false, alpha: true }} pixelRatio={window.devicePixelRatio} camera={{ position: [0, 150, 1300], near: 1, far: 4000}} size={[SCREEN_WIDTH, SCREEN_HEIGHT]} >
            <CameraController/>
            <fog attach="fog" args={[0x112233, 1000, 4000]} />
            <ambientLight args={[0x222222]} />
            <directionalLight
                args={[0xffffff, 2.25]}
                position={THREE.Vector3(200, 450, 500)}
                shadow-camera-left={-1000}
                shadow-camera-bottom={-350}
                shadow-camera-right={1000}
                shadow-camera-top={350}
                shadow-camera-near={100}
                shadow-camera-far={1200}
                shadow-mapSize-width={1024}
                shadow-mapSize-height={512}
                castShadow
            />
            <mesh receiveShadow rotation-x={- Math.PI / 2}>
                <planeBufferGeometry attach="geometry" args={[16000, 16000]} />
                <meshLambertMaterial attach="material" color={0x445566}>
                    <primitive attach="map" object={grassTexture} repeat={[64, 64]} wrapS={THREE.RepeatWrapping} wrapT={THREE.RepeatWrapping} encoding={THREE.sRGBEncoding} />
                </meshLambertMaterial>
            </mesh>
        </Canvas>
    )
}

export default MainCanvas