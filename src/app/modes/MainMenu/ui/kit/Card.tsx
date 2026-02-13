import React from 'react';

interface CardProps {
    children: React.ReactNode;
    title?: string;
    className?: string;
    noPadding?: boolean;
    variant?: 'default' | 'dark' | 'glass';
    focused?: boolean;
}

export const Card: React.FC<CardProps> = ({
    children,
    title,
    className = '',
    noPadding = false,
    variant = 'default',
    focused = false
}) => {
    const baseStyle = "border rounded-xl backdrop-blur-xl relative overflow-hidden transition-all duration-200";

    const variants = {
        default: "bg-slate-900/60 border-white/10 shadow-2xl",
        dark: "bg-black/80 border-slate-800 shadow-xl",
        glass: "bg-white/5 border-white/5 shadow-lg",
    };

    const focusStyle = focused
        ? 'border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.1)]'
        : '';

    return (
        <div className={`${baseStyle} ${variants[variant]} ${focusStyle} ${className}`}>
            {title && (
                <div className="px-3 py-1.5 border-b border-white/5 bg-black/20 text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center">
                    {title}
                </div>
            )}
            <div className={noPadding ? '' : 'p-4'}>
                {children}
            </div>
        </div>
    );
};
