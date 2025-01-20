import React, { useRef, useEffect, useMemo } from "react";
import { DoubleSide, Vector3, Vector2, AdditiveBlending } from "three";
import { useThree, useFrame } from "@react-three/fiber";
import Util from "../Util";
import Const from "../constants";

const plane_size = 16000;

/**
 *  Minimal fix:
 *   - Keep your "pos" and "wTargetUV" logic for the world-based grid lines.
 *   - Use gl_FragCoord for the spotlight but *normalize* it with
 *     screen resolution, so it matches the "mouse" uniform.
 */
function TangentGrid({
  position,
  orientation,
  target,
  targetUV,
  mouse, // still screen coords
  cellSize,
}) {
  const meshRef = useRef();

  // Local refs for time + last orientation => avoid collisions
  const lastOrientationRef = useRef(new Vector3());
  const timeRef = useRef(0);

  // For screen resolution, so we can unify gl_FragCoord & mouse
  const { size } = useThree(); // e.g. size.width, size.height

  useEffect(() => {
    if (meshRef.current) {
      // Keep your lookAt logic as-is
      const laPoint = position.clone().addScaledVector(orientation, 5);
      meshRef.current.lookAt(laPoint);
    }
    // If orientation changed, reset time
    if (!Util.vecsEqual3D(orientation, lastOrientationRef.current)) {
      timeRef.current = 0;
    }
    lastOrientationRef.current.copy(orientation);
  }, [position, orientation]);

  // Create the uniforms object just once, mutate .value in useFrame
  const uniforms = useMemo(() => {
    return {
      // grid logic
      vTarget: { value: target },
      planeSize: { value: new Vector2(plane_size, plane_size) },
      mouse: { value: new Vector2(mouse.x, mouse.y) },
      cellSize: { value: cellSize },

      // "pointerUV" for snap logic => we store in a uniform as in your code
      targetUV: { value: new Vector2() }, // set in onPointerMove

      // time
      time: { value: 0 },

      // screen resolution for spotlight normalization
      resolution: { value: new Vector2(size.width, size.height) },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep updating the uniform .value in the frame loop
  useFrame((_, delta) => {
    timeRef.current += delta;
    uniforms.time.value = timeRef.current;
    uniforms.cellSize.value = cellSize;

    // Update mouse & resolution in case the viewport is resized, or mouse changed
    uniforms.mouse.value.x = mouse.x;
    // invert y if needed, or keep as is:
    uniforms.mouse.value.y = mouse.y;
    uniforms.resolution.value.x = size.width;
    uniforms.resolution.value.y = size.height;
  });

  // onPointerMove sets the "pointerUV" uniform (0..1 on the plane)
  const onPointerMove = (e) => {
    uniforms.targetUV.value.x = e.uv.x;
    uniforms.targetUV.value.y = e.uv.y;
  };

  const fragmentShader = `
    varying vec3 norm;
    varying vec2 pos;        // world-based for grid lines
    varying vec2 vUv;        // plain [0..1] uv
    varying vec2 wTargetUV;  // pointer in world coords

    // Same as your original
    uniform vec2 planeSize;
    uniform vec2 mouse;      // now in screen coords
    uniform vec2 resolution; // new uniform to unify coords
    uniform float cellSize;
    uniform float time;

    const float PI = 3.1418;

    float gridValue(vec2 coord){
        vec2 nCoord = (coord / cellSize);
        vec2 grid = abs(fract(nCoord) - 0.5) / fwidth(nCoord*2.95);
        float line = min(grid.x, grid.y);
        return 1.0 - min(line, 1.0);
    }

    void main() {
        vec4 blue = vec4(
          0.0, 0.0, 1.5,
          0.75 * (clamp(0.0, 1.0, 3.0 * log(time + 0.9)))
        );

        float blendFactor = min(2.3 / length(fwidth(vUv)), 1.0);
        float gridVal = gridValue(pos);

        // SHIFT #1: unify spotlight in screen coords
        // gl_FragCoord.xy -> [0..viewport], so we also divide by resolution
        vec2 fragNDC   = gl_FragCoord.xy / resolution;
        vec2 mouseNDC  = mouse / resolution;
        vec2 mouseOffset = fragNDC - mouseNDC;

        // same radius as your old step thresholds
        float spotlight = 1.0 - smoothstep(0.3, 0.6, length(mouseOffset));

        // The ring logic for grid snapping
        vec2 pointToJunction = abs(fract(pos / cellSize)) - 0.5;
        float edgeDist = length(pointToJunction);
        float steppedEdgeDist = 1.0 - smoothstep(
          ${Const.CELL_SNAP_RATIO - 0.03},
          ${Const.CELL_SNAP_RATIO},
          edgeDist
        );

        vec2 mouseToEdge = abs(fract(wTargetUV / cellSize)) - 0.5;
        float steppedMouseDist = 1.0 - smoothstep(
          ${Const.CELL_SNAP_RATIO - 0.03},
          ${Const.CELL_SNAP_RATIO},
          length(mouseToEdge)
        );

        vec2 mouseIndex = floor(wTargetUV / cellSize);
        vec2 posIndex   = floor(pos / cellSize);

        // toggle snap point rendering if pointer & pixel share the same grid vertex
        float toggle = 1.0 - clamp(0.0, 1.0, length(mouseIndex - posIndex));

        // same ring animation as your code
        float rings = clamp(
          0.0, 1.0,
          mod(edgeDist * 5.0 * (PI/2.0) * 7.0 + time*4.0, 2.0*PI) - 2.0
        );
        float snapVal = min(steppedMouseDist, steppedEdgeDist) * toggle * rings;

        // Final color
        gl_FragColor =
          (1.0 - snapVal) * blue * gridVal * spotlight * blendFactor
          + vec4(1.0, 0.0, 1.0, 0.7) * snapVal;
    }
  `;

  const vertexShader = `
    varying vec3 norm;
    varying vec2 pos;
    varying vec2 wTargetUV;
    varying vec2 vUv;

    uniform float time;
    uniform vec2 planeSize;
    uniform vec2 mouse;
    uniform vec2 targetUV;
    uniform float cellSize;

    void main() {
        norm = normalize(normalMatrix * normal);
        // "pos" in world coords => (uv - 0.5)*planeSize + cellSize/2
        pos = (((uv - 0.5) * planeSize) + cellSize * 0.5);
        wTargetUV = ((targetUV - 0.5) * planeSize) + cellSize * 0.5;
        vUv = uv;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  return (
    <mesh ref={meshRef} position={position} onPointerMove={onPointerMove}>
      <planeGeometry args={[plane_size, plane_size]} />
      <shaderMaterial
        extensions={{ derivatives: true }}
        blending={AdditiveBlending}
        depthTest={true}
        depthWrite={true}
        transparent
        side={DoubleSide}
        uniforms={uniforms}
        fragmentShader={fragmentShader}
        vertexShader={vertexShader}
      />
    </mesh>
  );
}

export default TangentGrid;
