import { InputProfile } from '../../../engine/input/InputMapper';

/**
 * Gamepad profile for Orbit Camera controls.
 * Used by OrbitCamera when paused in FreeFlight and in the Lobby planet preview.
 *
 * Left Stick Y  → Zoom (dolly in/out)
 * Right Stick X → Azimuthal orbit (horizontal)
 * Right Stick Y → Polar orbit (vertical)
 */
export const ORBIT_GAMEPAD: InputProfile = {
    // Right Stick → Orbit
    "ORBIT_H": [{ deviceType: 'gamepad', axis: 2, deadzone: 0.15 }],   // Right Stick X
    "ORBIT_V": [{ deviceType: 'gamepad', axis: 3, deadzone: 0.15 }],   // Right Stick Y

    // Left Stick Y → Zoom
    "ORBIT_ZOOM": [{ deviceType: 'gamepad', axis: 1, deadzone: 0.15 }], // Left Stick Y
};
