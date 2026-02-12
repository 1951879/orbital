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
    <div className={`${baseClass} w-6 h-4 rounded-full text-[8px] border bg-slate-700 border-slate-500 text-white ${className}`}>LB</div>
);

export const RbIcon = ({ className = "" }: { className?: string }) => (
    <div className={`${baseClass} w-6 h-4 rounded-full text-[8px] border bg-slate-700 border-slate-500 text-white ${className}`}>RB</div>
);

// Triggers (LT/RT)
export const LtIcon = ({ className = "" }: { className?: string }) => (
    <div className={`${baseClass} ${triggerClass} bg-slate-700 border-slate-500 text-white ${className}`}>LT</div>
);

export const RtIcon = ({ className = "" }: { className?: string }) => (
    <div className={`${baseClass} ${triggerClass} bg-slate-700 border-slate-500 text-white ${className}`}>RT</div>
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
