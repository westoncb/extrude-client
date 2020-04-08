import React, {useMemo, useEffect, useState, useRef} from 'react'
import * as THREE from 'three'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { Canvas, extend, useThree, useFrame, useUpdate } from 'react-three-fiber'
import usePlayground from './playground'
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
import { Vector3, MathUtils, Raycaster } from 'three'
import Util from './Util'
import {mousePos, keyStates, intersections} from './global'

extend({ EffectComposer, RenderPass, UnrealBloomPass, SSAOPass })

const stats = new Stats()
const camDest = new Vector3(0, 100, 100)
const camLookAtDest = new Vector3(0, 0, 0)
const lastLookAtVec = new Vector3()
const raycaster = new Raycaster()

let camZoom = 1
let frame = 0

const CameraController = ({localPlayer, mode}) => {
    const { camera, scene } = useThree()
    const [frameIndex, setFrameIndex] = useState(0)

    useEffect(() => {
        
    }, [frameIndex, scene.children, camera])

    useFrame(() => {
        stats.update()
        
        // Note that doing this every-frame raycasting was causing periodic
        // crashes before, probably because the timing here is during a
        // react-three-fiber scene rebuild or something. The crash was in
        // Line2.js specifically and removing it seems to have fixed things,
        // but if you're seeing random crashes this could be an issue...
        const x = (mousePos.x / window.innerWidth) * 2 - 1;
        const y = - (mousePos.y / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera({ x, y }, camera)
        intersections.length = 0
        raycaster.intersectObjects(scene.children).forEach(i => intersections.push(i))

        if (mode === Const.MODE_DEFAULT) {

            const positionObj = localPlayer.position
            const targetObj = localPlayer.target
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

function InputHandler({mode, setMode, execute, structures, chatVisible, setChatVisible, setT, setShiftDown, activeObjectId, setActiveObjectId, mouseTravel, setMouseTravel}) {
    const { gl, size } = useThree()

    useEffect(() => {
        gl.domElement.onclick = e => {
            switch (mode) {
                case Const.MODE_DEFAULT:
                    setChatVisible(false)

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

            keyStates[e.key] = true
            execute("key_down", {...e, which: e.which, key: e.key})
            if (e.key === 'Shift') {
                setShiftDown(true)
            }

            if (e.key === ' ') {
                setT(0)
                setT(-1)
            }
        }
        window.onkeyup = e => {
            keyStates[e.key] = true
            if (e.key === 'Shift') {
                setShiftDown(false)
            }
            execute("key_up", { ...e, which: e.which, key: e.key})
        }
        gl.domElement.onmousemove = e => {

            mousePos.x = e.clientX
            mousePos.y = e.clientY

            switch (mode) {
                case Const.MODE_DEFAULT:

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
                    const updatedStructure = { ...activeStructure, extrusionParams: { ...activeStructure.extrusionParams, depth: newDepth } }
                    execute("update_structure", { structure: updatedStructure})
                    break;
                default:
                    break;
            }
        }
    }, [gl, chatVisible, mode, activeObjectId, structures, mouseTravel])

    return null
}

function MainCanvas({playerInfo}) {
    const [chatVisible, setChatVisible] = useState(false)
    const [activeObjectId, setActiveObjectId] = useState(null)
    const [mouseTravel, setMouseTravel] = useState({x: 0, y:0})
    const [t, setT] = useState(100)
    const grassTexture = useMemo(() => new THREE.TextureLoader().load("rust2.jpg"), [])
    const [mode, setMode] = useState(Const.MODE_DEFAULT)
    const [shiftDown, setShiftDown] = useState(false)
    const {execute, state} = usePlayground()
    const mainPlaneRef = useRef()
    const localPlayer = state.players[state.localPlayerId]

    useEffect(() => {
        execute("initialize", {player: playerInfo})
    }, [playerInfo])

    useEffect(() => {
        if (mainPlaneRef.current) {
            mainPlaneRef.current.userData.name = "main_plane"
        }
    }, [mainPlaneRef.current])

    const handleMeshMouseMove = e => {

        // Required so reac-three-fiber only processes the nearest mesh
        e.stopPropagation()

        // This is just to send it over the network
        execute("update_player_target", {target: e.point, playerId: localPlayer.id})

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
        execute("update_structure", {structure})
        setMode(Const.MODE_EXTRUDE)
        setActiveObjectId(structure.id)
    }

    const updateStructure = structure => {
        console.log("calling update structure", structure)
        execute("update_structure", {structure})
        setActiveObjectId(null)
        setMouseTravel({ x: 0, y: 0})
        setMode(Const.MODE_DEFAULT)
    }

    const sendChatMessage = message => {
        execute("send_chat_message", message)
    }

    return (
        <div className="main-canvas-container">
            <Canvas
                style={{ backgroundColor: "#789" }}
                gl={{ antialias: false, alpha: false}}
                pixelRatio={1}
                camera={{ position: [0, 10, 10], near: 1, far: 4000 }}
                shadowMap
                onCreated={({ gl }) => {
                    gl.toneMapping = THREE.Uncharted2ToneMapping
                    gl.outputEncoding = THREE.sRGBEncoding
                    gl.shadowMap.type = THREE.PCFSoftShadowMap
                    gl.setClearColor(new THREE.Color("#667788"))
                }}
            >
                <CameraController localPlayer={localPlayer} mode={mode} />

                <Effects />

                <InputHandler 
                    mode={mode}
                    setMode={setMode}
                    execute={execute}
                    structures={state.structures}
                    chatVisible={chatVisible}
                    setChatVisible={setChatVisible}
                    activeObjectId={activeObjectId}
                    setActiveObjectId={setActiveObjectId}
                    mouseTravel={mouseTravel}
                    setMouseTravel={setMouseTravel}
                    setT={setT}
                    setShiftDown={setShiftDown}
                />

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

                {Object.values(state.players).map(player => <Player key={player.id} t={t} player={player} isLocalPlayer={player.id === localPlayer.id} />)}

                {mode === Const.MODE_DEFAULT &&
                    <PartialStructure player={localPlayer} finishStructureFunc={finishStructure} />
                }

                {Object.values(state.structures).map(structure => <Structure 
                                                key={structure.id}
                                                structure={structure}
                                                updateStructure={updateStructure}
                                                player={localPlayer}
                                                onPointerMove={handleMeshMouseMove}
                                                onClick={handleMeshClick}
                                                onPointerOut={handleMeshPointerOut}
                                                onPointerOver={handleMeshPointerOver}
                                                mode={mode}
                                                active={activeObjectId === structure.id}
                                                shiftDown={shiftDown}
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
                    ref={mainPlaneRef}
                >
                    <planeBufferGeometry attach="geometry" args={[16000, 16000]} />
                    <meshStandardMaterial attach="material" color={0x333333} roughness={0.55} metalness={0.8}>
                        <primitive attach="map" object={grassTexture} repeat={[64, 64]} wrapS={THREE.RepeatWrapping} wrapT={THREE.RepeatWrapping} encoding={THREE.sRGBEncoding}/>
                    </meshStandardMaterial>
                </mesh>
            </Canvas>
            {chatVisible &&
                <ChatWindow players={state.players} sendChatMessage={sendChatMessage} localPlayer={localPlayer} messages={state.messages} hideChat={() => setChatVisible(false)}/>
            }
        </div>
    )
}

export default MainCanvas