// Structure.js
import React, { useState, useEffect, useRef } from "react";
import {
  Shape,
  Vector2,
  Vector3,
  Quaternion,
  LineCurve3,
  Euler,
  ExtrudeGeometry, // <-- Now we import from 'three'
} from "three";
import { extend } from "@react-three/fiber";
import MeshEvents from "../MeshEvents";
import Const from "../constants";
import Util from "../Util";

// Let R3F know about <extrudeGeometry />
extend({ ExtrudeGeometry });

const INITIAL_EXTRUSION_DEPTH = 4;

function Structure({
  structure,
  updateStructure,
  active,
  player,
  onPointerMove,
  onClick,
  onPointerOut,
  mode,
  setMode,
  shiftDown,
  mouseTravel,
}) {
  const [baseShape, setBaseShape] = useState(null);
  const [overMainFace, setOverMainFace] = useState(false);
  const [dragStartPoint, setDragStartPoint] = useState(null);
  const [position, setPosition] = useState(new Vector3());
  const meshRef = useRef();

  useEffect(() => {
    // Compute centroid
    const centroid = Util.centroid(structure.points);
    const normal = new Vector3().copy(structure.normal);

    // Rotate so 'normal' aligns with +Z
    const quat = new Quaternion().setFromUnitVectors(
      normal,
      new Vector3(0, 0, 1),
    );

    // Shift and rotate points into XY plane
    const shiftedPoints = structure.points.map(
      (p) => new Vector3(p.x - centroid.x, p.y - centroid.y, p.z - centroid.z),
    );
    const rotatedPoints = shiftedPoints.map((p) =>
      p.clone().applyQuaternion(quat),
    );

    // Create a Shape from those 2D (x,y) coords
    const shape = new Shape(rotatedPoints.map((p) => new Vector2(p.x, p.y)));
    setBaseShape(shape);
    setPosition(centroid);
  }, [structure.points, structure.normal]);

  useEffect(() => {
    // MeshEvents: your custom events system
    const handleMeshMouseMove = (e) => {
      if (!e.shiftKey) {
        setOverMainFace(false);
        return;
      }

      // The face's "a" vertex index helps figure out if we’re over the main face
      const hoverFaceIndex = e.face?.a;
      if (
        hoverFaceIndex >= 0 &&
        hoverFaceIndex <= mainPolyVertexCount(structure.points.length)
      ) {
        setOverMainFace(true);
      } else {
        setOverMainFace(false);
      }
    };

    const handlePointerOut = () => {
      setOverMainFace(false);
    };

    const handleMeshClick = (e) => {
      if (mode === Const.MODE_DEFAULT) {
        if (e.shiftKey) {
          setMode(Const.MODE_EXTRUDE, structure.id);
        }
      } else if (active && mode === Const.MODE_EXTRUDE) {
        updateStructure(structure);
      }
    };

    if (meshRef.current) {
      MeshEvents.listenFor(
        "structure_" + structure.id,
        {
          [MeshEvents.MOUSE_MOVE]: handleMeshMouseMove,
          [MeshEvents.CLICK]: handleMeshClick,
          [MeshEvents.POINTER_OUT]: handlePointerOut,
          [MeshEvents.POINTER_OVER]: handleMeshMouseMove,
        },
        [meshRef.current.id],
      );
    }
  }, [
    meshRef,
    overMainFace,
    structure,
    mode,
    active,
    setMode,
    updateStructure,
  ]);

  // Flags for special materials
  const showHighlightedMaterial = active && mode === Const.MODE_EXTRUDE;
  const highlightExtrusionSurface =
    baseShape && overMainFace && mode === Const.MODE_DEFAULT;

  return (
    <>
      {baseShape && (
        <mesh
          ref={meshRef}
          quaternion={rotationFromNormal(structure.normal)}
          position={position}
          castShadow
          receiveShadow
          onPointerMove={onPointerMove}
          onClick={onClick}
          onPointerOut={onPointerOut}
        >
          <extrudeGeometry
            attach="geometry"
            args={[baseShape, structure.extrusionParams]}
          />

          {/* Use whichever material logic you want here */}
          {showHighlightedMaterial ? (
            <meshPhysicalMaterial
              attach="material"
              color={0x000000}
              emissive={0x00ff00}
              emissiveIntensity={0.7}
              metalness={0.9}
              roughness={0.1}
              clearcoat
              clearcoatRoughness={0.25}
            />
          ) : (
            <meshPhysicalMaterial
              attach="material"
              color={0x666666}
              emissive={0x00ff00}
              emissiveIntensity={0}
              metalness={0.8}
              roughness={0.1}
              clearcoat
              clearcoatRoughness={0.25}
            />
          )}
        </mesh>
      )}

      {/* "Indicator" extrusion if user is holding shift but not in extrude mode */}
      {baseShape && mode !== Const.MODE_EXTRUDE && shiftDown && (
        <mesh
          quaternion={rotationFromNormal(structure.normal)}
          position={getIndicatorPosition(
            position,
            structure.normal,
            structure.extrusionParams.depth,
          )}
        >
          <extrudeGeometry
            attach="geometry"
            args={[
              baseShape,
              {
                depth: 1,
                bevelSize: 1,
                bevelThickness: 1,
                bevelSegments: 2,
              },
            ]}
          />
          {highlightExtrusionSurface ? (
            <meshPhysicalMaterial
              attach="material"
              color={0xffffff}
              emissive={0x0033dd}
              emissiveIntensity={1}
              metalness={0.9}
              roughness={0.1}
              clearcoat
              clearcoatRoughness={0.25}
            />
          ) : (
            <meshPhysicalMaterial
              attach="material"
              color={0xffffff}
              emissive={0x0033dd}
              emissiveIntensity={0.15}
              metalness={0.9}
              roughness={0.1}
              clearcoat
              clearcoatRoughness={0.25}
            />
          )}
        </mesh>
      )}
    </>
  );

  function getIndicatorPosition(pos, normal, depth) {
    // offset so it's above the original shape
    return pos.clone().addScaledVector(normal, depth + 1.5);
  }

  function rotationFromNormal(normal) {
    const quat = new Quaternion();
    quat.setFromUnitVectors(new Vector3(0, 0, 1), normal);
    return quat;
  }

  // Estimate how many faces make up the front polygon based on
  // how ExtrudeGeometry triangulates the shape
  function mainPolyVertexCount(pointCount) {
    return (pointCount - 2) * 6;
  }

  // If you need it, here's the sample method to compute extrude params
  function computeParams(params, mouseTravel) {
    const normal = new Vector3(0, 0, 1);

    const row = (Math.PI / 2) * (mouseTravel.x / 1000);
    const theta = (Math.PI / 2) * (mouseTravel.y / 100);

    const quat1 = new Quaternion().setFromEuler(
      new Euler(row, theta, 0, "XYZ"),
    );
    normal.applyQuaternion(quat1);

    const startPoint = new Vector3();
    const endPoint = startPoint.clone().addScaledVector(normal, params.depth);
    const line = new LineCurve3(startPoint, endPoint);

    return { ...params, extrudePath: line };
  }
}

export default Structure;
