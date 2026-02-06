
import React from 'react';
import { useStore } from '../../../store/useStore';

export const ArchitectureOverlay: React.FC = () => {
    const isPaused = useStore((state) => state.isPaused);
    const activeMenuTab = useStore((state) => state.activeMenuTab);

    return (
        <div className="absolute top-4 left-4 text-white font-mono bg-black/50 p-4 rounded z-50 pointer-events-none">
            <h1 className="font-bold text-lg mb-2">Architecture V2</h1>
            <p>Layer 1: Kernel (Active)</p>
            <p>Layer 2: Sim (Active)</p>
            <p>Layer 3: Render (Active)</p>
            <p className="mt-2 text-green-400">Control: Space to Start/Pause</p>
            <p className="text-xs text-gray-400">State: {isPaused ? (activeMenuTab === 'hangar' ? "LOBBY (Hangar)" : "LOBBY (Orbit)") : "FLIGHT (Running)"}</p>
        </div>
    );
};
