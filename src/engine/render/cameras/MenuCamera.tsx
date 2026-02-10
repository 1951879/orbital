import React, { useLayoutEffect, useRef, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Vector3, MathUtils } from 'three';
import { useStore } from '../../../app/store/useStore';
import { GamepadOrbitControls } from '../GamepadOrbitControls';

/**
 * Menu Camera - Planet Orbit View
 * 
 * Replaces LobbyCamera/SquadronCamera for the main menu view.
 * 
 * Features:
 * - Focuses on the Planet Core (0,0,0).
 * - Allows Orbit controls via Mouse/Touch/Gamepad.
 * - Handles initial framing for planet view.
 */
import { Camera } from 'three';
import { calculateViewOffset, isSignificantOffset } from './utils/ViewOffset';

interface MenuCameraProps {
    cameraRef?: React.MutableRefObject<Camera | null>;
}

export const MenuCamera: React.FC<MenuCameraProps> = ({ cameraRef }) => {
    const { camera: defaultCamera } = useThree();
    // Prioritize the passed ref (for Split-Screen), fallback to Default (for Single Player)
    const camera = cameraRef?.current || defaultCamera;

    // Calculate focus target
    // Always center on planet core for menu view
    const targetRef = useRef(new Vector3(0, 0, 0));
    const [initialized, setInitialized] = useState(false);

    const activeMenuTab = useStore((state) => state.activeMenuTab);
    const terrainParams = useStore((state) => state.terrainParams);
    const radius = terrainParams.planetRadius;
    const { size } = useThree();

    // Refs for tracking auto-zoom state
    const radiusRef = useRef(radius);
    const isAdjustingRef = useRef(false);
    const zoomVelocityRef = useRef(0);

    useFrame((state, delta) => {
        // Menu Camera always orbits the core
        const desiredTarget = new Vector3(0, 0, 0);
        targetRef.current.lerp(desiredTarget, delta * 5.0);

        // Handle View Offset for Menu Overlay using Centralized Logic
        const isMenuOpen = activeMenuTab === 'multiplayer' || activeMenuTab === 'config';
        const offset = calculateViewOffset('orbit', size.width, size.height, { isMenuOpen });

        if (isSignificantOffset(offset)) {
            (camera as any).setViewOffset(size.width, size.height, offset.x, offset.y, size.width, size.height);
        } else {
            (camera as any).clearViewOffset();
        }

        // --- DYNAMIC ZOOM INTERPOLATION ---
        // Calculate ideal distance to fit planet
        const fov = (camera as any).fov || 50;
        const fovRad = (fov * Math.PI) / 180;
        // Distance to fit sphere: d = r / sin(fov/2)
        // Add 20% padding (1.2)
        const idealDist = (radius * 1.5) / Math.sin(fovRad / 2);

        // Detect Radius Change to trigger auto-zoom
        if (radiusRef.current !== radius) {
            isAdjustingRef.current = true;
            radiusRef.current = radius;
        }

        // Only interpolate if we are in an "adjusting" state
        if (isAdjustingRef.current) {
            const currentDist = camera.position.length();

            // Lerp distance
            const newDist = MathUtils.lerp(currentDist, idealDist, delta * 2.0);
            const dir = camera.position.clone().normalize();
            camera.position.copy(dir.multiplyScalar(newDist));

            // Stop adjusting if we are close enough
            if (Math.abs(newDist - idealDist) < 0.5) {
                isAdjustingRef.current = false;
            }
        }
    });

    // Initial positioning
    useLayoutEffect(() => {
        const fov = (camera as any).fov || 50;
        const fovRad = (fov * Math.PI) / 180;
        const idealDist = (radius * 1.5) / Math.sin(fovRad / 2);

        // SANITY CHECK: If coming from Gameplay, we might be miles away
        if (camera.position.length() > 5000) {
            console.warn('[MenuCamera] Camera too far, creating fresh start.');
            setInitialized(false); // Force re-init logic below
        }

        if (!initialized || camera.position.length() > 5000) {
            camera.position.set(0, radius * 0.5, idealDist);
            camera.lookAt(0, 0, 0);
            setInitialized(true);
            radiusRef.current = radius; // Sync initial state
        }

        // CLEANUP: Ensure we clear any view offset when this camera unmounts
        // This is critical for transitions between Menu -> Gameplay
        return () => {
            if ((camera as any).clearViewOffset) {
                (camera as any).clearViewOffset();
            }
        };
    }, [initialized, camera]);

    const fov = (camera as any).fov || 50;
    const fovRad = (fov * Math.PI) / 180;
    const idealDist = (radius * 1.5) / Math.sin(fovRad / 2);

    return (
        <GamepadOrbitControls
            target={targetRef.current}
            minDistance={radius * 1.1} // Ensure we can't clip into surface
            maxDistance={idealDist * 2.0}
        />
    );
};
