export class GuestureReconizer {
    private guesturesToReconize = {
        "reversalRed": {
            index: false,
            middle: false,
            ring: true,
            pinky: true,
        },
        "hollowPurple": {
            index: false,
            middle: true,
            ring: false,
            pinky: true,
        },
    };

    getFingersOpenOrClosed(indexFinger: boolean, middleFinger: boolean, ringFinger: boolean, pinkyFinger: boolean) {
        for (const [gestureName, requiredFingers] of Object.entries(this.guesturesToReconize)) {
            if (requiredFingers.index === indexFinger && requiredFingers.middle === middleFinger && requiredFingers.ring === ringFinger && requiredFingers.pinky === pinkyFinger) {
                return gestureName;
            }
        }

        return null;
    }
}