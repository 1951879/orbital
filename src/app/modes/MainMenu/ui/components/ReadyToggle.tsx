import React from 'react';
import { GamepadButton } from '@/src/app/core/ui/GamepadIcons';
import { useSlotHints } from '../../hooks/useInputHints';

interface ReadyToggleProps {
    isReady: boolean;
    hints: ReturnType<typeof useSlotHints>;
    onClick: () => void;
    className?: string;
}

export const ReadyToggle: React.FC<ReadyToggleProps> = ({ isReady, hints, onClick, className = '' }) => {
    return (
        <div
            className={`flex items-center gap-2 cursor-pointer group select-none ${className}`}
            onClick={(e) => { e.stopPropagation(); onClick(); }}
        >
            {/* Label Container - Fixed width to match largest content (ENTER key) and right aligned */}
            <div className={`flex items-center justify-end gap-1.5 min-w-[55px] text-[10px] font-bold uppercase tracking-widest transition-colors ${isReady ? 'text-green-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
                {hints.showGamepad ? (
                    <GamepadButton type={hints.gamepadType} button="X" />
                ) : hints.showKeyboard ? (
                    <span className="h-4 min-w-[16px] px-1 border border-current rounded flex items-center justify-center text-[9px]">
                        {hints.keyboardReadyKey || 'R'}
                    </span>
                ) : null}
                READY
            </div>

            {/* Checkbox */}
            <div className={`w-4 h-4 border rounded flex items-center justify-center transition-all ${isReady ? 'bg-green-500 border-green-500 text-black' : 'border-slate-600 group-hover:border-slate-400 bg-transparent'}`}>
                {isReady && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                        <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                    </svg>
                )}
            </div>
        </div>
    );
};
