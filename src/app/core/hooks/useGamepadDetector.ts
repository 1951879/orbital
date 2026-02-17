import { useState, useEffect } from 'react';
import { useSessionStore } from '@/src/engine/session/SessionState';

export type GamepadType = 'xbox' | 'playstation' | 'generic';

/**
 * Detects gamepad type.
 * @param targetIndex If provided, checks SPECIFIC gamepad index. If undefined, checks Party Leader (Player 0) or fallback.
 */
export const useGamepadDetector = (targetIndex?: number): GamepadType | null => {
    const [gamepadType, setGamepadType] = useState<GamepadType | null>(null);

    // Subscribe to session store to know when players join/leave (for Leader detection)
    const sessionPlayers = useSessionStore(state => state.players);

    useEffect(() => {
        const getGamepads = () => navigator.getGamepads ? navigator.getGamepads() : [];

        const check = () => {
            const gps = getGamepads();
            let foundType: GamepadType | null = null;
            let gamepadToInspect: Gamepad | null = null;

            if (targetIndex !== undefined) {
                // 1. SPECIFIC MODE: Check specific slot (e.g. Player 2's controller)
                if (targetIndex >= 0) {
                    gamepadToInspect = gps[targetIndex];
                }
            } else {
                // 2. GLOBAL MODE: prioritize Party Leader (Player 0)
                const leader = sessionPlayers.find(p => p.id === 0);
                if (leader && leader.deviceId.startsWith('gamepad:')) {
                    const idx = parseInt(leader.deviceId.split(':')[1]);
                    if (!isNaN(idx)) {
                        gamepadToInspect = gps[idx];
                    }
                }

                // 3. FALLBACK: If no leader or leader not on gamepad, find FIRST connected gamepad
                if (!gamepadToInspect) {
                    for (const gp of gps) {
                        if (gp && gp.connected) {
                            gamepadToInspect = gp;
                            break; // Use first found
                        }
                    }
                }
            }

            // Analyze the identified gamepad
            if (gamepadToInspect && gamepadToInspect.connected) {
                const id = gamepadToInspect.id.toLowerCase();
                if (id.includes('dualshock') || id.includes('dualsense') || id.includes('playstation') || id.includes('sony')) {
                    foundType = 'playstation';
                } else {
                    foundType = 'xbox'; // Default to Xbox/Generic
                }
            }

            setGamepadType(foundType);
        };

        // Initial check
        check();

        // Events
        const onConnect = () => check();
        const onDisconnect = () => check();
        window.addEventListener('gamepadconnected', onConnect);
        window.addEventListener('gamepaddisconnected', onDisconnect);

        // Polling
        const interval = setInterval(check, 1000);

        return () => {
            window.removeEventListener('gamepadconnected', onConnect);
            window.removeEventListener('gamepaddisconnected', onDisconnect);
            clearInterval(interval);
        };
    }, [targetIndex, sessionPlayers]); // Re-run if session players change (e.g. P1 leaves)

    return gamepadType;
};
