import { HandTracker } from "./tracking/HandTracker";
import { HandAnalyzer } from "./tracking/HandAnalyzer";
import "./style.css";
import { GuestureReconizer } from "./tracking/GestureReconizer";

// Gets the webcam video element from the HTML
const video = document.getElementById("webcam") as HTMLVideoElement;

// Creates hand tracking system
const tracker = new HandTracker();

// Creates hand analyzer system
const analyzer = new HandAnalyzer();

// Creates gesture recongnition system
const gesture = new GuestureReconizer();

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

  // Starts the main application loop
  requestAnimationFrame(loop);
}

// Runs once per animation frame
function loop(): void {
  // Gives the newest webcam frame to the HandTracker
  tracker.update(video);

  // Gets the hands detected in the newest processed frame
  const hands = tracker.getHands();
  
  if (hands.length === 0) {
    requestAnimationFrame(loop);
    return;
  }

  // Recognizes gestures
  console.log(gesture.reconizeGesture(analyzer.isIndexOpen(hands[0]), analyzer.isMiddleOpen(hands[0]), analyzer.isRingOpen(hands[0]), analyzer.isPinkyOpen(hands[0])))

  // Requests that this function runs again on the next animation frame
  requestAnimationFrame(loop);
}

// Starts the webcam and tracking system
startWebcam();