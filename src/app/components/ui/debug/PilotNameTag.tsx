
import React, { useMemo, useEffect, useRef } from 'react';
import { Billboard, Text } from '@react-three/drei';
import { Group, Layers } from 'three';

interface PilotNameTagProps {
    name: string;
    playerId: number; // 0-3
    color: string;
}

export const PilotNameTag: React.FC<PilotNameTagProps> = ({ name, playerId, color }) => {
    const groupRef = useRef<Group>(null);

    // LAYER LOGIC:
    // We want this tag to be visible to EVERYONE EXCEPT 'playerId'.
    // Strategy:
    // 1. Assign this object to a specific Layer corresponding to the Player (index + 1).
    //    Layer 1 = Player 0's Tag
    //    Layer 2 = Player 1's Tag...
    // 2. The Camera for Player X will have Layer (X+1) DISABLED.
    // 3. BUT, simple Layers are exclusive if using .set(). We used .enable().
    //    Actually, objects usually belong to Layer 0 (default).
    //    If we set .layers.set(X), it is REMOVED from Layer 0.
    //    So it is ONLY visible to cameras that enable X.
    //    
    //    Correct Strategy:
    //    - Tag is on Layer X.
    //    - ALL Cameras Default to seeing Layer 0.
    //    - ALL Cameras ENABLE Layer 1, 2, 3, 4.
    //    - Camera X DISABLES Layer X.

    const layerIndex = playerId + 1; // 1, 2, 3, 4

    useEffect(() => {
        if (groupRef.current) {
            // Traverse to set layers for text mesh too
            groupRef.current.traverse((obj) => {
                obj.layers.set(layerIndex);
            });
        }
    }, [layerIndex]);

    return (
        <group ref={groupRef} position={[0, 8, 0]}>
            <Billboard>
                {/* NAME TEXT */}
                <Text
                    fontSize={2.5}
                    color="white"
                    anchorX="center"
                    anchorY="bottom"
                    outlineWidth={0.2}
                    outlineColor="black"
                >
                    {name}
                </Text>

                {/* ARROW / INDICATOR */}
                <Text
                    position={[0, -1.0, 0]}
                    fontSize={1.5}
                    color={color}
                    anchorX="center"
                    anchorY="top"
                    outlineWidth={0.1}
                    outlineColor="black"
                >
                    ▼
                </Text>
            </Billboard>
        </group>
    );
};
