import React, { useEffect, useState, useCallback } from 'react';
import { useFreeFlightStore } from '../useFreeFlightStore';
import { useStore } from '../../../store/useStore';
import { SessionState } from '../../../../engine/session/SessionState';
import { SharedHeader } from '@/src/app/core/ui/components/header/SharedHeader';
import { DeviceManager } from '../../../../engine/input/DeviceManager';

export const FreeFlightPauseMenu: React.FC = () => {
    const setPaused = useFreeFlightStore(state => state.setPaused);
    const setMission = useStore(state => state.setMission);

    // Pointer Lock Management: Unlock on Mount (Pause), Re-lock on Unmount (Resume) ONLY if still in flight
    useEffect(() => {
        DeviceManager.setPointerLockEnabled(false);
        return () => {
            if (useStore.getState().mission !== 'main_menu') {
                DeviceManager.setPointerLockEnabled(true);
            }
        };
    }, []);

    // Actions
    const handleResume = useCallback(() => {
        setPaused(false);
    }, [setPaused]);

    const handleAbort = useCallback(() => {
        setPaused(false);
        setMission('main_menu');
    }, [setPaused, setMission]);

    // Input Handling
    useEffect(() => {
        const unsubscribe = SessionState.onInput((playerId, action) => {
            if (action === 'SELECT' || action === 'FIRE' || action === 'LAUNCH' || action === 'PAUSE') {
                handleResume();
            }
            if (action === 'BACK') {
                handleResume();
            }
            if (action === 'ABORT') {
                handleAbort();
            }
        });
        return () => { unsubscribe(); };
    }, [handleResume, handleAbort]);

    // --- RENDER ---
    return (
        <div className="fixed inset-0 z-[100] flex flex-col pointer-events-none">
            <div className="pointer-events-auto">
                <SharedHeader
                    title="FREE FLIGHT"
                    onAbort={handleAbort}
                    onPrimary={handleResume}
                    primaryLabel="RESUME"
                    primaryState="ready"
                    showSquadron={true}
                    showNetwork={true}
                />
            </div>

            <div className="flex-1">
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/30 font-mono text-[10px] tracking-[0.2em] uppercase">
                    Orbital View Active
                </div>
            </div>
        </div>
    );
};
