import React, { useState } from 'react';
import { FlightTuning, Tunable } from '../../../../core/tuning/FlightTuning';
import { DebugSlider } from '../components/DebugSlider';

export const FlightPanel: React.FC = () => {
    const [, setTick] = useState(0);

    const update = (section: string, key: string, val: number) => {
        // @ts-ignore
        FlightTuning[section][key].value = val;
        setTick(t => t + 1);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {Object.entries(FlightTuning).map(([sectionKey, sectionProps]) => (
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
                                <DebugSlider
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
    );
};
