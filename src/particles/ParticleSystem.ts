import * as THREE from "three";
import { WebGPURenderer } from "three/webgpu"

interface MediaPipeLandmark {
    x: number;
    y: number;
    z: number;
}

export function convertMediaPipeToThree(landmark: MediaPipeLandmark, camera: THREE.PerspectiveCamera, isSelfieMode: boolean = true): THREE.Vector3 {
    const ndc = new THREE.Vector3();

    if (isSelfieMode) {
        ndc.x = -(landmark.x * 2 - 1);
    } else {
        ndc.x = landmark.x * 2 - 1;
    }

    ndc.y = -(landmark.y * 2 - 1);
    ndc.z = -(landmark.z * 2) - 1;

    ndc.unproject(camera);

    const targetDepth = 5;
    const dir = ndc.sub(camera.position).normalize();

    return camera.position.clone().add(dir.multiplyScalar(targetDepth));
}

export class ParticleSystem {
    private scene = new THREE.Scene();

    private camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 10000);

    private render = new WebGPURenderer({ alpha: true });

    private geometry = new THREE.BufferGeometry();
    private material!: THREE.PointsMaterial;
    private particles!: THREE.Points;

    private positions = new Float32Array(10000 * 3);

    private targets = new Float32Array(10000 * 3);

    private center = new THREE.Vector3();

    private initialized = false;

    constructor() {
        this.render.setSize(window.innerWidth, window.innerHeight);

        this.render.domElement.style.position = "fixed";
        this.render.domElement.style.top = "0";
        this.render.domElement.style.left = "0";
        this.render.domElement.style.zIndex = "10";
        this.render.domElement.id = "particleCanvas";

        document.body.appendChild(this.render.domElement);

        this.camera.position.set(0, 0, 5);
        this.camera.lookAt(0, 0, 0);

        this.createParticles();

        this.render.setAnimationLoop(() => {
            this.update();
            this.render.render(this.scene, this.camera);
        });
    }

    private createParticles() {
        for (let i = 0; i < 10000; i++) {
            const i3 = i * 3;

            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const radius = Math.random() * 2;

            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.sin(phi) * Math.sin(theta);
            const z = radius * Math.cos(phi);

            this.positions[i3] = x;
            this.positions[i3 + 1] = y;
            this.positions[i3 + 2] = z;

            this.targets[i3] = x;
            this.targets[i3 + 1] = y;
            this.targets[i3 + 2] = z;
        }

        this.geometry.setAttribute("position", new THREE.BufferAttribute(this.positions, 3));

        this.material = new THREE.PointsMaterial({ 
            size: 0.05,
            color: 0xffffff
        });

        this.particles = new THREE.Points(this.geometry, this.material);

        this.scene.add(this.particles);

        this.initialized = true;
    }

    private update() {
        if (!this.initialized) return;

        const positionAttribute = this.geometry.getAttribute("position") as THREE.BufferAttribute;

        for (let i = 0; i < 10000; i++) {
            const i3 = i * 3;

            this.positions[i3] += (this.targets[i3] - this.positions[i3]) * 0.08;

            this.positions[i3 + 1] += (this.targets[i3 + 1] - this.positions[i3 + 1]) * 0.08;

            this.positions[i3 + 2] += (this.targets[i3 + 2] - this.positions[i3 + 2]) * 0.08;
        }

        positionAttribute.needsUpdate = true;
    }

    spread(center: THREE.Vector3) {
        for (let i = 0; i < 10000; i++) {
            const i3 = i * 3;

            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            const radius = 1.5 + Math.random() * 3;

            this.targets[i3] = center.x + radius * Math.sin(phi) * Math.cos(theta);

            this.targets[i3 + 1] = center.y + radius * Math.sin(phi) * Math.sin(theta);

            this.targets[i3 + 2] = center.z + radius * Math.cos(phi);
        }
    }

    gather(center: THREE.Vector3, size: number) {
        for (let i = 0; i < 10000; i++) {
            const i3 = i * 3;

            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            const radius = Math.random() * size;

            this.targets[i3] = center.x + radius * Math.sin(phi) * Math.cos(theta);

            this.targets[i3 + 1] = center.y + radius * Math.sin(phi) * Math.sin(theta);

            this.targets[i3 + 2] = center.z + radius * Math.cos(phi);
        }
    }

    setColor(color: number) {
        this.material.color.set(color);
    }

    getCamera() {
        return this.camera;
    }
}