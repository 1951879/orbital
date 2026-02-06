
import React from 'react';

const baseClass = "inline-flex items-center justify-center shadow-sm font-black select-none pointer-events-none align-middle";
const roundClass = "w-4 h-4 rounded-full text-[9px] border";
const pillClass = "h-4 px-1.5 rounded-full text-[8px] border";

export const AIcon = ({ className = "" }: { className?: string }) => (
    <div className={`${baseClass} ${roundClass} bg-green-500 border-green-600 text-black ${className}`}>A</div>
);

export const BIcon = ({ className = "" }: { className?: string }) => (
    <div className={`${baseClass} ${roundClass} bg-red-500 border-red-600 text-white ${className}`}>B</div>
);

export const XIcon = ({ className = "" }: { className?: string }) => (
    <div className={`${baseClass} ${roundClass} bg-blue-500 border-blue-600 text-white ${className}`}>X</div>
);

export const YIcon = ({ className = "" }: { className?: string }) => (
    <div className={`${baseClass} ${roundClass} bg-yellow-400 border-yellow-600 text-black ${className}`}>Y</div>
);

export const StartIcon = ({ className = "" }: { className?: string }) => (
    <div className={`${baseClass} ${pillClass} bg-slate-700 border-slate-500 text-white ${className}`}>START</div>
);

export const SelectIcon = ({ className = "" }: { className?: string }) => (
    <div className={`${baseClass} w-5 h-5 rounded-full text-[9px] border bg-slate-700 border-slate-500 text-white ${className}`}>
        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="6" y="6" width="7" height="7" rx="1" />
            <path d="M3 10V4a1 1 0 0 1 1-1h6" />
        </svg>
    </div>
);

export const LbIcon = ({ className = "" }: { className?: string }) => (
    <div className={`${baseClass} w-6 h-4 rounded-full text-[8px] border bg-slate-700 border-slate-500 text-white ${className}`}>LB</div>
);

export const RbIcon = ({ className = "" }: { className?: string }) => (
    <div className={`${baseClass} w-6 h-4 rounded-full text-[8px] border bg-slate-700 border-slate-500 text-white ${className}`}>RB</div>
);
