
import { useEffect, useRef } from 'react';
import { MathUtils } from 'three';
import { useStore } from '../app/store/useStore';
import { PlayerInputConfig } from '../types';

export const useFlightInput = (
    sensitivity: number = 0.0015,
    config: PlayerInputConfig,
    playerId: number = 1 // 1-Based for legacy compatibility, converted to 0-based internally
) => {
    const isPaused = useStore((state) => state.isPaused);
    const setIsPaused = useStore((state) => state.setIsPaused);

    const pilotId = playerId - 1; // 0-based index

    // Use unified joystick and throttle state
    const pilotThrottle = useStore((state) => state.localParty[pilotId]?.throttle ?? 0);
    const setPilotThrottle = useStore((state) => state.setPilotThrottle);

    const virtualCursor = useRef({ x: 0, y: 0 });
    const input = useRef({ x: 0, y: 0 });
    const isLocked = useRef(false);
    const throttleRef = useRef(0);

    const wasJoystickActive = useRef(false);
    const wasGamepadActive = useRef(false);
    const gamepadThrottleActive = useRef(false);

    // Prevents "Start" button hold from triggering rapid pause/unpause
    const prevStartButton = useRef(true);
    // Prevents race conditions during Pause/Unpause transitions
    const pauseLockout = useRef(0);

    const releaseLockout = useRef(0); // Timestamp to block upstream sync
    const lastSentThrottle = useRef(0); // For deduplicating store updates

    // Track keyboard state (normalized)
    const keys = useRef({
        up: false, down: false, left: false, right: false,
        throttleUp: false, throttleDown: false
    });

    // Sync throttle from store to local ref
    useEffect(() => {
        const isLockedOut = Date.now() < releaseLockout.current;
        if (!gamepadThrottleActive.current && !isLockedOut) {
            throttleRef.current = pilotThrottle;
        }
    }, [pilotThrottle]);

    // Fix: Block pause toggling briefly after unpausing to prevent bounce-back
    useEffect(() => {
        if (!isPaused) {
            pauseLockout.current = Date.now() + 500;
        }
    }, [isPaused]);

    // --- MOUSE & KEYBOARD HANDLERS ---
    useEffect(() => {
        const handleMove = (e: MouseEvent) => {
            if (config.type !== 'mouse_kb' && config.type !== 'mouse_only') return;
            if (isPaused || isLocked.current) return;
            // @ts-ignore
            if (e.sourceCapabilities?.firesTouchEvents) return;

            virtualCursor.current.x += e.movementX * sensitivity;
            virtualCursor.current.y += e.movementY * sensitivity;
            clampCursor();
        };

        const handleWheel = (e: WheelEvent) => {
            if (config.type !== 'mouse_only') return;
            if (isPaused) return;

            const delta = e.deltaY * -0.001;
            let next = throttleRef.current + delta;
            next = Math.max(0, Math.min(1, next));
            throttleRef.current = next;
            setPilotThrottle(pilotId, next);
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            const k = e.key.toLowerCase();
            // Global Pause Shortcut (Space) is handled in App.tsx, but we guard here to prevent conflicts if needed

            // KEYBOARD WASD
            if (config.type === 'keyboard_wasd') {
                if (k === 'w') keys.current.up = true;
                if (k === 's') keys.current.down = true;
                if (k === 'a') keys.current.left = true;
                if (k === 'd') keys.current.right = true;
                if (k === 'f') keys.current.throttleUp = true;
                if (k === 'c') keys.current.throttleDown = true;
            }

            // KEYBOARD ARROWS
            if (config.type === 'keyboard_arrows') {
                if (e.key === 'ArrowUp') keys.current.up = true;
                if (e.key === 'ArrowDown') keys.current.down = true;
                if (e.key === 'ArrowLeft') keys.current.left = true;
                if (e.key === 'ArrowRight') keys.current.right = true;
                if (k === ';') keys.current.throttleUp = true;
                if (k === '/') keys.current.throttleDown = true;
            }

            if (config.type === 'mouse_kb') {
                if (k === 'f') keys.current.throttleUp = true;
                if (k === 'c') keys.current.throttleDown = true;
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            const k = e.key.toLowerCase();

            if (config.type === 'keyboard_wasd') {
                if (k === 'w') keys.current.up = false;
                if (k === 's') keys.current.down = false;
                if (k === 'a') keys.current.left = false;
                if (k === 'd') keys.current.right = false;
                if (k === 'f') keys.current.throttleUp = false;
                if (k === 'c') keys.current.throttleDown = false;
            }

            if (config.type === 'keyboard_arrows') {
                if (e.key === 'ArrowUp') keys.current.up = false;
                if (e.key === 'ArrowDown') keys.current.down = false;
                if (e.key === 'ArrowLeft') keys.current.left = false;
                if (e.key === 'ArrowRight') keys.current.right = false;
                if (k === ';') keys.current.throttleUp = false;
                if (k === '/') keys.current.throttleDown = false;
            }

            if (config.type === 'mouse_kb') {
                if (k === 'f') keys.current.throttleUp = false;
                if (k === 'c') keys.current.throttleDown = false;
            }
        };

        const clampCursor = () => {
            virtualCursor.current.x = MathUtils.clamp(virtualCursor.current.x, -1, 1);
            virtualCursor.current.y = MathUtils.clamp(virtualCursor.current.y, -1, 1);
        };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('wheel', handleWheel);
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('wheel', handleWheel);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [config, isPaused, sensitivity, pilotId, setPilotThrottle]);

    const update = (delta: number, smoothing: number) => {
        const now = Date.now();

        // 1. GAMEPAD LOGIC
        if (config.type === 'gamepad' && config.gamepadIndex >= 0) {
            const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
            const gp = gamepads[config.gamepadIndex];

            if (gp) {
                const startPressed = gp.buttons[9]?.pressed;

                // PAUSE TOGGLE LOGIC - MOVED TO SessionState (Global)
                prevStartButton.current = startPressed || false;

                if (!isPaused) {
                    const axisX = gp.axes[0];
                    const axisY = gp.axes[1];
                    const deadzone = 0.15;

                    if (Math.abs(axisX) > deadzone || Math.abs(axisY) > deadzone) {
                        wasGamepadActive.current = true;
                        virtualCursor.current.x = axisX;
                        virtualCursor.current.y = axisY;
                    } else if (wasGamepadActive.current) {
                        wasGamepadActive.current = false;
                        virtualCursor.current.x = 0;
                        virtualCursor.current.y = 0;
                    }

                    // Throttle (R2)
                    const rt = gp.buttons[7];
                    if (rt) {
                        // Apply deadzone: treat values below threshold as exactly 0
                        const throttleValue = rt.value > 0.9 ? rt.value : 0;

                        if (throttleValue > 0) {
                            gamepadThrottleActive.current = true;
                            throttleRef.current = throttleValue;
                            if (Math.abs(throttleRef.current - lastSentThrottle.current) > 0.01) {
                                setPilotThrottle(pilotId, throttleRef.current);
                                lastSentThrottle.current = throttleRef.current;
                            }
                        }
                        else if (gamepadThrottleActive.current) {
                            gamepadThrottleActive.current = false;
                            throttleRef.current = 0;
                            setPilotThrottle(pilotId, 0);
                            lastSentThrottle.current = 0;
                            releaseLockout.current = now + 500;
                        }
                    }
                }
            }
        }

        if (isPaused) return;

        // 2. TOUCH LOGIC
        if (config.type === 'touch') {
            const joystickState = useStore.getState().joysticks[pilotId] || { x: 0, y: 0, active: false };
            if (joystickState.active) {
                wasJoystickActive.current = true;
                virtualCursor.current.x = joystickState.x;
                virtualCursor.current.y = joystickState.y;
            } else if (wasJoystickActive.current) {
                virtualCursor.current.x = 0;
                virtualCursor.current.y = 0;
                wasJoystickActive.current = false;
            }
        }

        // 3. KEYBOARD FLIGHT LOGIC
        if ((config.type === 'keyboard_wasd' || config.type === 'keyboard_arrows') && !wasGamepadActive.current) {
            if (keys.current.left) virtualCursor.current.x -= delta * 1.5;
            if (keys.current.right) virtualCursor.current.x += delta * 1.5;

            if (keys.current.up) virtualCursor.current.y -= delta * 1.5;
            if (keys.current.down) virtualCursor.current.y += delta * 1.5;

            // Auto center
            if (!keys.current.left && !keys.current.right) {
                virtualCursor.current.x = MathUtils.damp(virtualCursor.current.x, 0, 2.0, delta);
            }
            if (!keys.current.up && !keys.current.down) {
                virtualCursor.current.y = MathUtils.damp(virtualCursor.current.y, 0, 2.0, delta);
            }

            virtualCursor.current.x = MathUtils.clamp(virtualCursor.current.x, -1, 1);
            virtualCursor.current.y = MathUtils.clamp(virtualCursor.current.y, -1, 1);
        }

        // 4. KEYBOARD THROTTLE LOGIC
        if (config.type !== 'mouse_only' && !gamepadThrottleActive.current && (keys.current.throttleUp || keys.current.throttleDown)) {
            const rate = 0.5;
            let next = throttleRef.current;
            if (keys.current.throttleUp) next += rate * delta;
            if (keys.current.throttleDown) next -= rate * delta;

            next = MathUtils.clamp(next, 0, 1);
            if (Math.abs(next - pilotThrottle) > 0.001) {
                setPilotThrottle(pilotId, next);
            }
            throttleRef.current = next;
        }

        const rawX = virtualCursor.current.x;
        const rawY = virtualCursor.current.y;
        const targetX = Math.abs(rawX) < 0.05 ? 0 : rawX;
        const targetY = Math.abs(rawY) < 0.05 ? 0 : rawY;

        input.current.x = MathUtils.damp(input.current.x, targetX, smoothing, delta);
        input.current.y = MathUtils.damp(input.current.y, targetY, smoothing, delta);
    };

    const setLocked = (locked: boolean) => { isLocked.current = locked; };
    const resetInput = () => {
        virtualCursor.current.x = 0; virtualCursor.current.y = 0;
        input.current.x = 0; input.current.y = 0;
        throttleRef.current = 0;
        setPilotThrottle(pilotId, 0);
        gamepadThrottleActive.current = false;
    };

    return { input, virtualCursor, throttleRef, update, setLocked, resetInput };
};
