import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, MathUtils, Group, Shape, Object3D } from 'three';
import { useStore } from '../../app/store/useStore';
import { AirplaneGeometry } from '../../app/components/AirplaneGeometry';
import { SimplexNoise, getTerrainElevation } from '../utils/terrain';

// --- CHEVRON COMPONENT ---
const Chevron: React.FC<{ position: [number, number, number], rotation: [number, number, number] }> = ({ position, rotation }) => {
    const shape = useMemo(() => {
        const s = new Shape();
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

// Helper to orient a group to look at At, with Up
const OrientGroup: React.FC<{ position: Vector3, lookAt: Vector3, up: Vector3, children: React.ReactNode }> = ({ position, lookAt, up, children }) => {
    const group = useRef<Group>(null);
    useEffect(() => {
        if (group.current) {
            group.current.up.copy(up);
            group.current.lookAt(lookAt);
        }
    }, [position, lookAt, up]);

    return <group ref={group} position={position}>{children}</group>;
};

export const LobbySquadron: React.FC = () => {
    const localParty = useStore((state) => state.localParty);
    const terrainParams = useStore((state) => state.terrainParams);
    const terrainSeed = useStore((state) => state.terrainSeed);
    const planetRadius = terrainParams.planetRadius;

    const squadronAnchor = useStore((state) => state.squadronAnchor);
    const terrainRotation = useStore((state) => state.terrainRotation);
    const simplex = useMemo(() => new SimplexNoise(terrainSeed), [terrainSeed]);

    // --- BASIS VECTORS ---
    // Ensure hooks run unconditionally. Use fallback if null.
    const safeAnchor = squadronAnchor || new Vector3(0, 0, 1);

    // Normal (Up from surface)
    const basisNormal = useMemo(() => safeAnchor.clone().normalize(), [safeAnchor]);
    // Right (Tangent X) = Global Y cross Normal.
    const basisRight = useMemo(() => new Vector3(0, 1, 0).cross(basisNormal).normalize(), [basisNormal]);
    // Forward (Tangent Y) = Normal cross Right
    const basisForward = useMemo(() => basisNormal.clone().cross(basisRight).normalize(), [basisNormal, basisRight]);

    // If no anchor is set (no pilots or initializing), render nothing
    if (!squadronAnchor) return null;

    // Base Team Colors
    const PLAYER_COLORS = ['#1d4ed8', '#b91c1c', '#3b82f6', '#ef4444'];
    const READY_COLORS = ['#60a5fa', '#f87171', '#93c5fd', '#fca5a5'];

    // Formation Offsets (Tangent Plane)
    const spread = 2.5;
    const slotOffsets = [
        { x: 0, y: 0.0 },           // P1 (Front Center)
        { x: .8, y: -0.5 },         // P2 (Right Back)
        { x: -.8, y: -0.5 },        // P3 (Left Back)
        { x: 0, y: -1.2 }           // P4 (Far Back)
    ];

    // --- ELEVATION SAMPLING ---
    // Sample Height ONCE at the Anchor to create a flat "runway" elevation for the formation.
    // This ensures they are all coplanar.
    const anchorSamplePos = squadronAnchor.clone().applyAxisAngle(new Vector3(0, 1, 0), -terrainRotation);
    const anchorH = getTerrainElevation(anchorSamplePos.x, anchorSamplePos.y, anchorSamplePos.z, simplex, terrainParams);
    const formationAlt = 5.0 + Math.max(0, anchorH); // Common Altitude

    return (
        <group>
            {localParty.map((pilot, i) => {
                // Dynamic Slotting: Use Index (i) ensures contiguous fill
                // 0: Leader, 1: Right Wing, 2: Left Wing, 3: Slot/Rear
                const off = slotOffsets[i % 4];

                // Tangent Space Offsets
                const localX = off.x * spread;
                const localY = off.y * spread;

                // 1. Calculate World Position using Basis
                // Pos = Anchor + (Right * X) + (Forward * Y)
                const worldPosNoAlt = squadronAnchor.clone()
                    .add(basisRight.clone().multiplyScalar(localX))
                    .add(basisForward.clone().multiplyScalar(localY));

                // 2. Apply Unified Elevation
                // Project along the surface normal (which is ~ worldPosNoAlt normalized)
                // We use the common formationAlt relative to planetRadius.
                const finalPos = worldPosNoAlt.clone().normalize().multiplyScalar(planetRadius + formationAlt);

                // 3. Orientation
                // Look North (Forward)
                // And Up = Surface Normal.
                const lookTarget = finalPos.clone().add(basisForward);
                const upVec = finalPos.clone().normalize();

                const isReady = pilot.ui.status === 'ready';
                const isSelecting = pilot.ui.status === 'selecting';
                const color = isReady ? READY_COLORS[pilot.id % 4] : PLAYER_COLORS[pilot.id % 4];
                const opacity = isReady ? 0.9 : 0.4;

                return (
                    <OrientGroup key={pilot.id} position={finalPos} lookAt={lookTarget} up={upVec}>
                        {/* Plane Container */}
                        <group>
                            {/* Landing Ring */}
                            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                                <ringGeometry args={[0.8, 1.0, 32]} />
                                <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} toneMapped={false} />

                                {isSelecting && (
                                    <group>
                                        <Chevron position={[.92, 0, 0.01]} rotation={[0, 0, 0]} />
                                        <Chevron position={[-.92, 0, 0.01]} rotation={[0, 0, Math.PI]} />
                                    </group>
                                )}
                            </mesh>

                            {/* The Plane */}
                            {/* OrientGroup aligns -Z to Forward (North). */}
                            {/* AirplaneGeometry defaults to -Z Forward (Standard). */}
                            {/* So no rotation needed to face North. */}
                            <group rotation={[0, 0, 0]}>
                                <group
                                    rotation={[pilot.ui.viewRotation.y, pilot.ui.viewRotation.x, 0]}
                                >
                                    <AirplaneGeometry type={pilot.airplane} playerId={pilot.id + 1} throttle={0} />
                                </group>
                            </group>
                        </group>
                    </OrientGroup>
                );
            })}
        </group>
    );
};
