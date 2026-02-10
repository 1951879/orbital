
import React from 'react';
import { ThreeElements } from '@react-three/fiber';
import { JetExhaust } from '../../effects/JetExhaust';
import { AIRPLANE_SCALES } from '../AirplaneConfig';

export const Tempest: React.FC<{ playerId?: number, throttle?: number, throttleRef?: React.MutableRefObject<number> }> = ({ playerId = 1, throttle, throttleRef }) => {
    const effectiveThrottle = throttle ?? 0.5;

    const colors = { main: '#64748b', highlight: '#06b6d4', engine: '#0f172a', canopy: '#cffafe' };

    return (
        <group scale={[AIRPLANE_SCALES.tempest, AIRPLANE_SCALES.tempest, AIRPLANE_SCALES.tempest]}>
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
