import { Hand } from "./Hand";

type Vector3D = [number, number, number];

export class HandAnalyzer {
  // Determines whether the index finger is open
  isIndexOpen(hand: Hand): boolean {
    return this.isFingerClosed(hand, [5, 6, 7, 8])
  }

  isMiddleOpen(hand: Hand): boolean {
    return this.isFingerClosed(hand, [9, 10, 11, 12])
  }

  isRingOpen(hand: Hand): boolean {
    return this.isFingerClosed(hand, [13, 14, 15, 16])
  }

  isPinkyOpen(hand: Hand): boolean {
    return this.isFingerClosed(hand, [17, 18, 19, 20])
  }

  private isFingerClosed(hand: Hand, indices: [number, number, number, number]): boolean {
    const base = hand.landmarks[indices[0]];
    const joint1 = hand.landmarks[indices[1]];
    const joint2 = hand.landmarks[indices[2]];
    const tip = hand.landmarks[indices[3]];

    const vectorA = this.createVector(base, joint1);
    const vectorB = this.createVector(joint1, joint2);
    const vectorC = this.createVector(joint2, tip);

    const angle1 = this.getAngle(vectorA, vectorB);
    const angle2 = this.getAngle(vectorB, vectorC);

    return angle1 > 10 && angle2 > 6
  }

  // Creates a vector from point A to point B
  createVector(a: any, b: any): Vector3D {
    return [
      b.x - a.x,
      b.y - a.y,
      b.z - a.z
    ];
  }

  // Calculates the angle between two vectors
  getAngle(a: Vector3D, b: Vector3D): number {
    const dot =
      a[0] * b[0] +
      a[1] * b[1] +
      a[2] * b[2];

    const magnitudeA = Math.sqrt(
      a[0] ** 2 +
      a[1] ** 2 +
      a[2] ** 2
    );

    const magnitudeB = Math.sqrt(
      b[0] ** 2 +
      b[1] ** 2 +
      b[2] ** 2
    );

    const cosine = dot / (magnitudeA * magnitudeB);

    return Math.acos(cosine) * (180 / Math.PI);
  }
}