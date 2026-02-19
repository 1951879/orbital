import { io, Socket } from 'socket.io-client';
import geckos, { ClientChannel } from '@geckos.io/client';
import { RemotePlayerInfo, LobbyInfo } from '../../types';

// Define locally to avoid importing from server protocol directly if not available in client types yet
// In a real monorepo we'd import from shared.
export interface PlayerMetadataUpdate {
    playerId: string;
    isReady?: boolean;
    color?: string;
    airplane?: string;
}

export interface RemoteEntity {
    id: string;
    type: string;
    ownerId: string;
    position: [number, number, number];
    quaternion: [number, number, number, number];
    velocity: [number, number, number];
    custom: Record<string, number>;
}

export interface EntityStateUpdate {
    entityId: string;
    position: [number, number, number];
    quaternion: [number, number, number, number];
    velocity: [number, number, number];
    custom: Record<string, number>;
}

export interface WorldSnapshot {
    tick: number;
    timestamp: number;
    entities: RemoteEntity[];
}

export interface EntityState {
    id: string;
    type: string;
    ownerId: string;
    position: [number, number, number];
    quaternion: [number, number, number, number];
    velocity: [number, number, number];
    custom: Record<string, number>;
}

type NetworkEvent =
    | { type: 'CONNECTED' }
    | { type: 'DISCONNECTED' }
    | { type: 'LOBBY_LIST'; lobbies: LobbyInfo[] }
    | { type: 'LOBBY_CREATED'; lobbyId: string; gameServerAddress: string; roomId: string }
    | { type: 'LOBBY_JOINED'; lobbyId: string; gameServerAddress: string; roomId: string }
    | { type: 'LOBBY_UPDATED'; lobby: LobbyInfo }
    | { type: 'LOBBY_DESTROYED'; lobbyId: string }
    | { type: 'GAME_CONNECTED' }
    | { type: 'GAME_DISCONNECTED' }
    | { type: 'ROOM_JOINED'; roomId: string; tick: number; entities: EntityState[]; players: RemotePlayerInfo[]; config: any }
    | { type: 'ENTITY_SPAWNED'; entity: EntityState }
    | { type: 'ENTITY_DESTROYED'; entityId: string }
    | { type: 'WORLD_SNAPSHOT'; snapshot: WorldSnapshot }
    | { type: 'PLAYER_JOINED'; player: RemotePlayerInfo }
    | { type: 'PLAYER_JOINED'; player: RemotePlayerInfo }
    | { type: 'PLAYER_LEFT'; playerId: string }
    | { type: 'PLAYER_METADATA_UPDATE'; player: RemotePlayerInfo }
    | { type: 'LATENCY'; ms: number }
    | { type: 'ERROR'; message: string };

type Listener = (event: NetworkEvent) => void;

// ============================================================
// NETWORK MANAGER
//
// Two independent connections:
//   1. Platform Services (Socket.IO / TCP) — lobby listing, create/join
//   2. Game Server (geckos.io / UDP) — entity state relay
// ============================================================

export class NetworkManager {
    // Platform Services connection (Socket.IO)
    private static platformSocket: Socket | null = null;
    private static _isPlatformConnected = false;

    // Game Server connection (geckos.io)
    private static gameChannel: ClientChannel | null = null;
    private static _isGameConnected = false;

    // Entity tracking
    private static _localEntityIds: string[] = [];
    private static _channelId: string | null = null;

    // Event system
    private static listeners: Set<Listener> = new Set();

    // Public getters
    public static get isConnected() { return this._isPlatformConnected; }
    public static get isGameConnected() { return this._isGameConnected; }
    public static get channelId() { return this._channelId; }
    public static get localEntityIds() { return this._localEntityIds; }

    // ============================================================
    // PLATFORM SERVICES (Socket.IO — lobbies)
    // ============================================================

    public static connectPlatform(url: string = 'http://localhost:3002') {
        if (this.platformSocket) return;

        console.log('[NetworkManager] Connecting to platform services:', url);
        this.platformSocket = io(url, {
            transports: ['websocket'],
            autoConnect: true,
        });

        this.setupPlatformListeners();
    }

    public static disconnectPlatform() {
        if (this.platformSocket) {
            this.platformSocket.disconnect();
            this.platformSocket = null;
            this._isPlatformConnected = false;
            this.emit({ type: 'DISCONNECTED' });
        }
    }

    public static createLobby(data: {
        name: string;
        hostName: string;
        mode: string;
        maxPlayers?: number;
        terrainConfig?: { seed: number; params: any };
        localPlayerCount?: number;
    }) {
        this.platformSocket?.emit('createLobby', data);
    }

    public static joinLobby(lobbyId: string, playerName: string, localPlayerCount: number = 1) {
        this.platformSocket?.emit('joinLobby', { lobbyId, playerName, localPlayerCount });
    }

    public static leaveLobby() {
        this.platformSocket?.emit('leaveLobby');
    }

    // ============================================================
    // GAME SERVER (geckos.io — entity state relay)
    // ============================================================

    public static connectGameServer(url: string = 'http://localhost:3001') {
        if (this.gameChannel) return;

        console.log('[NetworkManager] Connecting to game server:', url);

        // Parse URL to get host and port
        const parsed = new URL(url);
        const port = parseInt(parsed.port) || 3001;

        this.gameChannel = geckos({ url: `${parsed.protocol}//${parsed.hostname}`, port });

        this.gameChannel.onConnect((error) => {
            if (error) {
                console.error('[NetworkManager] Game server connection error:', error);
                this.emit({ type: 'ERROR', message: `Game server connection failed: ${error.message}` });
                return;
            }

            this._isGameConnected = true;
            this._channelId = this.gameChannel?.id || null;
            console.log('[NetworkManager] Game server connected, channelId:', this._channelId);
            this.emit({ type: 'GAME_CONNECTED' });

            this.setupGameListeners();
        });

        this.gameChannel.onDisconnect(() => {
            console.log('[NetworkManager] Game server disconnected');
            this._isGameConnected = false;
            this._channelId = null;
            this._localEntityIds = [];
            this.emit({ type: 'GAME_DISCONNECTED' });
        });
    }

    public static disconnectGameServer() {
        if (this.gameChannel) {
            this.gameChannel.close();
            this.gameChannel = null;
            this._isGameConnected = false;
            this._channelId = null;
            this._localEntityIds = [];
            this.emit({ type: 'GAME_DISCONNECTED' });
        }
    }

    /** Join a game room. Called after lobby creation/join provides a roomId. */
    public static joinGameRoom(roomId: string, party: any[]) { // LocalPilot[] but avoiding import cycle
        if (!this.gameChannel || !this._isGameConnected) {
            console.warn('[NetworkManager] Cannot join room — not connected to game server');
            return;
        }

        const players = party.map(p => ({
            name: p.name,
            airplane: p.airplane,
            color: p.color,
            pilotId: p.id
        }));

        this.gameChannel.emit('joinRoom', {
            roomId,
            players,
        } as any, { reliable: true });
    }

    /** Leave the current game room. */
    public static leaveGameRoom() {
        if (!this.gameChannel || !this._isGameConnected) return;
        this.gameChannel.emit('leaveRoom', null, { reliable: true });
        this._localEntityIds = [];
    }

    /** Send local entity state to the game server (unreliable, ~60Hz). */
    public static sendStateUpdate(update: EntityStateUpdate) {
        if (!this.gameChannel || !this._isGameConnected) return;
        this.gameChannel.emit('stateUpdate', update as any);
    }

    public static sendPlayerMetadata(metadata: PlayerMetadataUpdate) {
        if (!this.gameChannel || !this._isGameConnected) return;
        this.gameChannel.emit('playerMetadataUpdate', metadata as any, { reliable: true });
    }

    // ============================================================
    // LEGACY METHODS (backward compatibility)
    // ============================================================

    public static connect(url?: string) {
        this.connectPlatform(url || 'http://localhost:3002');
    }

    public static disconnect() {
        this.disconnectPlatform();
        this.disconnectGameServer();
    }

    public static joinRoom(roomId: string) {
        // Legacy support: join as single player "Player"
        this.joinGameRoom(roomId, [{ name: 'Player', airplane: 'interceptor', color: '#00ff00', id: 0 }]);
    }

    public static leaveRoom() {
        this.leaveGameRoom();
    }

    public static createRoom(name: string) {
        this.createLobby({ name, hostName: 'Host', mode: 'free_flight' });
    }

    public static sendUpdate(_data: any) { /* Phase 3: use sendStateUpdate */ }
    public static sendTelemetry(_data: any) { /* Phase 3: use sendStateUpdate */ }
    public static checkLatency() { /* TODO */ }

    // ============================================================
    // EVENT SYSTEM
    // ============================================================

    public static subscribe(listener: Listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private static emit(event: NetworkEvent) {
        this.listeners.forEach(l => l(event));
    }

    // ============================================================
    // INTERNAL LISTENERS
    // ============================================================

    private static setupPlatformListeners() {
        const socket = this.platformSocket;
        if (!socket) return;

        socket.on('connect', () => {
            console.log('[NetworkManager] Platform services connected');
            this._isPlatformConnected = true;
            this.emit({ type: 'CONNECTED' });
        });

        socket.on('disconnect', () => {
            console.log('[NetworkManager] Platform services disconnected');
            this._isPlatformConnected = false;
            this.emit({ type: 'DISCONNECTED' });
        });

        socket.on('lobbyList', (lobbies: LobbyInfo[]) => {
            this.emit({ type: 'LOBBY_LIST', lobbies });
        });

        socket.on('lobbyCreated', (data: { id: string; gameServerAddress: string; roomId: string }) => {
            this.emit({
                type: 'LOBBY_CREATED',
                lobbyId: data.id,
                gameServerAddress: data.gameServerAddress,
                roomId: data.roomId,
            });
        });

        socket.on('lobbyJoined', (data: { id: string; gameServerAddress: string; roomId: string }) => {
            this.emit({
                type: 'LOBBY_JOINED',
                lobbyId: data.id,
                gameServerAddress: data.gameServerAddress,
                roomId: data.roomId,
            });
        });

        socket.on('lobbyUpdated', (lobby: LobbyInfo) => {
            this.emit({ type: 'LOBBY_UPDATED', lobby });
        });

        socket.on('lobbyDestroyed', (data: { id: string }) => {
            this.emit({ type: 'LOBBY_DESTROYED', lobbyId: data.id });
        });

        socket.on('error', (data: { message: string }) => {
            this.emit({ type: 'ERROR', message: data.message });
        });
    }

    private static setupGameListeners() {
        const channel = this.gameChannel;
        if (!channel) return;

        // Room joined (reliable) — receive initial state
        channel.on('roomJoined', (data: any) => {
            const payload = data as {
                roomId: string;
                tick: number;
                entities: EntityState[];
                players: RemotePlayerInfo[];
                config: any;
            };

            // Track our own entities
            this._localEntityIds = payload.entities
                .filter(e => e.ownerId === this._channelId)
                .map(e => e.id);

            console.log('[NetworkManager] Room joined:', payload.roomId,
                'tick:', payload.tick,
                'entities:', payload.entities.length,
                'players:', payload.players?.length || 0,
                'own entities:', this._localEntityIds);

            this.emit({
                type: 'ROOM_JOINED',
                roomId: payload.roomId,
                tick: payload.tick,
                entities: payload.entities,
                players: payload.players || [],
                config: payload.config,
            });
        });

        // Player joined (reliable)
        channel.on('playerJoined', (data: any) => {
            const { player } = data as { player: RemotePlayerInfo };
            console.log('[NetworkManager] Player joined:', player.name, `(${player.id})`);
            this.emit({ type: 'PLAYER_JOINED', player });
        });

        // Player left (reliable)
        channel.on('playerLeft', (data: any) => {
            const { playerId } = data as { playerId: string };
            console.log('[NetworkManager] Player left:', playerId);
            this.emit({ type: 'PLAYER_LEFT', playerId });
        });

        // Player metadata update (reliable)
        channel.on('playerMetadataUpdate', (data: any) => {
            const { player } = data as { player: RemotePlayerInfo };
            console.log('[NetworkManager] Player metadata update:', player.name, player.isReady);
            this.emit({ type: 'PLAYER_METADATA_UPDATE', player });
        });

        // Entity spawned (reliable) — another player joined
        channel.on('entitySpawned', (data: any) => {
            const entity = data as EntityState;
            console.log('[NetworkManager] Entity spawned:', entity.id, 'type:', entity.type, 'owner:', entity.ownerId);
            this.emit({ type: 'ENTITY_SPAWNED', entity });
        });

        // Entity destroyed (reliable) — another player left
        channel.on('entityDestroyed', (data: any) => {
            const { entityId } = data as { entityId: string };
            console.log('[NetworkManager] Entity destroyed:', entityId);
            this._localEntityIds = this._localEntityIds.filter(id => id !== entityId);
            this.emit({ type: 'ENTITY_DESTROYED', entityId });
        });

        // World snapshot (unreliable, ~60Hz) — all entity states
        channel.on('worldSnapshot', (data: any) => {
            const snapshot = data as WorldSnapshot;
            this.emit({ type: 'WORLD_SNAPSHOT', snapshot });
        });

        // Room closed
        channel.on('roomClosed', () => {
            console.log('[NetworkManager] Room closed by server');
            this._localEntityIds = [];
            this.emit({ type: 'GAME_DISCONNECTED' });
        });
    }
}
