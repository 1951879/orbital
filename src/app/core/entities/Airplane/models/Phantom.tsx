
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { ThreeElements } from '@react-three/fiber';
import { JetExhaust } from '../../effects/JetExhaust';
import { AIRPLANE_SCALES } from '../AirplaneConfig';

export const Phantom: React.FC<{ playerId?: number, throttle?: number, throttleRef?: React.MutableRefObject<number> }> = ({ playerId = 1, throttle, throttleRef }) => {
    const effectiveThrottle = throttle ?? 0.5;

    const colors = { main: '#27272a', highlight: '#7e22ce', engine: '#18181b', canopy: '#a855f7' };

    const deltaShape = useMemo(() => {
        const shape = new THREE.Shape();
        shape.moveTo(0, 1.5);
        shape.lineTo(2.0, -1.0);
        shape.lineTo(0, -0.5);
        shape.lineTo(-2.0, -1.0);
        shape.lineTo(0, 1.5);
        return shape;
    }, []);

    return (
        <group scale={[AIRPLANE_SCALES.phantom, AIRPLANE_SCALES.phantom, AIRPLANE_SCALES.phantom]}>
            {/* Main Body */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <extrudeGeometry args={[deltaShape, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05 }]} />
                <meshStandardMaterial color={colors.main} roughness={0.2} metalness={0.8} />
            </mesh>

            {/* Cockpit Bulge */}
            <mesh position={[0, 0.2, 0.5]} scale={[1, 0.4, 1.5]}>
                <sphereGeometry args={[0.4, 16, 16]} />
                <meshStandardMaterial color={colors.main} roughness={0.3} metalness={0.7} />
            </mesh>

            {/* Glowing Sensor Strip */}
            <mesh position={[0, 0.25, 0.8]} rotation={[0, 0, 0]}>
                <boxGeometry args={[0.6, 0.05, 0.1]} />
                <meshStandardMaterial color={colors.canopy} emissive={colors.canopy} emissiveIntensity={1.0} />
            </mesh>

            {/* Winglets */}
            <mesh position={[1.8, 0.2, -0.8]} rotation={[0, 0, 0.5]}>
                <boxGeometry args={[0.1, 0.5, 0.8]} />
                <meshStandardMaterial color={colors.engine} />
            </mesh>
            <mesh position={[-1.8, 0.2, -0.8]} rotation={[0, 0, -0.5]}>
                <boxGeometry args={[0.1, 0.5, 0.8]} />
                <meshStandardMaterial color={colors.engine} />
            </mesh>

            {/* Hidden Exhausts */}
            <group position={[0.5, 0.1, -1.0]}>
                <JetExhaust color={colors.highlight} scale={0.7} length={2.0} throttle={effectiveThrottle} throttleRef={throttleRef} />
            </group>
            <group position={[-0.5, 0.1, -1.0]}>
                <JetExhaust color={colors.highlight} scale={0.7} length={2.0} throttle={effectiveThrottle} throttleRef={throttleRef} />
            </group>
        </group>
    );
};
