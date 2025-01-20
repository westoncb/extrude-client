import React, { useEffect, useState } from "react";
import * as THREE from "three";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei"; // Replaces deprecated <Dom>
import { useDOM } from "./w-hooks"; // Custom hook, keep if you still need it
import ModelFactory from "../ModelFactory";
import Util from "../Util";
import "./Player.css";
import { Vector2 } from "three";

const PLAYER_SPEED_SCALE = 1.75;

function Player({ player, isLocalPlayer, t }) {
  const [md2, setMd2] = useState(null);
  const [height, setHeight] = useState(0);
  const [laser, setLaser] = useState(null);

  const { size } = useThree();

  // Custom hook usage: presumably toggles some DOM parents/containers
  // so your .scene-label and other elements can attach properly
  useDOM([`#player-label-${player.id}`], [`md2-root-${player.id}`]);

  // Create label div for this player
  useEffect(() => {
    const label = document.createElement("div");
    label.id = `player-label-${player.id}`;
    label.className = "scene-label";
    label.innerText = player.name;

    const app = document.getElementsByClassName("App")[0];
    app.appendChild(label);

    return () => {
      if (app.contains(label)) {
        app.removeChild(label);
      }
    };
  }, [player.id, player.name]);

  // Keep MD2 data in sync with game state
  useEffect(() => {
    if (md2) {
      // If -1 or we’re above some threshold, bail out
      if (t === -1 || md2.root.position.y > 25) return;
      md2.t = t;

      // If not local, just copy position from store
      if (!isLocalPlayer) {
        md2.root.position.copy(player.position);
      }
    }
  }, [t, md2, player, isLocalPlayer]);

  // Load the MD2 model + Laser line
  useEffect(() => {
    ModelFactory.getModelInstance(player.skindex).then((instance) => {
      const bbox = Util.computeCompositeBoundingBox(instance.root);

      instance.root.userData.name = `md2-root-${player.id}`;

      setHeight(bbox.getSize(new THREE.Vector3()).y);

      setMd2(instance);

      instance.root.position.set(
        player.position.x,
        instance.root.position.y,
        player.position.z,
      );

      // Create a line geometry for the "laser"
      const geometry = new LineGeometry();
      geometry.setPositions([0, 0, 0, 0, 0, 100]); // placeholder points

      const matLine = new LineMaterial({
        color: 0x66ff11,
        linewidth: 2,
        vertexColors: false,
        dashed: false,
        resolution: new Vector2(size.width, size.height),
      });

      const line = new Line2(geometry, matLine);
      instance.root.add(line);

      setLaser(line);
    });
  }, [player.skindex, player.id, player.position, size.width, size.height]);

  // Update per frame
  useFrame((_, delta) => {
    if (!md2) return;

    // Key states to MD2
    md2.controls.moveForward =
      player.keyStates["w"] || player.keyStates["ArrowUp"];
    md2.controls.moveBackward =
      player.keyStates["s"] || player.keyStates["ArrowDown"];
    md2.controls.moveLeft =
      player.keyStates["a"] || player.keyStates["ArrowLeft"];
    md2.controls.moveRight =
      player.keyStates["d"] || player.keyStates["ArrowRight"];
    md2.controls.moveUp = player.keyStates["q"];
    md2.controls.moveDown = player.keyStates["e"];
    md2.controls.jump = player.keyStates[" "];
    md2.controls.attack = player.keyStates["f"];

    // Update MD2 animations
    md2.update(delta * PLAYER_SPEED_SCALE);
    md2.t += delta * PLAYER_SPEED_SCALE;

    // “Gravity” effect on y pos (was presumably from a ballistic formula)
    md2.root.position.y = Math.max(
      24.25,
      24.25 + md2.t ** 2 * -18.369 * 15 + md2.t * 17.209 * 15,
    );

    // Copy back to our global player object
    player.position.x = md2.root.position.x;
    player.position.y = md2.root.position.y;
    player.position.z = md2.root.position.z;

    // Laser & target orientation
    md2.target = player.target;
    const pos = new THREE.Vector3(
      player.position.x,
      player.position.y,
      player.position.z,
    );
    const tar = new THREE.Vector3(
      player.target.x,
      player.target.y,
      player.target.z,
    );
    tar.sub(pos);

    player.yRotation = -md2.bodyOrientation;

    if (laser) {
      laser.rotation.y = player.yRotation;
      laser.geometry.setPositions([0, 20, 5, tar.x, tar.y, tar.z]);
      laser.geometry.needsUpdate = true;
    }

    // If you still want a spotlight targeting the player’s target:
    // if (lightRef.current) {
    //   lightRef.current.target.position.copy(player.target);
    //   lightRef.current.target.updateMatrixWorld();
    // }
  });

  return (
    <mesh>
      {md2 && (
        <>
          {/* Example spotlight (if you want it) */}
          {/* <spotLight
            ref={lightRef}
            position={[player.position.x, player.position.y + 350, player.position.z]}
            args={[0x9999ff]}
            intensity={4}
            penumbra={0.5}
          /> */}

          {/* The MD2 model */}
          <primitive
            object={md2.root}
            onClick={() => console.log("clicked model")}
          />

          {/* Show messages in speech bubbles via <Html> from @react-three/drei */}
          {player.visibleMessages.map((message, i) => (
            <Html
              key={message.time}
              center
              // "transform" can help preserve 3D perspective if desired:
              // transform
              position={[
                player.position.x,
                player.position.y + height / 1.5,
                player.position.z,
              ]}
              style={{ transform: `translateY(${-i * 2.1}rem)` }}
            >
              <div className="speech-bubble">{message.message}</div>
            </Html>
          ))}
        </>
      )}
    </mesh>
  );
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

export default Player;
