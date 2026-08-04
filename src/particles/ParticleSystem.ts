import * as THREE from "three";
import * as webGPU from "three/webgpu"
import * as tsl from "three/tsl"

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

    private centerPos = tsl.uniform(new THREE.Vector3(0, 0, 0))
    private colorOfMaterial = tsl.color(0xffffff)

    private COUNT = 100000;
    private positions  = tsl.instancedArray(this.COUNT, 'vec3');
    private velocities = tsl.instancedArray(this.COUNT, 'vec3');
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

            const toAttractor = this.centerPos.sub(pos)
            const dist = toAttractor.length().add(0.001);
            const dir = toAttractor.div(dist);

            const pullStrength = dist.smoothstep(0.0, 0.5).mul(100.0)
            const attraction = dir.mul(pullStrength);

            const dt = tsl.float(1 / 60);

            
            let newVel = vel.add(attraction.mul(dt)).min(3.0);;
            
            if (this.forceSign == 1) {
                newVel = vel.add(attraction.mul(dt)).min(3.0); 
            } else if (this.forceSign == -1) {
                newVel = vel.add(attraction.negate().mul(dt)).min(3.0); 
            }
            const newPos = pos.add(newVel.mul(dt));

            this.velocities.element(tsl.instanceIndex).assign(newVel);
            this.positions.element(tsl.instanceIndex).assign(newPos);
        })().compute(this.COUNT);

        const material = new webGPU.SpriteNodeMaterial();

        material.positionNode = this.positions.toAttribute();
        material.scaleNode = tsl.vec3(0.04);
        material.colorNode = this.colorOfMaterial;

        const particles = new THREE.Sprite(material);
        particles.count = this.COUNT; 

        this.scene.add(particles);
        this.renderScene()
    }

    spread(center: THREE.Vector3) {
        this.centerPos.value.copy(center)
        
        this.forceSign = -1;
    }

    gather(center: THREE.Vector3, size: number) {
        this.centerPos.value.copy(center)
        
        this.forceSign = 1;
    }

    domainExpansion(domain: string) {
        if (domain == "maleviolentShrine")

    }

    renderScene() {
        if (this.update != null) {
            this.renderer.compute(this.update);
            this.renderer.render(this.scene, this.camera);
        }
    }

    setColor(color: any) {
        console.log("Color set")
        this.colorOfMaterial = tsl.color(color);
    }

    getCamera() {
        return this.camera;
    }
}