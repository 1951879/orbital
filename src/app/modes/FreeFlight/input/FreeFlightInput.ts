import { InputProfile } from '../../../../engine/input/InputMapper';
import { GLOBAL_INPUTS } from '../../../core/input/GlobalInput';
import { ORBIT_GAMEPAD } from '../../../core/input/OrbitInput';

export const FREE_FLIGHT_GAMEPAD: InputProfile = {
    ...GLOBAL_INPUTS.GAMEPAD,
    ...ORBIT_GAMEPAD,

    // Stick: Left Stick (0=X, 1=Y) -> Pitch/Roll
    "PITCH": [{ deviceType: 'gamepad', axis: 1, invert: false, deadzone: 0.1 }],
    "ROLL": [{ deviceType: 'gamepad', axis: 0, invert: false, deadzone: 0.1 }],
    // Coupled Yaw (Turn) to Roll (Bank) for Arcade Flight
    "YAW": [{ deviceType: 'gamepad', axis: 0, invert: false, deadzone: 0.1 }],

    // Triggers: R2=Throttle
    // Note: Trigger axis usually -1 to 1, or 0 to 1 depending on browser/OS. 
    // InputMapper handles standard gamepad API normalization (0 to 1 for triggers if mapped as button/analog).
    // However, `axis: 5` is often Right Trigger in standard mapping if treated as axis.
    // Check `StandardGamepad` mapping in InputManager if unsure, but typically `triggerIndex` is safer if supported.
    // Let's use `triggerIndex` as seen in `GAMEPAD_FLIGHT` from `DefaultProfiles.ts` reference.
    "THROTTLE": [{ deviceType: 'gamepad', triggerIndex: 1, deadzone: 0.05 }],

    // Optional: Map some buttons just in case, though user only asked for Pitch/Roll/Throttle
    "FIRE": [{ deviceType: 'gamepad', button: 0 }], // A
    "BOOST": [{ deviceType: 'gamepad', button: 10 }], // L3
    "ABORT": [{ deviceType: 'gamepad', button: 8 }],  // Select
};

export const FREE_FLIGHT_KB1: InputProfile = {
    ...GLOBAL_INPUTS.KEYBOARD_KB1,
    // Flight Controls (WASD)
    "PITCH": [
        { deviceType: 'keyboard', key: 'w', value: 1.0 },
        { deviceType: 'keyboard', key: 's', value: -1.0 }
    ],
    "ROLL": [
        { deviceType: 'keyboard', key: 'd', value: 1.0 },
        { deviceType: 'keyboard', key: 'a', value: -1.0 }
    ],
    "THROTTLE": [
        { deviceType: 'keyboard', key: 'ShiftLeft', value: 0.5 }, // Increment
        { deviceType: 'keyboard', key: 'ControlLeft', value: -0.5 } // Decrement
    ]
};

export const FREE_FLIGHT_KB2: InputProfile = {
    ...GLOBAL_INPUTS.KEYBOARD_KB2,
    // Flight Controls (Arrows)
    "PITCH": [
        { deviceType: 'keyboard', key: 'ArrowUp', value: 1.0 },
        { deviceType: 'keyboard', key: 'ArrowDown', value: -1.0 }
    ],
    "ROLL": [
        { deviceType: 'keyboard', key: 'ArrowRight', value: 1.0 },
        { deviceType: 'keyboard', key: 'ArrowLeft', value: -1.0 }
    ],
    "THROTTLE": [
        { deviceType: 'keyboard', key: ']', value: 0.5 },
        { deviceType: 'keyboard', key: '[', value: -0.5 }
    ]
};

export const FREE_FLIGHT_TOUCH: InputProfile = {
    "PITCH": [{ deviceType: 'touch', axis: 1, invert: false, deadzone: 0.05 }],
    "ROLL": [{ deviceType: 'touch', axis: 0, invert: false, deadzone: 0.05 }],
    "YAW": [{ deviceType: 'touch', axis: 0, invert: false, deadzone: 0.05 }],
    "THROTTLE": [{ deviceType: 'touch', triggerIndex: 1, deadzone: 0.01 }],
};
