import {Box3} from 'three'

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
}

export default Util