
import React, { useEffect, useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { PhysicsWorld } from '../sim/PhysicsWorld';
import { Loop } from '../kernel/Loop';
import { DeviceManager } from '../input/DeviceManager';
import { WorldState } from '../sim/WorldState';
import { TerrainManager } from '../sim/terrain/TerrainManager';
import { Stars, Environment } from '@react-three/drei';
import { SessionBridge } from '../../app/components/SessionBridge';
import { SessionState } from '../session/SessionState';
import { HTMLStencilViewportSystem } from './viewport/HTMLStencilViewportSystem.tsx';
import { useStore } from '../../app/store/useStore';
import { ViewportStencilLayout } from './viewport/ViewportStencilLayout';
import { View } from '@react-three/drei';
import { NetworkManager } from '../session/NetworkManager';
import { FreeFlightModeInstance } from '../../app/modes/FreeFlight/FreeFlightMode';
import { GameMode } from '../mode/GameMode';
import { MainMenuModeInstance } from '../../app/modes/MainMenu/MainMenuMode';

// --- MODE REGISTRY ---
// Map Store 'mission' string to GameMode Instance
const MODES: Record<string, GameMode> = {
    'free': FreeFlightModeInstance,
    'main_menu': MainMenuModeInstance
};

export const SceneRoot: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
    const [ready, setReady] = useState(false);
    const viewRefs = React.useRef<(HTMLDivElement | null)[]>([]);

    const isPaused = useStore((state) => state.isPaused);
    const mission = useStore((state) => state.mission);
    const localParty = useStore((state) => state.localParty);
    const terrainSeed = useStore((state) => state.terrainSeed);
    const terrainParams = useStore((state) => state.terrainParams);

    // Determines Active Mode
    const activeMode = useMemo(() => MODES[mission] || MainMenuModeInstance, [mission]);

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
                useStore.getState().terrainSeed,
                useStore.getState().terrainParams
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
                SessionState.update(dt);
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

                <SessionBridge />

                {/* RENDER ACTIVE MODE SCENE */}
                <activeMode.SceneComponent />

                {/* VIEWPORT SYSTEM (Cameras) */}
                {isFlying && activeMode.ViewportComponent && (
                    <HTMLStencilViewportSystem viewRefs={viewRefs}>
                        {(player, cameraRef) => (
                            <activeMode.ViewportComponent player={player} cameraRef={cameraRef} />
                        )}
                    </HTMLStencilViewportSystem>
                )}

                {!isFlying && (
                    <activeMode.ViewportComponent player={{ id: 0 }} cameraRef={null} />
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
