
import React, { useEffect, useRef } from 'react';
import { useSessionStore, EnginePlayer } from '../../engine/session/SessionState';
import { useStore } from '../store/useStore';
import { SessionState } from '../../engine/session/SessionState';

export const SessionBridge: React.FC = () => {
    const players = useSessionStore(state => state.players);
    const splitMode = useSessionStore(state => state.splitMode);

    // We need to sync Engine Players -> App Pilots
    const addPilot = useStore(state => state.addPilot);
    const removePilot = useStore(state => state.removePilot);
    const existingPilots = useStore(state => state.localParty);
    const isPaused = useStore(state => state.isPaused); // or activeMenuTab !== 'none'

    // Ref to track processed players to avoid infinite loops if bidirectional
    const processedIds = useRef(new Set<number>());

    // 1. Sync Players -> Pilots
    useEffect(() => {
        // Find new players
        players.forEach(p => {
            if (!existingPilots.find(pilot => pilot.sessionId === p.id)) {
                // New Engine Player -> Create Pilot
                console.log(`[Bridge] Syncing New Player ${p.id} to App`);
                addPilot(p.id, p.deviceId);
            }
        });

        // Find removed players
        existingPilots.forEach(pilot => {
            if (!players.find(p => p.id === pilot.sessionId)) {
                // Engine Player gone -> Remove Pilot
                console.log(`[Bridge] Syncing Player Removal ${pilot.sessionId} from App`);
                removePilot(pilot.sessionId);
            }
        });
    }, [players, existingPilots, addPilot, removePilot]);

    // 2. Sync Pause State -> Input Context
    // We check if we are in a menu state
    const activeMenu = useStore(state => state.activeMenuTab);

    useEffect(() => {
        // Global Pause Policy:
        // If App is Paused -> MENU Context (Navigation)
        // If App is Running -> FLIGHT Context (Gameplay)
        const targetContext = isPaused ? 'MENU' : 'FLIGHT';

        // This sets it for ALL inputs immediately
        SessionState.setContextForAll(targetContext);

    }, [isPaused]);

    // 3. Listen for Engine Input Events (e.g. 'BACK' to toggle Ready)
    const setPilotStatus = useStore(state => state.setPilotStatus);

    useEffect(() => {
        const cleanup = SessionState.onInput((pilotId, action) => {
            if (action === 'BACK') {
                const pilot = useStore.getState().localParty.find(p => p.id === pilotId);
                if (pilot) {
                    const newStatus = pilot.ui.status === 'ready' ? 'selecting' : 'ready';
                    setPilotStatus(pilotId, newStatus);
                }
            } else if (action === 'PAUSE') {
                const isPaused = useStore.getState().isPaused;
                useStore.getState().setIsPaused(!isPaused);
            }
        });
        return () => { cleanup(); };
    }, [setPilotStatus]);

    return null; // Logic only
};
