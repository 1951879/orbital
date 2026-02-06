

import React from 'react';
import { XIcon, BIcon, AIcon } from './ButtonIndicators';

export interface ConfigOption {
    label: string;
    value: any;
    color?: string;
}

export interface ConfigItem {
    label: string;
    value: any;
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    formatter?: (val: any) => string;
    
    // New: Options Mode
    options?: ConfigOption[];
}

interface Props {
    title: string;
    items: ConfigItem[];
    focusIndex: number; // 0 to items.length - 1
    canSave: boolean;
    onReset: () => void;
    onCancel: () => void;
    onSave: () => void;
}

export const GameConfigModal: React.FC<Props> = ({ 
    title, 
    items, 
    focusIndex, 
    canSave, 
    onReset, 
    onCancel, 
    onSave 
}) => {
    
    const getSliderRowClass = (idx: number) => `bg-slate-900/50 p-4 rounded-xl border transition-all ${focusIndex === idx ? 'border-yellow-500 ring-1 ring-yellow-500/50 bg-slate-800' : 'border-slate-700'}`;

    return (
        <div className="p-6 max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-right-4 duration-300 h-full flex flex-col pointer-events-auto">
            {/* HEADER */}
            <div className="flex justify-between items-center mb-6 border-b border-yellow-500/30 pb-2 flex-shrink-0">
                <h2 className="text-xl font-black text-yellow-500 uppercase tracking-widest">{title}</h2>
            </div>

            {/* CONFIG ITEMS LIST */}
            <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
                {items.map((item, idx) => {
                    const isFocused = focusIndex === idx;

                    if (item.options) {
                        // --- OPTIONS MODE (Unboxed / Clean Layout) ---
                        return (
                            <div key={idx} className={`transition-all duration-300 py-2 ${isFocused ? 'opacity-100' : 'opacity-40 grayscale-[0.8]'}`}>
                                {/* Section Header */}
                                <div className="flex justify-between items-end mb-3 px-1 border-b border-white/10 pb-1">
                                    <label className={`text-sm font-black uppercase tracking-widest ${isFocused ? 'text-yellow-500' : 'text-slate-500'}`}>
                                        {item.label}
                                    </label>
                                    {isFocused && <span className="text-[10px] text-yellow-500 animate-pulse font-mono">◄ CHANGE ►</span>}
                                </div>
                                
                                {/* Cards Grid */}
                                <div className="flex flex-wrap gap-3">
                                    {item.options.map((opt) => {
                                        const isSelected = item.value === opt.value;
                                        // Ensure we have a valid hex color, fallback to slate
                                        const baseColor = opt.color || '#94a3b8';
                                        
                                        return (
                                            <div 
                                                key={String(opt.value)}
                                                className={`
                                                    relative p-3 rounded-xl border-2 transition-all duration-200 min-w-[120px] flex-1 max-w-[160px] flex flex-col items-center justify-between gap-2
                                                    ${isSelected 
                                                        ? 'shadow-[0_0_20px_rgba(0,0,0,0.4)] scale-105 z-10 bg-slate-800' 
                                                        : 'bg-slate-900/40 border-slate-700/50 opacity-70 grayscale-[0.5] hover:opacity-100'}
                                                `}
                                                style={{
                                                    borderColor: isSelected ? baseColor : undefined,
                                                }}
                                            >
                                                {/* Active Gradient Overlay */}
                                                {isSelected && (
                                                    <div 
                                                        className="absolute inset-0 opacity-10 pointer-events-none rounded-xl" 
                                                        style={{ background: `linear-gradient(135deg, ${baseColor} 0%, transparent 100%)` }}
                                                    />
                                                )}

                                                {/* Header Strip */}
                                                <div 
                                                    className="w-12 h-1 rounded-full mb-1" 
                                                    style={{ backgroundColor: baseColor, boxShadow: isSelected ? `0 0 10px ${baseColor}` : 'none' }} 
                                                />
                                                
                                                <div className={`text-sm font-black uppercase tracking-wider text-center ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                                                    {opt.label}
                                                </div>
                                                
                                                {/* Selection Indicator */}
                                                <div className={`mt-1 text-[9px] font-mono uppercase tracking-widest ${isSelected ? 'text-white/60' : 'text-transparent'}`}>
                                                    {isSelected ? 'SELECTED' : '-'}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    }

                    // --- SLIDER MODE (Boxed Layout) ---
                    return (
                        <div key={idx} className={getSliderRowClass(idx)}>
                            <label className="text-xs font-bold text-slate-400 uppercase block mb-2 flex justify-between">
                                <span>{item.label}</span>
                                {isFocused && <span className="text-[10px] text-yellow-500 animate-pulse">◄ ADJUST ►</span>}
                            </label>
                            
                            <div className="flex items-center gap-4">
                                <div className="relative flex-1 h-2 bg-slate-900 rounded-full border border-slate-700 overflow-hidden">
                                    {/* Track */}
                                    <div 
                                        className="absolute top-0 bottom-0 left-0 bg-yellow-500 transition-all duration-75"
                                        style={{ 
                                            width: `${((item.value - (item.min||0)) / ((item.max||100) - (item.min||0))) * 100}%` 
                                        }}
                                    />
                                    {/* Slider Input (Hidden but functional) */}
                                    <input 
                                        type="range" 
                                        min={item.min} 
                                        max={item.max} 
                                        step={item.step} 
                                        value={typeof item.value === 'number' ? item.value : 0}
                                        readOnly 
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                </div>
                                <span className="text-xl font-mono font-bold text-white w-24 text-right tabular-nums">
                                    {item.formatter ? item.formatter(item.value) : `${item.value}${item.unit || ''}`}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {/* FOOTER BUTTONS */}
            <div className="mt-6 grid grid-cols-3 gap-4 flex-shrink-0 border-t border-white/10 pt-6">
                {/* RESET BUTTON */}
                <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onReset(); }}
                    className="group flex flex-col items-center justify-center p-3 rounded-lg border-2 border-slate-700 bg-slate-800 text-slate-500 uppercase font-black tracking-widest text-xs transition-all hover:bg-slate-700 hover:border-slate-600 hover:text-slate-300"
                >
                    <div className="flex items-center gap-2 mb-1">
                        <XIcon /> 
                    </div>
                    Reset Defaults
                </button>

                {/* CANCEL BUTTON */}
                <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onCancel(); }}
                    className="group flex flex-col items-center justify-center p-3 rounded-lg border-2 border-slate-700 bg-slate-800 text-slate-500 uppercase font-black tracking-widest text-xs transition-all hover:bg-slate-700 hover:border-slate-600 hover:text-slate-300"
                >
                    <div className="flex items-center gap-2 mb-1">
                        <BIcon />
                    </div>
                    Cancel
                </button>

                {/* SAVE BUTTON */}
                <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onSave(); }}
                    disabled={!canSave}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 uppercase font-black tracking-widest text-xs transition-all
                    ${!canSave ? 'opacity-50 cursor-not-allowed border-slate-800 bg-slate-900 text-slate-700' : 'border-slate-700 bg-slate-800 text-slate-500 hover:bg-slate-700 hover:border-slate-600 hover:text-slate-300'}
                    `}
                >
                    <div className="flex items-center gap-2 mb-1">
                        <AIcon />
                    </div>
                    Save
                </button>
            </div>
        </div>
    );
};