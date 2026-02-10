import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { Vector3 } from 'three';
import { TelemetryBridge } from '../../../engine/render/TelemetryBridge';
import { GameMode } from '../../../engine/mode/GameMode';
import { SessionState } from '../../../engine/session/SessionState';
import { useFreeFlightStore } from './useFreeFlightStore';
import { BlueprintSphere } from '../../core/env/BlueprintSphere';
import { AirplaneView } from '../../core/entities/Airplane/AirplaneView';
import { AirplaneSim } from '../../core/entities/Airplane/AirplaneSim';
import { SunLight } from '../../core/env/SunLight';
import { ChaseCamera } from '../../core/cameras/ChaseCamera';
import { useStore } from '../../store/useStore';
import { PhysicsWorld } from '../../../engine/sim/PhysicsWorld';
import { MenuOverlay } from '../../components/ui/MenuOverlay';

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

const FreeFlightViewport: React.FC<{ mode: FreeFlightModeLogic, player: any, cameraRef: any }> = ({ mode, player, cameraRef }) => {
    // We need to look up the sim for this player to attach the camera
    // Tricky: React Render vs Sim Creation sync.
    // If Sim doesn't exist yet, we can't attach camera target.

    // Subscribe to mode changes to retry if sim missing
    const sim = useSyncExternalStore(
        (cb) => mode.subscribe(cb),
        () => mode.getSim(player.id)
    );

    if (!sim) return null; // Wait for sim

    return <ChaseCamera sim={sim} cameraRef={cameraRef} />;
};

const FreeFlightScene: React.FC<{ mode: FreeFlightModeLogic }> = ({ mode }) => {
    // Subscribe to Sims List
    const sims = useSyncExternalStore(
        (cb) => mode.subscribe(cb),
        () => mode.getSims()
    );

    return (
        <>
            <SunLight />
            <BlueprintSphere />

            {sims.map(sim => (
                <React.Fragment key={sim.playerId}>
                    <AirplaneView
                        sim={sim}
                        playerId={sim.playerId}
                    />
                    <TelemetryBridge sim={sim} playerId={sim.playerId} />
                </React.Fragment>
            ))}
        </>
    );
};

const FreeFlightUI: React.FC = () => {
    const isPaused = useStore((state) => state.isPaused);
    /* 
       If Paused, show MenuOverlay. 
       Note: MenuOverlay handles "Resume" vs "Launch" logic via its internal check of 'mission'.
    */
    if (isPaused) {
        // We pass a dummy helper or rely on the internal store logic.
        // MenuOverlay uses onTogglePause prop.
        return <MenuOverlay onTogglePause={() => useStore.getState().setIsPaused(false)} />;
    }

    return (
        <div className="absolute top-4 left-4 text-white font-mono pointer-events-none">
            <h1 className="text-xl font-bold">FREE FLIGHT</h1>
            <div className="text-xs opacity-50">MODE: ACTIVE</div>
        </div>
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

    // State
    private sims = new Map<number, AirplaneSim>();
    private cachedSims: AirplaneSim[] = [];
    private listeners = new Set<() => void>();

    init() {
        console.log('[FreeFlightMode] Init');
        this.sims.clear();
        this.cachedSims = [];
        this.emitChange();
    }

    dispose() {
        console.log('[FreeFlightMode] Dispose');
        this.sims.clear();
        this.cachedSims = [];
        this.emitChange();
        this.listeners.clear();
    }

    update(dt: number) {
        // 1. Sync Players -> Sims
        const players = SessionState.players;
        let changed = false;

        // Add New
        players.forEach(p => {
            if (!this.sims.has(p.id)) {
                console.log('Spawning Sim for Player', p.id);
                const spawn = getSpawnPoint(p.id);
                const sim = new AirplaneSim(p.id, spawn, 'interceptor');
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

        // Check Pause State
        const isPaused = useStore.getState().isPaused;

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
