
import React, { useState } from 'react';

// Container for multiple tuning modules
export const TuningOverlay: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);

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

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                {children}
            </div>
        </div>
    );
};
