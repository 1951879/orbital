import { Vector3 } from 'three';
import { AirplaneType } from '../../../types';

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
    interceptor: [
        new Vector3(0, -0.5, 0),
        new Vector3(0, 0, 1.2),
        new Vector3(0, 0, -1.4),
        new Vector3(1.4, 0, -0.2),
        new Vector3(-1.4, 0, -0.2)
    ],
    raptor: [
        new Vector3(0, -0.4, 0),
        new Vector3(0, 0, 1.4),
        new Vector3(0, 0, -1.3),
        new Vector3(1.8, 0, -0.5),
        new Vector3(-1.8, 0, -0.5)
    ],
    bomber: [
        new Vector3(0, -0.8, 0),
        new Vector3(0, 0, 1.3),
        new Vector3(0, 0, -1.2),
        new Vector3(2.2, 0, 0),
        new Vector3(-2.2, 0, 0)
    ],
    scout: [
        new Vector3(0, -0.3, 0),
        new Vector3(0, 0, 1.1),
        new Vector3(0, 0, -0.9),
        new Vector3(1.8, 0, -0.6),
        new Vector3(-1.8, 0, -0.6)
    ],
    viper: [
        new Vector3(0, -0.3, 0),
        new Vector3(0, 0, 1.2),
        new Vector3(0, 0, -1.2),
        new Vector3(1.5, 0, 0.5),
        new Vector3(-1.5, 0, 0.5)
    ],
    manta: [
        new Vector3(0, -0.3, 0),
        new Vector3(0, 0, 1.0),
        new Vector3(0, 0, -1.0),
        new Vector3(2.0, 0, -0.5),
        new Vector3(-2.0, 0, -0.5)
    ],
    corsair: [
        new Vector3(0, -0.6, 0),
        new Vector3(0, 0, 1.2),
        new Vector3(0, 0, -1.2),
        new Vector3(2.0, -0.5, 0),
        new Vector3(-2.0, -0.5, 0)
    ],
    eagle: [
        new Vector3(0, -0.5, 0),
        new Vector3(0, 0, 1.3),
        new Vector3(0, 0, -1.3),
        new Vector3(1.8, 0, -0.2),
        new Vector3(-1.8, 0, -0.2)
    ],
    falcon: [
        new Vector3(0, -0.2, 0),
        new Vector3(0, 0, 1.5),
        new Vector3(0, 0, -1.5),
        new Vector3(1.8, 0, -0.5),
        new Vector3(-1.8, 0, -0.5)
    ],
    tempest: [
        new Vector3(0, -0.3, 0),
        new Vector3(0, 0, 1.2),
        new Vector3(0, 0, -1.5),
        new Vector3(2.0, 0, 0),
        new Vector3(-2.0, 0, 0)
    ],
    phantom: [
        new Vector3(0, -0.3, 0),
        new Vector3(0, 0, 1.0),
        new Vector3(0, 0, -1.0),
        new Vector3(2.0, 0, -0.8),
        new Vector3(-2.0, 0, -0.8)
    ],
    starling: [
        new Vector3(0, -0.4, 0),
        new Vector3(0, 0, 0.8),
        new Vector3(0, 0, -0.8),
        new Vector3(1.5, -0.2, 0),
        new Vector3(-1.5, -0.2, 0)
    ]
};
