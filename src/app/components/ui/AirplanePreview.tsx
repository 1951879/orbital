
import React, { useRef } from 'react';
// Fix: Import ThreeElements to provide JSX intrinsic types
import { useFrame, ThreeElements } from '@react-three/fiber';
import { AirplaneGeometry } from '../AirplaneGeometry';
import { AirplaneType } from '../../../types';

export const AirplanePreview: React.FC<{ type: AirplaneType; autoRotate?: boolean }> = ({ type, autoRotate = true }) => {
  const groupRef = useRef<any>(null);
  useFrame((state, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.5;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      <AirplaneGeometry type={type} />
    </group>
  );
};
