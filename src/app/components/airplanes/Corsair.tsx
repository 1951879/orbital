
import React, { useMemo } from 'react';
import * as THREE from 'three';
// Fix: Import ThreeElements to provide JSX intrinsic types
import { ThreeElements } from '@react-three/fiber';
import { JetExhaust } from '../effects/JetExhaust';

export const Corsair: React.FC<{ playerId?: number, throttle?: number, throttleRef?: React.MutableRefObject<number> }> = ({ playerId = 1, throttle, throttleRef }) => {
    const effectiveThrottle = throttle ?? 0.5;

    const colors = { main: '#ca8a04', highlight: '#1e3a8a', engine: '#475569', canopy: '#38bdf8' };

    const wingSection = useMemo(() => {
        const shape = new THREE.Shape();
        shape.moveTo(0, -0.5);
        shape.lineTo(1.5, 0.5);
        shape.lineTo(1.5, 1.5);
        shape.lineTo(0, 0.5);
        return shape;
    }, []);

    return (
        <group scale={[0.35, 0.35, 0.35]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.4, 0.3, 3.0, 12]} />
                <meshStandardMaterial color={colors.highlight} roughness={0.4} metalness={0.5} />
            </mesh>

            <mesh position={[0, 0, 1.5]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.1, 0.4, 0.8, 12]} />
                <meshStandardMaterial color={colors.main} />
            </mesh>

            {/* Gull Wings */}
            <group position={[0, -0.2, 0.2]}>
                {/* Inner Wing Down */}
                <mesh position={[0.6, -0.3, 0]} rotation={[0, 0, -0.5]}>
                    <boxGeometry args={[1.5, 0.1, 1.2]} />
                    <meshStandardMaterial color={colors.main} roughness={0.3} metalness={0.4} />
                </mesh>
                <mesh position={[-0.6, -0.3, 0]} rotation={[0, 0, 0.5]}>
                    <boxGeometry args={[1.5, 0.1, 1.2]} />
                    <meshStandardMaterial color={colors.main} roughness={0.3} metalness={0.4} />
                </mesh>

                {/* Outer Wing Flat */}
                <mesh position={[2.0, -0.6, 0]}>
                    <boxGeometry args={[2.0, 0.1, 1.0]} />
                    <meshStandardMaterial color={colors.highlight} roughness={0.3} metalness={0.4} />
                </mesh>
                <mesh position={[-2.0, -0.6, 0]}>
                    <boxGeometry args={[2.0, 0.1, 1.0]} />
                    <meshStandardMaterial color={colors.highlight} roughness={0.3} metalness={0.4} />
                </mesh>
            </group>

            <mesh position={[0, 0.3, -0.5]}>
                <sphereGeometry args={[0.35, 16, 16]} />
                <meshStandardMaterial color={colors.canopy} roughness={0.1} metalness={0.9} opacity={0.7} transparent />
            </mesh>

            <group position={[0, 0, -1.6]}>
                <JetExhaust color={colors.main} scale={1.0} length={3.0} throttle={effectiveThrottle} throttleRef={throttleRef} />
            </group>
        </group>
    );
};
