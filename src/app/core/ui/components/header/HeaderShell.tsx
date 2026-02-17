import React from 'react';

export const HeaderShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="h-14 md:h-16 bg-slate-950/80 backdrop-blur-md border-b border-white/10 flex items-center z-50 shrink-0 shadow-2xl relative">
            {children}
        </div>
    );
};
