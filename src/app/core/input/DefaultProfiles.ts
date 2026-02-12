
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

export const KEYBOARD_FLIGHT_KB1: InputProfile = {
    // WASD -> Pitch/Roll
    "PITCH": [
        { deviceType: 'keyboard', key: 'KeyW', value: -1.0 },
        { deviceType: 'keyboard', key: 'KeyS', value: 1.0 }
    ],
    "ROLL": [
        { deviceType: 'keyboard', key: 'KeyA', value: -1.0 },
        { deviceType: 'keyboard', key: 'KeyD', value: 1.0 }
    ],

    // Q/E -> Yaw (Rudder)
    "YAW": [
        { deviceType: 'keyboard', key: 'KeyQ', value: -1.0 },
        { deviceType: 'keyboard', key: 'KeyE', value: 1.0 }
    ],

    // Shift/Ctrl -> Throttle
    "THROTTLE_UP": [{ deviceType: 'keyboard', key: 'ShiftLeft' }],
    "THROTTLE_DOWN": [{ deviceType: 'keyboard', key: 'ControlLeft' }],

    "FIRE": [{ deviceType: 'keyboard', key: 'Space' }],
    "BOOST": [{ deviceType: 'keyboard', key: 'Tab' }], // Moved from Shift
    "BRAKE": [{ deviceType: 'keyboard', key: 'KeyB' }], // Explicit brake if needed
    "PAUSE": [{ deviceType: 'keyboard', key: 'Escape' }]
};

export const KEYBOARD_FLIGHT_KB2: InputProfile = {
    // P/L/;/' -> Pitch/Roll
    "PITCH": [
        { deviceType: 'keyboard', key: 'KeyP', value: -1.0 },
        { deviceType: 'keyboard', key: 'Semicolon', value: 1.0 }
    ],
    "ROLL": [
        { deviceType: 'keyboard', key: 'KeyL', value: -1.0 },
        { deviceType: 'keyboard', key: 'Quote', value: 1.0 }
    ],

    // O/[ -> Yaw
    "YAW": [
        { deviceType: 'keyboard', key: 'KeyO', value: -1.0 },
        { deviceType: 'keyboard', key: 'BracketLeft', value: 1.0 }
    ],

    // Right Shift/Ctrl -> Throttle
    "THROTTLE_UP": [{ deviceType: 'keyboard', key: 'ShiftRight' }],
    "THROTTLE_DOWN": [{ deviceType: 'keyboard', key: 'ControlRight' }],

    "FIRE": [{ deviceType: 'keyboard', key: 'Enter' }],
    "BOOST": [{ deviceType: 'keyboard', key: 'Backspace' }],
    "BRAKE": [{ deviceType: 'keyboard', key: 'Backslash' }],
    "PAUSE": [{ deviceType: 'keyboard', key: 'Delete' }]
};

// Deprecated: Alias to P1 for compatibility until full migration
export const KEYBOARD_FLIGHT = KEYBOARD_FLIGHT_KB1;

export const KEYBOARD_MENU: InputProfile = {
    "NAV_UP": [{ deviceType: 'keyboard', key: 'ArrowUp' }, { deviceType: 'keyboard', key: 'KeyW' }],
    "NAV_DOWN": [{ deviceType: 'keyboard', key: 'ArrowDown' }, { deviceType: 'keyboard', key: 'KeyS' }],
    "NAV_LEFT": [{ deviceType: 'keyboard', key: 'ArrowLeft' }, { deviceType: 'keyboard', key: 'KeyA' }],
    "NAV_RIGHT": [{ deviceType: 'keyboard', key: 'ArrowRight' }, { deviceType: 'keyboard', key: 'KeyD' }],

    "SELECT": [{ deviceType: 'keyboard', key: 'Space' }], // Removed Enter conflict
    "BACK": [{ deviceType: 'keyboard', key: 'Backspace' }],
    "LEAVE_SESSION": [{ deviceType: 'keyboard', key: 'Backspace' }],
    "PAUSE": [{ deviceType: 'keyboard', key: 'Escape' }] // Changed from Escape
};
