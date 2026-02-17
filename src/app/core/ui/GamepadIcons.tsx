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
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {/* Back Square (extended vertical line and properly spaced) */}
            <path d="M4 12 V5 a1 1 0 0 1 1-1 h10 v3" />
            {/* Front Square (smaller 10x10 and shifted) */}
            <rect x="9" y="9" width="10" height="10" rx="1.5" />
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

// Xbox D-Pad (Dish + Thick Cross)
const XboxDPad = ({ active = 'none', className = "" }: { active?: 'up' | 'down' | 'left' | 'right' | 'none', className?: string }) => (
    <div className={`${baseClass} w-5 h-5 text-white ${className}`}>
        <svg viewBox="0 0 24 24" fill="none">
            {/* Dish Background */}
            <circle cx="12" cy="12" r="11" className="fill-slate-800" />

            {/* Base Cross (Inactive) */}
            <path d="M9 3H15V9H21V15H15V21H9V15H3V9H9V3Z" className="fill-slate-600" />

            {/* Active Highlights (Shorter - only the limb) */}
            {active === 'up' && <path d="M9 3H15V10H9V3Z" className="fill-white" />}
            {active === 'down' && <path d="M9 14H15V21H9V14Z" className="fill-white" />}
            {active === 'left' && <path d="M3 9H10V15H3V9Z" className="fill-white" />}
            {active === 'right' && <path d="M14 9H21V15H14V9Z" className="fill-white" />}
        </svg>
    </div>
);

// PlayStation D-Pad (4 Separate Mitered Buttons)
const PlayStationDPad = ({ active = 'none', className = "" }: { active?: 'up' | 'down' | 'left' | 'right' | 'none', className?: string }) => {
    // Geometry: 5-sided polygons meeting at miters with a gap
    // Canvas 24x24. Center 12,12.
    // Gap causes points to retract from center.
    // Up: Top(8,2-16,2), Legs(16,6-8,6), Point(12,10)

    const upPath = "M8 2 H16 L16 6 L12 10 L8 6 Z";
    const downPath = "M8 22 H16 L16 18 L12 14 L8 18 Z";
    const leftPath = "M2 8 V16 L6 16 L10 12 L6 8 Z";
    const rightPath = "M22 8 V16 L18 16 L14 12 L18 8 Z";

    const inactiveClass = "fill-slate-700 stroke-slate-900 stroke-[0.5]";
    const activeClass = "fill-white stroke-slate-900 stroke-[0.5]";

    return (
        <div className={`${baseClass} w-5 h-5 text-white ${className}`}>
            <svg viewBox="0 0 24 24">
                <path d={upPath} className={active === 'up' ? activeClass : inactiveClass} />
                <path d={downPath} className={active === 'down' ? activeClass : inactiveClass} />
                <path d={leftPath} className={active === 'left' ? activeClass : inactiveClass} />
                <path d={rightPath} className={active === 'right' ? activeClass : inactiveClass} />
            </svg>
        </div>
    );
};

export const DPadUpIcon = ({ className = "" }: { className?: string }) => <XboxDPad active="up" className={className} />;
export const DPadDownIcon = ({ className = "" }: { className?: string }) => <XboxDPad active="down" className={className} />;
export const DPadLeftIcon = ({ className = "" }: { className?: string }) => <XboxDPad active="left" className={className} />;
export const DPadRightIcon = ({ className = "" }: { className?: string }) => <XboxDPad active="right" className={className} />;

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
    <div className={`${baseClass} ${roundClass} bg-pink-600 border-pink-400 text-white ${className}`}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={4} stroke="currentColor" className="w-2.5 h-2.5">
            <rect x="4" y="4" width="16" height="16" />
        </svg>
    </div>
);

export const TriangleIcon = ({ className = "" }: { className?: string }) => (
    <div className={`${baseClass} ${roundClass} bg-green-600 border-green-400 text-white ${className}`}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={4} stroke="currentColor" className="w-2.5 h-2.5">
            <path d="M12 4L4 20H20L12 4Z" />
        </svg>
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
import { GamepadType } from '../hooks/useGamepadDetector';

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
        case 'DPadUp': return isPs ? <PlayStationDPad active="up" className={className} /> : <XboxDPad active="up" className={className} />;
        case 'DPadDown': return isPs ? <PlayStationDPad active="down" className={className} /> : <XboxDPad active="down" className={className} />;
        case 'DPadLeft': return isPs ? <PlayStationDPad active="left" className={className} /> : <XboxDPad active="left" className={className} />;
        case 'DPadRight': return isPs ? <PlayStationDPad active="right" className={className} /> : <XboxDPad active="right" className={className} />;
        default: return null;
    }
};
