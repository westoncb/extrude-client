import React, { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { useFrame, Dom } from 'react-three-fiber'
import ModelFactory from '../ModelFactory'
import Util from '../Util'
import './Player.css'

// let imageCapture
// let texture
// let outerTick = 0

const PLAYER_SPEED_SCALE = 1.75

function Player({ player, messages }) {
    const [md2, setMd2] = useState(null)
    const [height, setHeight] = useState(0)
    const [laser, setLaser] = useState(null)
    // const [tick, setTick] = useState(0)

    useEffect(() => {
        ModelFactory.getModelInstance(player.skindex).then(instance => {
            const bbox = Util.computeCompositeBoundingBox(instance.root)

            setHeight(bbox.getSize().y)
            setMd2(instance)

            instance.root.position.set(player.position.x, instance.root.position.y, player.position.z)

            const geometry = new LineGeometry();
            geometry.setPositions([0, 0, 0, 0, 0, 100])
            // geometry.setColors(colors)

            const matLine = new LineMaterial({
                color: 0x11ff66,
                linewidth: 0.003, // in pixels
                vertexColors: false,
                //resolution:  // to be set by renderer, eventually
                dashed: false

            });

            const line = new Line2(geometry, matLine)
            line.computeLineDistances()
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
            md2.controls.moveForward = player.keyStates['w']
            md2.controls.moveBackward = player.keyStates['s']
            md2.controls.moveLeft = player.keyStates['a']
            md2.controls.moveRight = player.keyStates['d']
            md2.controls.moveUp = player.keyStates['q']
            md2.controls.moveDown = player.keyStates['e']
            md2.controls.jump = player.keyStates[' ']
            md2.controls.attack = player.keyStates['f']
            md2.target = player.target
            md2.update(delta * PLAYER_SPEED_SCALE)
            player.position.x = md2.root.position.x
            player.position.y = md2.root.position.y
            player.position.z = md2.root.position.z

            const pos = new THREE.Vector3(player.position.x, player.position.y, player.position.z)
            const tar = new THREE.Vector3(md2.target.x, md2.target.y, md2.target.z)

            tar.sub(pos)

            laser.rotation.y = -md2.bodyOrientation
            laser.geometry.setPositions([0, 20, 5, tar.x, tar.y, tar.z])
            laser.geometry.needsUpdate = true
        }
    })

    return (
        <mesh>
            {md2 && 
                <>
                    <primitive object={md2.root} onClick={e => console.log('click')}>
                        {/* <mesh position={[0, 200, -100]}>
                            <planeBufferGeometry attach="geometry" args={[250, 150]} />
                            <meshBasicMaterial attach="material" side={THREE.DoubleSide}>
                                <primitive attach="map" object={vidTex} wrapS={THREE.ClampToEdgeWrapping} wrapT={THREE.ClampToEdgeWrapping} encoding={THREE.sRGBEncoding}/>
                            </meshBasicMaterial>
                        </mesh> */}
                    </primitive>

                    <Dom center position={[player.position.x, player.position.y, player.position.z]}>
                        <div className="scene-label">{player.name}</div>
                    </Dom>

                    {messages.map((message, i) => (
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