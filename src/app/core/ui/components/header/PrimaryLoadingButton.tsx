import React from 'react';

export type LaunchState = 'not-ready' | 'waiting-host' | 'ready';

interface PrimaryLoadingButtonProps {
    onClick: () => void;
    label?: string;
    state?: LaunchState;
    disabled?: boolean;
    hint?: React.ReactNode;
}

export const PrimaryLoadingButton: React.FC<PrimaryLoadingButtonProps> = ({
    onClick,
    label = 'LAUNCH',
    state = 'ready',
    disabled = false,
    hint,
}) => {
    const styles: Record<LaunchState, string> = {
        'not-ready': 'bg-slate-800/80 text-slate-600 border-slate-700 cursor-not-allowed',
        // "waiting-host": Active blue, but faded (50% opacity) and not clickable
        'waiting-host': 'bg-gradient-to-r from-blue-600 to-blue-500 text-white border-blue-400/50 opacity-35 cursor-not-allowed',
        'ready': 'bg-gradient-to-r from-blue-600 to-blue-500 text-white border-blue-400/50 hover:from-blue-500 hover:to-blue-400 hover:shadow-[0_0_25px_rgba(59,130,246,0.3)] active:scale-[0.97] cursor-pointer',
    };

    const activeStyle = disabled ? styles['not-ready'] : styles[state];

    return (
        <button
            onClick={onClick}
            disabled={disabled || state !== 'ready'}
            className={`h-full px-4 md:px-6 font-black text-[10px] md:text-xs uppercase tracking-[0.15em] border-0 border-l border-white/10 transition-all duration-200 flex items-center gap-3 ${activeStyle}`}
        >
            {hint}
            {label}
        </button>
    );
};
