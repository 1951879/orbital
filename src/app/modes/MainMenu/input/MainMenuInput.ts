import { InputProfile } from '../../../../engine/input/InputMapper';

export const MAIN_MENU_GAMEPAD: InputProfile = {
    "NAV_UP": [{ deviceType: 'gamepad', button: 12 }],
    "NAV_DOWN": [{ deviceType: 'gamepad', button: 13 }],
    "NAV_LEFT": [{ deviceType: 'gamepad', button: 14 }],
    "NAV_RIGHT": [{ deviceType: 'gamepad', button: 15 }],
    "TAB_PREV": [{ deviceType: 'gamepad', button: 4 }], // LB
    "TAB_NEXT": [{ deviceType: 'gamepad', button: 5 }], // RB
    "SELECT": [{ deviceType: 'gamepad', button: 0 }], // A
    "BACK": [{ deviceType: 'gamepad', button: 1 }], // B
    "LEAVE_SESSION": [{ deviceType: 'gamepad', button: 1 }],
    "PAUSE": [{ deviceType: 'gamepad', button: 9 }], // Start
    "CONTEXT": [{ deviceType: 'gamepad', button: 3 }], // Y
    "MINOR": [{ deviceType: 'gamepad', button: 2 }]    // X
};

export const MAIN_MENU_KB1: InputProfile = {
    "NAV_UP": [{ deviceType: 'keyboard', key: 'KeyW' }],
    "NAV_DOWN": [{ deviceType: 'keyboard', key: 'KeyS' }],
    "NAV_LEFT": [{ deviceType: 'keyboard', key: 'KeyA' }],
    "NAV_RIGHT": [{ deviceType: 'keyboard', key: 'KeyD' }],
    "TAB_PREV": [{ deviceType: 'keyboard', key: 'KeyQ' }],
    "TAB_NEXT": [{ deviceType: 'keyboard', key: 'KeyE' }],
    "SELECT": [{ deviceType: 'keyboard', key: 'KeyF' }], // A
    "BACK": [{ deviceType: 'keyboard', key: 'KeyG' }],   // B
    "LEAVE_SESSION": [{ deviceType: 'keyboard', key: 'KeyG' }],
    "PAUSE": [{ deviceType: 'keyboard', key: 'Escape' }],
    "CONTEXT": [{ deviceType: 'keyboard', key: 'KeyT' }], // Y
    "MINOR": [{ deviceType: 'keyboard', key: 'KeyR' }]    // X
};

export const MAIN_MENU_KB2: InputProfile = {
    "NAV_UP": [{ deviceType: 'keyboard', key: 'ArrowUp' }],
    "NAV_DOWN": [{ deviceType: 'keyboard', key: 'ArrowDown' }],
    "NAV_LEFT": [{ deviceType: 'keyboard', key: 'ArrowLeft' }],
    "NAV_RIGHT": [{ deviceType: 'keyboard', key: 'ArrowRight' }],
    "TAB_PREV": [{ deviceType: 'keyboard', key: 'Delete' }],
    "TAB_NEXT": [{ deviceType: 'keyboard', key: 'PageDown' }],
    "SELECT": [{ deviceType: 'keyboard', key: 'Numpad1' }],  // A
    "BACK": [{ deviceType: 'keyboard', key: 'Numpad2' }],    // B
    "LEAVE_SESSION": [{ deviceType: 'keyboard', key: 'Numpad2' }],
    "PAUSE": [{ deviceType: 'keyboard', key: 'End' }],
    "CONTEXT": [{ deviceType: 'keyboard', key: 'Numpad5' }], // Y
    "MINOR": [{ deviceType: 'keyboard', key: 'Numpad4' }]    // X
};
