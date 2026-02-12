import { InputProfile } from '../../../engine/input/InputMapper';

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
    "PAUSE": [{ deviceType: 'gamepad', button: 9 }] // Start
};

export const MAIN_MENU_KB1: InputProfile = {
    "NAV_UP": [{ deviceType: 'keyboard', key: 'KeyW' }],
    "NAV_DOWN": [{ deviceType: 'keyboard', key: 'KeyS' }],
    "NAV_LEFT": [{ deviceType: 'keyboard', key: 'KeyA' }],
    "NAV_RIGHT": [{ deviceType: 'keyboard', key: 'KeyD' }],
    "TAB_PREV": [{ deviceType: 'keyboard', key: 'KeyQ' }],
    "TAB_NEXT": [{ deviceType: 'keyboard', key: 'KeyE' }],
    "SELECT": [{ deviceType: 'keyboard', key: 'KeyF' }],
    "BACK": [{ deviceType: 'keyboard', key: 'KeyR' }],
    "LEAVE_SESSION": [{ deviceType: 'keyboard', key: 'KeyR' }],
    "PAUSE": [{ deviceType: 'keyboard', key: 'Escape' }] // Start/Menu
};

export const MAIN_MENU_KB2: InputProfile = {
    "NAV_UP": [{ deviceType: 'keyboard', key: 'KeyP' }],
    "NAV_DOWN": [{ deviceType: 'keyboard', key: 'Semicolon' }],
    "NAV_LEFT": [{ deviceType: 'keyboard', key: 'KeyL' }],
    "NAV_RIGHT": [{ deviceType: 'keyboard', key: 'Quote' }],
    "TAB_PREV": [{ deviceType: 'keyboard', key: 'KeyO' }],
    "TAB_NEXT": [{ deviceType: 'keyboard', key: 'BracketLeft' }],
    "SELECT": [{ deviceType: 'keyboard', key: 'Enter' }],  // "A"
    "BACK": [{ deviceType: 'keyboard', key: 'BracketRight' }], // "B" ( ] )
    "LEAVE_SESSION": [{ deviceType: 'keyboard', key: 'BracketRight' }],
    "PAUSE": [{ deviceType: 'keyboard', key: 'Delete' }]
};
