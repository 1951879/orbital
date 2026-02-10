
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
import { FPSMeter } from '../../app/components/ui/debug/FPSMeter';

import { ViewportStencilLayout } from './viewport/ViewportStencilLayout';

export const SceneRoot: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
    const [ready, setReady] = useState(false);
    const viewRefs = React.useRef<(HTMLDivElement | null)[]>([]);

    // State for managing Sims (Pilot ID -> Sim)
    // We use a REF for the source of truth to avoid React State double-invocation issues in Strict Mode
    const simsRef = React.useRef<Map<number, AirplaneSim>>(new Map());
    const [simVersion, setSimVersion] = useState(0); // Trigger re-render when sims change

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

    // Manage Sim Entities based on Party (Robust Sync via Ref)
    useEffect(() => {
        const nextSims = simsRef.current;
        const activeIds = new Set<number>();
        let changed = false;

        // 1. Sync: Add or Update
        localParty.forEach(pilot => {
            activeIds.add(pilot.id);
            const existingSim = nextSims.get(pilot.id);
            const targetType = pilot.airplane || 'interceptor';

            if (!existingSim) {
                // NEW: Create and Register
                const offset = pilot.id * 20; // Spread out initial spawn
                console.log(`[SceneRoot] Creating Sim for Pilot ${pilot.id} (${targetType})`);
                const sim = new AirplaneSim(pilot.id, new Vector3(offset, 100 + offset, 0), targetType);
                WorldState.registerAirplane(sim);
                nextSims.set(pilot.id, sim);
                changed = true;
            } else if (existingSim.type !== targetType) {
                // CHANGED: Replace and Re-Register
                console.log(`[SceneRoot] Updating Sim for Pilot ${pilot.id} (${existingSim.type} -> ${targetType})`);
                WorldState.unregisterAirplane(existingSim);

                const newSim = new AirplaneSim(pilot.id, existingSim.position.clone(), targetType);
                newSim.quaternion.copy(existingSim.quaternion);
                newSim.currentSpeed = existingSim.currentSpeed;
                newSim.throttle = existingSim.throttle;

                WorldState.registerAirplane(newSim);
                nextSims.set(pilot.id, newSim);
                changed = true;
            }
        });

        // 2. Cleanup: Remove Stale
        for (const [id, sim] of nextSims) {
            if (!activeIds.has(id)) {
                console.log(`[SceneRoot] Removing Sim for Pilot ${id}`);
                WorldState.unregisterAirplane(sim);
                nextSims.delete(id);
                changed = true;
            }
        }

        if (changed) {
            setSimVersion(v => v + 1);
        }
    }, [localParty]); // Only re-run when localParty changes

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
            WorldState.reset();
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

                        {/* PROCESSED SIMS (Global Render) */}
                        {Array.from(simsRef.current.entries()).map(([id, sim]) => (
                            <React.Fragment key={id}>
                                <AirplaneView sim={sim} playerId={id} />
                                <TelemetryBridge sim={sim} playerId={id} />
                            </React.Fragment>
                        ))}

                        {/* SPLITSCREEN VIEWPORT SYSTEM */}
                        <HTMLStencilViewportSystem viewRefs={viewRefs}>
                            {(player, cameraRef) => {
                                const sim = simsRef.current.get(player.id);
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
                <FPSMeter />
            </div>
        </div>
    );
};
