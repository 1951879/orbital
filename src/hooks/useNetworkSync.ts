
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useStore, remoteTelemetry } from '../app/store/useStore';
import { Vector3, Quaternion } from 'three';
import { TerrainParams, LobbyInfo } from '../types';

// HOOK 1: SOCKET LIFECYCLE MANAGER
// This should only be called ONCE in the application (e.g. in Scene or App)
export const useNetworkSync = () => {
    const socketRef = useRef<Socket | null>(null);
    const setOnlineStatus = useStore((state) => state.setOnlineStatus);
    const setPing = useStore((state) => state.setPing);
    const addRemotePlayer = useStore((state) => state.addRemotePlayer);
    const removeRemotePlayer = useStore((state) => state.removeRemotePlayer);
    const setRemotePlayers = useStore((state) => state.setRemotePlayers);
    const setSocket = useStore((state) => state.setSocket);

    // Lobby State
    const setLobbies = useStore((state) => state.setLobbies);
    const currentRoomId = useStore((state) => state.currentRoomId);

    // World Sync Setters
    // @ts-ignore
    const setTerrainSeed = useStore((state) => state.setTerrainSeed);
    // @ts-ignore
    const setAllTerrainParams = useStore((state) => state.setAllTerrainParams);

    const isMultiplayerEnabled = useStore((state) => state.isMultiplayerEnabled);

    // Connect/Disconnect Logic
    useEffect(() => {
        // If not enabled, ensure disconnected and return
        if (!isMultiplayerEnabled) {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setSocket(null);
            }
            return;
        }

        // Prevent double connection via Ref
        if (socketRef.current?.connected) return;

        // Prevent double connection via Store (if mounted twice)
        if (useStore.getState().socket?.connected) {
            socketRef.current = useStore.getState().socket;
            return;
        }

        setOnlineStatus('connecting');

        const protocol = window.location.protocol;
        const socketUrl = `${protocol}//${window.location.hostname}:3001`;

        console.log(`Attempting connection to ${socketUrl}...`);

        const socket = io(socketUrl, {
            reconnectionAttempts: 5,
            timeout: 10000,
            transports: ['websocket']
        });
        socketRef.current = socket;
        setSocket(socket);

        socket.on('connect', () => {
            console.log('Connected to Orbital Server');
            setOnlineStatus('connected');
        });

        socket.on('connect_error', (err) => {
            console.error("Connection failed:", err.message);
            setOnlineStatus('disconnected');
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from server');
            setOnlineStatus('disconnected');
            setPing(0);
            setLobbies([]);
        });

        // --- LOBBY LIST UPDATES ---
        socket.on('lobbyList', (list: LobbyInfo[]) => {
            setLobbies(list);
        });

        // --- WORLD GEOMETRY SYNC ---
        socket.on('worldInit', (data: { seed: number, params: TerrainParams }) => {
            setTerrainSeed(data.seed);
            setAllTerrainParams(data.params);
        });

        socket.on('currentPlayers', (players: Record<string, any>) => {
            const list = Object.values(players)
                .filter((p: any) => p.id !== socket.id)
                .map((p: any) => ({ id: p.id, type: p.type }));

            // Initialize telemetry for existing players
            Object.values(players).forEach((p: any) => {
                if (p.id === socket.id) return;
                remoteTelemetry.set(p.id, {
                    pos: new Vector3(...p.pos),
                    quat: new Quaternion(...p.quat),
                    targetPos: new Vector3(...p.pos),
                    targetQuat: new Quaternion(...p.quat),
                    throttle: p.throttle || 0.5
                });
            });

            setRemotePlayers(list);
        });

        socket.on('playerJoined', (player: any) => {
            addRemotePlayer({ id: player.id, type: player.type });
            remoteTelemetry.set(player.id, {
                pos: new Vector3(...player.pos),
                quat: new Quaternion(...player.quat),
                targetPos: new Vector3(...player.pos),
                targetQuat: new Quaternion(...player.quat),
                throttle: player.throttle || 0.5
            });
        });

        socket.on('playerLeft', (id: string) => {
            removeRemotePlayer(id);
        });

        socket.on('remoteTelemetry', (data: any) => {
            const entry = remoteTelemetry.get(data.id);
            if (entry) {
                entry.targetPos.set(data.pos[0], data.pos[1], data.pos[2]);
                entry.targetQuat.set(data.quat[0], data.quat[1], data.quat[2], data.quat[3]);
                if (data.throttle !== undefined) entry.throttle = data.throttle;
            }

            const currentPlayers = useStore.getState().remotePlayers;
            const player = currentPlayers.find(p => p.id === data.id);
            if (player && player.type !== data.type) {
                useStore.getState().setRemotePlayers(
                    currentPlayers.map(p => p.id === data.id ? { ...p, type: data.type } : p)
                );
            }
        });

        const pingInterval = setInterval(() => {
            if (socket.connected) {
                const start = Date.now();
                socket.emit('latency', () => {
                    const latency = Date.now() - start;
                    setPing(latency);
                });
            }
        }, 2000);

        return () => {
            clearInterval(pingInterval);
            socket.disconnect();
            setSocket(null);
        };
    }, [isMultiplayerEnabled, setOnlineStatus, addRemotePlayer, removeRemotePlayer, setRemotePlayers, setPing, setTerrainSeed, setAllTerrainParams, setLobbies, setSocket]);

    return socketRef.current;
};

// Module level export to capture rotation from Airplane component
export const localPlayerState = {
    quat: new Quaternion(),
    velocity: new Vector3()
};

// Helper for Airplane to update this
export const updateLocalTelemetry = (q: Quaternion) => {
    localPlayerState.quat.copy(q);
};

// HOOK 2: TELEMETRY EMITTER LOOP
// Runs in the Scene loop to send data to server
export const useTelemetryLoop = () => {
    const socket = useStore((state) => state.socket);

    useEffect(() => {
        if (!socket) return;

        const interval = setInterval(() => {
            const state = useStore.getState();

            // Phase 5 Patch:
            // 1. Check Connected & Room
            if (socket.connected && state.currentRoomId) {

                // 2. Source Truth from LocalParty (Pilot 1)
                // This ensures changes in Arcade Hangar (which update localParty) are reflected on network
                const p1 = state.localParty[0];
                const p1Pos = state.pilotPositions[0]; // Updated

                if (p1 && p1Pos) {
                    socket.emit('telemetry', {
                        // ID for future multi-pilot support
                        pilotId: 0,

                        // Physics
                        pos: [p1Pos.x, p1Pos.y, p1Pos.z],
                        quat: [localPlayerState.quat.x, localPlayerState.quat.y, localPlayerState.quat.z, localPlayerState.quat.w],

                        // State from Party
                        type: p1.airplane,
                        throttle: p1.throttle
                    });
                }
            }
        }, 50);
        return () => clearInterval(interval);
    }, [socket]);
};

// HOOK 3: SOCKET ACTIONS
// Used by UI components to trigger joins/leaves without creating a new socket
export const useSocketActions = () => {
    const socket = useStore((state) => state.socket);

    const joinRoom = (roomId: string) => {
        if (socket && socket.connected) {
            socket.emit('joinRoom', roomId);
            useStore.getState().setCurrentRoomId(roomId);
            // Enforce Single Player View when going online to match V1 1-socket-1-plane rule
            useStore.getState().setGameMode('single');
        }
    };

    const leaveRoom = () => {
        if (socket && socket.connected) {
            socket.emit('leaveRoom');
            useStore.getState().setCurrentRoomId(null);
            useStore.getState().setRemotePlayers([]);
        }
    };

    return { joinRoom, leaveRoom };
};
