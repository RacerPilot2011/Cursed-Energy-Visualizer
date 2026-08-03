import { HandTracker } from "./tracking/HandTracker";
import { HandAnalyzer } from "./tracking/HandAnalyzer";
import "./style.css";
import { GuestureReconizer } from "./tracking/GestureReconizer";
import { ParticleSystem, convertMediaPipeToThree } from "./particles/ParticleSystem"


// Gets the webcam video element from the HTML
const video = document.getElementById("webcam") as HTMLVideoElement;

// Creates hand tracking system
const tracker = new HandTracker();

// Creates hand analyzer system
const analyzer = new HandAnalyzer();

// Creates gesture recongnition system
const gesture = new GuestureReconizer();

// Particles maker
const particles = new ParticleSystem();

// Initializes MediaPipe before starting the webcam
await tracker.initialize();


// Starts the user's webcam
async function startWebcam(): Promise<void> {
  // Requests access to the user's webcam
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      width: 640,
      height: 480
    },
    audio: false
  });

  // Sends the webcam stream to the video element
  video.srcObject = stream;

  // Waits until the video has enough data to begin processing
  await video.play();

  await particles.renderer.init()

  // Starts the main application loop
  particles.renderer.setAnimationLoop(loop)
}

// Runs once per animation frame
function loop(): void {
  tracker.update(video);

  const hands = tracker.getHands();

  if (hands.length === 0) {
    particles.renderer.setAnimationLoop(loop)
    return;
  }

  const gestureVar = gesture.reconizeGesture(analyzer.isIndexOpen(hands[0]), analyzer.isMiddleOpen(hands[0]), analyzer.isRingOpen(hands[0]), analyzer.isPinkyOpen(hands[0]));

  const palm = tracker.getPalm();

  if (!palm) {
    particles.renderer.setAnimationLoop(loop)
    return;
  }

  const center = convertMediaPipeToThree(palm, particles.getCamera(), false);

  if (gestureVar === "reversalRed") {
    particles.gather(convertMediaPipeToThree( { x: hands[0].landmarks[8].x, y: hands[0].landmarks[8].y - 0.15, z: hands[0].landmarks[8].z }, particles.getCamera(), false), 0.5);
    particles.setColor(0xc30f16);
    particles.renderer.setAnimationLoop(loop)
  } else if (gestureVar === "hollowPurple") {
    particles.gather(convertMediaPipeToThree( { x: hands[0].landmarks[10].x, y: hands[0].landmarks[12].y - 0.15, z: hands[0].landmarks[12].z}, particles.getCamera(), false), 2);
    particles.setColor(0x743089);
    particles.renderer.setAnimationLoop(loop)
  } else if (gestureVar === "lapseBlue") {
    particles.gather(convertMediaPipeToThree( { x: (hands[0].landmarks[8].x + hands[0].landmarks[12].x) / 2, y: hands[0].landmarks[12].y - 0.15, z: hands[0].landmarks[12].z }, particles.getCamera(), false), 2);
    particles.setColor(0x87ceeb);
    particles.renderer.setAnimationLoop(loop)
  } else {
    particles.spread(center);
    particles.setColor(0xffffff);
    particles.renderer.setAnimationLoop(loop)
  }

  particles.updateFunction()
}

// Starts the webcam and tracking system
startWebcam();
