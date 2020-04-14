import React, {useMemo, useEffect, useState, useRef} from 'react'
import * as THREE from 'three'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { Canvas, extend, useThree, useFrame } from 'react-three-fiber'
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
import { Vector3, MathUtils, Object3D, Euler } from 'three'
import { snap } from './components/w-hooks'
import {mousePos, keyStates} from './global'
import Util from './Util'
import DDisplay from './ddisplay'

extend({ EffectComposer, RenderPass, UnrealBloomPass, SSAOPass })

const stats = new Stats()
// const camDest = new Vector3(0, 100, 100)
const camLookAtDest = new Vector3(0, 0, 0)
const lastLookAtVec = new Vector3()

let camZoom = 1

const CameraController = ({localPlayer, mode}) => {
    const { camera, scene } = useThree()

    useFrame(() => {
        stats.update()
        
        if (mode === Const.MODE_DEFAULT) {

            const playerStartingForwardDir = new Vector3(0, 0, 1)

            const playerProxy = new Object3D()
            playerProxy.position.set(localPlayer.position.x, localPlayer.position.y, localPlayer.position.z)
            

            // This is all to get the 'playerProxy' oriented the same as the player model
            const target = new Vector3(localPlayer.target.x, localPlayer.target.y, localPlayer.target.z)
            const targetDirection = target.clone().sub(playerProxy.position).normalize()
            const targetDirZX = new Vector3(targetDirection.x, 0, targetDirection.z)

            DDisplay.show("targetDirZX", targetDirZX)

            const quat = new THREE.Quaternion().setFromUnitVectors(playerStartingForwardDir, targetDirZX)
            playerProxy.rotateY(Math.PI)
            playerProxy.quaternion.multiply(quat)
            playerProxy.updateMatrixWorld() 

            // DDisplay.show("globalTarget", target.clone())

            // Desired position of camera is player local coords
            const camOffset = new Vector3(0, 200, 210)
            const localTarget = playerProxy.worldToLocal(target.clone())
            
            // DDisplay.show("player-direction", playerProxy.getWorldDirection())
            // DDisplay.show("localTarget", localTarget)

            const baseLocalCamDir = localTarget.clone().sub(camOffset).normalize().negate()

            // Rather than use baseLocalCamDir directly we figure out the angle between the
            // y-axis and it, so that we can express constraints on that angle, and then
            // we rotate the y-axis using the constrained angle.
            const yAxis = new Vector3(0, 1, 0)
            const camDirY = new Vector3(0, baseLocalCamDir.y, baseLocalCamDir.z)
            let angle = yAxis.angleTo(camDirY)
            angle = Math.sign(angle) * Math.max(Math.abs(angle), Math.PI / 5)
            angle = Math.sign(angle) * Math.min(Math.PI/2.8, Math.abs(angle))
            const finalCamDestLocal = yAxis.clone().applyAxisAngle(new Vector3(1, 0, 0), angle).multiplyScalar(camOffset.length())

            const camDest = playerProxy.localToWorld(finalCamDestLocal.clone())

            // DDisplay.show("y-axis angle (constrained)", angle)
            DDisplay.show("camDest-local", finalCamDestLocal.clone())
            DDisplay.show("camDest", camDest)

            const between = camDest.clone().sub(camera.position)
            const dist = between.length()

            // map dist to [0, PI/2]
            const normDist = Util.clamp(0, 1, (dist - 50) / (500 - 50)) * Math.PI/2
            const increment = (Util.step(500, dist) * 0.1 + 
                              Util.step(50, dist) * (Math.sin(normDist) * 0.2)) * Util.smoothstep(30, 40, dist)

            camera.position.copy(camera.position.lerp(camDest, increment))

            // This way camera doesn't bob up and down when player jumps
            const posWithFixedY = playerProxy.position.clone()
            posWithFixedY.y = 100

            camera.lookAt(posWithFixedY)
            camera.updateMatrixWorld()
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
    const {execute, dispatch, state} = usePlayground()
    const localPlayer = state.players[state.localPlayerId]
    const [lastSnappedPoint, setLastSnappedPoint] = useState(new Vector3())
    let snappedPoint = lastSnappedPoint

    useEffect(() => {
        execute("initialize", {player: playerInfo})
        console.log("executed initialize!")
    }, [playerInfo])

    const handleMeshMouseMove = e => {

        // Required so reac-three-fiber only processes the nearest mesh
        e.stopPropagation()

        snappedPoint = snap(state, e)
        setLastSnappedPoint(snappedPoint)

        execute("update_player_target", {target: snappedPoint, playerId: localPlayer.id})
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
                pixelRatio={window.pixelRatio}
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
                <CameraController localPlayer={localPlayer} mode={mode} />

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

                <directionalLight
                    args={[0x9999ff, 7]}
                    position={[500, 5000, -1000]}
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
                    <PartialStructure player={localPlayer} snappedPoint={snappedPoint} dispatch={dispatch} finishStructureFunc={finishStructure} />
                }

                {/* <axesHelper args={[70]}/> */}

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
                >
                    <planeBufferGeometry attach="geometry" args={[16000, 16000]} />
                    <meshStandardMaterial attach="material" color={0x333333} roughness={0.55} metalness={0.8}>
                        <primitive attach="map" object={grassTexture} repeat={[64, 64]} wrapS={THREE.RepeatWrapping} wrapT={THREE.RepeatWrapping} encoding={THREE.sRGBEncoding}/>
                    </meshStandardMaterial>
                </mesh>

                {localPlayer &&
                    <mesh
                        onPointerMove={handleMeshMouseMove}
                        position={[localPlayer.position.x, localPlayer.position.y, localPlayer.position.z]}
                    >
                        <sphereBufferGeometry attach="geometry" args={[5000]} />
                        <meshStandardMaterial attach="material" color={0x2266ff} roughness={0.55} metalness={0.8} side={THREE.DoubleSide} />
                    </mesh>
                }

            </Canvas>
            {chatVisible &&
                <ChatWindow players={state.players} sendChatMessage={sendChatMessage} localPlayer={localPlayer} messages={state.messages} hideChat={() => setChatVisible(false)}/>
            }
        </div>
    )
}

export default MainCanvas