import React, {useMemo, useEffect, useState, useRef} from 'react'
import * as THREE from 'three'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Canvas, extend, useThree, useFrame } from 'react-three-fiber'
import Playground from './Playground'
import PlayerView from './components/Player'
import ChatWindow from './components/ChatWindow'
// import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
// import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
// import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass'
import './MainCanvas.css'

// extend({ EffectComposer, RenderPass, SSAOPass })
extend({ OrbitControls })

const stats = new Stats()

const CameraController = ({playground}) => {
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
    )

    // should be in a different component...
    useEffect(() => {
        gl.domElement.onclick = e => {
            if (playground)
                playground.localClick(e)
        }
        gl.domElement.onkeydown = e => {
            if (playground)
                playground.localKeyDown(e)
        }
        gl.domElement.onkeyup = e => {
            if (playground)
                playground.localKeyUp(e)
        }
        gl.domElement.onmousemove = e => {
            if (playground)
                playground.localMouseMove(e)
        }
    }, [gl, playground])

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
    const [messages, setMessages] = useState([])
    const [playground, setPlayground] = useState(null)
    const grassTexture = useMemo(() => new THREE.TextureLoader().load("grasslight-big.jpg"), [])

    useEffect(() => {
        setPlayground(new Playground(player, players => setPlayers(players), messages => setMessages(messages)))
    }, [player])

    return (
        <div className="main-canvas-container">
            <Canvas
                style={{ backgroundColor: "#789" }}
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
                <CameraController playground={playground} />
                <fog attach="fog" args={[0x778899, 1000, 4000]} />
                <ambientLight args={[0x888888]} />
                <directionalLight
                    args={[0xffffff, 8]}
                    position={[250, 4500, 500]}
                    shadow-camera-left={-1000}
                    shadow-camera-bottom={-1000}
                    shadow-camera-right={1000}
                    shadow-camera-top={1000}
                    shadow-camera-near={1}
                    shadow-camera-far={12000}
                    shadow-mapSize-width={1024}
                    shadow-mapSize-height={1024}
                    castShadow
                />

                {players.map(player => <PlayerView key={player.id} player={player} messages={player.visibleMessages} />)}

                <mesh receiveShadow rotation-x={- Math.PI / 2}>
                    <planeBufferGeometry attach="geometry" args={[16000, 16000]} />
                    <meshLambertMaterial attach="material" color={0x445566}>
                        <primitive attach="map" object={grassTexture} repeat={[64, 64]} wrapS={THREE.RepeatWrapping} wrapT={THREE.RepeatWrapping} encoding={THREE.sRGBEncoding} />
                    </meshLambertMaterial>
                </mesh>
            </Canvas>
            {playground && 
                <ChatWindow sendChatMessage={playground.sendChatMessage.bind(playground)} messages={messages} />
            }
        </div>
    )
}

export default MainCanvas