
import React, { useMemo } from 'react';
import * as THREE from 'three';
// Fix: Import ThreeElements to provide JSX intrinsic types
import { ThreeElements } from '@react-three/fiber';
import { JetExhaust } from '../effects/JetExhaust';

export const Interceptor: React.FC<{ playerId?: number, throttle?: number }> = ({ playerId = 1, throttle }) => {
  const effectiveThrottle = throttle ?? 0.5;

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
     <group scale={[0.33, 0.33, 0.33]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.25, 0.45, 2.2, 8]} />
            <meshStandardMaterial color={colors.main} roughness={0.2} metalness={0.7} />
        </mesh>
        
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.15, -0.2]}>
            <extrudeGeometry args={[wingShape, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 }]} />
            <meshStandardMaterial color={colors.main} roughness={0.2} metalness={0.7} />
        </mesh>

        <mesh position={[0.05, 0.45, -0.6]} rotation={[0, -Math.PI/2, 0]}>
             <extrudeGeometry args={[finShape, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 }]} />
             <meshStandardMaterial color={colors.highlight} roughness={0.3} metalness={0.4} emissive={colors.highlight} emissiveIntensity={0.2} />
        </mesh>

        <mesh position={[0, 0, -1.15]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.3, 0.35, 0.5, 16]} />
            <meshStandardMaterial 
              color={colors.engine} 
              emissive={colors.highlight} 
              emissiveIntensity={effectiveThrottle * 2.0} 
              roughness={0.4} 
              metalness={0.8} 
            />
        </mesh>
        
        <group position={[0, 0, -1.35]}>
            <JetExhaust color={colors.highlight} scale={1.2} throttle={effectiveThrottle} />
        </group>

        <mesh position={[0, 0.25, 0.6]} rotation={[Math.PI / 1.9, 0, 0]}>
            <capsuleGeometry args={[0.13, 0.6, 4, 16]} />
            <meshStandardMaterial color={colors.canopy} roughness={0.1} metalness={1.0} emissive={colors.canopy} emissiveIntensity={0.4} />
        </mesh>
     </group>
  );
};
