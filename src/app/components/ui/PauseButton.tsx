import React from 'react';

interface PauseButtonProps {
    onClick: () => void;
    className?: string;
}

export const PauseButton: React.FC<PauseButtonProps> = ({ onClick, className }) => {
    return (
        <button
            onClick={onClick}
            className={`
                w-10 h-10 rounded-full bg-slate-900/50 backdrop-blur-md 
                border border-white/20 hover:bg-slate-800/80 hover:border-white/50 
                flex items-center justify-center text-white/70 hover:text-white 
                transition-all duration-200 group pointer-events-auto
                ${className || ''}
            `}
            title="Pause Game"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
            </svg>
        </button>
    );
};
