
import React from 'react';
// Fix: Import ThreeElements to provide JSX intrinsic types
import { ThreeElements } from '@react-three/fiber';
import { JetExhaust } from '../effects/JetExhaust';

export const Eagle: React.FC<{ playerId?: number, throttle?: number, throttleRef?: React.MutableRefObject<number> }> = ({ playerId = 1, throttle, throttleRef }) => {
    const effectiveThrottle = throttle ?? 0.5;

    const colors = { main: '#fef08a', highlight: '#a16207', engine: '#451a03', canopy: '#0f172a' };

    return (
        <group scale={[0.38, 0.38, 0.38]}>
            {/* Main Hull */}
            <mesh>
                <boxGeometry args={[0.8, 0.6, 3.0]} />
                <meshStandardMaterial color={colors.main} roughness={0.5} metalness={0.8} />
            </mesh>

            {/* Side Engines */}
            <mesh position={[0.7, 0, -0.5]}>
                <boxGeometry args={[0.5, 0.5, 2.0]} />
                <meshStandardMaterial color={colors.highlight} roughness={0.4} metalness={0.7} />
            </mesh>
            <mesh position={[-0.7, 0, -0.5]}>
                <boxGeometry args={[0.5, 0.5, 2.0]} />
                <meshStandardMaterial color={colors.highlight} roughness={0.4} metalness={0.7} />
            </mesh>

            {/* Wings */}
            <mesh position={[0, 0.2, -0.5]}>
                <boxGeometry args={[3.5, 0.1, 1.5]} />
                <meshStandardMaterial color={colors.main} />
            </mesh>

            {/* Vertical Stabilizers */}
            <mesh position={[0.7, 0.5, -1.2]}>
                <boxGeometry args={[0.1, 0.8, 0.8]} />
                <meshStandardMaterial color={colors.engine} />
            </mesh>
            <mesh position={[-0.7, 0.5, -1.2]}>
                <boxGeometry args={[0.1, 0.8, 0.8]} />
                <meshStandardMaterial color={colors.engine} />
            </mesh>

            <mesh position={[0, 0.4, 0.8]}>
                <boxGeometry args={[0.6, 0.3, 0.8]} />
                <meshStandardMaterial color={colors.canopy} roughness={0.2} metalness={0.8} />
            </mesh>

            {/* Triple Exhaust */}
            <group position={[0, 0, -1.6]}>
                <JetExhaust color="#ef4444" scale={0.8} length={3.0} throttle={effectiveThrottle} throttleRef={throttleRef} />
            </group>
            <group position={[0.7, 0, -1.6]}>
                <JetExhaust color="#ef4444" scale={0.6} length={2.5} throttle={effectiveThrottle} throttleRef={throttleRef} />
            </group>
            <group position={[-0.7, 0, -1.6]}>
                <JetExhaust color="#ef4444" scale={0.6} length={2.5} throttle={effectiveThrottle} throttleRef={throttleRef} />
            </group>
        </group>
    );
};
