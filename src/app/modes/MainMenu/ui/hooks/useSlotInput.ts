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
    gamepadIndex: number,
    isActive: boolean,
    handlers: SlotInputHandlers
) => {
    // We use a simplified polling or event listener approach here
    // Since the global InputManager might be too heavy for this UI specific logic
    // We want direct, low-latency menu navigation.

    const lastInputTime = useRef(0);
    const cooldown = 200; // ms

    useEffect(() => {
        if (!isActive) return;

        let frameId: number;

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

            // Keyboard logic could be mapped here too if needed, but usually handled by global listeners

            frameId = requestAnimationFrame(checkInput);
        };

        if (inputType === 'gamepad') {
            frameId = requestAnimationFrame(checkInput);
        }

        return () => cancelAnimationFrame(frameId);
    }, [inputType, gamepadIndex, isActive, handlers]); // Re-bind if configs change
};
