import React, {useMemo, useEffect, useState, useRef} from 'react'
import * as THREE from 'three'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { Canvas, extend, useThree, useFrame } from 'react-three-fiber'
import Playground from './playground'
import Const from './constants'
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
import { Vector3, MathUtils } from 'three'
import Util from './Util'

extend({ EffectComposer, RenderPass, UnrealBloomPass, SSAOPass })

const stats = new Stats()
const camDest = new Vector3(0, 100, 100)
const camLookAtDest = new Vector3(0, 0, 0)
const lastLookAtVec = new Vector3()

let camZoom = 1

const CameraController = ({playground, mode}) => {
    const { camera, scene } = useThree()

    useFrame(() => {
        stats.update()
        
        if (mode === Const.MODE_DEFAULT) {
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

            camLookAtDest.copy(target.clone().add(target.clone().sub(position).multiplyScalar(0.8)))


            const positionGap = camera.position.clone().sub(camDest).length()
            const scale = MathUtils.clamp(positionGap / 10, 0.1, 4)
            camera.position.copy(camera.position.lerp(camDest, 0.005 * scale * Util.smoothstep(100, 115, positionGap)))


            const lookAtGap = lastLookAtVec.clone().sub(camLookAtDest).length()
            const newLookAt = lastLookAtVec.lerp(camLookAtDest, Util.smoothstep(75, 90, lookAtGap) * 0.005).clone()
            
            camera.lookAt(newLookAt)
            lastLookAtVec.copy(newLookAt)
            
            camera.updateProjectionMatrix()
        }
    })

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

function InputHandler({mode, setMode, playground, structures, setStructures, chatVisible, setChatVisible, setT, activeObjectId, setActiveObjectId, mouseTravel, setMouseTravel}) {
    const { gl, size } = useThree()

    useEffect(() => {
        gl.domElement.onclick = e => {
            switch (mode) {
                case Const.MODE_DEFAULT:
                    setChatVisible(false)

                    if (playground)
                        playground.localClick(e)
                    break;
                case Const.MODE_EXTRUDE:
                    setMode(Const.MODE_DEFAULT)
                    break;
                default:
                    break;
            }
        }
        window.onkeydown = e => {

            if (e.which === 9) { // tab key
                e.preventDefault()

                setChatVisible(!chatVisible)
            }

            if (playground && !chatVisible)
                playground.localKeyDown(e)

            if (e.key === ' ') {
                setT(0)
                setT(-1)
            }
        }
        window.onkeyup = e => {
            if (playground)
                playground.localKeyUp(e)
        }
        gl.domElement.onmousemove = e => {

            switch (mode) {
                case Const.MODE_DEFAULT:
                    if (playground)
                        playground.localMouseMove(e)
                    break;
                case Const.MODE_EXTRUDE:
                    setMouseTravel({x: mouseTravel.x + e.movementX, y: mouseTravel.y + e.movementY})
                    break;
                default:
                    break;
            }
        }

        gl.domElement.onwheel = e => {
            switch (mode) {
                case Const.MODE_DEFAULT:
                    e.preventDefault()
                    camZoom += e.deltaY * 0.01
                    camZoom = Math.min(Math.max(.05, camZoom), 3)
                    break;
                case Const.MODE_EXTRUDE:

                    const activeStructure = structures[activeObjectId]
                    const newDepth = Math.max(0, activeStructure.extrusionParams.depth + e.deltaY)
                    setStructures({ ...structures, [activeStructure.id]: { ...activeStructure, extrusionParams: { ...activeStructure.extrusionParams, depth: newDepth } }})
                    break;
                default:
                    break;
            }
        }
    }, [gl, playground, chatVisible, mode, activeObjectId, structures, mouseTravel])

    return null
}

function MainCanvas({player}) {
    const [players, setPlayers] = useState([])
    const [messages, setMessages] = useState([])
    const [playground, setPlayground] = useState(null)
    const [chatVisible, setChatVisible] = useState(false)
    const [structures, setStructures] = useState({})
    const [activeObjectId, setActiveObjectId] = useState(null)
    const [mouseTravel, setMouseTravel] = useState({x: 0, y:0})
    const [t, setT] = useState(100)
    const grassTexture = useMemo(() => new THREE.TextureLoader().load("rust2.jpg"), [])
    const [mode, setMode] = useState(Const.MODE_DEFAULT)

    useEffect(() => {
        setPlayground(new Playground(player, players => setPlayers(players), structures => setStructures(structures), messages => setMessages(messages)))
    }, [player])

    const handleMeshMouseMove = e => {

        // Required so reac-three-fiber only processes the nearest mesh
        e.stopPropagation()

        // It's an issue that these are out of sync...
        playground.getLocalPlayer().target = e.point
        player.target = e.point
        MeshEvents.eventOccurred(MeshEvents.MOUSE_MOVE, e)
    }
    const handleMeshClick = e => {
        e.stopPropagation()

        MeshEvents.eventOccurred(MeshEvents.CLICK, e)
    }
    const handleMeshPointerOut = e => {
        MeshEvents.eventOccurred(MeshEvents.POINTER_OUT, e)
    }
    const handleMeshPointerOver = e => {
        MeshEvents.eventOccurred(MeshEvents.POINTER_OVER, e)
    }

    const finishStructure = structure => {
        const newStructures = { ...structures, [structure.id]: structure }
        setStructures(newStructures)
        setMode(Const.MODE_EXTRUDE)
        setActiveObjectId(structure.id)
        playground.updateStructuresFromLocal(newStructures)
    }

    const updateStructure = structure => {
        const newStructures = { ...structures, [structure.id]: structure }
        setStructures(newStructures)
        setActiveObjectId(null)
        setMouseTravel({ x: 0, y: 0})
        setMode(Const.MODE_DEFAULT)
        playground.updateStructuresFromLocal(newStructures)
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

                <InputHandler 
                    mode={mode}
                    setMode={setMode}
                    playground={playground}
                    structures={structures}
                    setStructures={setStructures}
                    chatVisible={chatVisible}
                    setChatVisible={setChatVisible}
                    activeObjectId={activeObjectId}
                    setActiveObjectId={setActiveObjectId}
                    mouseTravel={mouseTravel}
                    setMouseTravel={setMouseTravel}
                    setT={setT}
                />
                <CameraController playground={playground} mode={mode} />

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

                {players.map(player => <Player key={player.id} t={t} player={player} mode={mode} messages={player.visibleMessages} />)}

                {mode === Const.MODE_DEFAULT &&
                    <PartialStructure player={player} finishStructureFunc={finishStructure} />
                }

                {Object.values(structures).map(structure => <Structure 
                                                key={structure.id}
                                                structure={structure}
                                                updateStructure={updateStructure}
                                                player={playground.getLocalPlayer()}
                                                onPointerMove={handleMeshMouseMove}
                                                onClick={handleMeshClick}
                                                onPointerOut={handleMeshPointerOut}
                                                onPointerOver={handleMeshPointerOver}
                                                mode={mode}
                                                active={activeObjectId === structure.id}
                                                setMode={(mode, id) => {
                                                    setMode(mode)
                                                    if (id) setActiveObjectId(id)
                                                }}
                                                mouseTravel={mouseTravel}
                                            />)}

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