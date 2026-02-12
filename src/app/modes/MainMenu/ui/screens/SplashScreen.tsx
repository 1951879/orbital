import React, { useEffect } from 'react';
import { useMainMenuStore } from '../../MainMenuStore';
import { useStore } from '../../../../store/useStore';

export const SplashScreen: React.FC = () => {
    const setScreen = useMainMenuStore(state => state.setScreen);
    const addPilot = useStore(state => state.addPilot);
    const localParty = useStore(state => state.localParty);

    // Simple Input Listener for "Start"
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Enter' || e.code === 'Space') {
                handleStart();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        // Poll Gamepads for Start Button (Index 9 on standard)
        const interval = setInterval(() => {
            const gps = navigator.getGamepads();
            for (const gp of gps) {
                if (gp && gp.buttons[9]?.pressed) {
                    handleStart();
                }
            }
        }, 100);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            clearInterval(interval);
        };
    }, []);

    const handleStart = () => {
        // If no pilots, add host automatically
        if (localParty.length === 0) {
            // Default P1
            addPilot(0, 'keyboard_wasd');
        }
        setScreen('hub');
    };

    return (
        <div
            className="w-full h-full flex flex-col items-center justify-center animate-in fade-in duration-1000 cursor-pointer"
            onClick={handleStart}
        >
            <h1 className="text-6xl md:text-8xl font-black text-white italic tracking-tighter uppercase drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                ORBITAL
            </h1>
            <p className="text-blue-400 font-mono tracking-[0.5em] text-sm md:text-base mt-4 uppercase animate-pulse">
                Click / Tap / Press Start
            </p>
        </div>
    );
};
