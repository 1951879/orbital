import React, { useState, useEffect } from 'react';
import { useSessionStore } from '../../../../../engine/session/SessionState';

export const GamePanel: React.FC = () => {
    const players = useSessionStore(state => state.players);
    const [gamepads, setGamepads] = useState<(Gamepad | null)[]>([]);

    useEffect(() => {
        const update = () => {
            const gps = navigator.getGamepads ? navigator.getGamepads() : [];
            // Filter out nulls if we want to, but keeping indexes is useful
            const gpArray = [];
            for (let i = 0; i < gps.length; i++) {
                gpArray.push(gps[i]);
            }
            setGamepads(gpArray);
            requestAnimationFrame(update);
        };
        const handle = requestAnimationFrame(update);
        return () => cancelAnimationFrame(handle);
    }, []);

    const hasAny = gamepads.some(g => g !== null);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {!hasAny && (
                <div style={{ padding: '20px', textAlign: 'center', color: '#666', fontStyle: 'italic', fontSize: '12px' }}>
                    No Gamepads Detected
                </div>
            )}

            {gamepads.map((gp, i) => {
                if (!gp) return null;

                // Check assignment
                const devId = `gamepad:${i}`;
                const assignedPlayer = players.find(p => p.deviceId === devId);

                // Check type
                const id = gp.id.toLowerCase();
                const isPS = id.includes('dualshock') || id.includes('dualsense') || id.includes('playstation') || id.includes('sony');
                const type = isPS ? 'PlayStation' : 'Xbox/Generic';

                return (
                    <div key={i} style={{ padding: '10px', background: '#222', borderRadius: '4px', borderLeft: assignedPlayer ? '4px solid #4ade80' : '4px solid #666' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '12px' }}>
                                GAMEPAD {i}
                            </div>
                            <div style={{
                                fontSize: '10px',
                                fontWeight: 'bold',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: isPS ? '#003087' : '#107c10',
                                color: 'white'
                            }}>
                                {type.toUpperCase()}
                            </div>
                        </div>

                        <div style={{ fontSize: '11px', color: '#666', wordBreak: 'break-all', marginBottom: '8px', lineHeight: '1.2' }}>
                            {gp.id}
                        </div>

                        <div style={{
                            fontSize: '11px',
                            color: assignedPlayer ? '#4ade80' : '#fbbf24',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: assignedPlayer ? '#4ade80' : '#fbbf24' }}></div>
                            {assignedPlayer ? `ASSIGNED: PLAYER ${assignedPlayer.id}` : 'UNASSIGNED'}
                        </div>

                        <button
                            onClick={() => {
                                const g = navigator.getGamepads()[i];
                                if (g && g.vibrationActuator) {
                                    g.vibrationActuator.playEffect("dual-rumble", {
                                        startDelay: 0,
                                        duration: 500,
                                        weakMagnitude: 1.0,
                                        strongMagnitude: 1.0,
                                    });
                                }
                            }}
                            style={{
                                marginTop: '8px',
                                width: '100%',
                                padding: '6px',
                                background: '#333',
                                border: '1px solid #444',
                                color: 'white',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                borderRadius: '2px',
                                textTransform: 'uppercase'
                            }}
                        >
                            Rumble Test
                        </button>
                    </div>
                );
            })}
        </div>
    );
};
