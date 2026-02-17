import React from 'react';
import { useStore } from '../../../../store/useStore';

export const NetworkStatus: React.FC = () => {
    const isOnline = useStore((state) => state.isOnline);

    return (
        <div className="flex items-center gap-2 px-3 md:px-4 h-full text-[10px] md:text-xs font-mono uppercase text-slate-400">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'bg-slate-700'}`} />
            <span className="hidden sm:inline">NET</span>
        </div>
    );
};
