import React from 'react';

interface PageLayoutProps {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
    actions?: React.ReactNode;
    className?: string;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
    children,
    title,
    subtitle,
    actions,
    className = ''
}) => {
    return (
        <div className={`w-full h-full flex flex-col p-4 md:p-8 animate-in fade-in zoom-in-95 duration-300 ${className}`}>
            {/* Header Area */}
            {(title || actions) && (
                <div className="flex justify-between items-end mb-6 shrink-0 relative z-10">
                    <div>
                        {title && <h1 className="text-3xl md:text-5xl font-black text-white italic uppercase drop-shadow-lg tracking-tighter">{title}</h1>}
                        {subtitle && <p className="text-slate-400 text-sm md:text-base mt-1 font-mono uppercase">{subtitle}</p>}
                    </div>
                    {actions && <div className="flex gap-2">{actions}</div>}
                </div>
            )}

            {/* Content Area */}
            <div className="flex-1 min-h-0 relative z-10 w-full">
                {children}
            </div>
        </div>
    );
};
