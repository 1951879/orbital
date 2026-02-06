
import React from 'react';
import { ThreeElements } from '@react-three/fiber';
import { JetExhaust } from '../effects/JetExhaust';

export const Starling: React.FC<{ playerId?: number, throttle?: number }> = ({ playerId = 1, throttle }) => {
  const effectiveThrottle = throttle ?? 0.5;

  const colors = { main: '#facc15', highlight: '#000000', engine: '#171717', canopy: '#0ea5e9' };

  return (
     <group scale={[0.3, 0.3, 0.3]}>
        {/* Teardrop Body */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
            <sphereGeometry args={[0.8, 16, 16]} />
            <meshStandardMaterial color={colors.main} roughness={0.1} metalness={0.4} />
        </mesh>
        <mesh position={[0, 0, -1.0]} rotation={[Math.PI/2, 0, 0]}>
            <cylinderGeometry args={[0.75, 0.4, 2.0, 16]} />
            <meshStandardMaterial color={colors.main} roughness={0.1} metalness={0.4} />
        </mesh>

        {/* Racing Stripes */}
        <mesh position={[0, 0.81, 0]} rotation={[Math.PI/2, 0, 0]}>
             <planeGeometry args={[0.4, 1.5]} />
             <meshBasicMaterial color={colors.highlight} />
        </mesh>

        {/* Stubby Wings */}
        <mesh position={[0, -0.2, 0.2]}>
            <boxGeometry args={[3.5, 0.2, 1.0]} />
            <meshStandardMaterial color={colors.main} />
        </mesh>
        
        {/* Checkered Tips */}
        <mesh position={[1.5, -0.19, 0.2]}>
             <boxGeometry args={[0.5, 0.21, 1.0]} />
             <meshStandardMaterial color={colors.highlight} />
        </mesh>
        <mesh position={[-1.5, -0.19, 0.2]}>
             <boxGeometry args={[0.5, 0.21, 1.0]} />
             <meshStandardMaterial color={colors.highlight} />
        </mesh>

        {/* Tail */}
        <mesh position={[0, 0.8, -1.5]}>
            <boxGeometry args={[0.1, 1.0, 0.8]} />
            <meshStandardMaterial color={colors.highlight} />
        </mesh>

        {/* Bubble Canopy */}
        <mesh position={[0, 0.5, 0.5]}>
            <sphereGeometry args={[0.45, 16, 16]} />
            <meshStandardMaterial color={colors.canopy} roughness={0.0} metalness={1.0} emissive={colors.canopy} emissiveIntensity={0.2} />
        </mesh>
        
        {/* Single Big Exhaust */}
        <group position={[0, 0, -2.0]}>
            <JetExhaust color="#f59e0b" scale={1.5} length={2.0} throttle={effectiveThrottle} />
        </group>
     </group>
  );
};
