import { Vector3 } from 'three';
import { AirplaneType } from '../../../../types';

export const AIRPLANE_CONFIG = {
    speed: 30.0,
    turnSpeed: 1.8,
    climbSpeed: 8.0,
    minAltitude: 0.5,
    maxAltitude: 80.0,
    inputSmoothing: 5.0,
    collider: {
        type: 'capsule',
        radius: 2,
        height: 10
    },
    mass: 500
};

export const AIRPLANE_SCALES: Record<AirplaneType, number> = {
    interceptor: 0.33,
    raptor: 0.37,
    bomber: 0.4,
    scout: 0.3,
    viper: 0.35,
    manta: 0.3,
    corsair: 0.35,
    eagle: 0.38,
    falcon: 0.35,
    tempest: 0.38,
    phantom: 0.4,
    starling: 0.3
};

export const COLLISION_POINTS: Record<AirplaneType, Vector3[]> = {
    // Standard Utility Fighter
    interceptor: [
        new Vector3(0, -0.5, 1.8),  // Nose Bottom
        new Vector3(0, 0.5, 1.8),   // Nose Top
        new Vector3(0, -0.5, -1.8), // Tail Bottom
        new Vector3(0, 0.8, -1.8),  // Tail Top (Fin)
        new Vector3(2.5, 0, -0.5),  // Left Wingtip
        new Vector3(-2.5, 0, -0.5)  // Right Wingtip
    ],
    // Twin-Tail Air Superiority (F-22 style)
    raptor: [
        new Vector3(0, -0.4, 2.0),  // Nose Bottom
        new Vector3(0, 0.4, 2.0),   // Nose Top
        new Vector3(0, -0.4, -1.5), // Fuselage Rear Bottom
        new Vector3(0.6, 0.8, -1.5), // Left Fin Top
        new Vector3(-0.6, 0.8, -1.5),// Right Fin Top
        new Vector3(3.0, 0, -0.5),   // Left Wingtip
        new Vector3(-3.0, 0, -0.5)   // Right Wingtip
    ],
    // Heavy Bomber (Wide with Engine Pods)
    bomber: [
        new Vector3(0, -0.8, 2.5),   // Nose Bottom
        new Vector3(0, 0.8, 2.5),    // Nose Top
        new Vector3(0, -0.6, -2.5),  // Tail Bottom
        new Vector3(0, 1.2, -2.5),   // Tail Top
        new Vector3(4.5, 0, 0),      // Left Wingtip
        new Vector3(-4.5, 0, 0),     // Right Wingtip
        new Vector3(1.2, -0.9, -0.5), // Left Engine Bottom
        new Vector3(-1.2, -0.9, -0.5) // Right Engine Bottom
    ],
    // Flying Wing (Triangle)
    manta: [
        new Vector3(0, -0.3, 2.0),   // Nose
        new Vector3(0, 0.5, 0),      // Cockpit bump
        new Vector3(2.5, -0.2, -1.0),// Left Wingtip
        new Vector3(-2.5, -0.2, -1.0),// Right Wingtip
        new Vector3(1.0, -0.3, -1.5), // Rear Left
        new Vector3(-1.0, -0.3, -1.5) // Rear Right
    ],
    // Small Agile Scout
    scout: [
        new Vector3(0, -0.3, 1.5),
        new Vector3(0, 0.3, 1.5),
        new Vector3(0, -0.3, -1.2),
        new Vector3(0, 0.6, -1.2),
        new Vector3(2.0, 0, -0.5),
        new Vector3(-2.0, 0, -0.5)
    ],
    // Fwd Swept / Scifi
    viper: [
        new Vector3(0, -0.4, 2.0),
        new Vector3(0, 0.4, 2.0),
        new Vector3(0, -0.4, -1.5),
        new Vector3(0.5, 0.8, -1.5), // V-Tail L
        new Vector3(-0.5, 0.8, -1.5),// V-Tail R
        new Vector3(2.0, 0, 0.5),    // Wingtip L (Forward)
        new Vector3(-2.0, 0, 0.5)    // Wingtip R (Forward)
    ],
    // Default / Placeholder dimensions for others
    corsair: [
        new Vector3(0, -0.5, 1.5),
        new Vector3(0, 0.5, 1.5),
        new Vector3(0, -0.5, -1.5),
        new Vector3(0, 0.8, -1.5),
        new Vector3(2.2, 0, -0.2),
        new Vector3(-2.2, 0, -0.2)
    ],
    eagle: [
        new Vector3(0, -0.5, 1.8),
        new Vector3(0, 0.5, 1.8),
        new Vector3(0, -0.5, -1.8),
        new Vector3(0, 0.9, -1.8),
        new Vector3(2.5, 0, -0.5),
        new Vector3(-2.5, 0, -0.5)
    ],
    falcon: [
        new Vector3(0, -0.4, 1.6),
        new Vector3(0, 0.4, 1.6),
        new Vector3(0, -0.4, -1.6),
        new Vector3(0, 0.8, -1.6),
        new Vector3(2.0, 0, -0.4),
        new Vector3(-2.0, 0, -0.4)
    ],
    tempest: [
        new Vector3(0, -0.5, 1.7),
        new Vector3(0, 0.5, 1.7),
        new Vector3(0, -0.5, -1.7),
        new Vector3(0, 0.9, -1.7),
        new Vector3(2.4, 0, -0.3),
        new Vector3(-2.4, 0, -0.3)
    ],
    phantom: [
        new Vector3(0, -0.4, 1.8),
        new Vector3(0, 0.4, 1.8),
        new Vector3(0, -0.4, -1.6),
        new Vector3(0, 0.8, -1.6),
        new Vector3(2.2, 0, -0.5),
        new Vector3(-2.2, 0, -0.5)
    ],
    starling: [
        new Vector3(0, -0.3, 1.2),
        new Vector3(0, 0.3, 1.2),
        new Vector3(0, -0.3, -1.0),
        new Vector3(0, 0.6, -1.0),
        new Vector3(1.5, 0, -0.2),
        new Vector3(-1.5, 0, -0.2)
    ]
};
