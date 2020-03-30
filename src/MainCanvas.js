import React, {useMemo, useEffect, useState, useRef} from 'react'
import * as THREE from 'three'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Canvas, extend, useThree, useFrame } from 'react-three-fiber'
import Playground from './Playground'
import PlayerView from './components/PlayerView'
// import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
// import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
// import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass'
import './MainCanvas.css'

// extend({ EffectComposer, RenderPass, SSAOPass })
extend({ OrbitControls })

const stats = new Stats()

const CameraController = () => {
    const { camera, gl } = useThree();
    useFrame(() => stats.update())
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

// function Effects() {
//     const { gl, scene, camera, size } = useThree()
//     const composer = useRef()
//     useEffect(() => void composer.current.setSize(size.width, size.height), [size])
//     useFrame(() => composer.current.render(), 1)
//     return (
//         <effectComposer ref={composer} args={[gl]}>
//             <renderPass attachArray="passes" args={[scene, camera]} />
//             <sSAOPass attachArray="passes" args={[scene, camera, size.width, size.height]}/>
//         </effectComposer>
//     )
// }

function MainCanvas({player}) {
    const [players, setPlayers] = useState([])
    const [playground, setPlayground] = useState(null)
    const grassTexture = useMemo(() => new THREE.TextureLoader().load("grasslight-big.jpg"), [])
    useEffect(() => {
        setPlayground(new Playground(player, thePlayers => setPlayers(thePlayers)))
    }, [player])

    return (
        <div className="main-canvas-container">
            <Canvas
                style={{ backgroundColor: "#123" }}
                gl={{ antialias: false, alpha: true }}
                pixelRatio={window.devicePixelRatio}
                camera={{ position: [0, 150, 1300], near: 1, far: 4000 }}
                shadowMap
                onCreated={({ gl }) => {
                    gl.toneMapping = THREE.ReinhardToneMapping
                    gl.outputEncoding = THREE.sRGBEncoding
                    gl.shadowMap.type = THREE.PCFSoftShadowMap
                }}
            >
                {/* <Effects /> */}
                <CameraController />
                <fog attach="fog" args={[0x112233, 1000, 4000]} />
                <ambientLight args={[0x888888]} />
                <directionalLight
                    args={[0xffffff, 8]}
                    position={[250, 450, 500]}
                    shadow-camera-left={-1000}
                    shadow-camera-bottom={-1000}
                    shadow-camera-right={1000}
                    shadow-camera-top={1000}
                    shadow-camera-near={1}
                    shadow-camera-far={1200}
                    shadow-mapSize-width={1024}
                    shadow-mapSize-height={1024}
                    castShadow
                />

                {players.map(player => <PlayerView key={player.id} player={player} />)}

                <mesh receiveShadow rotation-x={- Math.PI / 2}>
                    <planeBufferGeometry attach="geometry" args={[16000, 16000]} />
                    <meshLambertMaterial attach="material" color={0x445566}>
                        <primitive attach="map" object={grassTexture} repeat={[64, 64]} wrapS={THREE.RepeatWrapping} wrapT={THREE.RepeatWrapping} encoding={THREE.sRGBEncoding} />
                    </meshLambertMaterial>
                </mesh>
            </Canvas>
            <div className="chat-window">

            </div>
        </div>
    )
}

export default MainCanvas