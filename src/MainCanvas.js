import React, {useMemo, useEffect, useState, useRef} from 'react'
import * as THREE from 'three'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { Canvas, extend, useThree, useFrame } from 'react-three-fiber'
import Playground from './playground'
import Player from './components/Player'
import ChatWindow from './components/ChatWindow'
// import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
// import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
// import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass'
import './MainCanvas.css'
import { Vector3, MathUtils } from 'three'

// extend({ EffectComposer, RenderPass, SSAOPass })

const stats = new Stats()
const camDest = new Vector3()

let camZoom = 1

const CameraController = ({playground, setChatVisible, chatVisible}) => {
    const { camera, gl } = useThree();

    useFrame(() => {
        stats.update()
        const positionObj = playground.getLocalPlayer().position
        const targetObj = playground.getLocalPlayer().target
        const position = new Vector3(positionObj.x, positionObj.y + 70, positionObj.z)
        const target = new Vector3(targetObj.x, targetObj.y, targetObj.z)

        const toTarget = target.sub(position).normalize()

        camDest.copy(position.clone().add(toTarget.multiplyScalar(-200 * camZoom)))
        camDest.y = Math.max(camDest.y, 100)

        const scale = MathUtils.clamp(camera.position.clone().sub(camDest).length() / 10, 0.1, 4)
        camera.position.copy(camera.position.lerp(camDest, 0.0025 * scale))
        
        camera.lookAt(position)
        camera.updateProjectionMatrix()
    })

    // should be in a different component...
    useEffect(() => {
        gl.domElement.onclick = e => {
            if (playground)
                playground.localClick(e)
        }
        window.onkeydown = e => {

            if (e.key === 't') {
                if (!chatVisible) {
                    e.preventDefault()
                }

                setChatVisible(true)
            } else if (e.which === 27) { //escape key
                setChatVisible(!chatVisible)
            }
                

            if (playground)
                playground.localKeyDown(e)
        }
        window.onkeyup = e => {
            if (playground)
                playground.localKeyUp(e)
        }
        gl.domElement.onmousemove = e => {
            if (playground)
                playground.localMouseMove(e)
        }

        gl.domElement.onwheel = event => {
            event.preventDefault();
            camZoom += event.deltaY * 0.01;
            camZoom = Math.min(Math.max(.05, camZoom), 3);
        }
    }, [gl, playground, chatVisible])

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
    const [chatVisible, setChatVisible] = useState(false)
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
                camera={{ position: [0, 10, 10], near: 1, far: 4000 }}
                shadowMap
                onCreated={({ gl }) => {
                    gl.toneMapping = THREE.ReinhardToneMapping
                    gl.outputEncoding = THREE.sRGBEncoding
                    gl.shadowMap.type = THREE.PCFSoftShadowMap
                }}
            >
                {/* <Effects /> */}
                <CameraController playground={playground} setChatVisible={setChatVisible} chatVisible={chatVisible} />
                <fog attach="fog" args={[0x778899, 1000, 4000]} />
                <ambientLight args={[0x666666]} />
                <directionalLight
                    args={[0xffffff, 7]}
                    position={[0, 6000, 3000]}
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

                {players.map(player => <Player key={player.id} player={player} messages={player.visibleMessages} />)}

                <mesh receiveShadow 
                    rotation-x={- Math.PI / 2} 
                    onPointerMove={e => (
                        playground.getLocalPlayer().target = e.point
                    )}
                >
                    <planeBufferGeometry attach="geometry" args={[16000, 16000]} />
                    <meshLambertMaterial attach="material">
                        <primitive attach="map" object={grassTexture} repeat={[64, 64]} wrapS={THREE.RepeatWrapping} wrapT={THREE.RepeatWrapping} encoding={THREE.sRGBEncoding} />
                    </meshLambertMaterial>
                </mesh>
            </Canvas>
            {playground && chatVisible &&
                <ChatWindow sendChatMessage={playground.sendChatMessage.bind(playground)} messages={messages} hideChat={() => setChatVisible(false)}/>
            }
        </div>
    )
}

export default MainCanvas