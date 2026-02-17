import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { Vector3 } from 'three';
import { TelemetryBridge } from '../../core/components/TelemetryBridge';
import { GameMode } from '../../../engine/mode/GameMode';
import { SessionState } from '../../../engine/session/SessionState';
import { useFreeFlightStore } from './useFreeFlightStore';
import { BlueprintSphere } from '../../core/env/BlueprintSphere';
import { AirplaneView } from '../../core/entities/Airplane/AirplaneView';
import { AirplaneSim } from '../../core/entities/Airplane/AirplaneSim';
import { SunLight } from '../../core/env/SunLight';
import { useStore } from '../../store/useStore';
import { GameHUD } from '../../core/ui/components/hud/GameHUD'; // Import HUD

import { PhysicsWorld } from '../../../engine/sim/PhysicsWorld';
import { FREE_FLIGHT_GAMEPAD, FREE_FLIGHT_KB1, FREE_FLIGHT_KB2 } from './input/FreeFlightInput';

// --- SPAWN LOGIC ---
const getSpawnPoint = (index: number) => {
    // Simple ring distribution
    const angle = (index / 4) * Math.PI * 2;
    const radius = 55; // Altitude
    const x = Math.sin(angle) * radius;
    const z = Math.cos(angle) * radius;
    return new Vector3(x, 50, z); // 50 starts them high?
};

// --- REACT COMPONENTS ---

// Forward declaration of the class type for use in props
type FreeFlightModeLogicType = import('./FreeFlightMode').FreeFlightModeLogic;

const FreeFlightViewport: React.FC<{
    mode: FreeFlightModeLogic,
    player: any,
    cameraRef: any,
    cameras?: Record<string, React.FC<any>>
}> = ({ mode, player, cameraRef, cameras }) => {
    // 1. Always call Hooks at top level
    const isPaused = useFreeFlightStore((state) => state.isPaused);

    const sim = useSyncExternalStore(
        (cb) => mode.subscribe(cb),
        () => mode.getSim(player.id)
    );

    // 2. Conditional Rendering

    // ORBIT CAMERA (Pause Mode)
    if (isPaused) {
        const OrbitCam = cameras ? cameras['orbit'] : null;
        if (OrbitCam) return <OrbitCam cameraRef={cameraRef} />;
    }

    // CHASE CAMERA (Gameplay Mode)
    if (!sim) return null; // Wait for sim

    // Use Injected Camera
    const CameraComponent = cameras ? cameras['chase'] : null;
    if (!CameraComponent) return null;

    return <CameraComponent sim={sim} cameraRef={cameraRef} />;
};

const FreeFlightScene: React.FC<{ mode: FreeFlightModeLogic }> = ({ mode }) => {
    // Subscribe to Sims List
    const sims = useSyncExternalStore(
        (cb) => mode.subscribe(cb),
        () => mode.getSims()
    );

    const isPaused = useFreeFlightStore(state => state.isPaused); // Move Hook to Top Level

    return (
        <>
            <SunLight />
            <BlueprintSphere />

            {sims.map(sim => (
                <React.Fragment key={sim.playerId}>
                    <AirplaneView
                        sim={sim}
                        playerId={sim.playerId}
                        paused={isPaused} // Use Variable
                    />
                    <TelemetryBridge sim={sim} playerId={sim.playerId} />
                </React.Fragment>
            ))}
        </>
    );
};

import { FreeFlightPauseMenu } from './ui/FreeFlightPauseMenu';
import { PauseButton } from '../../components/ui/PauseButton';

const FreeFlightUI: React.FC = () => {
    const isPaused = useFreeFlightStore((state) => state.isPaused);
    const setPaused = useFreeFlightStore((state) => state.setPaused);

    return (
        <>
            {!isPaused && (
                <PauseButton
                    onClick={() => setPaused(true)}
                    className="absolute top-6 right-6"
                />
            )}
            {isPaused && <FreeFlightPauseMenu />}

            {/* Render HUDs for all local players, respecting PAUSE state */}
            {useStore(state => state.localParty).map((pilot, index) => (
                <div key={pilot.id} className="absolute inset-0 pointer-events-none">
                    {/* Simplified positioning for single player for now, need robust grid for splitscreen later */}
                    {/* For now, just center-bottom like before */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                        <GameHUD pilotId={pilot.id} paused={isPaused} />
                    </div>
                </div>
            ))}
        </>
    );
};

// --- MODE LOGIC CLASS ---
export class FreeFlightModeLogic implements GameMode {
    id = 'free_flight';

    // Components to Render (Bound to this instance)
    // We use arrow functions to capture 'this' and pass it to the components
    SceneComponent: React.FC = () => <FreeFlightScene mode={this} />;
    UIComponent: React.FC = () => <FreeFlightUI />;
    ViewportComponent: React.FC<{ player: any, cameraRef: any }> = (props) => <FreeFlightViewport mode={this} {...props} />;

    getLayoutOverride() {
        return useFreeFlightStore.getState().isPaused ? 'single' : 'default';
    }

    // State
    private sims = new Map<number, AirplaneSim>();
    private cachedSims: AirplaneSim[] = [];
    private listeners = new Set<() => void>();

    init() {
        console.log('[FreeFlightMode] Init');
        this.sims.clear();
        this.cachedSims = [];

        // Register Input Profiles
        SessionState.registerDefaultProfile('gamepad', 'FLIGHT', FREE_FLIGHT_GAMEPAD);
        // Register Keyboard Profiles
        SessionState.registerDefaultProfile('keyboard_wasd', 'FLIGHT', FREE_FLIGHT_KB1);
        SessionState.registerDefaultProfile('keyboard_arrows', 'FLIGHT', FREE_FLIGHT_KB2);
        // Also register general 'keyboard' just in case
        SessionState.registerDefaultProfile('keyboard', 'FLIGHT', FREE_FLIGHT_KB1);

        // Apply to existing players (since they joined before this profile was registered)
        SessionState.players.forEach(p => {
            if (p.deviceId.startsWith('gamepad')) {
                p.input.loadProfile('FLIGHT', FREE_FLIGHT_GAMEPAD);
            } else if (p.deviceId === 'keyboard_wasd' || p.deviceId === 'kb1') {
                p.input.loadProfile('FLIGHT', FREE_FLIGHT_KB1);
            } else if (p.deviceId === 'keyboard_arrows' || p.deviceId === 'kb2') {
                p.input.loadProfile('FLIGHT', FREE_FLIGHT_KB2);
            } else {
                // Fallback
                p.input.loadProfile('FLIGHT', FREE_FLIGHT_KB1);
            }
        });

        // Force Context to FLIGHT for all players
        SessionState.setContextForAll('FLIGHT');

        // Listen for PAUSE Input
        const onInput = (playerId: number, action: string) => {
            if (action === 'PAUSE') {
                const current = useFreeFlightStore.getState().isPaused;
                useFreeFlightStore.getState().setPaused(!current);
            }
        };
        this.unsubscribeInput = SessionState.onInput(onInput);

        this.emitChange();
    }

    private unsubscribeInput?: () => void;

    dispose() {
        console.log('[FreeFlightMode] Dispose');
        this.sims.clear();
        this.cachedSims = [];
        if (this.unsubscribeInput) this.unsubscribeInput();
        this.emitChange();
        this.listeners.clear();

        // Ensure paused is false when leaving? Or let next mode handle it.
        useFreeFlightStore.getState().setPaused(false);
    }

    update(dt: number) {
        // 1. Sync Players -> Sims
        const players = SessionState.players;
        let changed = false;

        // Add New
        players.forEach(p => {
            if (!this.sims.has(p.id)) {
                // Read the pilot's selected airplane from the store
                const pilot = useStore.getState().localParty.find(lp => lp.id === p.id);
                const selectedType = pilot?.airplane || 'interceptor';
                console.log('Spawning Sim for Player', p.id, 'with type', selectedType);
                const spawn = getSpawnPoint(p.id);
                const sim = new AirplaneSim(p.id, spawn, selectedType);
                this.sims.set(p.id, sim);
                changed = true;
            }
        });

        // Remove Old
        for (const id of this.sims.keys()) {
            if (!players.find(p => p.id === id)) {
                console.log('Removing Sim for Player', id);
                this.sims.delete(id);
                changed = true;
            }
        }

        if (changed) {
            this.cachedSims = Array.from(this.sims.values());
            this.emitChange();
        }

        // Check Pause State (LOCAL)
        const isPaused = useFreeFlightStore.getState().isPaused;

        if (!isPaused) {
            // 2. Update Physics
            PhysicsWorld.step(dt);

            // 3. Update Sims
            this.sims.forEach(sim => sim.update());

            // 4. Update Projectiles
            useFreeFlightStore.getState().updateProjectiles(dt);
        }
    }

    // --- API for React ---
    getSims() {
        return this.cachedSims;
    }

    getSim(id: number) {
        return this.sims.get(id);
    }

    subscribe(callback: () => void) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    private emitChange() {
        this.listeners.forEach(cb => cb());
    }
}

// Singleton Instance
export const FreeFlightModeInstance = new FreeFlightModeLogic();
