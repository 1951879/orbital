
import React, { useMemo } from 'react';
import * as THREE from 'three';
// Fix: Import ThreeElements to provide JSX intrinsic types
import { ThreeElements } from '@react-three/fiber';
import { JetExhaust } from '../../effects/JetExhaust';
import { AIRPLANE_SCALES } from '../AirplaneConfig';

export const Scout: React.FC<{ playerId?: number, throttle?: number, throttleRef?: React.MutableRefObject<number> }> = ({ playerId = 1, throttle, throttleRef }) => {
   const effectiveThrottle = throttle ?? 0.5;
   // ...


   const colors = {
      main: '#e2e8f0',
      highlight: '#f97316',
      engine: '#94a3b8',
      canopy: '#0ea5e9'
   };

   const { wingShape, wingletShape, strakeShape } = useMemo(() => {
      const wing = new THREE.Shape();
      wing.moveTo(0, 0.4);
      wing.lineTo(1.8, -0.6);
      wing.lineTo(1.8, -1.0);
      wing.lineTo(0, -0.4);
      wing.lineTo(0, 0.4);

      const winglet = new THREE.Shape();
      winglet.moveTo(0, 0);
      winglet.lineTo(-0.4, 0);
      winglet.lineTo(-0.7, 0.3);

      const strake = new THREE.Shape();
      strake.moveTo(0, 0.8);
      strake.lineTo(0.3, 0);
      strake.lineTo(0, 0);
      strake.lineTo(0, 0.8);

      return { wingShape: wing, wingletShape: winglet, strakeShape: strake };
   }, []);

   return (
      <group scale={[AIRPLANE_SCALES.scout, AIRPLANE_SCALES.scout, AIRPLANE_SCALES.scout]}>
         <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.5]}>
            <coneGeometry args={[0.3, 3.2, 16]} />
            <meshStandardMaterial color={colors.main} roughness={0.1} metalness={0.9} />
         </mesh>

         <group position={[0, -0.05, -0.2]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
               <extrudeGeometry args={[wingShape, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01 }]} />
               <meshStandardMaterial color={colors.main} roughness={0.3} metalness={0.7} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]} scale={[-1, 1, 1]}>
               <extrudeGeometry args={[wingShape, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01 }]} />
               <meshStandardMaterial color={colors.main} roughness={0.3} metalness={0.7} />
            </mesh>

            <mesh position={[1.8, 0.05, -0.6]} rotation={[0, -Math.PI / 2, 0]}>
               <extrudeGeometry args={[wingletShape, { depth: 0.04, bevelEnabled: false }]} />
               <meshStandardMaterial color={colors.highlight} roughness={0.2} metalness={0.5} />
            </mesh>
            <mesh position={[-1.8, 0.05, -0.6]} rotation={[0, -Math.PI / 2, 0]} scale={[1, 1, -1]}>
               <extrudeGeometry args={[wingletShape, { depth: 0.04, bevelEnabled: false }]} />
               <meshStandardMaterial color={colors.highlight} roughness={0.2} metalness={0.5} />
            </mesh>
         </group>

         <group position={[0, -0.05, 0.6]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.2, 0, 0]}>
               <extrudeGeometry args={[strakeShape, { depth: 0.02, bevelEnabled: false }]} />
               <meshStandardMaterial color={colors.main} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.2, 0, 0]} scale={[-1, 1, 1]}>
               <extrudeGeometry args={[strakeShape, { depth: 0.02, bevelEnabled: false }]} />
               <meshStandardMaterial color={colors.main} />
            </mesh>
         </group>

         <mesh position={[0, 0.15, 0.5]}>
            <sphereGeometry args={[0.22, 24, 24]} />
            <meshStandardMaterial color={colors.canopy} roughness={0.0} metalness={1.0} opacity={0.6} transparent emissive={colors.canopy} emissiveIntensity={0.3} />
         </mesh>

         <mesh position={[0, 0, -1.0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.25, 0.15, 0.6, 12]} />
            <meshStandardMaterial
               color="#2d3748"
               emissive={colors.highlight}
               emissiveIntensity={effectiveThrottle * 2.5}
               metalness={0.9}
               roughness={0.4}
            />
         </mesh>

         <group position={[0, 0, -1.2]}>
            <JetExhaust color={colors.highlight} scale={0.8} length={2.5} throttle={effectiveThrottle} throttleRef={throttleRef} />
         </group>
      </group>
   );
};
