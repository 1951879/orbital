import { Vector3, Quaternion } from 'three';

/**
 * ISimObject - Generic Interface for Physics/Sim Entities
 * 
 * Allows Engine components (like CameraDirector) to interact with 
 * application entities (like AirplaneSim) without direct dependencies.
 */
export interface ISimObject {
    position: Vector3;
    quaternion: Quaternion;

    // Physical state often needed for cameras/effects
    velocity?: Vector3;
    currentSpeed?: number;
    throttle?: number;
}
