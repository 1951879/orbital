import React from 'react';

interface CardProps {
    children: React.ReactNode;
    title?: string;
    className?: string;
    noPadding?: boolean;
    variant?: 'default' | 'dark' | 'glass';
}

export const Card: React.FC<CardProps> = ({
    children,
    title,
    className = '',
    noPadding = false,
    variant = 'default'
}) => {
    const baseStyle = "border rounded-xl backdrop-blur-xl relative overflow-hidden transition-all duration-300";

    const variants = {
        default: "bg-slate-900/60 border-white/10 shadow-2xl",
        dark: "bg-black/80 border-slate-800 shadow-xl",
        glass: "bg-white/5 border-white/5 shadow-lg",
    };

    return (
        <div className={`${baseStyle} ${variants[variant]} ${className}`}>
            {title && (
                <div className="px-4 py-2 border-b border-white/5 bg-black/20 text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center">
                    {title}
                </div>
            )}
            <div className={noPadding ? '' : 'p-4'}>
                {children}
            </div>
        </div>
    );
};
