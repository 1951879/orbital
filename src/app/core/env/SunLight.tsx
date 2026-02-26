import React from 'react';
import { Stars, Environment } from '@react-three/drei';

export const SunLight: React.FC = () => {
    return (
        <>
            <color attach="background" args={['#0f172a']} />
            <ambientLight intensity={0.05} />
            <directionalLight position={[10, 10, 5]} intensity={3} castShadow />
            <Stars radius={300} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            {/* <Environment preset="city" /> -- Removing this because it adds uncontrollable IBL brightness */}
        </>
    );
};
