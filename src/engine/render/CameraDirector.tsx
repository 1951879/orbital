import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, MathUtils, Vector2 } from 'three';
import { ISimObject } from '../sim/ISimObject';

// Configuration for the Chase Camera
const CAM_CONFIG = {
    dist: 80.0,          // Distance behind (Scales with size?)
    height: 25.0,        // Height above
    lookAhead: 50.0,     // How far to look in front of the ship
    lerpSpeed: 5.0,      // Position smoothing
    lookSpeed: 50.0      // Rotation smoothing
};

interface CameraDirectorProps {
    sim: ISimObject;
    inverted?: boolean;
}

export const CameraDirector: React.FC<CameraDirectorProps> = ({ sim, inverted = false }) => {
    const { camera } = useThree();

    // Reusable vectors to reduce GC
    const _target = useRef(new Vector3());
    const _offset = useRef(new Vector3());
    const _up = useRef(new Vector3());
    const _forward = useRef(new Vector3());

    useFrame((state, delta) => {
        // 1. Get Sim State
        const pos = sim.position;
        const quat = sim.quaternion;

        // 2. Calculate Basis Vectors
        const forward = _forward.current.set(0, 0, 1).applyQuaternion(quat).normalize();
        const up = _up.current.copy(pos).normalize(); // Planet Up (Center to Pos)

        // 3. Determine Desired Position
        // Position: Behind and Above
        // We want local offset (0, HEIGHT, -DIST) relative to ship orientation?
        // Or relative to Gravity Up?
        // Legacy used mixed approach. Let's do simple local chase first.

        // Local Offset: Back (-Z) and Up (+Y) relative to ship
        // Warning: If ship is upside down, Up (+Y) pushes camera into ground?
        // Standard space games usually lock camera "Up" to world "Up" or ship "Sky".
        // For planetary flight, we usually want "Up" to be "Away from Planet".

        // Let's try: Position = ShipPos - (Forward * Dist) + (PlanetUp * Height)
        const desiredPos = _offset.current.copy(pos)
            .addScaledVector(forward, -CAM_CONFIG.dist) // Back
            .addScaledVector(up, CAM_CONFIG.height);    // Up (Away from planet)

        // 4. Determine LookTarget
        const lookTarget = _target.current.copy(pos)
            .addScaledVector(forward, CAM_CONFIG.lookAhead); // Look slightly ahead of ship

        // 5. Apply Smoothing (Lerp)
        camera.position.lerp(desiredPos, delta * CAM_CONFIG.lerpSpeed);

        // Handle Teleport (if distance is huge, snap)
        if (camera.position.distanceTo(pos) > 500) {
            camera.position.copy(desiredPos);
        }

        // 6. Orientation
        // Camera Up should generally align with Planet Up, 
        // BUT if we want to feel the roll, we should align with Ship Up.
        // Legacy code used Inverted option.
        // Let's blend Ship Up and Planet Up based on simple "Chase" feel.
        // For now, aligning to Ship Up makes it feel like a real flight sim.
        const shipUp = new Vector3(0, 1, 0).applyQuaternion(quat);
        camera.up.lerp(shipUp, delta * 3.0);

        camera.lookAt(lookTarget);
    });

    return null;
};
