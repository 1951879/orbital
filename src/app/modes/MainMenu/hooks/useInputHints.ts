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
}

const NONE: HintMode = { showGamepad: false, showKeyboard: false, gamepadType: null, keyboardDevice: 'kb1' };

// Heuristic: device has no precise pointer → touch-primary (no keyboard expected)
const isTouchPrimaryDevice = (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(hover: none)').matches;
};

/**
 * Hint mode for a specific player slot.
 * @param pilot The pilot in the slot, or undefined for empty slot.
 * @param targetGpIndex Gamepad index to detect type for (undefined = global/fallback).
 */
export const useSlotHints = (pilot: LocalPilot | undefined): HintMode => {
    // For gamepad detection: use pilot's gamepad index if they're on gamepad, otherwise global fallback
    const targetGpIndex = (pilot && pilot.input.type === 'gamepad') ? pilot.input.gamepadIndex : undefined;
    const detectedType = useGamepadDetector(targetGpIndex);

    if (!pilot) {
        // Empty slot
        const hasGamepad = !!detectedType;
        const hasKeyboard = !isTouchPrimaryDevice();
        return {
            showGamepad: hasGamepad,
            showKeyboard: !hasGamepad && hasKeyboard,
            gamepadType: detectedType,
            keyboardDevice: 'kb1',
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
    };
};

/**
 * Hint mode for global / host-level UI (Header tabs, etc.).
 * If host is touch, returns NONE so no hints pollute the global UI.
 */
export const useHostHints = (): HintMode => {
    const localParty = useStore(state => state.localParty);
    const host = localParty.find(p => p.id === 0);

    const hostGpIndex = (host && host.input.type === 'gamepad') ? host.input.gamepadIndex : undefined;
    const detectedType = useGamepadDetector(hostGpIndex);

    if (!host) {
        // No host yet — show keyboard hints only if non-touch device
        const hasGamepad = !!detectedType;
        const hasKeyboard = !isTouchPrimaryDevice();
        return {
            showGamepad: hasGamepad,
            showKeyboard: !hasGamepad && hasKeyboard,
            gamepadType: detectedType,
            keyboardDevice: 'kb1',
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

    // Keyboard host
    return {
        showGamepad: false,
        showKeyboard: true,
        gamepadType: null,
        keyboardDevice: host.input.deviceId,
    };
};
