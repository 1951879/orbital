import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { Vector3 } from 'three';
import { TelemetryBridge } from '../../core/components/TelemetryBridge';
import { GameMode } from '../../../engine/mode/GameMode';
import { SessionState } from '../../../engine/session/SessionState';
import { useFreeFlightStore } from './useFreeFlightStore';
import { BlueprintSphere } from '../../core/env/BlueprintSphere';
import { AirplaneView } from '../../core/entities/Airplane/AirplaneView';
import { AirplaneSim } from '../../core/entities/Airplane/AirplaneSim';
import { RemoteAirplane } from '../../core/entities/Airplane/RemoteAirplane';
import { SunLight } from '../../core/env/SunLight';
import { useStore } from '../../store/useStore';
import { useRemoteEntities, applyWorldSnapshot } from '../../store/useRemoteEntities';
import { GameHUD } from '../../core/ui/components/hud/GameHUD';
import { NetworkManager, EntityStateUpdate } from '../../../engine/session/NetworkManager';

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
    // Subscribe to Local Sims List
    const sims = useSyncExternalStore(
        (cb) => mode.subscribe(cb),
        () => mode.getSims()
    );

    const isPaused = useFreeFlightStore(state => state.isPaused);

    // Remote entity IDs (Zustand — only re-renders on entity add/remove)
    const remoteEntityIds = useRemoteEntities(state => state.entityIds);

    return (
        <>
            <SunLight />
            <BlueprintSphere />

            {/* Local players */}
            {sims.map(sim => (
                <React.Fragment key={sim.playerId}>
                    <AirplaneView
                        sim={sim}
                        playerId={sim.playerId}
                        paused={isPaused}
                    />
                    <TelemetryBridge sim={sim} playerId={sim.playerId} />
                </React.Fragment>
            ))}

            {/* Remote players (from game server — read mutable state in useFrame) */}
            {remoteEntityIds.map(entityId => (
                <RemoteAirplane key={entityId} entityId={entityId} />
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
    private unsubscribeNetwork?: () => void;

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

        // ---- ONLINE: Connect to game server ----
        const { currentRoomId } = useStore.getState();
        if (currentRoomId) {
            console.log('[FreeFlightMode] Online mode, connecting to game server for room:', currentRoomId);
            NetworkManager.connectGameServer();

            this.unsubscribeNetwork = NetworkManager.subscribe((event) => {
                switch (event.type) {
                    case 'GAME_CONNECTED': {
                        const pilot = useStore.getState().localParty[0];
                        const playerName = pilot?.name || 'Unknown';
                        const entityType = pilot?.airplane || 'interceptor';
                        NetworkManager.joinGameRoom(currentRoomId, playerName, entityType);
                        break;
                    }
                    case 'ROOM_JOINED': {
                        useRemoteEntities.getState().setRoomState(event.roomId, true);
                        applyWorldSnapshot(event.entities, NetworkManager.channelId);

                        // SNAP LOCAL SIMS TO SERVER SPAWN POSITIONS
                        // This prevents multiple clients from overlapping at the hardcoded "Player 0" spawn.
                        const myEntities = event.entities.filter(e => e.ownerId === NetworkManager.channelId);
                        let index = 0;
                        this.sims.forEach((sim) => {
                            if (index < myEntities.length) {
                                const ent = myEntities[index];
                                console.log('[FreeFlightMode] Snapping Sim', sim.playerId, 'to server spawn:', ent.position);
                                sim.position.set(ent.position[0], ent.position[1], ent.position[2]);
                                sim.quaternion.set(ent.quaternion[0], ent.quaternion[1], ent.quaternion[2], ent.quaternion[3]);
                                sim.altitude = sim.position.length(); // Update altitude derived from pos
                            }
                            index++;
                        });
                        break;
                    }
                    case 'WORLD_SNAPSHOT': {
                        applyWorldSnapshot(event.snapshot.entities, NetworkManager.channelId);
                        break;
                    }
                    case 'ENTITY_SPAWNED': {
                        if (event.entity.ownerId !== NetworkManager.channelId) {
                            useRemoteEntities.getState().addEntity(
                                event.entity.id,
                                event.entity.type,
                                event.entity.ownerId,
                                event.entity.position,
                                event.entity.quaternion
                            );
                        }
                        break;
                    }
                    case 'ENTITY_DESTROYED': {
                        useRemoteEntities.getState().removeEntity(event.entityId);
                        break;
                    }
                    case 'GAME_DISCONNECTED': {
                        useRemoteEntities.getState().clear();
                        break;
                    }
                }
            });
        }

        this.emitChange();
    }

    private unsubscribeInput?: () => void;

    dispose() {
        console.log('[FreeFlightMode] Dispose');
        this.sims.clear();
        this.cachedSims = [];
        if (this.unsubscribeInput) this.unsubscribeInput();

        // Cleanup network
        if (this.unsubscribeNetwork) {
            this.unsubscribeNetwork();
            this.unsubscribeNetwork = undefined;
        }
        NetworkManager.leaveGameRoom();
        NetworkManager.disconnectGameServer();
        useRemoteEntities.getState().clear();

        this.emitChange();
        this.listeners.clear();
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

            // 5. ONLINE: Send local entity state to game server
            if (NetworkManager.isGameConnected && NetworkManager.localEntityIds.length > 0) {
                const entityIds = NetworkManager.localEntityIds;
                let entityIdx = 0;
                this.sims.forEach(sim => {
                    if (entityIdx < entityIds.length) {
                        const update: EntityStateUpdate = {
                            entityId: entityIds[entityIdx],
                            position: [sim.position.x, sim.position.y, sim.position.z],
                            quaternion: [sim.quaternion.x, sim.quaternion.y, sim.quaternion.z, sim.quaternion.w],
                            velocity: [0, 0, 0], // Not exposed publicly; server validates via position delta
                            custom: {
                                throttle: sim.throttle,
                                currentSpeed: sim.currentSpeed,
                                altitude: sim.altitude,
                            },
                        };
                        NetworkManager.sendStateUpdate(update);
                        entityIdx++;
                    }
                });
            }
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
