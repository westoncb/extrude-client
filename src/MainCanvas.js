import React, {useMemo, useEffect, useState, useRef} from 'react'
import * as THREE from 'three'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { Canvas, extend, useThree, useFrame } from 'react-three-fiber'
import Playground from './playground'
import MeshEvents from './MeshEvents'
import Player from './components/Player'
import PartialStructure from './components/PartialStructure'
import Structure from './components/Structure'
import ChatWindow from './components/ChatWindow'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import './MainCanvas.css'
import { Vector3, MathUtils, Vector2 } from 'three'

extend({ EffectComposer, RenderPass, UnrealBloomPass, SSAOPass })

const stats = new Stats()
const camDest = new Vector3(0, 100, 100)
const camLookAtDest = new Vector3(0, 0, 0)
const curLookAtVect = new Vector3()
const lastLookAtVec = new Vector3()

let camZoom = 1

const CameraController = ({playground, setChatVisible, chatVisible}) => {
    const { camera, gl } = useThree();

    useFrame(() => {
        stats.update()
        const positionObj = playground.getLocalPlayer().position
        const targetObj = playground.getLocalPlayer().target
        const position = new Vector3(positionObj.x, positionObj.y, positionObj.z)
        const shiftedPosition = position.set(position.x, position.y + 70, position.z)
        const target = new Vector3(targetObj.x, targetObj.y, targetObj.z)

        const toTarget = target.clone().sub(shiftedPosition).normalize()
        const extension = toTarget.clone().multiplyScalar(-200 * camZoom)
        extension.z = Math.max(Math.abs(extension.z), 50) * Math.sign(extension.z)
        extension.y = Math.max(extension.y, 50)

        camDest.copy(position.clone().add(extension))

        camLookAtDest.copy(position)


        const scale = MathUtils.clamp(camera.position.clone().sub(camDest).length() / 10, 0.1, 4)
        camera.position.copy(camera.position.lerp(camDest, 0.005 * scale))
        
        const newLookAt = lastLookAtVec.lerp(camLookAtDest, 0.05).clone()
        camera.lookAt(newLookAt)
        camera.updateProjectionMatrix()

        lastLookAtVec.copy(newLookAt)
    })

    // should be in a different component...
    useEffect(() => {
        gl.domElement.onclick = e => {
            setChatVisible(false)

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
                

            if (playground && !chatVisible)
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

function Effects({ssao, bloom}) {
    const { gl, scene, camera, size } = useThree()
    const composer = useRef()
    useEffect(() => void composer.current.setSize(size.width, size.height), [size])
    useFrame(() => composer.current.render(), 1)
    return (
        <effectComposer ref={composer} args={[gl]}>
            <renderPass attachArray="passes" args={[scene, camera]} />
            {bloom && 
                <unrealBloomPass
                    attachArray="passes"
                    args={[undefined, 1.5, 0.4, 0.60]}
                    bloomThreshold={1}
                    bloomStrength={1}
                    bloomRadius={0}
                />
            }
            {ssao &&
                <sSAOPass
                    attachArray="passes"
                    args={[scene, camera, size.width, size.height]}
                    kernelRadius={16}
                    minDistance={0.005}
                    maxDistance={50}
                />
            }
        </effectComposer>
    )
}

function MainCanvas({player}) {
    const [players, setPlayers] = useState([])
    const [messages, setMessages] = useState([])
    const [playground, setPlayground] = useState(null)
    const [chatVisible, setChatVisible] = useState(false)
    const [structures, setStructures] = useState([])
    const grassTexture = useMemo(() => new THREE.TextureLoader().load("rust2.jpg"), [])

    useEffect(() => {
        setPlayground(new Playground(player, players => setPlayers(players), messages => setMessages(messages)))
    }, [player])

    const handleMeshMouseMove = e => {
        playground.getLocalPlayer().target = e.point
        MeshEvents.mouseMove(e)
    }

    const handleMeshClick = e => {
        MeshEvents.click(e)
    }

    const finishStructure = structure => {
        console.log("finished structure", structure)
        setStructures([...structures, structure])
    }

    return (
        <div className="main-canvas-container">
            <Canvas
                style={{ backgroundColor: "#789" }}
                gl={{ antialias: false, alpha: false}}
                pixelRatio={window.devicePixelRatio}
                camera={{ position: [0, 10, 10], near: 1, far: 4000 }}
                shadowMap
                onCreated={({ gl }) => {
                    gl.toneMapping = THREE.Uncharted2ToneMapping
                    gl.outputEncoding = THREE.sRGBEncoding
                    gl.shadowMap.type = THREE.PCFSoftShadowMap
                    gl.setClearColor(new THREE.Color("#667788"))
                }}
            >
                <Effects />

                <CameraController playground={playground} setChatVisible={setChatVisible} chatVisible={chatVisible} />
                <fog attach="fog" args={[0x667788, 500, 1500]} />
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

                <PartialStructure finishStructureFunc={finishStructure}/>

                {structures.map(structure => <Structure key={structure.id} points={structure.points} extrusionLine={structure.extrusionLine}/>)}

                <mesh receiveShadow 
                    rotation-x={- Math.PI / 2} 
                    onPointerMove={handleMeshMouseMove}
                    onClick={handleMeshClick}
                >
                    <planeBufferGeometry attach="geometry" args={[16000, 16000]} />
                    <meshStandardMaterial attach="material" color={0x333333} roughness={0.55} metalness={0.8}>
                        <primitive attach="map" object={grassTexture} repeat={[64, 64]} wrapS={THREE.RepeatWrapping} wrapT={THREE.RepeatWrapping} encoding={THREE.sRGBEncoding}/>
                    </meshStandardMaterial>
                </mesh>
            </Canvas>
            {playground && chatVisible &&
                <ChatWindow sendChatMessage={playground.sendChatMessage.bind(playground)} messages={messages} hideChat={() => setChatVisible(false)}/>
            }
        </div>
    )
}

export default MainCanvas