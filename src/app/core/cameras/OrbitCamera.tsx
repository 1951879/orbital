import React, { useLayoutEffect, useRef, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Vector3, MathUtils, Camera } from 'three';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useStore } from '../../../app/store/useStore';
import { SessionState } from '../../../engine/session/SessionState';
import { calculateViewOffset, isSignificantOffset } from './utils/ViewOffset';

/**
 * Unified Orbit Camera — Planet View
 * 
 * Used in:
 *  - Main Menu (LobbyScreen AO preview)
 *  - Free Flight Pause Mode
 * 
 * Features:
 *  - Mouse/Touch orbit via drei OrbitControls
 *  - Gamepad orbit via input profile (ORBIT_H, ORBIT_V, ORBIT_ZOOM)
 *  - Full polar range orbit (no buffer)
 *  - Dynamic zoom interpolation when planet radius changes
 *  - Optional auto-rotate for lobby preview
 */

const POLAR_MIN = MathUtils.degToRad(1);
const POLAR_MAX = MathUtils.degToRad(179);

const ROTATION_SPEED = 10.0;   // Radians per second at full stick deflection
const ZOOM_SPEED = 100.0;     // Units per second at full stick deflection

interface OrbitCameraProps {
    cameraRef?: React.MutableRefObject<Camera | null>;
    autoRotate?: boolean;
    autoRotateSpeed?: number;
    minDistance?: number;
    maxDistance?: number;
}

export const OrbitCamera: React.FC<OrbitCameraProps> = ({
    cameraRef,
    autoRotate = false,
    autoRotateSpeed = 0.05,
    minDistance,
    maxDistance,
}) => {
    const { camera: defaultCamera } = useThree();
    const camera = cameraRef?.current || defaultCamera;

    const controlsRef = useRef<OrbitControlsImpl>(null);
    const targetRef = useRef(new Vector3(0, 0, 0));
    const [initialized, setInitialized] = useState(false);

    const activeMenuTab = useStore((state) => state.activeMenuTab);
    const mission = useStore((state) => state.mission);
    const terrainParams = useStore((state) => state.terrainParams);
    const radius = terrainParams.planetRadius;
    const { size } = useThree();

    // Refs for tracking auto-zoom state
    const radiusRef = useRef(radius);
    const isAdjustingRef = useRef(false);

    useFrame((state, delta) => {
        const controls = controlsRef.current;

        // --- TARGET TRACKING ---
        const desiredTarget = new Vector3(0, 0, 0);
        targetRef.current.lerp(desiredTarget, delta * 5.0);

        // --- VIEW OFFSET (Menu Overlay) ---
        const isMenuOpen = (activeMenuTab === 'multiplayer' || activeMenuTab === 'config') && mission === 'main_menu';
        const offset = calculateViewOffset('orbit', size.width, size.height, { isMenuOpen });

        if (isSignificantOffset(offset)) {
            (camera as any).setViewOffset(size.width, size.height, offset.x, offset.y, size.width, size.height);
        } else {
            (camera as any).clearViewOffset();
        }

        // --- DYNAMIC ZOOM INTERPOLATION (radius change) ---
        const fov = (camera as any).fov || 50;
        const fovRad = (fov * Math.PI) / 180;
        const idealDist = (radius * 1.5) / Math.sin(fovRad / 2);

        if (radiusRef.current !== radius) {
            isAdjustingRef.current = true;
            radiusRef.current = radius;
        }

        if (isAdjustingRef.current) {
            const currentDist = camera.position.length();
            const newDist = MathUtils.lerp(currentDist, idealDist, delta * 2.0);
            const dir = camera.position.clone().normalize();
            camera.position.copy(dir.multiplyScalar(newDist));

            if (Math.abs(newDist - idealDist) < 0.5) {
                isAdjustingRef.current = false;
            }
        }

        // --- GAMEPAD ORBIT ---
        if (controls) {
            const player0 = SessionState.getPlayer(0);
            if (player0) {
                const input = player0.input;

                // Right Stick → Orbit
                const orbitH = input.getAxis("ORBIT_H");
                const orbitV = input.getAxis("ORBIT_V");

                if (Math.abs(orbitH) > 0.1) {
                    controls.setAzimuthalAngle(
                        controls.getAzimuthalAngle() - orbitH * delta * ROTATION_SPEED
                    );
                }

                if (Math.abs(orbitV) > 0.1) {
                    const currentPolar = controls.getPolarAngle();
                    const newPolar = MathUtils.clamp(
                        currentPolar - orbitV * delta * ROTATION_SPEED,
                        POLAR_MIN,
                        POLAR_MAX
                    );
                    controls.setPolarAngle(newPolar);
                }

                // Left Stick Y → Zoom
                const zoom = input.getAxis("ORBIT_ZOOM");

                if (Math.abs(zoom) > 0.1) {
                    const cam = controls.object;
                    const target = controls.target;
                    const distVec = cam.position.clone().sub(target);
                    const dist = distVec.length();
                    const deltaDist = zoom * delta * ZOOM_SPEED;
                    const clampMin = minDistance ?? 10;
                    const clampMax = maxDistance ?? 500;
                    const newDist = Math.max(clampMin, Math.min(clampMax, dist + deltaDist));
                    distVec.setLength(newDist);
                    cam.position.copy(target).add(distVec);
                }
            }

            controls.update();
        }
    });

    // --- INITIAL POSITIONING ---
    useLayoutEffect(() => {
        const fov = (camera as any).fov || 50;
        const fovRad = (fov * Math.PI) / 180;
        const idealDist = (radius * 1.5) / Math.sin(fovRad / 2);

        if (camera.position.length() > 5000) {
            console.warn('[OrbitCamera] Camera too far, creating fresh start.');
            setInitialized(false);
        }

        if (!initialized || camera.position.length() > 5000) {
            camera.position.set(0, radius * 0.5, idealDist);
            camera.lookAt(0, 0, 0);
            setInitialized(true);
            radiusRef.current = radius;
        }

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
        <OrbitControls
            ref={controlsRef}
            target={targetRef.current}
            enablePan={false}
            enableZoom={true}
            enableRotate={true}
            minPolarAngle={POLAR_MIN}
            maxPolarAngle={POLAR_MAX}
            minDistance={minDistance ?? radius * 1.1}
            maxDistance={maxDistance ?? idealDist * 2.0}
            autoRotate={autoRotate}
            autoRotateSpeed={autoRotateSpeed}
        />
    );
};
