
import React, { useState } from 'react';
import { FlightTuning, Tunable } from '../../../tuning/FlightTuning';
import { TuningOverlay } from './TuningOverlay';

export const FlightTuningMenu: React.FC = () => {
    // We default to the "Flight" tab for now, but this structure allows more tabs later.
    const [activeTab, setActiveTab] = useState('Flight');
    const [, setTick] = useState(0);
    const [copied, setCopied] = useState(false);

    const update = (section: string, key: string, val: number) => {
        // @ts-ignore
        FlightTuning[section][key].value = val;
        setTick(t => t + 1);
    };

    const copyToClipboard = () => {
        // Create a simplified JSON export of JUST values? Or the whole structure?
        // Usually we want the source code structure to paste back into the file.
        // Let's check if we can format it nicely.

        let json = "export const FlightTuning = {\n";

        Object.entries(FlightTuning).forEach(([sectionKey, sectionVal]) => {
            json += `    ${sectionKey}: {\n`;
            Object.entries(sectionVal).forEach(([propKey, propVal]) => {
                const p = propVal as Tunable;
                json += `        ${propKey}: { value: ${p.value}, min: ${p.min}, max: ${p.max}, step: ${p.step} },\n`;
            });
            json += `    },\n`;
        });
        json += "};";

        navigator.clipboard.writeText(json).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <TuningOverlay>

            {/* TAB HEADER */}
            <div style={{ display: 'flex', borderBottom: '1px solid #333' }}>
                <button
                    style={{
                        flex: 1,
                        padding: '10px',
                        background: activeTab === 'Flight' ? '#222' : 'transparent',
                        color: activeTab === 'Flight' ? '#fff' : '#666',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold'
                    }}
                    onClick={() => setActiveTab('Flight')}
                >
                    FLIGHT
                </button>
                <button
                    style={{
                        flex: 1,
                        padding: '10px',
                        background: 'transparent',
                        color: '#444',
                        border: 'none',
                        cursor: 'not-allowed',
                        fontSize: '12px',
                        fontWeight: 'bold'
                    }}
                >
                    GAME (WIP)
                </button>
            </div>

            {/* CONTENT */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {activeTab === 'Flight' && Object.entries(FlightTuning).map(([sectionKey, sectionProps]) => (
                    <div key={sectionKey}>
                        <div style={{
                            fontSize: '11px',
                            color: '#666',
                            fontWeight: 'bold',
                            letterSpacing: '1px',
                            marginBottom: '10px',
                            borderBottom: '1px solid #222',
                            paddingBottom: '4px'
                        }}>
                            {sectionKey.toUpperCase()}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {Object.entries(sectionProps).map(([propKey, propVal]) => {
                                const p = propVal as Tunable;
                                return (
                                    <Slider
                                        key={propKey}
                                        label={propKey}
                                        value={p.value}
                                        min={p.min}
                                        max={p.max}
                                        step={p.step}
                                        onChange={(v) => update(sectionKey, propKey, v)}
                                    />
                                );
                            })}
                        </div>
                    </div>
                ))}

            </div>

            <div style={{ marginTop: 'auto', padding: '20px', borderTop: '1px solid #333' }}>
                <button
                    onClick={copyToClipboard}
                    style={{
                        width: '100%',
                        padding: '12px',
                        background: copied ? '#48bb78' : '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '12px',
                        transition: 'background 0.3s'
                    }}
                >
                    {copied ? "COPIED TO CLIPBOARD" : "EXPORT CONFIG"}
                </button>
            </div>

        </TuningOverlay>
    );
};

const Slider: React.FC<{ label: string; value: number; min: number; max: number; step?: number; onChange: (val: number) => void }> = ({ label, value, min, max, step = 0.1, onChange }) => (
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
