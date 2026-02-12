
import React, { useEffect, useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { PhysicsWorld } from '../sim/PhysicsWorld';
import { Loop } from '../kernel/Loop';
import { DeviceManager } from '../input/DeviceManager';
import { WorldState } from '../sim/WorldState';
import { TerrainManager } from '../sim/terrain/TerrainManager';
import { Stars, Environment } from '@react-three/drei';

import { SessionState } from '../session/SessionState';
import { HTMLStencilViewportSystem } from './viewport/HTMLStencilViewportSystem.tsx';

import { ViewportStencilLayout } from './viewport/ViewportStencilLayout';
import { View } from '@react-three/drei';
import { NetworkManager } from '../session/NetworkManager';
import { GameMode } from '../mode/GameMode';

// Note: SceneRoot is now a Dumb Container. It does not import specific modes.

// Define the Interface for Engine Configuration
export interface EngineConfig {
    isPaused: boolean;
    mission: string;
    localParty: any[]; // Todo: Define strict type or keep generic array
    terrainSeed: number;
    terrainParams: any;
}

export const SceneRoot: React.FC<{
    modes: Record<string, GameMode>,
    cameras: Record<string, React.FC<any>>,
    config: EngineConfig,
    children?: React.ReactNode
}> = ({ modes, cameras, config, children }) => {
    const [ready, setReady] = useState(false);
    const viewRefs = React.useRef<(HTMLDivElement | null)[]>([]);

    // Destructure Config
    const { isPaused, mission, localParty, terrainSeed, terrainParams } = config;

    // Determines Active Mode
    // Fallback to first available mode if mission not found? Or handled by App?
    // We assume 'main_menu' is always present or handled safely.
    // Ensure we have a valid fallback.
    const activeMode = useMemo(() => {
        return modes[mission] || modes['main_menu'] || Object.values(modes)[0];
    }, [mission, modes]);

    // Sync Terrain
    useEffect(() => {
        TerrainManager.instance.updateConfig(terrainSeed, terrainParams);
    }, [terrainSeed, terrainParams]);

    // Sync Pointer Lock
    useEffect(() => {
        DeviceManager.setPointerLockEnabled(!isPaused);
    }, [isPaused]);

    // Initialize Engine & Mode
    useEffect(() => {
        const initEngine = async () => {
            // 0. Init Managers
            TerrainManager.instance.updateConfig(
                config.terrainSeed,
                config.terrainParams
            );
            DeviceManager.init();
            SessionState.init();
            await PhysicsWorld.init(); // Wait for WASM

            // 1. Init Mode
            activeMode.init();

            // 2. Register Loop
            Loop.register(() => {
                const dt = 0.016; // Fixed timestep target
                WorldState.update(dt);
                // SessionState.update(dt); // Moved to Loop.ts (Kernel)
                // MODE UPDATE
                activeMode.update(dt);
            });

            // 3. Start
            Loop.start();
            setReady(true);
        };

        const cleanup = () => {
            Loop.stop();
            activeMode.dispose();
            DeviceManager.cleanup();
            WorldState.reset();
        };

        initEngine();
        return cleanup;
    }, [activeMode]); // Re-init if mode changes

    if (!ready) return <div className="absolute inset-0 flex items-center justify-center text-white bg-slate-900">Initializing Engine...</div>;

    const isFlying = !isPaused;

    return (
        <div className="absolute inset-0 bg-slate-950" style={{ touchAction: 'none' }}>
            <Canvas shadows camera={{ position: [0, 50, 100], fov: 60 }}>
                {/* GLOBAL LIGHTING & ENV (Common to all modes?) */}
                {/* Actually, Mode should probably handle its own Env if it wants different lighting */}
                {/* But keeping generic stars/bg here is fine for now. */}
                <color attach="background" args={['#0f172a']} />
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
                <Stars radius={300} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                <Environment preset="city" />


                {/* RENDER ACTIVE MODE SCENE */}
                <activeMode.SceneComponent />

                {/* VIEWPORT SYSTEM (Cameras) */}
                {isFlying && activeMode.ViewportComponent && (
                    <HTMLStencilViewportSystem viewRefs={viewRefs}>
                        {(player, cameraRef) => (
                            <activeMode.ViewportComponent
                                player={player}
                                cameraRef={cameraRef}
                                cameras={cameras} // Injecting Cameras Here
                            />
                        )}
                    </HTMLStencilViewportSystem>
                )}

                {!isFlying && (
                    <activeMode.ViewportComponent
                        player={{ id: 0 }}
                        cameraRef={null}
                        cameras={cameras} // Injecting Cameras Here
                    />
                )}

                <View.Port />

                {children}
            </Canvas>

            {/* STENCIL LAYOUT */}
            {isFlying && (
                <ViewportStencilLayout
                    playerCount={localParty.length}
                    onRefsReady={(refs) => { viewRefs.current = refs; }}
                />
            )}

            <div className="absolute inset-0 z-50 pointer-events-none">
                <activeMode.UIComponent />
            </div>


        </div>
    );
};
