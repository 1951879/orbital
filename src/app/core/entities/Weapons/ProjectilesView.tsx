import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { InstancedMesh, Object3D, Color } from 'three';
import { ProjectileManager } from '../../../../engine/sim/weapons/ProjectileManager';

export const ProjectilesView: React.FC = () => {
    const meshRef = useRef<InstancedMesh>(null);
    const dummy = useMemo(() => new Object3D(), []);
    const color = useMemo(() => new Color('#ff4400').multiplyScalar(5), []); // Glowing orange

    useFrame(() => {
        if (!meshRef.current || !ProjectileManager.instance) return;

        const projectiles = ProjectileManager.instance.projectiles;
        let count = 0;

        for (let i = 0; i < projectiles.length; i++) {
            const p = projectiles[i];
            if (p.active) {
                dummy.position.copy(p.position);
                dummy.quaternion.copy(p.quaternion);
                dummy.scale.set(0.5, 0.5, 8.0); // Long thin laser
                dummy.updateMatrix();
                meshRef.current.setMatrixAt(count, dummy.matrix);
                meshRef.current.setColorAt(count, color);
                count++;
            }
        }

        meshRef.current.count = count;
        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, 100]} frustumCulled={false}>
            <capsuleGeometry args={[0.2, 1, 4, 8]} />
            <meshBasicMaterial toneMapped={false} />
        </instancedMesh>
    );
};
