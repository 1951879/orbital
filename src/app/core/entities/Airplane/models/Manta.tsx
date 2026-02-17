
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Vector3 } from 'three';
import { ThreeElements } from '@react-three/fiber';
import { JetExhaust } from '../../effects/JetExhaust';
import { AirplaneDef, AirplaneModelProps } from './AirplaneDef';

const Manta: React.FC<AirplaneModelProps> = ({ playerId = 1, throttle, throttleRef, scale }) => {
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
        <group scale={[scale, scale, scale]}>
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

export default {
    type: 'manta',
    name: 'Deep Manta',
    description: 'Experimental bio-wing.',
    scale: 0.3,
    collisionPoints: [
        new Vector3(0, -0.3, 2.0),
        new Vector3(0, 0.5, 0),
        new Vector3(2.5, -0.2, -1.0),
        new Vector3(-2.5, -0.2, -1.0),
        new Vector3(1.0, -0.3, -1.5),
        new Vector3(-1.0, -0.3, -1.5),
    ],
    audio: {
        engineBaseFreq: 40, engineType: 'sine', engineMix: 0.6,
        whineBaseFreq: 200, whineType: 'square', whineModulation: 50, whineMix: 0.03,
        rumbleMix: 0.3, rumbleFilterFreq: 100,
        windMix: 0.3, windTone: 100, maneuverNoiseOffset: 1.0, volMult: 0.28,
    },
    Component: Manta,
} satisfies AirplaneDef;
