// Represents a single point on a hand
export interface Landmark {
  x: number;
  y: number;
  z: number;
}

// Represents one hand
export interface Hand {
  landmarks: Landmark[];
}

// For guestures
export interface Fingers {
    index: boolean;
    middle: boolean;
    ring: boolean;
    pinky: boolean;
}