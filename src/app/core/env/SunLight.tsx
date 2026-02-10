import React from 'react';
import { Stars, Environment } from '@react-three/drei';

export const SunLight: React.FC = () => {
    return (
        <>
            <ambientLight intensity={0.0} />
            <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
            <Stars radius={300} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            <Environment preset="city" />
        </>
    );
};
