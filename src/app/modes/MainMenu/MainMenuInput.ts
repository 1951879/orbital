import { InputProfile } from '../../../engine/input/InputMapper';

export const MAIN_MENU_PROFILE: InputProfile = {
    // Navigation
    "NAV_UP": [
        { deviceType: 'gamepad', button: 12 }, // D-Pad Up
        { deviceType: 'keyboard', key: 'ArrowUp' },
        { deviceType: 'keyboard', key: 'KeyW' }
    ],
    "NAV_DOWN": [
        { deviceType: 'gamepad', button: 13 }, // D-Pad Down
        { deviceType: 'keyboard', key: 'ArrowDown' },
        { deviceType: 'keyboard', key: 'KeyS' }
    ],
    "NAV_LEFT": [
        { deviceType: 'gamepad', button: 14 }, // D-Pad Left
        { deviceType: 'keyboard', key: 'ArrowLeft' },
        { deviceType: 'keyboard', key: 'KeyA' }
    ],
    "NAV_RIGHT": [
        { deviceType: 'gamepad', button: 15 }, // D-Pad Right
        { deviceType: 'keyboard', key: 'ArrowRight' },
        { deviceType: 'keyboard', key: 'KeyD' }
    ],

    // Tab Switching
    "TAB_PREV": [
        { deviceType: 'gamepad', button: 4 }, // L1 / LB
        { deviceType: 'keyboard', key: 'KeyQ' }
    ],
    "TAB_NEXT": [
        { deviceType: 'gamepad', button: 5 }, // R1 / RB
        { deviceType: 'keyboard', key: 'KeyE' }
    ],

    // Actions
    "SELECT": [
        { deviceType: 'gamepad', button: 0 }, // A / Cross
        { deviceType: 'keyboard', key: 'Space' },
        { deviceType: 'keyboard', key: 'Enter' }
    ],
    "BACK": [
        { deviceType: 'gamepad', button: 1 }, // B / Circle
        { deviceType: 'keyboard', key: 'Backspace' },
        { deviceType: 'keyboard', key: 'Escape' }
    ],

    // Session
    "LEAVE_SESSION": [
        { deviceType: 'gamepad', button: 1 }, // B (Hold)
        { deviceType: 'keyboard', key: 'Backspace' }
    ]
};
