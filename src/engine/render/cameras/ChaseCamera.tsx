import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Matrix4, MathUtils, Camera } from 'three';
import { AirplaneSim } from '../../../app/entities/Airplane/AirplaneSim';
import { smoothCameraTransform, shouldSnapCamera } from './utils/CameraUtils';
import { useStore } from '../../../app/store/useStore';

const CAM_CONFIG = {
    dist: 4.0,         // Legacy: 6.0 (very close to ship)
    height: 4,       // Legacy: 4.0
    lookAhead: 0.0,    // No look-ahead - plane stays centered
    lerpSpeed: 5.0,
    snapThreshold: 500
};

interface ChaseCameraProps {
    sim: AirplaneSim;
    cameraRef?: React.MutableRefObject<Camera | null>;
}

/**
 * ChaseCamera - Spherical Chase Camera
 * 
 * Follows the airplane from behind using spherical coordinates.
 * Camera offset is calculated in ship's local space and transformed to world space.
 * Look target adapts based on altitude to keep horizon in view.
 */
export const ChaseCamera: React.FC<ChaseCameraProps> = ({ sim, cameraRef }) => {
    const { camera: defaultCamera } = useThree();
    const lastPosRef = useRef(new Vector3());

    // Reusable vectors and matrices
    const desiredPos = useRef(new Vector3());
    const lookTarget = useRef(new Vector3());
    const forward = useRef(new Vector3());
    const planetUp = useRef(new Vector3());
    const shipMatrix = useRef(new Matrix4());
    const localOffset = useRef(new Vector3());

    useFrame((state, delta) => {
        if (!sim) return;

        const activeCam = cameraRef?.current || defaultCamera;
        if (!activeCam) return;

        const pos = sim.position;
        const quat = sim.quaternion;

        // Get planet parameters
        const terrainParams = useStore.getState().terrainParams;
        const planetRadius = terrainParams.planetRadius;

        // Calculate altitude and adaptive look-down angle
        const currentAlt = pos.length();
        const altitude = currentAlt - planetRadius;

        // Adaptive look-down: higher altitude = look down more (legacy logic)
        const altitudePercent = MathUtils.clamp(altitude / 79.5, 0, 1);
        const lookDownOffset = MathUtils.lerp(6, 28, altitudePercent);

        // Calculate camera position in ship's LOCAL space, then transform to world
        shipMatrix.current.compose(pos, quat, new Vector3(1, 1, 1));
        localOffset.current.set(0, CAM_CONFIG.height, -CAM_CONFIG.dist);
        desiredPos.current.copy(localOffset.current).applyMatrix4(shipMatrix.current);

        // Calculate look target - look directly at the plane
        forward.current.set(0, 0, 1).applyQuaternion(quat);
        planetUp.current.copy(pos).normalize();

        // Look directly at the plane's position (no forward or vertical offset)
        lookTarget.current.copy(pos);

        // Check for teleport/snapping
        if (shouldSnapCamera(activeCam, desiredPos.current, CAM_CONFIG.snapThreshold)) {
            activeCam.position.copy(desiredPos.current);
            activeCam.lookAt(lookTarget.current);
            activeCam.up.copy(planetUp.current);
            lastPosRef.current.copy(desiredPos.current);
        } else {
            // Use the smoothCameraTransform utility
            smoothCameraTransform(
                activeCam,
                desiredPos.current,
                lookTarget.current,
                planetUp.current,
                delta,
                CAM_CONFIG.lerpSpeed,
                3.0  // Up vector lerp speed
            );
        }

        // if (Math.random() < 0.01) {
        //     console.log(`[ChaseCam] P${sim.playerId} Pos: ${activeCam.position.toArray().map(n => n.toFixed(1))} | Sim: ${pos.toArray().map(n => n.toFixed(1))}`);
        // }
        lastPosRef.current.copy(activeCam.position);
    });

    return null;
};
