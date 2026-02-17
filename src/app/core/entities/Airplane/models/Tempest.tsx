
import React from 'react';
import { Vector3 } from 'three';
import { ThreeElements } from '@react-three/fiber';
import { JetExhaust } from '../../effects/JetExhaust';
import { AirplaneDef, AirplaneModelProps } from './AirplaneDef';

const Tempest: React.FC<AirplaneModelProps> = ({ playerId = 1, throttle, throttleRef, scale }) => {
    const effectiveThrottle = throttle ?? 0.5;

    const colors = { main: '#64748b', highlight: '#06b6d4', engine: '#0f172a', canopy: '#cffafe' };

    return (
        <group scale={[scale, scale, scale]}>
            {/* Central Pod */}
            <mesh position={[0, 0, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
                <capsuleGeometry args={[0.4, 1.5, 4, 8]} />
                <meshStandardMaterial color={colors.main} roughness={0.4} metalness={0.6} />
            </mesh>

            {/* Wings */}
            <mesh position={[0, 0, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
                <boxGeometry args={[4.0, 1.2, 0.2]} />
                <meshStandardMaterial color={colors.main} />
            </mesh>

            {/* Twin Booms */}
            <group position={[1.2, 0, -0.5]}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.25, 0.25, 3.5, 8]} />
                    <meshStandardMaterial color={colors.engine} />
                </mesh>
                <mesh position={[0, 0.4, -1.5]} rotation={[0, 0, 0]}>
                    <boxGeometry args={[0.1, 0.8, 0.5]} />
                    <meshStandardMaterial color={colors.highlight} />
                </mesh>
            </group>
            <group position={[-1.2, 0, -0.5]}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.25, 0.25, 3.5, 8]} />
                    <meshStandardMaterial color={colors.engine} />
                </mesh>
                <mesh position={[0, 0.4, -1.5]} rotation={[0, 0, 0]}>
                    <boxGeometry args={[0.1, 0.8, 0.5]} />
                    <meshStandardMaterial color={colors.highlight} />
                </mesh>
            </group>

            {/* Rear Stabilizer connecting booms */}
            <mesh position={[0, 0.7, -2.0]}>
                <boxGeometry args={[2.5, 0.1, 0.4]} />
                <meshStandardMaterial color={colors.main} />
            </mesh>

            {/* Canopy */}
            <mesh position={[0, 0.25, 0.8]}>
                <boxGeometry args={[0.5, 0.4, 0.8]} />
                <meshStandardMaterial color={colors.canopy} roughness={0.2} metalness={0.9} />
            </mesh>

            {/* Exhausts */}
            <group position={[1.2, 0, -2.3]}>
                <JetExhaust color={colors.highlight} scale={0.8} length={2.5} throttle={effectiveThrottle} throttleRef={throttleRef} />
            </group>
            <group position={[-1.2, 0, -2.3]}>
                <JetExhaust color={colors.highlight} scale={0.8} length={2.5} throttle={effectiveThrottle} throttleRef={throttleRef} />
            </group>
        </group>
    );
};

export default {
    type: 'tempest',
    name: 'Tempest Heavy',
    description: 'Twin-boom heavy fighter.',
    scale: 0.38,
    collisionPoints: [
        new Vector3(0, -0.5, 1.7),
        new Vector3(0, 0.5, 1.7),
        new Vector3(0, -0.5, -1.7),
        new Vector3(0, 0.9, -1.7),
        new Vector3(2.4, 0, -0.3),
        new Vector3(-2.4, 0, -0.3),
    ],
    audio: {
        engineBaseFreq: 60, engineType: 'square', engineMix: 0.3,
        whineBaseFreq: 400, whineType: 'sawtooth', whineModulation: 200, whineMix: 0.03,
        rumbleMix: 1.2, rumbleFilterFreq: 250,
        windMix: 0.8, windTone: 200, maneuverNoiseOffset: 2.8, volMult: 0.35,
    },
    Component: Tempest,
} satisfies AirplaneDef;
