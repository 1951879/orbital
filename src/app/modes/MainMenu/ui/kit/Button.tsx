import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    icon?: React.ReactNode;
    fullWidth?: boolean;
    isActive?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    icon,
    fullWidth = false,
    isActive = false,
    className = '',
    ...props
}) => {
    const baseStyles = "relative font-bold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 border disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-blue-600 border-blue-400 text-white hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.6)]",
        secondary: "bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700 hover:border-slate-400 shadow-lg",
        danger: "bg-red-900/80 border-red-500 text-red-100 hover:bg-red-800 hover:border-red-400 shadow-[0_0_10px_rgba(239,68,68,0.3)]",
        ghost: "bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-white/5",
    };

    const activeStyles = isActive ? "ring-2 ring-white/50 scale-[1.02]" : "";

    const sizes = {
        sm: "text-[10px] px-3 py-1 rounded",
        md: "text-xs px-4 py-2 rounded-md",
        lg: "text-sm px-6 py-3 rounded-lg",
        xl: "text-base px-8 py-4 rounded-xl",
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${activeStyles} ${className}`}
            {...props}
        >
            {icon && <span className="shrink-0">{icon}</span>}
            {children}
        </button>
    );
};
