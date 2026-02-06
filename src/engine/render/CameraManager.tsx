import React from 'react';
import { useStore } from '../../app/store/useStore';
import { ChaseCamera } from './cameras/ChaseCamera';
import { MenuCamera } from './cameras/MenuCamera';
import { SquadronCamera } from './cameras/SquadronCamera';
import { WorldState } from '../sim/WorldState';

/**
 * Camera Manager - Coordinates Camera Mode Switching
 * 
 * Responsibilities:
 * - Determines which camera mode should be active
 * - Renders the appropriate camera component
 * - (Future) Handles smooth transitions between modes
 */

import { Camera } from 'three';

interface CameraManagerProps {
    playerSim?: any; // AirplaneSim instance for chase camera
    cameraRef?: React.MutableRefObject<Camera | null>;
    playerId?: number; // Added to manage Layers
}

export const CameraManager: React.FC<CameraManagerProps> = ({ playerSim, cameraRef, playerId }) => {
    const isPaused = useStore((state) => state.isPaused);
    const activeMenuTab = useStore((state) => state.activeMenuTab);

    const hasPlayers = useStore(state => state.localParty.length > 0);

    // Layer Management (Hide Self Name Tag)
    React.useEffect(() => {
        if (cameraRef?.current && typeof playerId === 'number') {
            const cam = cameraRef.current;
            cam.layers.enableAll(); // See everything by default

            // Hide own name tag (Layer = ID + 1)
            // Layers 1, 2, 3, 4 are for P1, P2, P3, P4 tags respectively.
            cam.layers.disable(playerId + 1);
        }
    }, [cameraRef, playerId]);

    // Determine active camera mode
    let cameraMode: 'chase' | 'squadron' | 'menu' = 'chase';

    if (isPaused) {
        // Logic: 
        // 1. If we are in 'hangar' AND have players -> Squadron View (Close up)
        // 2. Otherwise (Orbiting Planet, other tabs, or hangar empty) -> Menu View (Planet Orbit)
        if (activeMenuTab === 'hangar' && hasPlayers) {
            cameraMode = 'squadron';
        } else {
            cameraMode = 'menu';
        }
    }

    // Render appropriate camera
    if (cameraMode === 'menu') {
        return <MenuCamera cameraRef={cameraRef} />;
    }

    if (cameraMode === 'squadron') {
        // SquadronCamera handles its own logic, assuming it looks at the anchor
        return <SquadronCamera cameraRef={cameraRef} />;
    }

    if (cameraMode === 'chase' && playerSim) {
        return <ChaseCamera sim={playerSim} cameraRef={cameraRef} />;
    }

    // Fallback: no camera (default Three.js camera behavior)
    return null;
};
