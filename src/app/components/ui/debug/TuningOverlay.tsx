
import React, { useState } from 'react';
import { useStore } from '../../../store/useStore';

// Container for multiple tuning modules
export const TuningOverlay: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'sim' | 'touch'>('sim');

    const touchConfig = useStore(state => state.touchConfig);
    const setTouchConfig = useStore(state => state.setTouchConfig);

    if (!isOpen) {
        return (
            <div style={{
                position: 'absolute',
                top: '50%',
                right: '0px',
                transform: 'translateY(-50%)',
                zIndex: 9999,
                pointerEvents: 'auto'
            }}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                }}
            >
                <button
                    onClick={() => setIsOpen(true)}
                    style={{
                        padding: '10px',
                        background: '#333',
                        color: 'white',
                        border: '1px solid #555',
                        borderRight: 'none',
                        cursor: 'pointer',
                        fontSize: '20px',
                        borderRadius: '8px 0 0 8px'
                    }}
                >
                    &lt;
                </button>
            </div>
        );
    }

    return (
        <div style={{
            position: 'absolute',
            top: '0',
            right: '0',
            width: '340px',
            height: '100vh',
            background: 'rgba(10, 10, 12, 0.95)',
            borderLeft: '1px solid #333',
            zIndex: 9999,
            color: 'white',
            fontFamily: 'monospace',
            display: 'flex',
            flexDirection: 'column',
            pointerEvents: 'auto'
        }}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
            }}
        >
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '15px',
                borderBottom: '1px solid #333',
                background: '#111'
            }}>
                <h3 style={{ margin: 0, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Tuning Console</h3>
                <button onClick={() => setIsOpen(false)} style={{ cursor: 'pointer', background: 'transparent', border: 'none', color: '#666', fontSize: '16px' }}>X</button>
            </div>
            <div style={{ display: 'flex', borderBottom: '1px solid #333' }}>
                <button
                    onClick={() => setActiveTab('sim')}
                    style={{ flex: 1, padding: '10px', background: activeTab === 'sim' ? '#222' : 'transparent', color: activeTab === 'sim' ? 'white' : '#888', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                >
                    SIMULATION
                </button>
                <button
                    onClick={() => setActiveTab('touch')}
                    style={{ flex: 1, padding: '10px', background: activeTab === 'touch' ? '#222' : 'transparent', color: activeTab === 'touch' ? 'white' : '#888', border: 'none', borderLeft: '1px solid #333', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                >
                    TOUCH CONTROLS
                </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                {activeTab === 'sim' && children}
                {activeTab === 'touch' && (
                    <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                <label style={{ color: '#aaa' }}>Joystick Size</label>
                                <span style={{ color: '#4ade80' }}>{touchConfig.joystickSize.toFixed(2)}x</span>
                            </div>
                            <input
                                type="range"
                                min="0.5"
                                max="2.0"
                                step="0.1"
                                value={touchConfig.joystickSize}
                                onChange={(e) => setTouchConfig({ joystickSize: parseFloat(e.target.value) })}
                                style={{
                                    width: '100%',
                                    accentColor: '#4ade80'
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
