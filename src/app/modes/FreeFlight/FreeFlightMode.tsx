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
    // Standardized Spawn Logic (Matches GameRoom.ts)
    // Ring around equator (Y=0)
    const angle = (index * Math.PI * 0.5); // 90 degrees separation per player
    const state = useStore.getState();
    const planetRadius = state.terrainParams ? state.terrainParams.planetRadius : 50;
    const radius = planetRadius + 50; // Standard altitude

    return new Vector3(
        Math.sin(angle) * radius,
        0,
        Math.cos(angle) * radius
    );
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
            <BlueprintSphere isPaused={isPaused} />

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
import { LoadingScreen } from '../../core/ui/LoadingScreen';

const FreeFlightUI: React.FC = () => {
    const isPaused = useFreeFlightStore((state) => state.isPaused);
    const setPaused = useFreeFlightStore((state) => state.setPaused);
    const isLoading = useFreeFlightStore((state) => state.isLoading);

    const localParty = useStore(state => state.localParty);

    if (isLoading) {
        return <LoadingScreen />;
    }

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
            {localParty.map((pilot, index) => (
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
    private pendingSpawns: Vector3[] = []; // Store server-dictated spawns

    init() {
        console.log('[FreeFlightMode] Init');
        this.sims.clear();
        this.cachedSims = [];
        this.pendingSpawns = [];

        // Start Loading (if online)
        const { currentRoomId } = useStore.getState();
        if (currentRoomId) {
            console.log('[FreeFlightMode] Online match detected. Enabling Loading Screen.');
            useFreeFlightStore.getState().setLoading(true);

            // Failsafe: Disable loading after 5s if network hangs
            setTimeout(() => {
                const { isLoading } = useFreeFlightStore.getState();
                if (isLoading) {
                    console.warn('[FreeFlightMode] Loading timed out! Forcing disable.');
                    useFreeFlightStore.getState().setLoading(false);
                }
            }, 5000);
        } else {
            useFreeFlightStore.getState().setLoading(false);
        }

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
        // Reuse currentRoomId from above
        if (currentRoomId) {
            console.log('[FreeFlightMode] Online mode, connecting to game server for room:', currentRoomId);
            NetworkManager.connectGameServer();

            this.unsubscribeNetwork = NetworkManager.subscribe((event) => {
                switch (event.type) {
                    case 'GAME_CONNECTED': {
                        const localParty = useStore.getState().localParty;
                        console.log('[FreeFlightMode] Joining game room with party:', localParty);
                        NetworkManager.joinGameRoom(currentRoomId, localParty);
                        break;
                    }
                    case 'ROOM_JOINED': {
                        useRemoteEntities.getState().setRoomState(event.roomId, true);
                        applyWorldSnapshot(event.entities, NetworkManager.channelId);

                        // SNAP LOCAL SIMS TO SERVER SPAWN POSITIONS
                        const myEntities = event.entities.filter(e => e.ownerId === NetworkManager.channelId);

                        // Store them for sims that haven't been created yet
                        this.pendingSpawns = myEntities.map(e => new Vector3(e.position[0], e.position[1], e.position[2]));
                        console.log('[FreeFlightMode] Received server spawns:', this.pendingSpawns);

                        let index = 0;
                        // Snap EXISTING sims immediately
                        this.sims.forEach((sim) => {
                            if (index < myEntities.length) {
                                const ent = myEntities[index];
                                console.log('[FreeFlightMode] Snapping EXISTING Sim', sim.playerId, 'to server spawn:', ent.position);
                                sim.position.set(ent.position[0], ent.position[1], ent.position[2]);
                                sim.quaternion.set(ent.quaternion[0], ent.quaternion[1], ent.quaternion[2], ent.quaternion[3]);
                                sim.altitude = sim.position.length(); // Update altitude derived from pos

                                // Reset physics velocity too to avoid "momentum" from the snap
                                sim.setVelocity(0, 0, 0);
                            }
                            index++;
                        });

                        // Stop Loading Screen - We are synced!
                        useFreeFlightStore.getState().setLoading(false);
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

            // HANDLE ALREADY CONNECTED STATE
            if (NetworkManager.isGameConnected) {
                const localParty = useStore.getState().localParty;
                console.log('[FreeFlightMode] Already connected. Immediately joining room:', currentRoomId);
                NetworkManager.joinGameRoom(currentRoomId, localParty);
            }
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

                // Use Server Spawn if available (for network play), otherwise local default
                let spawn = getSpawnPoint(p.id);
                if (this.pendingSpawns[p.id]) {
                    console.log('Using PENDING SERVER SPAWN for Player', p.id, this.pendingSpawns[p.id]);
                    spawn = this.pendingSpawns[p.id];
                }

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

                // Debug log every 60 frames (approx 1s) to avoid spam
                const shouldLog = Math.random() < 0.01;

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

                        if (shouldLog) {
                            // console.log('[FreeFlightMode] Sending update for entity:', update.entityId, 'Pos:', update.position);
                        }

                        NetworkManager.sendStateUpdate(update);
                        entityIdx++;
                    }
                });
            } else if (NetworkManager.isGameConnected && Math.random() < 0.01) {
                console.warn('[FreeFlightMode] Connected but no local entities to sync!', {
                    connected: NetworkManager.isGameConnected,
                    localEntityIds: NetworkManager.localEntityIds
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
