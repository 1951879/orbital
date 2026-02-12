import React from 'react';

export const DebugSlider: React.FC<{ label: string; value: number; min: number; max: number; step?: number; onChange: (val: number) => void }> = ({ label, value, min, max, step = 0.1, onChange }) => (
    <div style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px', color: '#ccc' }}>
            <span style={{ opacity: 0.8 }}>{label}</span>
            <span style={{ color: '#60a5fa', fontFamily: 'monospace' }}>
                {/* Formatting: Intelligent decimal places based on step size */}
                {step < 0.01 ? value.toFixed(4) : step < 0.1 ? value.toFixed(2) : value.toFixed(1)}
            </span>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            style={{
                width: '100%',
                cursor: 'pointer',
                accentColor: '#3b82f6',
                height: '4px',
                background: '#333',
                borderRadius: '2px',
                appearance: 'none' // Basic reset, deeper styling needs CSS modules usually
            }}
        />
    </div>
);
