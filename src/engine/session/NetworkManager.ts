import { io, Socket } from 'socket.io-client';
import { RemotePlayerInfo, LobbyInfo } from '../../types';

export interface RemoteEntity {
    id: string;
    position: [number, number, number];
    quaternion: [number, number, number, number];
    velocity: [number, number, number];
    throttle: number;
}

type NetworkEvent =
    | { type: 'CONNECTED' }
    | { type: 'DISCONNECTED' }
    | { type: 'LOBBY_UPDATE'; lobbies: LobbyInfo[] }
    | { type: 'ROOM_JOINED'; roomId: string }
    | { type: 'PLAYER_JOINED'; player: RemotePlayerInfo }
    | { type: 'PLAYER_LEFT'; playerId: string }
    | { type: 'SYNC'; entities: Record<string, RemoteEntity> }
    | { type: 'WORLD_INIT'; data: any }
    | { type: 'LATENCY'; ms: number };

type Listener = (event: NetworkEvent) => void;

export class NetworkManager {
    private static socket: Socket | null = null;
    private static listeners: Set<Listener> = new Set();
    private static _isConnected = false;

    public static get isConnected() { return this._isConnected; }

    public static connect(url: string = 'http://localhost:3001') {
        if (this.socket) return;

        console.log('[NetworkManager] Connecting to', url);
        this.socket = io(url, {
            transports: ['websocket'],
            autoConnect: true
        });

        this.setupListeners();
    }

    public static disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this._isConnected = false;
            this.emit({ type: 'DISCONNECTED' });
        }
    }

    public static joinRoom(roomId: string) {
        this.socket?.emit('join_room', roomId);
    }

    public static leaveRoom() {
        this.socket?.emit('leave_room');
    }

    public static createRoom(name: string) {
        this.socket?.emit('create_room', name);
    }

    public static sendUpdate(data: any) {
        if (this._isConnected) {
            this.socket?.emit('update_state', data);
        }
    }

    public static sendTelemetry(data: any) {
        if (this._isConnected) {
            this.socket?.emit('telemetry', data);
        }
    }

    public static checkLatency() {
        if (this.socket?.connected) {
            const start = Date.now();
            this.socket.emit('latency', () => {
                const latency = Date.now() - start;
                this.emit({ type: 'LATENCY', ms: latency });
            });
        }
    }

    public static subscribe(listener: Listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private static emit(event: NetworkEvent) {
        this.listeners.forEach(l => l(event));
    }

    private static setupListeners() {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            console.log('[NetworkManager] Connected');
            this._isConnected = true;
            this.emit({ type: 'CONNECTED' });
        });

        this.socket.on('disconnect', () => {
            console.log('[NetworkManager] Disconnected');
            this._isConnected = false;
            this.emit({ type: 'DISCONNECTED' });
        });

        this.socket.on('lobbies_update', (lobbies: LobbyInfo[]) => {
            this.emit({ type: 'LOBBY_UPDATE', lobbies });
        });

        this.socket.on('room_joined', (roomId: string) => {
            this.emit({ type: 'ROOM_JOINED', roomId });
        });

        this.socket.on('player_joined', (player: RemotePlayerInfo) => {
            this.emit({ type: 'PLAYER_JOINED', player });
        });

        this.socket.on('player_left', (playerId: string) => {
            this.emit({ type: 'PLAYER_LEFT', playerId });
        });

        this.socket.on('state_update', (entities: any) => {
            this.emit({ type: 'SYNC', entities });
        });

        this.socket.on('worldInit', (data: any) => {
            this.emit({ type: 'WORLD_INIT', data });
        });

        this.socket.on('remoteTelemetry', (data: any) => {
            // Re-package as SYNC for now, or separate event? 
            // NetworkManager normalizes to SYNC?
            // App expects 'remoteTelemetry'.
            // Let's emit separate or normalize.
            this.emit({ type: 'SYNC', entities: { [data.id]: data } });
        });

        this.socket.on('currentPlayers', (players: any) => {
            // Emit individual joins or a bulk sync?
            Object.values(players).forEach((p: any) => {
                this.emit({ type: 'PLAYER_JOINED', player: { id: p.id, type: p.type } });
                // Also sync initial pos
                this.emit({ type: 'SYNC', entities: { [p.id]: p } });
            });
        });
    }
}
