
// ==================================================================================
// SHARED FLIGHT PHYSICS CONSTANTS
//
// Per-type data (scales, collision points, audio) now lives in each model file
// and is collected by models/registry.ts.
//
// Re-export registry maps for backward compatibility.
// ==================================================================================

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

// Re-exports from registry for backward compatibility
export { AIRPLANE_SCALES, COLLISION_POINTS } from './registry';
