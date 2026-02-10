
export interface Tunable {
    value: number;
    min: number;
    max: number;
    step: number;
}

export const FlightTuning = {
    Speed: {
        baseSpeed: { value: 15, min: 10, max: 100, step: 1 },
        boostMultiplier: { value: 1, min: 1, max: 3, step: 0.1 },
        accelerationRate: { value: 1, min: 0.1, max: 5, step: 0.1 },
    },
    Turning: {
        turnSpeed: { value: 1.2, min: 0.5, max: 5, step: 0.1 },
        yawMomentumDamping: { value: 10, min: 0.1, max: 20, step: 0.1 },
    },
    Agility: {
        minSpeedAgilityMultiplier: { value: 1.6, min: 1, max: 5, step: 0.1 },
    },
    Input: {
        inputSmoothing: { value: 8, min: 1, max: 20, step: 0.5 },
    },
    Banking: {
        maxRollAngle: { value: 1.2566370614359172, min: 0.1, max: 3.141592653589793, step: 0.1 },
        maxPitchAngle: { value: 0.4, min: 0.1, max: 1.5707963267948966, step: 0.1 },
        pitchBankAssist: { value: 0.2, min: 0, max: 1, step: 0.05 },
    },
    Lift: {
        climbSpeed: { value: 8, min: 1, max: 20, step: 0.5 },
        minThrottleForClimb: { value: 0.3, min: 0, max: 1, step: 0.1 },
    },
    Collision: {
        collisionSpeedDecay: { value: 0.98, min: 0.85, max: 1, step: 0.001 },
        collisionSafetyBuffer: { value: 0.0, min: -10, max: 10, step: 0.05 },
    },
};
