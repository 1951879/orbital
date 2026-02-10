import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useStore } from '../../app/store/useStore';
import { AirplaneSim } from '../../app/core/entities/Airplane/AirplaneSim';
import { MathUtils, Euler } from 'three';

// Bridges the gap between V2 Sim (Physics) and V1 Store (UI)
export const TelemetryBridge: React.FC<{ sim: AirplaneSim; playerId: number }> = ({ sim, playerId }) => {
    const lastUpdate = useRef(0);

    useFrame((state) => {
        // Throttle UI updates to 10hz to save React cycles, or run every frame?
        // UI usually needs 60fps for smooth gages. Let's try every frame first.

        // We mainly need to update: speed, altitude, heading, pitch, roll

        const storeState = useStore.getState();
        // Lookup by ID, NOT index (array order changes on join/leave/rejoin)
        const pilot = storeState.localParty.find(p => p.id === playerId);

        if (pilot) {
            // 1. Sync Telemetry
            pilot.telemetry.speed = sim.currentSpeed;
            pilot.telemetry.throttle = sim.throttle;
            pilot.throttle = sim.throttle; // Update top-level prop for React components

            // Calculate altitude above planet surface (for spherical terrain)
            const terrainParams = storeState.terrainParams;
            const planetRadius = terrainParams.planetRadius;
            const distanceFromCenter = sim.position.length();
            pilot.telemetry.altitude = Math.max(0, distanceFromCenter - planetRadius);

            const euler = new Euler().setFromQuaternion(sim.quaternion);
            pilot.telemetry.pitch = euler.x;
            pilot.telemetry.roll = euler.z;
            // Heading is euler.y

            // 2. Sync Position for Minimap/Radar (if used)
            storeState.pilotPositions[playerId].copy(sim.position);
        }
    });

    return null;
};
