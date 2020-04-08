import {Box3, Vector3} from 'three'

class Util {
    static randString(length) {
        var result = ''
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        var charactersLength = characters.length
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength))
        }
        return result
    }

    /*
        Computes a bounding box which is the union of the geometry
        belonging to the passed in node and all descendent meshes.
        This exists because the Three.Box3().setFromObject() method
        is broken—possibly having to do with THREE.Group nodes.
    */
    static computeCompositeBoundingBox(obj3d, options = {}) {
        const allMeshes = [];

        Util.walkNodes(obj3d, node => {
            if (node.geometry) {
                const notExcluded =
                    !options.excludedTypes ||
                    !options.excludedTypes.includes(node.userData.objectType);

                if (notExcluded) allMeshes.push(node);
            }
        });

        let totalBox = new Box3();
        allMeshes.forEach(mesh => {
            mesh.updateMatrixWorld();
            const geometryCopy = mesh.geometry.clone();
            geometryCopy.applyMatrix(mesh.matrixWorld);
            geometryCopy.computeBoundingBox();
            totalBox = totalBox.union(geometryCopy.boundingBox);
        });

        return totalBox;
    }

    /*
        Depth first walk of a three.js node and all of its children.
        The passed in function is called at each node, and the current
        node is passed in as the sole argument.
    */
    static walkNodes(node, func) {
        func(node);

        for (let i = 0; i < node.children.length; i += 1) {
            Util.walkNodes(node.children[i], func);
        }
    }

    static rand(min, max) {
        return Math.random() * (max - min) + min
    }

    static vec3ToScreenPoint(vector, camera, canvasWidth, canvasHeight) {
        // Make a copy since .project(...) will transform the vector
        const vectorCopy = vector.clone();

        const widthHalf = 0.5 * canvasWidth;
        const heightHalf = 0.5 * canvasHeight;

        vectorCopy.project(camera);

        vectorCopy.x = vectorCopy.x * widthHalf + widthHalf;
        vectorCopy.y = -(vectorCopy.y * heightHalf) + heightHalf;

        return {
            x: vectorCopy.x,
            y: vectorCopy.y,
        };
    }

    static exponentialEaseOut(k) {
        return k === 1 ? 1 : - Math.pow(2, - 10 * k) + 1;
    }

    /*
    From: https://github.com/ayamflow/polygon-centroid
  */
    static centroid(points) {
        const l = points.length;

        return points.reduce((center, p, i) => {
            center.x += p.x;
            center.y += p.y;
            center.z += p.z;

            if (i === l - 1) {
                center.x /= l;
                center.y /= l;
                center.z /= l;
            }

            return center;
        }, new Vector3(0, 0, 0));
    }

    static pointsAreEqual3D(p1, p2, threshold = 0.001) {
        return (
            Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2 + (p2.z - p1.z) ** 2) <
            threshold
        );
    }

    static generateId() {
        return "" + Math.round(Math.random() * 1000000)
    }

    static step(min, max, value) {
        if (value <= min)
            return 0;
        if (value >= max)
            return 1;
    }

    static smoothstep(min, max, value) {
        const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
        return x * x * (3 - 2 * x);
    }

    /*
    From: https://github.com/math-utils/area-polygon
  */
    static polygonArea(points) {
        let det = 0;

        points = points.map(point => {
            if (!Array.isArray(point)) return point;
            return {
                x: point[0],
                y: point[1],
            };
        });

        if (!Util.pointsAreEqual2D(points[0], points[points.length - 1]))
            points = points.concat(points[0]);

        for (let i = 0; i < points.length - 1; i += 1)
            det += points[i].x * points[i + 1].y - points[i].y * points[i + 1].x;

        return Math.abs(det) / 2;
    }

    // Works for points in object or array format
    static pointsAreEqual2D(p1, p2, threshold = 0.001) {
        // object style
        if (p1.x !== undefined) {
            return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2) < threshold;
        }

        // array style
        return Math.sqrt((p2[0] - p1[0]) ** 2 + (p2[1] - p1[1]) ** 2) < threshold;
    }

    static scratch1 = new Vector3()
    static vecsEqual3D(v1, v2, threshold = 0.001) {
        return this.scratch1.subVectors(v1, v2).length() < threshold
    }
}

export default Util