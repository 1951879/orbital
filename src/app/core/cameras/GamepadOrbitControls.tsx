import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { SessionState } from '../../../engine/session/SessionState';

export const GamepadOrbitControls: React.FC<any> = (props) => {
    const controlsRef = useRef<OrbitControlsImpl>(null);

    useFrame((state, delta) => {
        if (!controlsRef.current) return;

        // Read Input State (Use Player 0 for Menu Camera)
        const player0 = SessionState.getPlayer(0);
        if (!player0) return;
        const input = player0.input;

        // --- ROTATION (Right Stick) ---
        // X-axis: Azymuthal angle (Horizontal)
        // Y-axis: Polar angle (Vertical)
        const lookX = input.getAxis("LOOK_Y"); // Swapped? DefaultProfiles usually mapping Stick Right X/Y. 
        const lookY = input.getAxis("YAW"); // Check DefaultProfiles.ts

        const ROTATION_SPEED = 6.0;

        if (Math.abs(lookX) > 0.1) {
            controlsRef.current.setAzimuthalAngle(
                controlsRef.current.getAzimuthalAngle() - lookX * delta * ROTATION_SPEED
            );
        }

        if (Math.abs(lookY) > 0.1) {
            controlsRef.current.setPolarAngle(
                controlsRef.current.getPolarAngle() - lookY * delta * ROTATION_SPEED
            );
        }

        // --- ZOOM (Left Stick Y) ---
        // Using Left Stick Y for Zoom (Throttle axis)
        // Push Up (Negative) -> Zoom In? Or Down -> Zoom Out?
        // Standard flight: Stick Up (-1) is Pitch Down.
        // Let's us Stick Up -> Zoom In (Move closer).
        const moveY = input.getAxis("PITCH"); // Stick Left Y

        const ZOOM_SPEED = 100.0; // Units per second

        if (Math.abs(moveY) > 0.1) {
            // Modify distance directly if we can, or use dolly
            // .dollyIn(scale) multiplies zoom.
            // Let's try simple distance limit approach or target distance.
            // OrbitControls has object.position vs target.

            // Simpler approach: Move camera along forward vector
            const cam = controlsRef.current.object;
            const target = controlsRef.current.target;

            // Current vector from target to camera
            const distVec = cam.position.clone().sub(target);
            const dist = distVec.length();

            // Desired change
            const deltaDist = moveY * delta * ZOOM_SPEED;

            // Clamp distance to avoiding flipping or clipping too far
            const newDist = Math.max(10, Math.min(500, dist + deltaDist));

            // Re-apply
            distVec.setLength(newDist);
            cam.position.copy(target).add(distVec);
        }

        controlsRef.current.update();
    });

    return (
        <OrbitControls
            ref={controlsRef}
            enablePan={false}
            enableZoom={true} // Allow mouse wheel
            enableRotate={true} // Allow mouse drag
            {...props}
        />
    );
};
