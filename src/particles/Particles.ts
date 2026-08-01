import * as THREE from 'three';

export class Particles {
    public scene = new THREE.Scene();
    public camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);

    public render = new THREE.WebGLRenderer();
    startDoingStuff() {
        this.render.setSize(window.innerWidth, window.innerHeight);
        this.render.domElement.style.position = "fixed";
        this.render.domElement.style.top = "0";
        this.render.domElement.style.left = "0";
        this.render.domElement.style.zIndex = "10";
        document.body.appendChild(this.render.domElement);
        const geometry = new THREE.BoxGeometry(1,1,1);
        const material = new THREE.MeshBasicMaterial({color: 0x00ff00})
        const cube = new THREE.Mesh(geometry, material);
        this.scene.add(cube);

        this.scene.background = new THREE.Color(0x222222);

        cube.position.z = 0;

        this.camera.position.set(0, 0, 5);
        this.camera.lookAt(0, 0, 0);

        const startRendering = (time: any) => {
            cube.rotation.x = time / 2000;
            cube.rotation.y = time / 1000;
            this.render.render(this.scene, this.camera)
            return
        }

        this.render.setAnimationLoop(startRendering)
    }
}