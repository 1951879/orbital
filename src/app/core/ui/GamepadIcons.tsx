import React from 'react';

const baseClass = "inline-flex items-center justify-center shadow-sm font-black select-none pointer-events-none align-middle";
const roundClass = "w-4 h-4 rounded-full text-[9px] border";
const pillClass = "h-4 px-1.5 rounded-full text-[8px] border";
const triggerClass = "h-4 px-1.5 rounded text-[8px] border";

// A (Green)
export const AIcon = ({ className = "" }: { className?: string }) => (
    <div className={`${baseClass} ${roundClass} bg-green-500 border-green-600 text-black ${className}`}>A</div>
);

// B (Red)
export const BIcon = ({ className = "" }: { className?: string }) => (
    <div className={`${baseClass} ${roundClass} bg-red-500 border-red-600 text-white ${className}`}>B</div>
);

// X (Blue)
export const XIcon = ({ className = "" }: { className?: string }) => (
    <div className={`${baseClass} ${roundClass} bg-blue-500 border-blue-600 text-white ${className}`}>X</div>
);

// Y (Yellow)
export const YIcon = ({ className = "" }: { className?: string }) => (
    <div className={`${baseClass} ${roundClass} bg-yellow-400 border-yellow-600 text-black ${className}`}>Y</div>
);

// Start / Select
export const StartIcon = ({ className = "" }: { className?: string }) => (
    <div className={`${baseClass} ${pillClass} bg-slate-700 border-slate-500 text-white ${className}`}>START</div>
);

export const SelectIcon = ({ className = "" }: { className?: string }) => (
    <div className={`${baseClass} w-5 h-5 rounded-full text-[9px] border bg-slate-700 border-slate-500 text-white flex items-center justify-center ${className}`}>
        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="5" width="6" height="6" rx="1" />
            <path d="M2 5V4a1 1 0 0 1 1-1h6" />
        </svg>
    </div>
);

// Bumpers (LB/RB)
export const LbIcon = ({ className = "" }: { className?: string }) => (
    <div className={`${baseClass} w-8 h-5 rounded-full text-xs border border-white/20 bg-slate-800 text-white ${className}`}>LB</div>
);

export const RbIcon = ({ className = "" }: { className?: string }) => (
    <div className={`${baseClass} w-8 h-5 rounded-full text-xs border border-white/20 bg-slate-800 text-white ${className}`}>RB</div>
);

// Triggers (LT/RT)
export const LtIcon = ({ className = "" }: { className?: string }) => (
    <div className={`${baseClass} w-8 h-5 rounded-md text-xs border border-white/20 bg-slate-800 text-white ${className}`}>LT</div>
);

export const RtIcon = ({ className = "" }: { className?: string }) => (
    <div className={`${baseClass} w-8 h-5 rounded-md text-xs border border-white/20 bg-slate-800 text-white ${className}`}>RT</div>
);

// D-Pad
export const DPadUpIcon = ({ className = "" }: { className?: string }) => (
    <div className={`${baseClass} w-4 h-4 bg-slate-800 border-slate-600 text-white rounded-[2px] ${className}`}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    </div>
);

export const DPadDownIcon = ({ className = "" }: { className?: string }) => (
    <div className={`${baseClass} w-4 h-4 bg-slate-800 border-slate-600 text-white rounded-[2px] ${className}`}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M12 5v14M19 12l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    </div>
);

export const DPadLeftIcon = ({ className = "" }: { className?: string }) => (
    <div className={`${baseClass} w-4 h-4 bg-slate-800 border-slate-600 text-white rounded-[2px] ${className}`}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    </div>
);

export const DPadRightIcon = ({ className = "" }: { className?: string }) => (
    <div className={`${baseClass} w-4 h-4 bg-slate-800 border-slate-600 text-white rounded-[2px] ${className}`}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    </div>
);
// PlayStation Face Buttons
export const CrossIcon = ({ className = "" }: { className?: string }) => (
    <div className={`${baseClass} ${roundClass} bg-blue-600 border-blue-400 text-white ${className}`}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={4} stroke="currentColor" className="w-2.5 h-2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
    </div>
);

export const CircleIcon = ({ className = "" }: { className?: string }) => (
    <div className={`${baseClass} ${roundClass} bg-red-600 border-red-400 text-white ${className}`}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={4} stroke="currentColor" className="w-2.5 h-2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
        </svg>
    </div>
);

export const SquareIcon = ({ className = "" }: { className?: string }) => (
    <div className={`${baseClass} ${roundClass} bg-pink-500 border-pink-300 text-white ${className}`}>
        <rect x="7" y="7" width="10" height="10" stroke="currentColor" strokeWidth="4" fill="none" />
    </div>
);

export const TriangleIcon = ({ className = "" }: { className?: string }) => (
    <div className={`${baseClass} ${roundClass} bg-green-500 border-green-300 text-white ${className}`}>
        <path d="M12 6L6 18H18L12 6Z" stroke="currentColor" strokeWidth="4" fill="none" transform="scale(0.8) translate(3,3)" />
    </div>
);

// PlayStation Bumpers/Triggers
export const L1Icon = ({ className = "" }: { className?: string }) => (
    <div className={`${baseClass} w-8 h-5 rounded-full text-xs border border-white/20 bg-slate-800 text-white ${className}`}>L1</div>
);
export const R1Icon = ({ className = "" }: { className?: string }) => (
    <div className={`${baseClass} w-8 h-5 rounded-full text-xs border border-white/20 bg-slate-800 text-white ${className}`}>R1</div>
);
export const L2Icon = ({ className = "" }: { className?: string }) => (
    <div className={`${baseClass} w-8 h-5 rounded-md text-xs border border-white/20 bg-slate-800 text-white ${className}`}>L2</div>
);
export const R2Icon = ({ className = "" }: { className?: string }) => (
    <div className={`${baseClass} w-8 h-5 rounded-md text-xs border border-white/20 bg-slate-800 text-white ${className}`}>R2</div>
);


// --- SMART COMPONENT ---
import { GamepadType } from './useGamepadDetector';

interface GamepadButtonProps {
    type: GamepadType | null;
    button: 'A' | 'B' | 'X' | 'Y' | 'LB' | 'RB' | 'LT' | 'RT' | 'Start' | 'Select' | 'DPadUp' | 'DPadDown' | 'DPadLeft' | 'DPadRight';
    className?: string;
}

export const GamepadButton: React.FC<GamepadButtonProps> = ({ type, button, className }) => {
    // Default to Xbox if generic or null (though caller usually checks null)
    const isPs = type === 'playstation';

    switch (button) {
        case 'A': return isPs ? <CrossIcon className={className} /> : <AIcon className={className} />;
        case 'B': return isPs ? <CircleIcon className={className} /> : <BIcon className={className} />;
        case 'X': return isPs ? <SquareIcon className={className} /> : <XIcon className={className} />;
        case 'Y': return isPs ? <TriangleIcon className={className} /> : <YIcon className={className} />;
        case 'LB': return isPs ? <L1Icon className={className} /> : <LbIcon className={className} />;
        case 'RB': return isPs ? <R1Icon className={className} /> : <RbIcon className={className} />;
        case 'LT': return isPs ? <L2Icon className={className} /> : <LtIcon className={className} />;
        case 'RT': return isPs ? <R2Icon className={className} /> : <RtIcon className={className} />;
        case 'Start': return isPs ? <StartIcon className={className} /> : <StartIcon className={className} />; // TODO: Options icon for PS
        case 'Select': return isPs ? <SelectIcon className={className} /> : <SelectIcon className={className} />; // TODO: Share icon for PS
        case 'DPadUp': return <DPadUpIcon className={className} />;
        case 'DPadDown': return <DPadDownIcon className={className} />;
        case 'DPadLeft': return <DPadLeftIcon className={className} />;
        case 'DPadRight': return <DPadRightIcon className={className} />;
        default: return null;
    }
};
