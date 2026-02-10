
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { ThreeElements } from '@react-three/fiber';
import { JetExhaust } from '../effects/JetExhaust';

export const Falcon: React.FC<{ playerId?: number, throttle?: number, throttleRef?: React.MutableRefObject<number> }> = ({ playerId = 1, throttle, throttleRef }) => {
    const effectiveThrottle = throttle ?? 0.5;

    const colors = { main: '#f8fafc', highlight: '#f97316', engine: '#334155', canopy: '#38bdf8' };

    const wingShape = useMemo(() => {
        const shape = new THREE.Shape();
        shape.moveTo(0, 0);
        shape.lineTo(0.5, 0.5);
        shape.lineTo(2.0, -0.5);
        shape.lineTo(2.0, -1.0);
        shape.lineTo(0.5, -0.8);
        shape.lineTo(0, 0);
        return shape;
    }, []);

    return (
        <group scale={[0.35, 0.35, 0.35]}>
            {/* Fuselage */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.15, 0.3, 3.5, 8]} />
                <meshStandardMaterial color={colors.main} roughness={0.3} metalness={0.5} />
            </mesh>

            {/* Wings */}
            <group position={[0, 0, -0.2]}>
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                    <extrudeGeometry args={[wingShape, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02 }]} />
                    <meshStandardMaterial color={colors.main} roughness={0.3} metalness={0.5} />
                </mesh>
                <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[-1, 1, 1]}>
                    <extrudeGeometry args={[wingShape, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02 }]} />
                    <meshStandardMaterial color={colors.main} roughness={0.3} metalness={0.5} />
                </mesh>
            </group>

            {/* Canards */}
            <mesh position={[0, 0.1, 1.0]} rotation={[-Math.PI / 2, 0, 0]}>
                <boxGeometry args={[1.2, 0.4, 0.05]} />
                <meshStandardMaterial color={colors.highlight} />
            </mesh>

            {/* Engine Housing */}
            <mesh position={[0, 0.2, -1.2]}>
                <boxGeometry args={[0.8, 0.5, 1.0]} />
                <meshStandardMaterial color={colors.engine} />
            </mesh>

            {/* Vertical Stabilizer */}
            <mesh position={[0, 0.6, -1.5]} rotation={[0, 0, 0]}>
                <boxGeometry args={[0.1, 0.8, 0.6]} />
                <meshStandardMaterial color={colors.highlight} />
            </mesh>

            {/* Canopy */}
            <mesh position={[0, 0.2, 0.5]} scale={[1, 0.5, 2]}>
                <sphereGeometry args={[0.2, 16, 16]} />
                <meshStandardMaterial color={colors.canopy} roughness={0.1} metalness={0.9} emissive={colors.canopy} emissiveIntensity={0.3} />
            </mesh>

            {/* Exhaust */}
            <group position={[0, 0.2, -1.8]}>
                <JetExhaust color="#38bdf8" scale={1.1} length={3.0} throttle={effectiveThrottle} throttleRef={throttleRef} />
            </group>
        </group>
    );
};
