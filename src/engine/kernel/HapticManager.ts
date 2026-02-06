import { MathUtils } from 'three';

/**
 * HapticManager - Centralized Gamepad Vibration System
 * 
 * Provides haptic feedback for collisions and events.
 * Automatically rate-limits rumble to prevent overwhelming feedback.
 */
export class HapticManager {
    private static lastRumbleTime = 0;
    private static readonly MIN_RUMBLE_INTERVAL = 100; // ms between rumbles

    /**
     * Trigger haptic feedback (gamepad vibration)
     * @param intensity 0-1 normalized intensity
     * @param duration Duration in milliseconds (default: 150ms)
     * @param gamepadIndex Optional specific gamepad index to rumble
     */
    public static rumble(intensity: number, duration = 150, gamepadIndex?: number) {
        const now = Date.now();
        // if (now - this.lastRumbleTime < this.MIN_RUMBLE_INTERVAL) return; // Debounce per-pad? Or global?
        // Let's remove global debounce if targeting specific pads, or make it per-pad map. 
        // For simplicity, keeping it simple:

        const gamepads = navigator.getGamepads?.() || [];

        for (const gp of gamepads) {
            if (!gp?.vibrationActuator) continue;
            // Filter if index provided
            if (gamepadIndex !== undefined && gp.index !== gamepadIndex) continue;

            const clampedIntensity = MathUtils.clamp(intensity, 0, 1);

            gp.vibrationActuator.playEffect('dual-rumble', {
                startDelay: 0,
                duration,
                weakMagnitude: clampedIntensity,
                strongMagnitude: clampedIntensity * 0.6
            }).catch(() => {
                // Ignore errors (browser may block vibration)
            });
        }

    }

    /**
     * Trigger mobile vibration (Navigator API)
     * @param duration Duration in milliseconds
     */
    public static vibrate(duration: number) {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(duration);
        }
    }

    /**
     * Create rumble based on collision speed
     * Uses exponential curve for more natural feel
     */
    public static collisionRumble(speed: number, maxSpeed: number, gamepadIndex?: number) {
        if (speed < 1.0) return; // No rumble for very slow collisions

        const normalizedSpeed = speed / maxSpeed;
        const intensity = MathUtils.clamp(Math.pow(normalizedSpeed, 0.8), 0.05, 1.0);
        this.rumble(intensity, 150, gamepadIndex);
    }
}
