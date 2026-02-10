
import React, { useMemo } from 'react';
import * as THREE from 'three';
// Fix: Import ThreeElements to provide JSX intrinsic types
import { ThreeElements } from '@react-three/fiber';
import { JetExhaust } from '../../effects/JetExhaust';
import { AIRPLANE_SCALES } from '../AirplaneConfig';

export const Manta: React.FC<{ playerId?: number, throttle?: number, throttleRef?: React.MutableRefObject<number> }> = ({ playerId = 1, throttle, throttleRef }) => {
    const effectiveThrottle = throttle ?? 0.5;

    const colors = { main: '#4c1d95', highlight: '#22d3ee', engine: '#020617', canopy: '#c084fc' };

    const bodyShape = useMemo(() => {
        const shape = new THREE.Shape();
        shape.moveTo(0, 2.0);    // Nose
        shape.quadraticCurveTo(2.0, 0.5, 2.5, -1.0); // Right Wingtip
        shape.lineTo(1.0, -1.5); // Right Rear
        shape.quadraticCurveTo(0, -1.0, -1.0, -1.5); // Rear Arc
        shape.lineTo(-2.5, -1.0); // Left Wingtip
        shape.quadraticCurveTo(-2.0, 0.5, 0, 2.0); // Left Nose
        return shape;
    }, []);

    return (
        <group scale={[AIRPLANE_SCALES.manta, AIRPLANE_SCALES.manta, AIRPLANE_SCALES.manta]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <extrudeGeometry args={[bodyShape, { depth: 0.4, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1, bevelSegments: 3 }]} />
                <meshStandardMaterial color={colors.main} roughness={0.3} metalness={0.8} />
            </mesh>

            {/* Glowing Strips */}
            <mesh position={[1.5, 0.21, -0.5]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.2, 1.5]} />
                <meshStandardMaterial color={colors.highlight} emissive={colors.highlight} emissiveIntensity={1.0} />
            </mesh>
            <mesh position={[-1.5, 0.21, -0.5]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.2, 1.5]} />
                <meshStandardMaterial color={colors.highlight} emissive={colors.highlight} emissiveIntensity={1.0} />
            </mesh>

            <mesh position={[0, 0.3, 1.0]} scale={[1, 0.4, 1.5]}>
                <sphereGeometry args={[0.4, 16, 16]} />
                <meshStandardMaterial color={colors.canopy} roughness={0.1} metalness={0.9} emissive={colors.canopy} emissiveIntensity={0.5} />
            </mesh>

            <group position={[0.8, 0.2, -1.5]}>
                <JetExhaust color={colors.highlight} scale={1.0} length={2.0} throttle={effectiveThrottle} throttleRef={throttleRef} />
            </group>
            <group position={[-0.8, 0.2, -1.5]}>
                <JetExhaust color={colors.highlight} scale={1.0} length={2.0} throttle={effectiveThrottle} throttleRef={throttleRef} />
            </group>
        </group>
    );
};
