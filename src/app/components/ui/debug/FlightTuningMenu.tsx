import React, { useState } from 'react';
import { FlightTuning, Tunable } from '../../../core/tuning/FlightTuning';
import { TuningOverlay } from './TuningOverlay';
import { DebugConfig } from './DebugConfig';
import { GamePanel } from './panels/GamePanel';
import { FlightPanel } from './panels/FlightPanel';

export const FlightTuningMenu: React.FC = () => {
    // We default to the "Flight" tab for now, but this structure allows more tabs later.
    const [activeTab, setActiveTab] = useState('Flight');
    const [copied, setCopied] = useState(false);

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


    if (!DebugConfig.showFlightTuning) return null;

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
                        background: activeTab === 'Game' ? '#222' : 'transparent',
                        color: activeTab === 'Game' ? '#fff' : '#444',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold'
                    }}
                    onClick={() => setActiveTab('Game')}
                >
                    GAME
                </button>
            </div>

            {/* CONTENT */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {activeTab === 'Game' && <GamePanel />}
                {activeTab === 'Flight' && <FlightPanel />}

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
