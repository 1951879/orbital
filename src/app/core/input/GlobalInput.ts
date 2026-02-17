import { InputProfile } from '../../../engine/input/InputMapper';

export const GLOBAL_INPUTS = {
    GAMEPAD: {
        "PAUSE": [{ deviceType: 'gamepad', button: 9 }], // Start
        "LAUNCH": [{ deviceType: 'gamepad', button: 9 }] // Start
    } as InputProfile,

    // WASD / Left-Handed Style
    KEYBOARD_KB1: {
        "PAUSE": [{ deviceType: 'keyboard', key: 'Escape' }],
        "LAUNCH": [{ deviceType: 'keyboard', key: 'Escape' }] // Or Space?
    } as InputProfile,

    // Arrow / Right-Handed Style
    KEYBOARD_KB2: {
        "PAUSE": [{ deviceType: 'keyboard', key: 'NumpadEnter' }], // Or End
        "LAUNCH": [{ deviceType: 'keyboard', key: 'NumpadEnter' }]
    } as InputProfile
};
