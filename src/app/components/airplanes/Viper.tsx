
import React, { useMemo } from 'react';
import * as THREE from 'three';
// Fix: Import ThreeElements to provide JSX intrinsic types
import { ThreeElements } from '@react-three/fiber';
import { JetExhaust } from '../effects/JetExhaust';

export const Viper: React.FC<{ playerId?: number, throttle?: number, throttleRef?: React.MutableRefObject<number> }> = ({ playerId = 1, throttle, throttleRef }) => {
    const effectiveThrottle = throttle ?? 0.5;
    // ...


    const colors = { main: '#b91c1c', highlight: '#fca5a5', engine: '#18181b', canopy: '#0ea5e9' };

    const { wingShape, finShape } = useMemo(() => {
        // Forward swept wing
        const wing = new THREE.Shape();
        wing.moveTo(0, -0.2);
        wing.lineTo(1.5, 0.8); // Tip forward
        wing.lineTo(1.5, 1.2);
        wing.lineTo(0, 1.0);   // Root back
        wing.lineTo(0, -0.2);

        const fin = new THREE.Shape();
        fin.moveTo(-0.5, 1.2);
        fin.lineTo(0.5, 0.5);
        fin.lineTo(-0.5, 0.0);
        fin.lineTo(-0.8, 1.2);

        return { wingShape: wing, finShape: fin };
    }, []);

    return (
        <group scale={[0.35, 0.35, 0.35]}>
            {/* Fuselage */}
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.2]}>
                <cylinderGeometry args={[0.2, 0.35, 2.5, 8]} />
                <meshStandardMaterial color={colors.main} roughness={0.2} metalness={0.6} />
            </mesh>

            {/* Wings */}
            <group position={[0, -0.1, -0.5]}>
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                    <extrudeGeometry args={[wingShape, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02 }]} />
                    <meshStandardMaterial color={colors.main} roughness={0.2} metalness={0.5} />
                </mesh>
                <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[-1, 1, 1]}>
                    <extrudeGeometry args={[wingShape, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02 }]} />
                    <meshStandardMaterial color={colors.main} roughness={0.2} metalness={0.5} />
                </mesh>
            </group>

            {/* Fins - Rotated 90 deg Y to align with airflow, slanted for V-Tail */}
            <group position={[0, 0.2, -1.0]}>
                <mesh rotation={[0, -Math.PI / 2, -0.45]} position={[0.3, -.4, 0]}>
                    <extrudeGeometry args={[finShape, { depth: 0.05, bevelEnabled: false }]} />
                    <meshStandardMaterial color={colors.engine} />
                </mesh>
                <mesh rotation={[0, -Math.PI / 2, -0.45]} position={[-0.3, -.4, 0]}>
                    <extrudeGeometry args={[finShape, { depth: 0.05, bevelEnabled: false }]} />
                    <meshStandardMaterial color={colors.engine} />
                </mesh>
            </group>

            {/* Engine Intake */}
            <mesh position={[0, -0.2, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.25, 0.15, 0.4, 8]} />
                <meshStandardMaterial color={colors.engine} />
            </mesh>

            {/* Canopy */}
            <mesh position={[0, 0.25, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
                <capsuleGeometry args={[0.15, 0.5, 4, 8]} />
                <meshStandardMaterial color={colors.canopy} roughness={0.0} metalness={0.9} emissive={colors.canopy} emissiveIntensity={0.2} />
            </mesh>

            {/* Exhaust */}
            <group position={[0, 0, -1.1]}>
                <JetExhaust color="#ff0000" scale={1.3} length={3.5} throttle={effectiveThrottle} throttleRef={throttleRef} />
            </group>
        </group>
    );
};
