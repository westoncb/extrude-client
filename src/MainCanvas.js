import React from 'react'
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// import { MD2CharacterComplex } from './jsm/misc/MD2CharacterComplex.js';
// import { Gyroscope } from './jsm/misc/Gyroscope.js';

import './MainCanvas.css'


// var characters = [];
// var nCharacters = 0;

// var cameraControls;

// var controls = {

//     moveForward: false,
//     moveBackward: false,
//     moveLeft: false,
//     moveRight: false

// };

// var clock = new THREE.Clock();


class MainCanvas extends React.PureComponent {
    componentDidMount() {
        

        var SCREEN_WIDTH = window.innerWidth;
        var SCREEN_HEIGHT = window.innerHeight;

        this.clock = new THREE.Clock();

        // CAMERA
        
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 4000);
        this.camera.position.set(0, 150, 1300);

        // SCENE

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x112233);
        this.scene.fog = new THREE.Fog(0x112233, 1000, 4000);

        this.scene.add(this.camera);

        // LIGHTS

        this.scene.add(new THREE.AmbientLight(0x222222));

        var light = new THREE.DirectionalLight(0xffffff, 2.25);
        light.position.set(200, 450, 500);
        light.castShadow = true;
        light.shadow.mapSize.width = 1024;
        light.shadow.mapSize.height = 512;
        light.shadow.camera.near = 100;
        light.shadow.camera.far = 1200;
        light.shadow.camera.left = - 1000;
        light.shadow.camera.right = 1000;
        light.shadow.camera.top = 350;
        light.shadow.camera.bottom = - 350;

        this.scene.add(light);
        // this.scene.add( new CameraHelper( light.shadow.camera ) );


        //  GROUND

        var gt = new THREE.TextureLoader().load("grasslight-big.jpg");
        var gg = new THREE.PlaneBufferGeometry(16000, 16000);
        var gm = new THREE.MeshPhongMaterial({ color: 0x445566, map: gt });

        var ground = new THREE.Mesh(gg, gm);
        ground.rotation.x = - Math.PI / 2;
        ground.material.map.repeat.set(64, 64);
        ground.material.map.wrapS = THREE.RepeatWrapping;
        ground.material.map.wrapT = THREE.RepeatWrapping;
        ground.material.map.encoding = THREE.sRGBEncoding;
        ground.receiveShadow = true;

        this.scene.add(ground);

        // RENDERER

        this.renderer = new THREE.WebGLRenderer({ antialias: false });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
        // container.appendChild(this.renderer.domElement);
        

        //

        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        this.mount.appendChild(this.renderer.domElement);

        // STATS

        this.stats = new Stats();
        this.mount.appendChild(this.stats.dom);

        // CONTROLS

        this.cameraControls = new OrbitControls(this.camera, this.renderer.domElement);
        this.cameraControls.target.set(0, 50, 0);
        this.cameraControls.update();

        window.addEventListener('resize', () => {
            SCREEN_WIDTH = window.innerWidth;
            SCREEN_HEIGHT = window.innerHeight;

            this.renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);

            this.camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
            this.camera.updateProjectionMatrix();
        }, false);

        this.animate()
    }

    animate() {

        requestAnimationFrame(this.animate.bind(this));
        this.renderThree();

        this.stats.update();

    }

    renderThree() {

        var delta = this.clock.getDelta();

        // for (var i = 0; i < nCharacters; i++) {

        //     characters[i].update(delta);

        // }

        this.renderer.render(this.scene, this.camera);

    }

    render() {
        return (
            <div className="main-canvas-container" ref={ref => (this.mount = ref)} />
        )
    }
}

export default MainCanvas