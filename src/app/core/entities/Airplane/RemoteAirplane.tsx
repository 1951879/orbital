import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import { AirplaneGeometry } from './models/AirplaneGeometry';
import { remoteEntityState } from '../../../store/useRemoteEntities';
import { AirplaneType } from '../../../../types';

/**
 * RemoteAirplane — renders a remote player's airplane.
 *
 * Reads from the mutable `remoteEntityState` Map inside useFrame (no re-renders).
 * Performs lerp/slerp interpolation toward the latest network target.
 */
export const RemoteAirplane: React.FC<{
    entityId: string;
}> = ({ entityId }) => {
    const groupRef = useRef<Group>(null);
    const throttleRef = useRef(0);

    // Read type once on mount from mutable state
    const type = useMemo(() => {
        const data = remoteEntityState.get(entityId);
        return (data?.type || 'interceptor') as AirplaneType;
    }, [entityId]);

    useFrame((_state, delta) => {
        if (!groupRef.current) return;

        const data = remoteEntityState.get(entityId);
        if (!data) return;

        // Interpolate toward network target (smooth)
        const lerpRate = Math.min(1, delta * 15);
        data.pos.lerp(data.targetPos, lerpRate);
        data.quat.slerp(data.targetQuat, lerpRate);

        // Apply to group
        groupRef.current.position.copy(data.pos);
        groupRef.current.quaternion.copy(data.quat);

        // Update throttle for exhaust effects
        throttleRef.current = data.throttle;
    });

    return (
        <group ref={groupRef}>
            <AirplaneGeometry
                type={type}
                playerId={-1}
                throttleRef={throttleRef}
            />
        </group>
    );
};
