
import React from 'react';
import { Vector3 } from 'three';
import { ThreeElements } from '@react-three/fiber';
import { JetExhaust } from '../../effects/JetExhaust';
import { AirplaneDef, AirplaneModelProps } from './AirplaneDef';

const Starling: React.FC<AirplaneModelProps> = ({ playerId = 1, throttle, throttleRef, scale }) => {
    const effectiveThrottle = throttle ?? 0.5;

    const colors = { main: '#facc15', highlight: '#000000', engine: '#171717', canopy: '#0ea5e9' };

    return (
        <group scale={[scale, scale, scale]}>
            {/* Teardrop Body */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <sphereGeometry args={[0.8, 16, 16]} />
                <meshStandardMaterial color={colors.main} roughness={0.1} metalness={0.4} />
            </mesh>
            <mesh position={[0, 0, -1.0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.75, 0.4, 2.0, 16]} />
                <meshStandardMaterial color={colors.main} roughness={0.1} metalness={0.4} />
            </mesh>

            {/* Racing Stripes */}
            <mesh position={[0, 0.81, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.4, 1.5]} />
                <meshBasicMaterial color={colors.highlight} />
            </mesh>

            {/* Stubby Wings */}
            <mesh position={[0, -0.2, 0.2]}>
                <boxGeometry args={[3.5, 0.2, 1.0]} />
                <meshStandardMaterial color={colors.main} />
            </mesh>

            {/* Checkered Tips */}
            <mesh position={[1.5, -0.19, 0.2]}>
                <boxGeometry args={[0.5, 0.21, 1.0]} />
                <meshStandardMaterial color={colors.highlight} />
            </mesh>
            <mesh position={[-1.5, -0.19, 0.2]}>
                <boxGeometry args={[0.5, 0.21, 1.0]} />
                <meshStandardMaterial color={colors.highlight} />
            </mesh>

            {/* Tail */}
            <mesh position={[0, 0.8, -1.5]}>
                <boxGeometry args={[0.1, 1.0, 0.8]} />
                <meshStandardMaterial color={colors.highlight} />
            </mesh>

            {/* Bubble Canopy */}
            <mesh position={[0, 0.5, 0.5]}>
                <sphereGeometry args={[0.45, 16, 16]} />
                <meshStandardMaterial color={colors.canopy} roughness={0.0} metalness={1.0} emissive={colors.canopy} emissiveIntensity={0.2} />
            </mesh>

            {/* Single Big Exhaust */}
            <group position={[0, 0, -2.0]}>
                <JetExhaust color="#f59e0b" scale={1.5} length={2.0} throttle={effectiveThrottle} throttleRef={throttleRef} />
            </group>
        </group>
    );
};

export default {
    type: 'starling',
    name: 'Starling Racer',
    description: 'Civilian racing modification.',
    scale: 0.3,
    collisionPoints: [
        new Vector3(0, -0.3, 1.2),
        new Vector3(0, 0.3, 1.2),
        new Vector3(0, -0.3, -1.0),
        new Vector3(0, 0.6, -1.0),
        new Vector3(1.5, 0, -0.2),
        new Vector3(-1.5, 0, -0.2),
    ],
    audio: {
        engineBaseFreq: 200, engineType: 'triangle', engineMix: 0.4,
        whineBaseFreq: 600, whineType: 'square', whineModulation: 1200, whineMix: 0.08,
        rumbleMix: 0.4, rumbleFilterFreq: 600,
        windMix: 0.4, windTone: 1000, maneuverNoiseOffset: 1.8, volMult: 0.28,
    },
    Component: Starling,
} satisfies AirplaneDef;
