import { FilesetResolver, HandLandmarker, type HandLandmarkerResult } from "@mediapipe/tasks-vision";

import { Hand, Landmark } from "./Hand";

export class HandTracker {
  // Stores the MediaPipe hand tracking model
  private handLandmarker!: HandLandmarker;

  // Stores the timestamp of the last video frame we processed
  private lastVideoTime = -1;

  // Stores the hands currently visible in the webcam
  private handArray: Hand[] = [];

  // Initializes MediaPipe and loads the hand tracking model
  async initialize(): Promise<void> {
    // Loads the MediaPipe WebAssembly runtime
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

    // Creates the MediaPipe hand tracking model
    this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "/models/hand_landmarker.task"
      },

      // Tells MediaPipe that we are processing webcam video
      runningMode: "VIDEO",

      // Allows MediaPipe to detect up to two hands
      numHands: 2,

      // Minimum confidence required to initially detect a hand
      minHandDetectionConfidence: 0.5,

      // Minimum confidence required to consider a detected hand present
      minHandPresenceConfidence: 0.5,

      // Minimum confidence required to continue tracking a hand
      minTrackingConfidence: 0.5
    });
  }

  // Processes the newest webcam frame
  update(video: HTMLVideoElement): void {
    // Stops if the video has not loaded enough data yet
    if (video.readyState < 2) {
      return;
    }

    // Stops if this exact video frame has already been processed
    if (video.currentTime === this.lastVideoTime) {
      return;
    }

    // Saves the current frame timestamp
    this.lastVideoTime = video.currentTime;

    // Runs MediaPipe hand detection on the current video frame
    const results: HandLandmarkerResult =
      this.handLandmarker.detectForVideo(
        video,
        performance.now()
      );

    // Clears the hands from the previous frame
    this.handArray = [];

    // Converts every detected MediaPipe hand into your own Hand format
    for (const landmarks of results.landmarks) {
      // Creates an empty array for the 21 landmarks of this hand
      const handLandmarks: Landmark[] = [];

      // Converts every MediaPipe landmark into your own Landmark object
      for (const landmark of landmarks) {
        handLandmarks.push({
          x: landmark.x,
          y: landmark.y,
          z: landmark.z
        });
      }

      // Adds the complete hand to the current hand array
      this.handArray.push({
        landmarks: handLandmarks
      });
    }
  }

  // Returns all hands detected in the most recently processed frame
  getHands(): Hand[] {
    return this.handArray;
  }

  // Gets center of the palm via guesstimation
  getPalm() {
    const hand = this.handArray[0];

    if (!hand) {
      return;
    }
    
    const centeredX = (hand.landmarks[0].x + hand.landmarks[1].x + hand.landmarks[5].x + hand.landmarks[9].x + hand.landmarks[13].x + hand.landmarks[17].x) / 6;
    const centeredY = (hand.landmarks[0].y + hand.landmarks[1].y + hand.landmarks[5].y + hand.landmarks[9].y + hand.landmarks[13].y + hand.landmarks[17].y) / 6;
    const centeredZ = (hand.landmarks[0].z + hand.landmarks[1].z + hand.landmarks[5].z + hand.landmarks[9].z + hand.landmarks[13].z + hand.landmarks[17].z) / 6;

    return {
      x: centeredX,
      y: centeredY,
      z: centeredZ
    }
  }
}