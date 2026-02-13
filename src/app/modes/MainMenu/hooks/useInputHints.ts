import { useStore } from '@/src/app/store/useStore';
import { useGamepadDetector, GamepadType } from '@/src/app/core/ui/useGamepadDetector';
import { LocalPilot } from '@/src/types';

/**
 * Centralized hint visibility logic for menu UI.
 *
 * Rules:
 *  1. Empty slot: show gamepad hints if detected, keyboard hints only on non-touch devices.
 *  2. Active slot (touch player): no hints.
 *  3. Host is touch: suppress all global/host-level hints (Header tabs etc.),
 *     but per-slot hints for non-touch players still show.
 */

export interface HintMode {
    showGamepad: boolean;
    showKeyboard: boolean;
    gamepadType: GamepadType | null;
    keyboardDevice: string; // 'kb1' | 'kb2'
    keyboardReadyKey?: string; // key name for the Ready action
}

const NONE: HintMode = { showGamepad: false, showKeyboard: false, gamepadType: null, keyboardDevice: 'kb1' };

// Heuristic: device is touch-primary (no physical keyboard expected)
// Combines maxTouchPoints with coarse pointer check — catches phones, tablets,
// and iPads with trackpads (which still have maxTouchPoints > 0)
const isTouchPrimaryDevice = (): boolean => {
    if (typeof window === 'undefined') return false;
    const hasTouch = navigator.maxTouchPoints > 0;
    const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const hasNoHover = window.matchMedia('(hover: none)').matches;
    // Touch-primary if: coarse pointer OR no hover, AND has touch
    return hasTouch && (hasCoarsePointer || hasNoHover);
};

/**
 * Hint mode for a specific player slot.
 */
export const useSlotHints = (pilot: LocalPilot | undefined): HintMode => {
    // For gamepad detection: use pilot's gamepad index if they're on gamepad, otherwise global fallback
    const targetGpIndex = (pilot && pilot.input.type === 'gamepad') ? pilot.input.gamepadIndex : undefined;
    const detectedType = useGamepadDetector(targetGpIndex);

    const getReadyKey = (deviceId: string) => deviceId === 'kb2' ? '4' : 'R';

    if (!pilot) {
        // Empty slot
        const hasGamepad = !!detectedType;
        const hasKeyboard = !isTouchPrimaryDevice();
        return {
            showGamepad: hasGamepad,
            showKeyboard: !hasGamepad && hasKeyboard,
            gamepadType: detectedType,
            keyboardDevice: 'kb1',
            keyboardReadyKey: 'R' // Default to KB1
        };
    }

    // Active slot
    if (pilot.input.type === 'touch') return NONE;

    if (pilot.input.type === 'gamepad') {
        return {
            showGamepad: !!detectedType,
            showKeyboard: false,
            gamepadType: detectedType,
            keyboardDevice: pilot.input.deviceId,
        };
    }

    // Keyboard player
    return {
        showGamepad: false,
        showKeyboard: true,
        gamepadType: null,
        keyboardDevice: pilot.input.deviceId,
        keyboardReadyKey: getReadyKey(pilot.input.deviceId)
    };
};

/**
 * Hint mode for global / host-level UI.
 */
export const useHostHints = (): HintMode => {
    // ... (host logic) ...
    const localParty = useStore(state => state.localParty);
    const host = localParty.find(p => p.id === 0);

    const hostGpIndex = (host && host.input.type === 'gamepad') ? host.input.gamepadIndex : undefined;
    const detectedType = useGamepadDetector(hostGpIndex);

    const getReadyKey = (deviceId: string) => deviceId === 'kb2' ? '4' : 'R';

    if (!host) {
        const hasGamepad = !!detectedType;
        const hasKeyboard = !isTouchPrimaryDevice();
        return {
            showGamepad: hasGamepad,
            showKeyboard: !hasGamepad && hasKeyboard,
            gamepadType: detectedType,
            keyboardDevice: 'kb1',
            keyboardReadyKey: 'R'
        };
    }

    if (host.input.type === 'touch') return NONE;

    if (host.input.type === 'gamepad') {
        return {
            showGamepad: !!detectedType,
            showKeyboard: false,
            gamepadType: detectedType,
            keyboardDevice: host.input.deviceId,
        };
    }

    return {
        showGamepad: false,
        showKeyboard: true,
        gamepadType: null,
        keyboardDevice: host.input.deviceId,
        keyboardReadyKey: getReadyKey(host.input.deviceId)
    };
};
