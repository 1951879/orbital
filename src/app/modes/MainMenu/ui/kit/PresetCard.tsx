import React from 'react';

interface PresetCardProps {
    name: string;
    desc: string;
    badge?: string;
    active?: boolean;
    focused?: boolean;
    onClick?: () => void;
    className?: string;
}

export const PresetCard: React.FC<PresetCardProps> = ({
    name,
    desc,
    badge,
    active = false,
    focused = false,
    onClick,
    className = '',
}) => {
    return (
        <button
            onClick={onClick}
            className={`relative p-3 rounded-lg border transition-all duration-200 flex flex-col justify-between text-left overflow-hidden w-full ${focused
                ? 'border-blue-500/70 bg-blue-600/10 shadow-[0_0_12px_rgba(59,130,246,0.15)]'
                : active
                    ? 'bg-blue-500/10 border-blue-500/50'
                    : 'bg-slate-900/40 border-slate-700/50 hover:bg-slate-800/60 hover:border-slate-600'
                } ${className}`}
        >
            {active && <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent pointer-events-none" />}
            <div className="flex justify-between items-start relative">
                <span className={`text-xs font-bold uppercase ${active ? 'text-white' : 'text-slate-300'}`}>
                    {name}
                </span>
                {badge && (
                    <span className="text-[8px] font-mono text-blue-400 bg-blue-900/30 px-1.5 py-0.5 rounded">
                        {badge}
                    </span>
                )}
            </div>
            <p className="text-[9px] text-slate-500 leading-tight mt-1 relative">
                {desc}
            </p>
        </button>
    );
};
