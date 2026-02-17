import React from 'react';
import { useStore } from '../../../../store/useStore';

export const SquadStatus: React.FC = () => {
    const localParty = useStore((state) => state.localParty);

    return (
        <div className="flex items-center gap-1.5 px-3 md:px-4 h-full" title="Squad Status">
            {Array.from({ length: 4 }).map((_, i) => {
                const pilot = localParty.find(p => p.id === i);
                let colorClass = 'bg-slate-700';
                let glowClass = '';

                if (pilot) {
                    if (pilot.ui.status === 'ready') {
                        colorClass = 'bg-green-500';
                        glowClass = 'shadow-[0_0_8px_rgba(34,197,94,0.8)]';
                    } else {
                        colorClass = 'bg-blue-500';
                        glowClass = 'shadow-[0_0_8px_rgba(59,130,246,0.8)]';
                    }
                }

                return (
                    <div
                        key={i}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${colorClass} ${glowClass}`}
                    />
                );
            })}
        </div>
    );
};
