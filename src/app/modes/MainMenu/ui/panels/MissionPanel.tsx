import React from 'react';
import { useMainMenuStore } from '../../MainMenuStore';

interface MissionPanelProps {
    focusedItem: number;
    showFocus: boolean;
}

export const MissionPanel: React.FC<MissionPanelProps> = ({ focusedItem, showFocus }) => {
    const selectedMode = useMainMenuStore(state => state.selectedModeFilter);
    const modeName = selectedMode === 'free_flight' ? 'Free Flight' : 'Free Flight';

    return (
        <div className="flex flex-col h-full p-3 gap-3">
            <div className="space-y-2 flex-1">
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Sortie Type</span>
                    <span className="text-xs font-bold text-white uppercase tracking-wider">{modeName}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Objectives</span>
                    <span className="text-[10px] font-mono text-slate-400">None — Free Ops</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Rules of Engagement</span>
                    <span className="text-[10px] font-mono text-slate-400">Unrestricted</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Time Limit</span>
                    <span className="text-[10px] font-mono text-slate-400">Unlimited</span>
                </div>
            </div>
        </div>
    );
};
