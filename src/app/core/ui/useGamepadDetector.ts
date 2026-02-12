import { useState, useEffect } from 'react';

/**
 * Detects if a gamepad is currently connected/active.
 * Used to conditionally render UI hints.
 */
export const useGamepadDetector = () => {
    const [hasGamepad, setHasGamepad] = useState(false);

    useEffect(() => {
        const check = () => {
            const gps = navigator.getGamepads ? navigator.getGamepads() : [];
            let count = 0;
            for (const gp of gps) if (gp) count++;
            setHasGamepad(count > 0);
        };

        // Initial check
        check();

        // 1. Listen for connection events (efficient)
        const onConnect = () => check();
        const onDisconnect = () => check();
        window.addEventListener('gamepadconnected', onConnect);
        window.addEventListener('gamepaddisconnected', onDisconnect);

        // 2. Fallback polling (robust)
        const interval = setInterval(check, 1000);

        return () => {
            window.removeEventListener('gamepadconnected', onConnect);
            window.removeEventListener('gamepaddisconnected', onDisconnect);
            clearInterval(interval);
        };
    }, []);

    return hasGamepad;
};
