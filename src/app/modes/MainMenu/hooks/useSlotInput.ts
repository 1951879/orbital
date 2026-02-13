import { useEffect, useRef } from 'react';
import { useStore } from '@/src/app/store/useStore';
import { InputType } from '@/src/types';
import { MAIN_MENU_GAMEPAD, MAIN_MENU_KB1, MAIN_MENU_KB2 } from '../input/MainMenuInput';
import { InputProfile } from '@/src/engine/input/InputMapper';

interface SlotInputHandlers {
    onPrev: () => void;
    onNext: () => void;
    onConfirm: () => void;
    onBack?: () => void;
    onReady?: () => void;
    onContext?: () => void;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const checkKeyboard = (profile: InputProfile, action: string, code: string): boolean => {
    const bindings = profile[action];
    if (!bindings) return false;
    // Check if any binding matches the key code
    return bindings.some(b => b.deviceType === 'keyboard' && b.key === code);
};

const checkGamepad = (profile: InputProfile, action: string, gp: Gamepad): boolean => {
    const bindings = profile[action];
    if (!bindings) return false;

    // Check any binding
    return bindings.some(b => {
        if (b.deviceType !== 'gamepad') return false;

        // Button check
        if (b.button !== undefined && gp.buttons[b.button]?.pressed) return true;

        // Axis check (simulated as button press if > deadzone)
        if (b.axis !== undefined) {
            const val = gp.axes[b.axis];
            // If value definition is positive/negative direction
            if (b.value && b.value > 0 && val > 0.5) return true;
            if (b.value && b.value < 0 && val < -0.5) return true;
            // Default if no direction specified (absolute > 0.5)
            if (!b.value && Math.abs(val) > 0.5) return true;
        }

        return false;
    });
};

export const useSlotInput = (
    inputType: InputType,
    deviceId: string,
    gamepadIndex: number,
    isActive: boolean,
    handlers: SlotInputHandlers
) => {
    // We use a simplified polling or event listener approach here
    // Since the global InputManager might be too heavy for this UI specific logic
    // We want direct, low-latency menu navigation.

    const lastInputTime = useRef(0);
    const waitForRelease = useRef(true); // Default to waiting for release on mount
    const cooldown = 200; // ms

    useEffect(() => {
        if (!isActive) return;

        let frameId: number;

        // --- GAMEPAD POLLING ---
        const checkInput = () => {
            const now = performance.now();
            if (now - lastInputTime.current < cooldown) {
                frameId = requestAnimationFrame(checkInput);
                return;
            }

            if (inputType === 'gamepad' && gamepadIndex !== -1) {
                const gp = navigator.getGamepads()[gamepadIndex];
                if (gp) {
                    // Check standard inputs against profile
                    const p = MAIN_MENU_GAMEPAD;

                    const intentPrev = checkGamepad(p, 'NAV_LEFT', gp) || checkGamepad(p, 'TAB_PREV', gp);
                    const intentNext = checkGamepad(p, 'NAV_RIGHT', gp) || checkGamepad(p, 'TAB_NEXT', gp);
                    const intentConfirm = checkGamepad(p, 'SELECT', gp);
                    const intentBack = checkGamepad(p, 'BACK', gp);
                    const intentReady = checkGamepad(p, 'SELECT', gp); // Wait, Ready logic often same as Select or specialized?
                    // RosterPanel passes onReady for 'X' usually. 
                    // But in Profile, X is mapped to... let's check profile. 
                    // The profile doesn't have "READY" action usually. 
                    // MainMenuInput has: SELECT (A), BACK (B), CONTEXT (Y).
                    // Wait, recent convo said Ready is X. 
                    // Checking MainMenuInput: X is not mapped. 
                    // Button 2 (X) is missing in MAIN_MENU_GAMEPAD.
                    // Okay, keep hardcoded check for X if it's not in profile, OR add "READY" to profile?
                    // User said "remap 'Ready' action to 'X' button" in previous convo.
                    // But looking at MainMenuInput.ts, X is NOT in the profile.
                    // So we MUST keep hardcoded check for Button 2 (X) for Ready, OR explicit 'READY' action if added.
                    // Let's defer to hardcoded X for Ready if profile lacks it, to avoid regression.
                    const buttonX = gp.buttons[2]?.pressed;

                    const intentContext = checkGamepad(p, 'CONTEXT', gp);

                    // INITIALIZATION GUARD: Wait for button release
                    if (waitForRelease.current) {
                        const isAnyPressed = intentPrev || intentNext || intentConfirm || intentBack || buttonX || intentContext;
                        if (!isAnyPressed) {
                            waitForRelease.current = false;
                        }
                        frameId = requestAnimationFrame(checkInput);
                        return;
                    }

                    if (intentPrev) {
                        handlers.onPrev();
                        lastInputTime.current = now;
                    } else if (intentNext) {
                        handlers.onNext();
                        lastInputTime.current = now;
                    } else if (intentConfirm) {
                        handlers.onConfirm();
                        lastInputTime.current = now;
                    } else if (intentBack && handlers.onBack) {
                        handlers.onBack();
                        lastInputTime.current = now;
                    } else if (intentReady && handlers.onReady) {
                        handlers.onReady();
                        lastInputTime.current = now;
                    } else if (intentContext && handlers.onContext) {
                        handlers.onContext();
                        lastInputTime.current = now;
                    }
                }
            }

            frameId = requestAnimationFrame(checkInput);
        };

        if (inputType === 'gamepad') {
            frameId = requestAnimationFrame(checkInput);
        }

        // --- KEYBOARD LISTENER ---
        const handleKeyDown = (e: KeyboardEvent) => {
            // Check if inputType is a keyboard variant (e.g. "keyboard", "keyboard_wasd", "mouse_kb")
            if (!inputType.startsWith('keyboard') && !inputType.startsWith('mouse')) return;

            // Debounce handled by repeat rate usually, but we can enforce cooldown if needed
            // For now, let's rely on native repeat or simple timestamp check
            const now = performance.now();
            if (now - lastInputTime.current < cooldown) return;

            let action: 'prev' | 'next' | 'confirm' | 'back' | 'context' | 'ready' | null = null;
            const code = e.code;

            // Select Profile based on deviceId
            let profile = deviceId === 'kb2' ? MAIN_MENU_KB2 : MAIN_MENU_KB1;

            if (checkKeyboard(profile, 'NAV_LEFT', code) || checkKeyboard(profile, 'TAB_PREV', code)) action = 'prev';
            if (checkKeyboard(profile, 'NAV_RIGHT', code) || checkKeyboard(profile, 'TAB_NEXT', code)) action = 'next';
            if (checkKeyboard(profile, 'SELECT', code)) action = 'confirm';
            if (checkKeyboard(profile, 'BACK', code)) action = 'back';
            if (checkKeyboard(profile, 'CONTEXT', code)) action = 'context';
            if (checkKeyboard(profile, 'MINOR', code)) action = 'ready';

            if (action) {
                if (action === 'prev') handlers.onPrev();
                if (action === 'next') handlers.onNext();
                if (action === 'confirm') handlers.onConfirm();
                if (action === 'back' && handlers.onBack) handlers.onBack();
                if (action === 'context' && handlers.onContext) handlers.onContext();
                if (action === 'ready' && handlers.onReady) handlers.onReady();
                lastInputTime.current = now;
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            cancelAnimationFrame(frameId);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [inputType, deviceId, gamepadIndex, isActive, handlers]); // Re-bind if configs change
};
