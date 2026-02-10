
import React, { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PhysicsWorld } from '../sim/PhysicsWorld';
import { Loop } from '../kernel/Loop';
import { DeviceManager } from '../input/DeviceManager';
import { WorldState } from '../sim/WorldState';
import { TerrainManager } from '../sim/terrain/TerrainManager';
import { AirplaneSim } from '../../app/entities/Airplane/AirplaneSim';
import { AirplaneView } from '../../app/entities/Airplane/AirplaneView';
import { Vector3 } from 'three';
import { Stars, Environment, OrbitControls } from '@react-three/drei';
import { BlueprintSphere } from '../../app/components/BlueprintSphere';
import { TelemetryBridge } from './TelemetryBridge';
import { CameraManager } from './CameraManager';
import { LobbySquadron } from './LobbySquadron';
import { SessionBridge } from '../../app/components/SessionBridge';
import { SessionState } from '../session/SessionState';
import { HTMLStencilViewportSystem } from './viewport/HTMLStencilViewportSystem.tsx';
import { useStore } from '../../app/store/useStore';
import { ArchitectureOverlay } from '../../app/components/ui/debug/ArchitectureOverlay';

import { ViewportStencilLayout } from './viewport/ViewportStencilLayout';

export const SceneRoot: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
    const [ready, setReady] = useState(false);
    const viewRefs = React.useRef<(HTMLDivElement | null)[]>([]);

    // State for managing Sims (Pilot ID -> Sim)
    const [sims, setSims] = useState<Map<number, AirplaneSim>>(new Map());

    const isPaused = useStore((state) => state.isPaused);
    const activeMenuTab = useStore((state) => state.activeMenuTab);
    const terrainSeed = useStore((state) => state.terrainSeed);
    const terrainParams = useStore((state) => state.terrainParams);

    // Sync Local Party -> Sims
    const localParty = useStore((state) => state.localParty);

    // Sync Terrain Manager with Store
    useEffect(() => {
        TerrainManager.instance.updateConfig(terrainSeed, terrainParams);
    }, [terrainSeed, terrainParams]);

    // Sync Pointer Lock with Paused State
    useEffect(() => {
        DeviceManager.setPointerLockEnabled(!isPaused);
    }, [isPaused]);

    // Manage Sim Entities based on Party
    useEffect(() => {
        setSims(prev => {
            const next = new Map(prev);
            const activeIds = new Set<number>();

            // Add/Update
            localParty.forEach(pilot => {
                activeIds.add(pilot.id);
                if (!next.has(pilot.id)) {
                    // Create new Sim
                    // Position based on ID to avoid overlap?
                    const offset = pilot.id * 20;
                    const sim = new AirplaneSim(pilot.id, new Vector3(offset, 100 + offset, 0), pilot.airplane);
                    WorldState.registerAirplane(sim);
                    next.set(pilot.id, sim);
                } else {
                    // Check if Plane Type Changed
                    const existingSim = next.get(pilot.id)!;

                    // Add safety check for pilot.airplane to avoid undefined/default issues
                    const newType = pilot.airplane || 'interceptor';

                    if (existingSim.type !== newType) {
                        // Type changed! Replace the Sim.
                        WorldState.unregisterAirplane(existingSim);

                        // Reset position slightly to ensure clean collision state? 
                        // Or keep existing position but update type.
                        const newSim = new AirplaneSim(pilot.id, existingSim.position.clone(), newType);
                        newSim.quaternion.copy(existingSim.quaternion);
                        newSim.currentSpeed = existingSim.currentSpeed; // Preserve speed
                        newSim.throttle = existingSim.throttle; // Preserve throttle

                        WorldState.registerAirplane(newSim);
                        next.set(pilot.id, newSim);
                    }
                }
            });

            // Remove
            for (const id of next.keys()) {
                if (!activeIds.has(id)) {
                    // Logic to unregister sim? WorldState doesn't have unregister yet?
                    // Assuming for now we just drop reference.
                    next.delete(id);
                }
            }

            return next;
        });
    }, [localParty]);

    useEffect(() => {
        const initEngine = async () => {
            // 0. Init Terrain Manager (First Sync)
            TerrainManager.instance.updateConfig(
                useStore.getState().terrainSeed,
                useStore.getState().terrainParams
            );

            // 1a. Init Session Logic
            DeviceManager.init();
            SessionState.init();

            // 1b. Init Physics
            await PhysicsWorld.init();

            // 2. Register Sim Update to Loop
            Loop.register(() => {
                // Fixed Time Step
                const dt = 0.016;
                WorldState.update(dt);
                SessionState.update(dt); // Poll for Joins/Leaves
            });

            // 4. Start Loop
            Loop.start();

            setReady(true);
        };

        const cleanup = () => {
            Loop.stop();
            DeviceManager.cleanup();
        };

        initEngine();

        return cleanup;
    }, []);

    const isFlying = !isPaused;

    if (!ready) return <div className="absolute inset-0 flex items-center justify-center text-white bg-slate-900">Initializing Engine...</div>;

    return (
        <div className="absolute inset-0 bg-slate-950" style={{ touchAction: 'none' }}>
            <Canvas shadows camera={{ position: [0, 50, 100], fov: 60 }}>
                {/* LIGHTING & ENV */}
                <color attach="background" args={['#0f172a']} />
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
                <Stars radius={300} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                <Environment preset="city" />

                {/* WORLD CONTENT */}
                <BlueprintSphere />
                <SessionBridge />

                {/* MODE SWITCH: GAMEPLAY vs MENU */}
                {isFlying ? (
                    <>
                        {/* --- GAMEPLAY (SPLITSCREEN + PHYSICS) --- */}

                        {/* ENTITIES (Global Render) */}
                        {Array.from(sims.entries()).map(([id, sim]) => (
                            <React.Fragment key={id}>
                                <AirplaneView sim={sim} playerId={id} />
                                <TelemetryBridge sim={sim} playerId={id} />
                            </React.Fragment>
                        ))}

                        {/* SPLITSCREEN VIEWPORT SYSTEM */}
                        <HTMLStencilViewportSystem viewRefs={viewRefs}>
                            {(player, cameraRef) => {
                                const sim = sims.get(player.id);
                                return (
                                    <>
                                        <CameraManager
                                            playerSim={sim}
                                            cameraRef={cameraRef}
                                            playerId={player.id}
                                        />
                                        {/* Future: HUD(player) */}
                                    </>
                                );
                            }}
                        </HTMLStencilViewportSystem>
                    </>
                ) : (
                    <>
                        {/* --- MENU (SINGLE VIEW + DECORATION) --- */}

                        {/* Visual Planes in Formation */}
                        <LobbySquadron />

                        {/* Main Camera Controller (Squadron vs Menu Orbit) */}
                        <CameraManager />
                    </>
                )}

                {children}
            </Canvas>

            {/* STENCIL LAYOUT (Outside Canvas for robust DOM layout) */}
            {isFlying && (
                <ViewportStencilLayout
                    playerCount={localParty.length}
                    onRefsReady={(refs) => { viewRefs.current = refs; }}
                />
            )}

            <div className="absolute top-4 left-4 z-50 pointer-events-none">
                <ArchitectureOverlay />
            </div>
        </div>
    );
};
