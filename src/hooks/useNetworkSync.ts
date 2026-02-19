import { useEffect, useRef } from 'react';
import { useStore, remoteTelemetry } from '../app/store/useStore';
import { NetworkManager, RemoteEntity } from '../engine/session/NetworkManager';
import { Vector3, Quaternion } from 'three';

// HOOK 1: SOCKET LIFECYCLE MANAGER
export const useNetworkSync = () => {
    const setOnlineStatus = useStore((state) => state.setOnlineStatus);
    const setPing = useStore((state) => state.setPing);
    const addRemotePlayer = useStore((state) => state.addRemotePlayer);
    const removeRemotePlayer = useStore((state) => state.removeRemotePlayer);
    const setRemotePlayers = useStore((state) => state.setRemotePlayers);
    const setLobbies = useStore((state) => state.setLobbies);

    // @ts-ignore
    const setTerrainSeed = useStore((state) => state.setTerrainSeed);
    // @ts-ignore
    const setAllTerrainParams = useStore((state) => state.setAllTerrainParams);

    const isMultiplayerEnabled = useStore((state) => state.isMultiplayerEnabled);

    useEffect(() => {
        if (!isMultiplayerEnabled) {
            NetworkManager.disconnect();
            return;
        }

        const protocol = window.location.protocol;
        const socketUrl = `${protocol}//${window.location.hostname}:3002`;

        // Subscribe BEFORE connecting to catch initial events
        const unsubscribe = NetworkManager.subscribe((event) => {
            switch (event.type) {
                case 'CONNECTED':
                    setOnlineStatus('connected');
                    break;
                case 'DISCONNECTED':
                    setOnlineStatus('disconnected');
                    setPing(0);
                    setLobbies([]);
                    break;
                case 'LOBBY_LIST':
                    setLobbies(event.lobbies);
                    break;
                case 'ROOM_JOINED':
                    setRemotePlayers(event.players);
                    break;
                case 'PLAYER_JOINED':
                    addRemotePlayer(event.player);
                    break;
                case 'PLAYER_LEFT':
                    removeRemotePlayer(event.playerId);
                    break;
                case 'LATENCY':
                    setPing(event.ms);
                    break;
            }
        });

        NetworkManager.connect(socketUrl);
        setOnlineStatus('connecting');

        const pingInterval = setInterval(() => {
            NetworkManager.checkLatency();
        }, 2000);

        return () => {
            unsubscribe();
            clearInterval(pingInterval);
            NetworkManager.disconnect();
        };

    }, [isMultiplayerEnabled, setOnlineStatus, addRemotePlayer, removeRemotePlayer, setLobbies, setPing]);
};

// Module level export to capture rotation from Airplane component
export const localPlayerState = {
    quat: new Quaternion(),
    velocity: new Vector3()
};

export const updateLocalTelemetry = (q: Quaternion) => {
    localPlayerState.quat.copy(q);
};

// HOOK 2: TELEMETRY EMITTER LOOP
export const useTelemetryLoop = () => {
    useEffect(() => {
        const interval = setInterval(() => {
            if (!NetworkManager.isConnected) return;

            const state = useStore.getState();
            if (state.currentRoomId) {
                const p1 = state.localParty[0];
                const p1Pos = state.pilotPositions[0];

                if (p1 && p1Pos) {
                    NetworkManager.sendTelemetry({
                        pilotId: 0,
                        pos: [p1Pos.x, p1Pos.y, p1Pos.z],
                        quat: [localPlayerState.quat.x, localPlayerState.quat.y, localPlayerState.quat.z, localPlayerState.quat.w],
                        type: p1.airplane,
                        throttle: p1.throttle
                    });
                }
            }
        }, 50);
        return () => clearInterval(interval);
    }, []);
};

// HOOK 3: SOCKET ACTIONS
export const useSocketActions = () => {
    const joinRoom = (roomId: string) => {
        if (NetworkManager.isConnected) {
            NetworkManager.joinRoom(roomId);
            useStore.getState().setCurrentRoomId(roomId);
            useStore.getState().setGameMode('single');
        }
    };

    const leaveRoom = () => {
        if (NetworkManager.isConnected) {
            NetworkManager.leaveRoom();
            useStore.getState().setCurrentRoomId(null);
            useStore.getState().setRemotePlayers([]);
        }
    };

    return { joinRoom, leaveRoom };
};
