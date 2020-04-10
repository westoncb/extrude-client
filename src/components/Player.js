import React, { useEffect, useMemo, useState, useRef } from 'react'
import * as THREE from 'three'
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { useFrame, useThree, Dom } from 'react-three-fiber'
import { useDOM } from './w-hooks'
import ModelFactory from '../ModelFactory'
import Util from '../Util'
import './Player.css'
import { Vector2, Euler } from 'three'

// let imageCapture
// let texture
// let outerTick = 0

const PLAYER_SPEED_SCALE = 1.75

function Player({ player, isLocalPlayer, t }) {
    const [md2, setMd2] = useState(null)
    const [height, setHeight] = useState(0)
    const [laser, setLaser] = useState(null)
    const { size } = useThree()
    const lightRef = useRef()
    // const [tick, setTick] = useState(0)

    useDOM(['#player-label-' + player.id], ["md2-root-" + player.id])

    useEffect(() => {
        const label = document.createElement("div")
        label.id = 'player-label-' + player.id
        label.className = "scene-label"
        label.innerText = player.name
        const app = document.getElementsByClassName("App")[0]
        app.appendChild(label)

        return () => app.removeChild(label)
    }, [player.id, player.name])

    useEffect(() => {
        if (md2) {
            if (t === -1 || md2.root.position.y > 25) return

            md2.t = t

            if (!isLocalPlayer) {
                md2.root.position.copy(player.position)
            }
        } 
    }, [t, md2, player])

    useEffect(() => {
        ModelFactory.getModelInstance(player.skindex).then(instance => {
            const bbox = Util.computeCompositeBoundingBox(instance.root)

            instance.root.userData.name = "md2-root-"+player.id

            setHeight(bbox.getSize().y)
            setMd2(instance)

            instance.root.position.set(player.position.x, instance.root.position.y, player.position.z)

            const geometry = new LineGeometry();
            geometry.setPositions([0, 0, 0, 0, 0, 100])

            // Laser colors
            // 0x66ff11
            // 0x0033dd
            // 0x11ff66
            // 0x882288
            const matLine = new LineMaterial({
                color: 0x66ff11,
                linewidth: 2,
                vertexColors: false,
                dashed: false,
                resolution: new Vector2(size.width, size.height)
            });

            const line = new Line2(geometry, matLine)
            instance.root.add(line)

            setLaser(line)
        })
    }, [])

    // useEffect(() => {
    //     setInterval(() => {
    //         setTick(++outerTick)
    //     }, 400)
    // }, [])

    // const vidTex = useMemo(() => {
    //     return getVideoTexture()
    // }, [tick])

    useFrame((info, delta) => {
        if (md2) {
            md2.controls.moveForward = player.keyStates['w'] || player.keyStates['ArrowUp']
            md2.controls.moveBackward = player.keyStates['s'] || player.keyStates['ArrowDown']
            md2.controls.moveLeft = player.keyStates['a'] || player.keyStates['ArrowLeft']
            md2.controls.moveRight = player.keyStates['d'] || player.keyStates['ArrowRight']
            md2.controls.moveUp = player.keyStates['q']
            md2.controls.moveDown = player.keyStates['e']
            md2.controls.jump = player.keyStates[' ']
            md2.controls.attack = player.keyStates['f']
            md2.update(delta * PLAYER_SPEED_SCALE)
            md2.t += delta * PLAYER_SPEED_SCALE
            md2.root.position.y = Math.max(24.25, 24.25 + md2.t ** 2 * -18.369 * 15 + md2.t * 17.209 * 15)
            player.position.x = md2.root.position.x
            player.position.y = md2.root.position.y
            player.position.z = md2.root.position.z

            md2.target = player.target
            const pos = new THREE.Vector3(player.position.x, player.position.y, player.position.z)
            const tar = new THREE.Vector3(md2.target.x, md2.target.y, md2.target.z)

            tar.sub(pos)

            laser.rotation.y = -md2.bodyOrientation
            laser.geometry.setPositions([0, 20, 5, tar.x, tar.y, tar.z])
            laser.geometry.needsUpdate = true

            // if (lightRef.current) {
            //     lightRef.current.target.position.copy(player.target)
            //     lightRef.current.target.updateMatrixWorld()
            // }
        }
    })

    return (
        <mesh>
            {md2 && 
                <>
                    {/* <spotLight 
                        ref={lightRef}
                        position={[player.position.x, player.position.y + 350, player.position.z]}
                        args={[0x9999ff]}
                        intensity={4}
                        penumbra={0.5} 
                    /> */}
                    <primitive object={md2.root} onClick={e => console.log('click')}>
                        {/* <mesh position={[0, 200, -100]}>
                            <planeBufferGeometry attach="geometry" args={[250, 150]} />
                            <meshBasicMaterial attach="material" side={THREE.DoubleSide}>
                                <primitive attach="map" object={vidTex} wrapS={THREE.ClampToEdgeWrapping} wrapT={THREE.ClampToEdgeWrapping} encoding={THREE.sRGBEncoding}/>
                            </meshBasicMaterial>
                        </mesh> */}
                    </primitive>

                    {player.visibleMessages.map((message, i) => (
                        <Dom key={message.time} center position={[player.position.x, player.position.y + height/1.5, player.position.z]}>
                            <div style={{transform: `translateY(${-i*2.1}rem)`}} className="speech-bubble">{message.message}</div>
                        </Dom>
                    ))}
                </>
            }
        </mesh>
    )
}

// function getVideoTexture() {
//     if (!texture)
//         texture = new THREE.Texture()

//     var video = document.getElementById('video');

//     const drawCanvas = img => {
//         const canvas = document.getElementById('test-canvas');
//         canvas.width = getComputedStyle(canvas).width.split('px')[0];
//         canvas.height = getComputedStyle(canvas).height.split('px')[0];
//         let ratio = Math.min(canvas.width / img.width, canvas.height / img.height);
//         let x = (canvas.width - img.width * ratio) / 2;
//         let y = (canvas.height - img.height * ratio) / 2;
//         canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
//         canvas.getContext('2d').drawImage(img, 0, 0, img.width, img.height,
//             x, y, img.width * ratio, img.height * ratio);

//         canvas.width = 256
//         canvas.height = 256
//         canvas.style.width = "256px"
//         canvas.style.height = "256px"

//         return canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height)
//     }

//     const updateTexture = async imageCapture => {
//         const { imageWidth, imageHeight } = await imageCapture.getPhotoCapabilities();
//         // console.log("asdf", imageWidth, imageHeight)

//         imageCapture.takePhoto({imageWidth: imageWidth.min, imageHeight: imageHeight.min})
//             .then(blob => createImageBitmap(blob))
//             .then(imageBitmap => {
//                 texture.image = drawCanvas(imageBitmap)
//                 texture.format = THREE.RGBAFormat
//                 texture.needsUpdate = true
//             })
//             .catch(error => console.log(error));
//     }

//     if (!imageCapture) {
//         navigator.mediaDevices.getUserMedia({ video: true, audio: false })
//             .then(mediaStream => {
//                 video.srcObject = mediaStream;

//                 const track = mediaStream.getVideoTracks()[0];
//                 imageCapture = new ImageCapture(track);

//                 return imageCapture
//             }).then(imageCapture => {
//                 updateTexture(imageCapture)
//             }).catch(error => console.log('Error with video stream capture', error.name || error))
//     } else {

//         updateTexture(imageCapture)
//     }

//     return texture
// }

export default Player