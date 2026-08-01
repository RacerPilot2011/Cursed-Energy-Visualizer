import * as THREE from "three";

// Define the shape of MediaPipe landmarks
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
    private camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
    private render = new THREE.WebGLRenderer({alpha: true});

    private geometry!: THREE.BufferGeometry;
    private material!: THREE.PointsMaterial;
    private particles!: THREE.Points;

    private positions = new Float32Array(10000 * 3);

    update(center: THREE.Vector3) {
        const positionAttribute = this.geometry.getAttribute("position") as THREE.BufferAttribute;

        const positions = positionAttribute.array as Float32Array;

        for (let i = 0; i < positions.length; i += 3) {
            positions[i] - center.x;
            positions[i + 1] - center.y;
            positions[i + 2] - center.z;
        }

        positionAttribute.needsUpdate = true;
    }

    startDoingStuff(landmark: any) {
        const center = convertMediaPipeToThree(landmark, this.camera, false)

        if (document.querySelector<HTMLCanvasElement>('#particleCanvas')) {
            console.log("Particles exist, removing");
            this.scene.remove(this.particles);
        }
        this.render.setSize(window.innerWidth, window.innerHeight);
        this.render.domElement.style.position = "fixed";
        this.render.domElement.style.top = "0";
        this.render.domElement.style.left = "0";
        this.render.domElement.style.zIndex = "10";
        this.render.domElement.id = "particleCanvas"
        document.body.appendChild(this.render.domElement);

        for (let i = 0; i < 10000; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const radius = Math.random() * 2;

            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.sin(phi) * Math.sin(theta);
            const z = radius * Math.cos(phi);

            this.positions[i * 3] = x + center.x;
            this.positions[i * 3 + 1] = y + center.y;
            this.positions[i * 3 + 2] = z + center.z;
        }

        this.geometry = new THREE.BufferGeometry();

        this.geometry.setAttribute("position", new THREE.BufferAttribute(this.positions, 3));

        this.material = new THREE.PointsMaterial({ size: 0.05 });

        this.particles = new THREE.Points(this.geometry, this.material);

        this.scene.add(this.particles);

        this.camera.position.set(0, 0, 5);
        this.camera.lookAt(0, 0, 0);

        const startRendering = (time: any) => {
            this.update(center)
            this.render.render(this.scene, this.camera)
            return
        }

        this.render.setAnimationLoop(startRendering)
    }
}

