
import React from 'react';
// Fix: Import ThreeElements to provide JSX intrinsic types
import { ThreeElements } from '@react-three/fiber';
import { JetExhaust } from '../effects/JetExhaust';

export const Bomber: React.FC<{ playerId?: number, throttle?: number, throttleRef?: React.MutableRefObject<number> }> = ({ playerId = 1, throttle, throttleRef }) => {
    const effectiveThrottle = throttle ?? 0.5;
    // ...


    const colors = { main: '#f97316', highlight: '#22d3ee', engine: '#1c1917', canopy: '#10b981' };

    return (
        <group scale={[0.4, 0.4, 0.4]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.5, 0.6, 2.2, 6]} />
                <meshStandardMaterial color={colors.main} roughness={0.4} metalness={0.3} />
            </mesh>
            <mesh position={[0, 0, 0.0]} scale={[4.5, 0.15, 1.5]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color={colors.engine} roughness={0.5} metalness={0.4} />
            </mesh>
            <mesh position={[1.2, -0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.25, 0.2, 1.5, 8]} />
                <meshStandardMaterial color={colors.main} emissive={colors.highlight} emissiveIntensity={effectiveThrottle * 1.0} roughness={0.4} metalness={0.3} />
            </mesh>
            <mesh position={[-1.2, -0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.25, 0.2, 1.5, 8]} />
                <meshStandardMaterial color={colors.main} emissive={colors.highlight} emissiveIntensity={effectiveThrottle * 1.0} roughness={0.4} metalness={0.3} />
            </mesh>
            <mesh position={[0, 0.35, 0.6]} rotation={[Math.PI / 2, 0, 0]}>
                <boxGeometry args={[0.4, 0.6, 0.3]} />
                <meshStandardMaterial color={colors.canopy} roughness={0.2} metalness={0.8} />
            </mesh>
            <group position={[0, 0.4, -0.8]}>
                <mesh rotation={[0.4, 0, 0]}>
                    <boxGeometry args={[0.1, 0.8, 0.6]} />
                    <meshStandardMaterial color={colors.engine} roughness={0.5} metalness={0.4} />
                </mesh>
                <mesh position={[0, 0.3, -0.1]} rotation={[0, 0, 0]}>
                    <boxGeometry args={[1.8, 0.05, 0.4]} />
                    <meshStandardMaterial color={colors.engine} roughness={0.5} metalness={0.4} />
                </mesh>
            </group>

            <group position={[1.2, -0.2, -0.8]}>
                <JetExhaust color={colors.highlight} scale={1.4} length={4.0} throttle={effectiveThrottle} throttleRef={throttleRef} />
            </group>
            <group position={[-1.2, -0.2, -0.8]}>
                <JetExhaust color={colors.highlight} scale={1.4} length={4.0} throttle={effectiveThrottle} throttleRef={throttleRef} />
            </group>
        </group>
    );
};
