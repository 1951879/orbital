import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { WorldState } from '../sim/WorldState';
import { Group } from 'three';

// This component reads from the Sim layer (WorldState) and updates the Scene Graph
// It does NOT hold state itself.
export const ViewSync: React.FC = () => {
    const groupRef = useRef<Group>(null);

    useFrame(() => {
        if (!groupRef.current) return;

        // Naive one-to-one mapping for now.
        // In a real implementation, we'd map Entity IDs to Child Meshes.
        // For this prototype, let's assume we are syncing a single debug cube if it exists.

        // Loop through entities and sync
        for (const entity of WorldState.entities) {
            // Find matching mesh in groupRef or update a specific ref passed in logic
            // This is a placeholder for the concept.
        }
    });

    return (
        <group ref={groupRef}>
            {/* Child components would be instantiated here loosely coupled or injected */}
        </group>
    );
};
