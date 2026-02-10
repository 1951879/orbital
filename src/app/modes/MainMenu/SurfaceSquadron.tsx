
import React, { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, MathUtils, Group, Object3D, Shape, MeshBasicMaterial } from 'three';
import { Html } from '@react-three/drei';
import { useStore } from '../../store/useStore';
import { PLANES } from '../../components/ui/tabs/data';
import { AirplaneGeometry } from '../../core/entities/Airplane/models/AirplaneGeometry';
import { getTerrainElevation, SimplexNoise } from '../../../engine/utils/terrain';

// Base Team Colors (Dimmer)
const PLAYER_COLORS = ['#1d4ed8', '#b91c1c', '#3b82f6', '#ef4444'];
// Ready Team Colors (Intense/Neon)
const READY_COLORS = ['#60a5fa', '#f87171', '#93c5fd', '#fca5a5'];

const Chevron: React.FC<{ position: [number, number, number], rotation: [number, number, number] }> = ({ position, rotation }) => {
    const shape = useMemo(() => {
        const s = new Shape();
        // Arrowhead pointing right >
        s.moveTo(-0.06, 0.08);
        s.lineTo(0.04, 0);
        s.lineTo(-0.06, -0.08);
        s.lineTo(-0.03, 0);
        s.lineTo(-0.06, 0.08);
        return s;
    }, []);

    return (
        <mesh position={position} rotation={rotation}>
            <shapeGeometry args={[shape]} />
            <meshBasicMaterial color="white" transparent opacity={0.9} depthWrite={false} toneMapped={false} side={2} />
        </mesh>
    );
};

export const SurfaceSquadron: React.FC = () => {
    const localParty = useStore((state) => state.localParty);
    const activeTab = useStore((state) => state.activeMenuTab);
    const terrainParams = useStore((state) => state.terrainParams);
    const terrainSeed = useStore((state) => state.terrainSeed);
    const planetRadius = terrainParams.planetRadius;

    // Use simple lerp factor for transition: 0 = Surface (Hangar), 1 = Orbit (Mission)
    const transitionState = useRef(0);
    const groupRef = useRef<Group>(null);

    // Anchor Position: Equatorial North (0, 0, R) relative to the group center
    const ANCHOR_POS = useMemo(() => new Vector3(0, 0, planetRadius), [planetRadius]);

    // Noise generator for snapping to terrain
    const simplex = useMemo(() => new SimplexNoise(terrainSeed), [terrainSeed]);

    useFrame((state, delta) => {
        // Transition Logic
        const target = activeTab === 'hangar' ? 0 : 1;
        // Increased damping speed (2.0 -> 8.0) so formation settles before camera arrives
        transitionState.current = MathUtils.damp(transitionState.current, target, 8.0, delta);

        const t = transitionState.current;

        // Ring Scale: 1.25 (Hangar) -> 2.5 (Orbit)
        const ringScale = MathUtils.lerp(1.25, 2.5, t);

        // Dynamic Spread: Reduced to 1.5x (was 3.0x) to tighten formation
        const spread = ringScale * 1.8;

        // --- UNIFORM ALTITUDE CALCULATION ---
        let maxElevation = -Infinity;

        const slotOffsets = [
            { x: 0, y: 0.5 },           // P1 (Center)
            { x: 1, y: 0.2 },           // P2 (Right, slight back)
            { x: -1, y: 0.2 },          // P3 (Left, slight back)
            { x: 0, y: -0.7 }           // P4 (Rear center)
        ];

        // 1. Scan all slots for max height (using local coordinates relative to group)
        for (let i = 0; i < 4; i++) {
            const off = slotOffsets[i];
            const localPos = new Vector3(off.x * spread, off.y * spread, 0);
            // Get the position on the unit sphere surface relative to group rotation
            const geometryPos = ANCHOR_POS.clone().add(localPos).normalize().multiplyScalar(planetRadius);

            const h = getTerrainElevation(geometryPos.x, geometryPos.y, geometryPos.z, simplex, terrainParams);
            if (h > maxElevation) maxElevation = h;
        }

        // 2. Set formation altitude
        const formationAltitude = planetRadius + maxElevation + 1.5;

        // 3. Sync Rotation with Planet
        if (groupRef.current) {
            // Apply the global terrain rotation to this group so planes stick to the ground
            const terrainRotation = useStore.getState().terrainRotation;
            groupRef.current.rotation.y = terrainRotation;

            // CRITICAL: Update matrix world immediately so children calculations use the latest rotation
            groupRef.current.updateMatrixWorld();

            groupRef.current.children.forEach((child, i) => {
                const pilot = localParty[i];
                if (!pilot) {
                    child.visible = false;
                    return;
                }
                child.visible = true;

                const off = slotOffsets[i];
                const localPosOffset = new Vector3(off.x * spread, off.y * spread, 0);

                // Local Position on Sphere Surface
                const localPos = ANCHOR_POS.clone().add(localPosOffset).normalize().multiplyScalar(formationAltitude);
                child.position.copy(localPos);

                // --- ROBUST ORIENTATION ---
                // We want the plane to align with the Surface Normal (Up) and face Local North (Forward)
                const localNormal = localPos.clone().normalize();
                const localNorth = new Vector3(0, 1, 0);

                // Calculate target point in Local Space (Just slightly North of current pos)
                const localTarget = localPos.clone().add(localNorth);

                // Convert Local vectors to World vectors for lookAt()
                // transformDirection handles rotation only (for normal)
                // applyMatrix4 handles rotation+translation (for point target)
                const worldNormal = localNormal.clone().transformDirection(groupRef.current!.matrixWorld);
                const worldTarget = localTarget.clone().applyMatrix4(groupRef.current!.matrixWorld);

                child.up.copy(worldNormal);
                child.lookAt(worldTarget);

                // --- PLANE CONTAINER ROTATION ---
                const planeContainer = child.getObjectByName('plane-container');
                if (planeContainer) {
                    planeContainer.rotation.set(0, 0, 0);
                    if (t < 0.5) {
                        // Apply Inspection Rotation
                        planeContainer.rotateY(pilot.ui.viewRotation.x);
                        planeContainer.rotateX(pilot.ui.viewRotation.y);
                    }
                }

                // Scale Ring
                const ring = child.getObjectByName('landing-ring');
                if (ring) {
                    ring.scale.setScalar(ringScale);
                }
            });
        }
    });

    return (
        <group ref={groupRef}>
            {/* Render slots for up to 4 potential pilots */}
            {[0, 1, 2, 3].map((i) => {
                const pilot = localParty.find(p => p.id === i);
                const planeType = pilot?.airplane || PLANES[i % PLANES.length].id;

                // Color Intensity Logic
                const isReady = pilot?.ui.status === 'ready';
                const isSelecting = pilot?.ui.status === 'selecting';
                const color = isReady ? READY_COLORS[i] : PLAYER_COLORS[i];
                const opacity = isReady ? 0.9 : 0.4; // Brighter and more opaque when ready

                if (!pilot) return <group key={i} visible={false} />;

                return (
                    <group key={i}>
                        {/* Landing Ring */}
                        <mesh name="landing-ring" rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.5, 0]}>
                            <ringGeometry args={[0.8, 1.0, 32]} />
                            <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} toneMapped={false} />

                            {/* Chevrons - Only Visible when Selecting */}
                            {isSelecting && (
                                <group>
                                    {/* Right > */}
                                    <Chevron position={[0.9, 0, 0.01]} rotation={[0, 0, 0]} />
                                    {/* Left < */}
                                    <Chevron position={[-0.9, 0, 0.01]} rotation={[0, 0, Math.PI]} />
                                </group>
                            )}
                        </mesh>

                        {/* The Plane */}
                        <group name="plane-container">
                            <AirplaneGeometry type={planeType} throttle={0} />
                        </group>
                    </group>
                );
            })}
        </group>
    );
};
