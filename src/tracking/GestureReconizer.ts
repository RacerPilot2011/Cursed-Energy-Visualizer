export class GuestureReconizer {
    // Object that has each finger
    private guesturesToReconize = {
        "reversalRed": {
            index: false,
            middle: true,
            ring: true,
            pinky: true,
        },
        "lapseBlue": {
            index: true,
            middle: true,
            ring: false,
            pinky: false,
        },
        "hollowPurple": {
            index: false,
            middle: true,
            ring: false,
            pinky: false,
        },
        "domainExpansion": {
            index: false,
            middle: false,
            ring: true,
            pinky: true,
        }
    };

    // Function to reconize gesture
    reconizeGesture(indexFinger: boolean, middleFinger: boolean, ringFinger: boolean, pinkyFinger: boolean) {
        // For each gesture in the Object, compare the finger values to what is reconized by the HandAnalyzer
        for (const [gestureName, requiredFingers] of Object.entries(this.guesturesToReconize)) {
            if (requiredFingers.index === indexFinger && requiredFingers.middle === middleFinger && requiredFingers.ring === ringFinger && requiredFingers.pinky === pinkyFinger) {
                return gestureName;
            }
        }

        return null;
    }
}