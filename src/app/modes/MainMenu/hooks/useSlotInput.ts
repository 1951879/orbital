import { useEffect, useRef } from 'react';
import { useStore } from '@/src/app/store/useStore';
import { InputType } from '@/src/types';

interface SlotInputHandlers {
    onPrev: () => void;
    onNext: () => void;
    onConfirm: () => void;
    onBack?: () => void;
}

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
                    // D-Pad or Stick
                    const axisX = gp.axes[0];
                    const dpadLeft = gp.buttons[14]?.pressed;
                    const dpadRight = gp.buttons[15]?.pressed;
                    const buttonA = gp.buttons[0]?.pressed;
                    const buttonB = gp.buttons[1]?.pressed;

                    // INITIALIZATION GUARD: Wait for button release
                    if (waitForRelease.current) {
                        const isAnyPressed = Math.abs(axisX) > 0.5 || dpadLeft || dpadRight || buttonA || buttonB;
                        if (!isAnyPressed) {
                            waitForRelease.current = false;
                        }
                        frameId = requestAnimationFrame(checkInput);
                        return;
                    }

                    if (axisX < -0.5 || dpadLeft) {
                        handlers.onPrev();
                        lastInputTime.current = now;
                    } else if (axisX > 0.5 || dpadRight) {
                        handlers.onNext();
                        lastInputTime.current = now;
                    } else if (buttonA) {
                        handlers.onConfirm();
                        lastInputTime.current = now;
                    } else if (buttonB && handlers.onBack) {
                        handlers.onBack();
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
        // --- KEYBOARD LISTENER ---
        const handleKeyDown = (e: KeyboardEvent) => {
            // Check if inputType is a keyboard variant (e.g. "keyboard", "keyboard_wasd", "mouse_kb")
            if (!inputType.startsWith('keyboard') && !inputType.startsWith('mouse')) return;

            // Debounce handled by repeat rate usually, but we can enforce cooldown if needed
            // For now, let's rely on native repeat or simple timestamp check
            const now = performance.now();
            if (now - lastInputTime.current < cooldown) return;

            let action: 'prev' | 'next' | 'confirm' | 'back' | null = null;
            const code = e.code;

            if (deviceId === 'kb1') {
                if (code === 'KeyQ') action = 'prev'; // TAB_PREV logic but reusing for slot cycling? No, slot uses A/D usually. 
                // Wait, MainMenuInput says A/D for NAV_LEFT/RIGHT. Slot uses "Cycle".
                // Let's stick to A/D for Cycle (Prev/Next) and F for Select.
                if (code === 'KeyA') action = 'prev';
                if (code === 'KeyD') action = 'next';
                if (code === 'KeyF') action = 'confirm';
                if (code === 'KeyR') action = 'back';
            } else if (deviceId === 'kb2') {
                if (code === 'KeyL') action = 'prev';
                if (code === 'Quote') action = 'next';
                if (code === 'Enter') action = 'confirm';
                if (code === 'BracketRight') action = 'back';
            }

            if (action) {
                if (action === 'prev') handlers.onPrev();
                if (action === 'next') handlers.onNext();
                if (action === 'confirm') handlers.onConfirm();
                if (action === 'back' && handlers.onBack) handlers.onBack();
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
