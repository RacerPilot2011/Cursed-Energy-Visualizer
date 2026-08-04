import * as THREE from "three";
import * as webGPU from "three/webgpu";
import * as tsl from "three/tsl";
import shrineJSON from "../domains/shrine.json";

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
    public scene = new THREE.Scene();
    public camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 10000);
    public renderer = new webGPU.WebGPURenderer({ alpha: true });
    public update: any;

    private centerPos = tsl.uniform(new THREE.Vector3(0, 0, 0));
    private morphProgress = tsl.uniform(0.0); 

    private COUNT = 100000;
    private positions = tsl.instancedArray(this.COUNT, 'vec3');
    private velocities = tsl.instancedArray(this.COUNT, 'vec3');
    
    private targetPositions = tsl.instancedArray(this.COUNT, 'vec3');
    private targetColors = tsl.instancedArray(this.COUNT, 'vec3');

    private forceSign: number = -1;

    constructor() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        this.renderer.domElement.style.position = "fixed";
        this.renderer.domElement.style.top = "0";
        this.renderer.domElement.style.left = "0";
        this.renderer.domElement.style.zIndex = "10";
        this.renderer.domElement.id = "particleCanvas";

        document.body.appendChild(this.renderer.domElement);

        this.camera.position.set(0, 0, 5);
        this.camera.lookAt(0, 0, 0);

        const blankColors = new Float32Array(this.COUNT * 3).fill(1.0);
        const blankPositions = new Float32Array(this.COUNT * 3).fill(0.0);
        this.targetColors.value = new webGPU.StorageInstancedBufferAttribute(blankColors, 3);
        this.targetPositions.value = new webGPU.StorageInstancedBufferAttribute(blankPositions, 3);

        const init = tsl.Fn(() => {
            const i = tsl.instanceIndex.toFloat();

            const angle  = tsl.hash(i.add(1)).mul(Math.PI * 2);
            const radius = tsl.hash(i.add(2)).mul(2).add(1);

            const pos = tsl.vec3(
                angle.cos().mul(radius),
                angle.sin().mul(radius),
                tsl.hash(i.add(3)).sub(0.5).mul(0.4)
            );

            this.positions.element(tsl.instanceIndex).assign(pos);

            const dir = pos.normalize();
            const vel = tsl.vec3(
                dir.y.negate(), 
                dir.x, 
                0
            );

            this.velocities.element(tsl.instanceIndex).assign(vel);
        })().compute(this.COUNT);

        this.renderer.computeAsync(init);
    }

    updateFunction() {
        this.update = tsl.Fn(() => {
            const pos = this.positions.element(tsl.instanceIndex);
            const vel = this.velocities.element(tsl.instanceIndex);
            const targetPos = this.targetPositions.element(tsl.instanceIndex);

            const toAttractor = this.centerPos.sub(pos);
            const dist = toAttractor.length().add(0.001);
            const dir = toAttractor.div(dist);

            const pullStrength = dist.smoothstep(0.0, 0.5).mul(100.0);
            const attraction = dir.mul(pullStrength);

            const dt = tsl.float(1 / 60);
            
            let physicsVel = vel.add(attraction.mul(dt)).min(3.0);
            if (this.forceSign == -1) {
                physicsVel = vel.add(attraction.negate().mul(dt)).min(3.0); 
            }
            
            const physicsPos = pos.add(physicsVel.mul(dt));
            const finalPos = tsl.mix(physicsPos, targetPos, this.morphProgress);
            const finalVel = tsl.mix(physicsVel, tsl.vec3(0.0), this.morphProgress);

            this.velocities.element(tsl.instanceIndex).assign(finalVel);
            this.positions.element(tsl.instanceIndex).assign(finalPos);
        })().compute(this.COUNT);

        const material = new webGPU.SpriteNodeMaterial();

        material.positionNode = this.positions.toAttribute();
        material.scaleNode = tsl.vec3(0.04);
        
        material.colorNode = tsl.mix(tsl.color(0xffffff), this.targetColors.element(tsl.instanceIndex), this.morphProgress);

        const particles = new THREE.Sprite(material);
        particles.count = this.COUNT; 

        this.scene.add(particles);
        this.renderScene();
    }

    spread(center: THREE.Vector3) {
        this.morphProgress.value = 0.0; 
        this.centerPos.value.copy(center);
        this.forceSign = -1;
    }

    gather(center: THREE.Vector3, size: number) {
        this.morphProgress.value = 0.0;
        this.centerPos.value.copy(center);
        this.forceSign = 1;
    }

    domainExpansion(domain: string) {
        if (domain === "maleviolentShrine") {
            const hexArray = shrineJSON.pixels[0];
            
            const posBuffer = new Float32Array(this.COUNT * 3);
            const colorBuffer = new Float32Array(this.COUNT * 3);
            const imageSide = Math.floor(Math.sqrt(hexArray.length));
            const spacing = 0.05;

            for (let i = 0; i < this.COUNT; i++) {
                const bufferIdx = i * 3;

                if (i < hexArray.length) {
                    const hex = hexArray[i];
                    
                    const color = new THREE.Color(hex);
                    colorBuffer[bufferIdx]     = color.r;
                    colorBuffer[bufferIdx + 1] = color.g;
                    colorBuffer[bufferIdx + 2] = color.b;

                    const x = i % imageSide;
                    const y = Math.floor(i / imageSide);

                    posBuffer[bufferIdx]     = (x - imageSide / 2) * spacing;
                    posBuffer[bufferIdx + 1] = -(y - imageSide / 2) * spacing; 
                    posBuffer[bufferIdx + 2] = 0; 
                } else {
                    posBuffer[bufferIdx]     = 99999; 
                    posBuffer[bufferIdx + 1] = 99999;
                    posBuffer[bufferIdx + 2] = 99999;
                }
            }

            this.targetPositions.value = new webGPU.StorageInstancedBufferAttribute(posBuffer, 3);
            this.targetColors.value = new webGPU.StorageInstancedBufferAttribute(colorBuffer, 3);
 
            this.targetPositions.needsUpdate = true;
            this.targetColors.needsUpdate = true;
            this.morphProgress.value = 1.0; 
        }
    }

    renderScene() {
        if (this.update != null) {
            this.renderer.compute(this.update);
            this.renderer.render(this.scene, this.camera);
        }
    }

    setColor(color: any) {
        console.log("Color set");
    }

    getCamera() {
        return this.camera;
    }
}