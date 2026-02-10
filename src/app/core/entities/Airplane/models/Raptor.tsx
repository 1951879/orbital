
import React, { useMemo } from 'react';
import * as THREE from 'three';
// Fix: Import ThreeElements to provide JSX intrinsic types
import { ThreeElements } from '@react-three/fiber';
import { JetExhaust } from '../../effects/JetExhaust';
import { AIRPLANE_SCALES } from '../AirplaneConfig';

export const Raptor: React.FC<{ playerId?: number, throttle?: number, throttleRef?: React.MutableRefObject<number> }> = ({ playerId = 1, throttle, throttleRef }) => {
    const effectiveThrottle = throttle ?? 0.5;
    // ... (lines omitted)


    const colors = {
        main: '#15803d',
        highlight: '#84cc16',
        engine: '#020617',
        canopy: '#f59e0b',
        exhaust: '#22c55e'
    };

    const { raptorWing, raptorTail, raptorFin } = useMemo(() => {
        const rWing = new THREE.Shape();
        rWing.moveTo(0, -1.2);
        rWing.lineTo(0.4, -1.2);
        rWing.lineTo(1.8, 0.4);
        rWing.lineTo(1.8, 0.6);
        rWing.lineTo(0.4, 1.0);
        rWing.lineTo(-0.4, 1.0);
        rWing.lineTo(-1.8, 0.6);
        rWing.lineTo(-1.8, 0.4);
        rWing.lineTo(-0.4, -1.2);
        rWing.lineTo(0, -1.2);

        const rTail = new THREE.Shape();
        rTail.moveTo(0.2, 0);
        rTail.lineTo(1.2, 0.8);
        rTail.lineTo(1.2, 1.2);
        rTail.lineTo(0.2, 1.0);
        rTail.lineTo(0.2, 0);

        const rFin = new THREE.Shape();
        rFin.moveTo(-0.2, 0.9);
        rFin.lineTo(0.4, 0.75);
        rFin.lineTo(0.2, -0.2);
        rFin.lineTo(-0.8, -0.2);
        rFin.lineTo(-0.2, 0.9);

        return { raptorWing: rWing, raptorTail: rTail, raptorFin: rFin };
    }, []);

    return (
        <group scale={[AIRPLANE_SCALES.raptor, AIRPLANE_SCALES.raptor, AIRPLANE_SCALES.raptor]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1.4, 0.5, 0.6]}>
                <cylinderGeometry args={[0.35, 0.5, 2.6, 8]} />
                <meshStandardMaterial color={colors.main} roughness={0.3} metalness={0.6} />
            </mesh>

            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0.0]} scale={[1.5, .5, 1]}>
                <extrudeGeometry args={[raptorWing, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.005, bevelSegments: 1 }]} />
                <meshStandardMaterial color={colors.main} roughness={0.3} metalness={0.6} />
            </mesh>

            <group position={[0, 0, -1.2]}>
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.4, 0, 0]}>
                    <extrudeGeometry args={[raptorTail, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.005 }]} />
                    <meshStandardMaterial color={colors.main} roughness={0.3} metalness={0.6} />
                </mesh>
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.4, 0, 0]} scale={[-1, 1, 1]}>
                    <extrudeGeometry args={[raptorTail, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.005 }]} />
                    <meshStandardMaterial color={colors.main} roughness={0.3} metalness={0.6} />
                </mesh>
            </group>

            <group position={[0, 0.35, -1.1]}>
                <mesh rotation={[0, -Math.PI / -2, 0]} position={[-0.6, 0, -.5]}>
                    <extrudeGeometry args={[raptorFin, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.005 }]} />
                    <meshStandardMaterial color={colors.highlight} roughness={0.4} metalness={0.3} emissive={colors.highlight} emissiveIntensity={0.1} />
                </mesh>
                <mesh rotation={[0, -Math.PI / -2, 0]} position={[0.5, 0, -.5]}>
                    <extrudeGeometry args={[raptorFin, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.005 }]} />
                    <meshStandardMaterial color={colors.highlight} roughness={0.4} metalness={0.3} emissive={colors.highlight} emissiveIntensity={0.1} />
                </mesh>
            </group>

            <group position={[0, 0, -1.3]}>
                <mesh position={[0.3, 0.15, 0]}>
                    <boxGeometry args={[0.4, 0.25, 0.5]} />
                    <meshStandardMaterial color={colors.engine} emissive={colors.exhaust} emissiveIntensity={effectiveThrottle * 1.5} />
                </mesh>
                <mesh position={[-0.3, 0.15, 0]}>
                    <boxGeometry args={[0.4, 0.25, 0.5]} />
                    <meshStandardMaterial color={colors.engine} emissive={colors.exhaust} emissiveIntensity={effectiveThrottle * 1.5} />
                </mesh>

                <group position={[0.3, 0.15, -0.2]}>
                    <JetExhaust color={colors.exhaust} scale={0.9} length={2.5} throttle={effectiveThrottle} />
                </group>
                <group position={[-0.3, 0.15, -0.2]}>
                    <JetExhaust color={colors.exhaust} scale={0.9} length={2.5} throttle={effectiveThrottle} throttleRef={throttleRef} />
                </group>
            </group>

            <mesh position={[0, 0.05, 0.7]} scale={[1.1, 0.5, 1.6]}>
                <sphereGeometry args={[0.3, 16, 16]} />
                <meshStandardMaterial color={colors.canopy} roughness={0.1} metalness={0.9} opacity={0.9} transparent emissive={colors.canopy} emissiveIntensity={0.3} />
            </mesh>
        </group>
    );
};
