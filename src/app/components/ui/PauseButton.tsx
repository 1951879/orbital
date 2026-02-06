import React from 'react';
import { useStore } from '../../store/useStore';

export const PauseButton: React.FC = () => {
    const isPaused = useStore((state) => state.isPaused);
    const setIsPaused = useStore((state) => state.setIsPaused);
    const playerCount = useStore((state) => state.localParty.length);

    if (isPaused) return null;

    // Positioning Logic
    // If single player: Top Right
    // If split screen (2+ players): Center
    const positionClass = playerCount > 1
        ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
        : 'top-6 right-6';

    return (
        <button
            onClick={() => setIsPaused(true)}
            className={`
                absolute ${positionClass} z-50 pointer-events-auto
                w-10 h-10 rounded-full bg-slate-900/50 backdrop-blur-md 
                border border-white/20 hover:bg-slate-800/80 hover:border-white/50 
                flex items-center justify-center text-white/70 hover:text-white 
                transition-all duration-200 group
            `}
            title="Pause Game"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
            </svg>
        </button>
    );
};
