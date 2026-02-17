
import React, { useEffect } from 'react';
import { useSessionStore } from '../../engine/session/SessionState';
import { useStore } from '../store/useStore';

export const SessionBridge: React.FC = () => {
    const players = useSessionStore(state => state.players);

    // We need to sync Engine Players -> App Pilots
    const addPilot = useStore(state => state.addPilot);
    const removePilot = useStore(state => state.removePilot);
    const existingPilots = useStore(state => state.localParty);

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

    return null; // Logic only
};
