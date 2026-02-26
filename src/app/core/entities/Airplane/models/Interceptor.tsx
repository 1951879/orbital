
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Vector3 } from 'three';
import { ThreeElements, useFrame } from '@react-three/fiber';
import { JetExhaust } from '../../effects/JetExhaust';
import { AirplaneDef, AirplaneModelProps } from './AirplaneDef';

const Interceptor: React.FC<AirplaneModelProps> = ({ playerId = 1, throttle, throttleRef, scale }) => {
  const effectiveThrottle = throttle ?? 0.5;

  const engineRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(() => {
    if (engineRef.current) {
      // Use ref for 60fps update, fallback to static prop
      const t = throttleRef?.current ?? effectiveThrottle;
      engineRef.current.emissiveIntensity = t * 2.0;
    }
  });

  const colors = { main: '#0ea5e9', highlight: '#dc2626', engine: '#0f172a', canopy: '#fbbf24' };

  const { wingShape, finShape } = useMemo(() => {
    const wing = new THREE.Shape();
    wing.moveTo(0, -1.3);
    wing.lineTo(1.4, 0.8);
    wing.lineTo(0, 0.2);
    wing.lineTo(-1.4, 0.8);
    wing.lineTo(0, -1.3);

    const fin = new THREE.Shape();
    fin.moveTo(-0.8, 0.9);
    fin.lineTo(0.5, -0.2);
    fin.lineTo(-0.3, -0.2);
    fin.lineTo(-0.8, 0.9);

    return { wingShape: wing, finShape: fin };
  }, []);

  return (
    <group scale={[scale, scale, scale]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.25, 0.45, 2.2, 8]} />
        <meshStandardMaterial color={colors.main} roughness={0.2} metalness={0.7} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.15, -0.2]}>
        <extrudeGeometry args={[wingShape, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 }]} />
        <meshStandardMaterial color={colors.main} roughness={0.2} metalness={0.7} />
      </mesh>

      <mesh position={[0.05, 0.45, -0.6]} rotation={[0, -Math.PI / 2, 0]}>
        <extrudeGeometry args={[finShape, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 }]} />
        <meshStandardMaterial color={colors.highlight} roughness={0.3} metalness={0.4} emissive={colors.highlight} emissiveIntensity={0.2} />
      </mesh>

      <mesh position={[0, 0, -1.15]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.3, 0.35, 0.5, 16]} />
        <meshStandardMaterial
          ref={engineRef}
          color={colors.engine}
          emissive={colors.highlight}
          emissiveIntensity={effectiveThrottle * 2.0}
          roughness={0.4}
          metalness={0.8}
        />
      </mesh>

      <group position={[0, 0, -1.35]}>
        <JetExhaust color={colors.highlight} scale={1.2} throttle={effectiveThrottle} throttleRef={throttleRef} />
      </group>

      <mesh position={[0, 0.25, 0.6]} rotation={[Math.PI / 1.9, 0, 0]}>
        <capsuleGeometry args={[0.13, 0.6, 4, 16]} />
        <meshStandardMaterial color={colors.canopy} roughness={0.1} metalness={1.0} emissive={colors.canopy} emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
};

export default {
  type: 'interceptor',
  name: 'Interceptor',
  description: 'Balanced multi-role fighter.',
  scale: 0.33,
  collisionPoints: [
    new Vector3(0, -0.5, 1.8),
    new Vector3(0, 0.5, 1.8),
    new Vector3(0, -0.5, -1.8),
    new Vector3(0, 0.8, -1.8),
    new Vector3(2.5, 0, -0.5),
    new Vector3(-2.5, 0, -0.5),
  ],
  weaponHardpoints: [
    new Vector3(2, 0, 5),  // Right Wing (+Z is forward physically)
    new Vector3(-2, 0, 5), // Left Wing
  ],
  audio: {
    engineBaseFreq: 110, engineType: 'sawtooth', engineMix: 0.18,
    whineBaseFreq: 800, whineType: 'sine', whineModulation: 800, whineMix: 0.04,
    rumbleMix: 0.7, rumbleFilterFreq: 350,
    windMix: 0.6, windTone: 200, maneuverNoiseOffset: 2.0, volMult: 0.3,
  },
  stats: {
    turnSpeed: 1.3,
    maxSpeed: 1.25,
    acceleration: 1.2,
    agility: 1.3
  },
  Component: Interceptor,
} satisfies AirplaneDef;
