import React, { useState, useEffect, useRef } from "react";
import { Vector3, Vector2, Object3D } from "three";
import { extend, useThree } from "@react-three/fiber";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import MeshEvents from "../MeshEvents";
import Util from "../Util";
import TangentGrid from "./TangentGrid";
import { mousePos } from "../global";
import Const from "../constants";

extend({ LineMaterial, LineGeometry, Line2 });

const MAX_POLY_POINTS = 50;
const SNAP_RADIUS = 30;
const Z_FIGHT_SHIFT_DIST = 0.2;

function PartialStructure({
  player,
  snappedPoint,
  dispatch,
  finishStructureFunc,
}) {
  const [points, setPoints] = useState([]);
  const [inSnapRange, setInSnapRange] = useState(false);
  const [gridConfig, setGridConfig] = useState({
    position: new Vector3(),
    target: new Vector2(),
    orientation: new Vector3(),
    mouse: new Vector2(),
  });
  const [parentNormal, setParentNormal] = useState(new Vector3());
  const [parentObject, setParentObject] = useState(null);
  const { size } = useThree();

  const visible = points.length > 0;

  // A ref for the line geometry
  const geometryRef = useRef(null);

  useEffect(() => {
    dispatch({ type: "update_partial_points", points });
  }, [points, dispatch]);

  const updateGridConfig = (e, pts) => {
    const rotation = e.object.rotation.clone();
    const normal = e.face.normal.clone().applyEuler(rotation);

    const zFightingShift = normal.clone().multiplyScalar(Z_FIGHT_SHIFT_DIST);
    const firstPointPos = pts[0].clone().add(zFightingShift);
    const cursorPos = e.point.clone().add(zFightingShift);
    const sameNormals = normal.clone().sub(parentNormal).length() < 0.1;
    const thePosition =
      e.object === parentObject && sameNormals ? firstPointPos : cursorPos;

    setGridConfig((prev) => ({
      ...prev,
      position: thePosition,
      orientation: normal.clone(),
      target: e.point.clone(),
      mouse: new Vector2(mousePos.x, mousePos.y),
      cellSize: Const.BASE_CELL_SIZE,
      targetUV: e.uv.clone(),
    }));
  };

  useEffect(() => {
    const handleMeshMouseMove = (e) => {
      if (visible && points.length > 0) {
        updateGridConfig(e, points);
      }
    };

    const handleMeshClick = (e) => {
      if (e.shiftKey) return;

      const rotation = e.object.rotation.clone();
      const normal = e.face.normal.clone().applyEuler(rotation);

      if (points.length === 0) {
        console.log("setting parent normal");
        setParentNormal(normal);
        setParentObject(e.object);
      }

      const newPoint = snappedPoint.clone();
      newPoint.id = Util.generateId();

      const newPoints = [...points, newPoint];
      setPoints(newPoints);
      updateGridConfig(e, newPoints);
    };

    MeshEvents.listenFor("partial_structure", {
      [MeshEvents.MOUSE_MOVE]: handleMeshMouseMove,
      [MeshEvents.CLICK]: handleMeshClick,
    });

    return () => {
      MeshEvents.removeListener("partial_structure");
    };
  }, [points, snappedPoint, visible]);

  // Use an effect to update the geometry whenever `points` or `snappedPoint` changes
  useEffect(() => {
    if (!geometryRef.current) return;

    const geom = geometryRef.current;

    // If no points, just clear everything
    if (points.length < 1) {
      geom.setPositions(new Float32Array(MAX_POLY_POINTS * 3));
      return;
    }

    // Check if first and last points overlap to finish structure
    if (points.length > 2) {
      if (Util.pointsAreEqual3D(points[0], points[points.length - 1], 0.1)) {
        const pointsWithoutLast = points.slice(0, -1).map((p) =>
          // Undo any z-fighting shift
          p
            .clone()
            .sub(parentNormal.clone().multiplyScalar(Z_FIGHT_SHIFT_DIST + 0.1)),
        );

        const structure = {
          id: Util.generateId(),
          owner: player.id,
          points: pointsWithoutLast,
          normal: parentNormal,
          extrusionParams: {
            depth: 4,
            row: 0,
            theta: 0,
            bevelThickness: 3,
            bevelSize: 4,
            bevelSegments: 4,
            steps: 1,
          },
        };

        finishStructureFunc(structure);
        setPoints([]);
        setInSnapRange(false);
        return;
      }
    }

    // Build array for drawPoints
    const drawPoints = points.reduce((acc, { x, y, z }) => {
      acc.push(x, y, z);
      return acc;
    }, []);

    drawPoints.push(snappedPoint.x, snappedPoint.y, snappedPoint.z);

    // Fill up remaining slots so setPositions doesn't break
    while (drawPoints.length < MAX_POLY_POINTS * 3) {
      drawPoints.push(
        drawPoints[drawPoints.length - 3],
        drawPoints[drawPoints.length - 2],
        drawPoints[drawPoints.length - 1],
      );
    }

    // Limit length just in case
    drawPoints.length = Math.min(MAX_POLY_POINTS * 3, drawPoints.length);

    geom.setPositions(drawPoints);
  }, [points, snappedPoint, parentNormal, player.id, finishStructureFunc]);

  return (
    <>
      <line2>
        {/* The ref’d geometry replaces the old useUpdate */}
        <lineGeometry ref={geometryRef} attach="geometry" />
        <lineMaterial
          attach="material"
          color={0x66ff11}
          linewidth={10}
          resolution={[size.width, size.height]}
        />
      </line2>

      {points.map((point, i) => (
        <mesh key={point.id} castShadow position={[point.x, point.y, point.z]}>
          <sphereGeometry
            attach="geometry"
            args={[i === 0 && inSnapRange ? SNAP_RADIUS : 7, 32, 32]}
          />
          <meshPhysicalMaterial
            attach="material"
            color={i === 0 && inSnapRange ? 0x00ff00 : 0x117700}
            clearcoat
            metalness={0.25}
            clearcoatRoughness={0.75}
            roughness={0.1}
          />
        </mesh>
      ))}

      {visible && (
        <TangentGrid
          position={gridConfig.position}
          orientation={gridConfig.orientation}
          target={gridConfig.target}
          mouse={gridConfig.mouse}
          cellSize={gridConfig.cellSize}
          targetUV={gridConfig.targetUV}
        />
      )}
    </>
  );
}

export default PartialStructure;
