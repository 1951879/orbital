
import { InputProfile } from '../../../engine/input/InputMapper';

// --- GAMEPAD PROFILES ---

export const GAMEPAD_FLIGHT: InputProfile = {
    // Stick: Left Stick (0=X, 1=Y) -> Pitch/Roll
    "PITCH": [{ deviceType: 'gamepad', axis: 1, invert: false, deadzone: 0.1 }],
    "ROLL": [{ deviceType: 'gamepad', axis: 0, invert: false, deadzone: 0.1 }],

    // Stick: Right Stick (2=X, 3=Y) -> Yaw/Cam
    "YAW": [
        { deviceType: 'gamepad', axis: 2, deadzone: 0.1 },
        { deviceType: 'gamepad', axis: 0, deadzone: 0.1 } // Coupled to Left Stick Roll
    ],
    "LOOK_Y": [{ deviceType: 'gamepad', axis: 3, deadzone: 0.1 }],

    // Triggers: R2=Throttle, L2=Brake
    "THROTTLE": [{ deviceType: 'gamepad', triggerIndex: 1, deadzone: 0.15 }],
    "BRAKE": [{ deviceType: 'gamepad', triggerIndex: 0 }],

    // Buttons
    "FIRE": [{ deviceType: 'gamepad', button: 0 }], // A / Cross
    "BOOST": [{ deviceType: 'gamepad', button: 10 }], // L3 (Stick Click) or maybe B? 
    "CAMERA": [{ deviceType: 'gamepad', button: 3 }], // Y / Triangle
    "PAUSE": [{ deviceType: 'gamepad', button: 9 }]  // Start
};

export const GAMEPAD_MENU: InputProfile = {
    "NAV_UP": [{ deviceType: 'gamepad', button: 12 }], // D-Pad Up
    "NAV_DOWN": [{ deviceType: 'gamepad', button: 13 }], // D-Pad Down
    "NAV_LEFT": [{ deviceType: 'gamepad', button: 14 }], // D-Pad Left
    "NAV_RIGHT": [{ deviceType: 'gamepad', button: 15 }], // D-Pad Right

    "SELECT": [{ deviceType: 'gamepad', button: 0 }], // A
    "BACK": [{ deviceType: 'gamepad', button: 1 }], // B
    "LEAVE_SESSION": [{ deviceType: 'gamepad', button: 1 }], // B (Hold logic handled in SessionState)
    "PAUSE": [{ deviceType: 'gamepad', button: 9 }]  // Start (Toggle Menu off)
};

// --- KEYBOARD PROFILES ---

export const KEYBOARD_FLIGHT: InputProfile = {
    // WASD -> Pitch/Roll
    "PITCH": [
        { deviceType: 'keyboard', key: 'KeyW', value: -1.0 },
        { deviceType: 'keyboard', key: 'KeyS', value: 1.0 }
    ],
    "ROLL": [
        { deviceType: 'keyboard', key: 'KeyA', value: -1.0 },
        { deviceType: 'keyboard', key: 'KeyD', value: 1.0 }
    ],

    // Arrows -> Yaw/Throttle (Alternative Layouts can be added later)
    "YAW": [
        { deviceType: 'keyboard', key: 'ArrowLeft', value: -1.0 },
        { deviceType: 'keyboard', key: 'ArrowRight', value: 1.0 }
    ],

    // Throttle Keys (E/Q)
    "THROTTLE_UP": [{ deviceType: 'keyboard', key: 'KeyE' }],
    "THROTTLE_DOWN": [{ deviceType: 'keyboard', key: 'KeyQ' }],

    "FIRE": [{ deviceType: 'keyboard', key: 'Space' }],
    "BOOST": [{ deviceType: 'keyboard', key: 'ShiftLeft' }],
    "BRAKE": [{ deviceType: 'keyboard', key: 'ControlLeft' }],
    "PAUSE": [{ deviceType: 'keyboard', key: 'Enter' }]
};

export const KEYBOARD_MENU: InputProfile = {
    "NAV_UP": [{ deviceType: 'keyboard', key: 'ArrowUp' }, { deviceType: 'keyboard', key: 'KeyW' }],
    "NAV_DOWN": [{ deviceType: 'keyboard', key: 'ArrowDown' }, { deviceType: 'keyboard', key: 'KeyS' }],
    "NAV_LEFT": [{ deviceType: 'keyboard', key: 'ArrowLeft' }, { deviceType: 'keyboard', key: 'KeyA' }],
    "NAV_RIGHT": [{ deviceType: 'keyboard', key: 'ArrowRight' }, { deviceType: 'keyboard', key: 'KeyD' }],

    "SELECT": [{ deviceType: 'keyboard', key: 'Space' }], // Removed Enter conflict
    "BACK": [{ deviceType: 'keyboard', key: 'Backspace' }],
    "LEAVE_SESSION": [{ deviceType: 'keyboard', key: 'Backspace' }],
    "PAUSE": [{ deviceType: 'keyboard', key: 'Enter' }] // Changed from Escape
};
