
import React from 'react';
import { useStore } from '../../../store/useStore';
import { TerrainParams } from '../../../../types';

interface Props {
    focusIndex: number;
}

// Config Items Definition to map index to key
export const CONFIG_ITEMS: { key: keyof TerrainParams | 'regen'; label: string; min: number; max: number; step: number; unit: string }[] = [
    { key: 'planetRadius', label: 'Planetary Radius', min: 25, max: 200, step: 5, unit: 'u' },
    { key: 'waterLevel', label: 'Ocean Coverage', min: 0.0, max: 1.0, step: 0.05, unit: '%' },
    { key: 'mountainScale', label: 'Tectonic Amplitude', min: 0.0, max: 2.0, step: 0.1, unit: 'x' },
    { key: 'mountainFrequency', label: 'Terrain Frequency', min: 0.5, max: 4.0, step: 0.1, unit: 'Hz' },
    { key: 'regen', label: 'Re-Initialize System', min: 0, max: 0, step: 0, unit: '' } // Button
];

export const ConfigTab: React.FC<Props> = ({ focusIndex }) => {
    const terrainParams = useStore((state) => state.terrainParams);

    // Helper to format display value
    const getDisplayValue = (item: typeof CONFIG_ITEMS[0]) => {
        if (item.key === 'regen') return '';
        const val = terrainParams[item.key as keyof TerrainParams];
        if (item.unit === '%') return `${Math.round(val * 100)}%`;
        if (item.step < 1) return val.toFixed(1) + item.unit;
        return val + item.unit;
    };

    // Helper for progress bar width
    const getProgress = (item: typeof CONFIG_ITEMS[0]) => {
        if (item.key === 'regen') return 0;
        const val = terrainParams[item.key as keyof TerrainParams];
        return ((val - item.min) / (item.max - item.min)) * 100;
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-300 p-8 max-w-4xl mx-auto w-full">
            <div className="flex justify-between items-end border-b border-slate-800 pb-4 mb-4">
                <h2 className="text-xl font-black text-slate-500 uppercase tracking-widest">System Calibration</h2>
                <span className="text-xs text-slate-600 font-mono border border-slate-800 px-2 py-1 rounded bg-slate-900/50">MANUAL OVERRIDE ENABLED</span>
            </div>

            {CONFIG_ITEMS.map((item, idx) => {
                const isFocused = focusIndex === idx;
                const isRegen = item.key === 'regen';

                if (isRegen) {
                    return (
                        <div
                            key={idx}
                            className={`
                            mt-12 p-6 rounded-xl border-2 uppercase font-black text-center tracking-widest text-lg transition-all duration-200
                            ${isFocused
                                    ? 'bg-blue-600 border-blue-400 text-white shadow-lg scale-105'
                                    : 'bg-slate-800/50 border-slate-700 text-slate-500'
                                }
                        `}
                        >
                            Initialize Generation
                        </div>
                    );
                }

                return (
                    <div
                        key={item.key}
                        className={`
                        relative p-4 rounded-xl border transition-all duration-200 flex flex-col gap-3
                        ${isFocused
                                ? 'bg-slate-800 border-slate-500 shadow-lg ring-1 ring-slate-600 scale-[1.02]'
                                : 'bg-slate-900/30 border-slate-800/50 opacity-80'
                            }
                    `}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center">
                            <span className={`text-xs font-bold uppercase tracking-wider ${isFocused ? 'text-blue-300' : 'text-slate-400'}`}>
                                {item.label}
                            </span>
                            <span className={`text-sm font-mono font-bold ${isFocused ? 'text-white' : 'text-slate-500'}`}>
                                {getDisplayValue(item)}
                            </span>
                        </div>

                        {/* Bar visualization */}
                        <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800 relative">
                            <div
                                className={`h-full transition-all duration-100 ${isFocused ? 'bg-blue-500' : 'bg-slate-600'}`}
                                style={{ width: `${getProgress(item)}%` }}
                            />
                            {/* Tick Marks */}
                            <div className="absolute inset-0 flex justify-between px-2">
                                {[...Array(9)].map((_, i) => <div key={i} className="w-px h-full bg-black/20" />)}
                            </div>
                        </div>


                    </div>
                );
            })}
        </div>
    );
};
