
import { create } from 'zustand';
import { Vector3, Quaternion } from 'three';
import {
    AppState,
    TerrainParams,
    LocalPilot,
    PlayerInputConfig,
    AirplaneType,
    JoystickState,
    PilotStatus,
    MenuTabId,
    GameMode,
    MissionType,
    LobbyInfo,
    RemotePlayerInfo,
    InputType,

} from '../../types';

// Non-reactive storage for high frequency updates
export const remoteTelemetry = new Map<string, {
    pos: Vector3;
    quat: Quaternion;
    targetPos: Vector3;
    targetQuat: Quaternion;
    throttle: number;
}>();

const DEFAULT_TERRAIN_PARAMS: TerrainParams = {
    waterLevel: 0.33,
    mountainScale: 1.0,
    forestDensity: 0.45,
    desertDensity: 0.3,
    plantSize: 0.3,
    planetRadius: 50.0,
    mountainFrequency: 2.5
};



// Initial Pilot Setup
const createPilot = (id: number, type: InputType, deviceId: string, gpIndex: number = -1): LocalPilot => ({
    id,
    sessionId: id, // Default to id
    name: id === 0 ? "Maverick" : (id === 1 ? "Goose" : (id === 2 ? "Iceman" : "Viper")),
    color: id === 0 ? "#3b82f6" : (id === 1 ? "#ef4444" : (id === 2 ? "#eab308" : "#22c55e")),
    team: (id % 2) === 0 ? 1 : 2,
    input: { type, deviceId, gamepadIndex: gpIndex },
    airplane: 'interceptor',
    ui: { cursorIndex: 0, status: 'selecting', viewRotation: { x: 0, y: 0 } },
    telemetry: { altitude: 0, speed: 0, throttle: 0, pitch: 0, roll: 0 },
    throttle: 0
});

export const useStore = create<AppState>((set, get) => ({
    // --- GAME MODE & MISSION ---
    gameMode: 'single',
    setGameMode: (mode) => set({ gameMode: mode }),

    mission: 'main_menu',
    setMission: (mission) => set({ mission }),



    // --- MULTIPLAYER ---
    splitDirection: 'horizontal',
    setSplitDirection: (dir) => set({ splitDirection: dir }),

    invertPlayer2: false,
    setInvertPlayer2: (inv) => set({ invertPlayer2: inv }),

    isMultiplayerEnabled: false,
    setMultiplayerEnabled: (enabled) => set({ isMultiplayerEnabled: enabled }),

    isOnline: false,
    ping: 0,
    setPing: (ms) => set({ ping: ms }),

    socketStatus: 'disconnected',
    remotePlayers: [],

    lobbies: [],
    currentRoomId: null,
    setLobbies: (lobbies) => set({ lobbies }),
    setCurrentRoomId: (id) => set({ currentRoomId: id }),

    // Socket Moved to NetworkManager
    // socket: null,
    // setSocket: (socket) => set({ socket }),

    setOnlineStatus: (status) => set({ socketStatus: status, isOnline: status === 'connected' }),
    setRemotePlayers: (players) => set({ remotePlayers: players }),
    addRemotePlayer: (player) => set((state) => ({ remotePlayers: [...state.remotePlayers, player] })),
    removeRemotePlayer: (id) => set((state) => ({ remotePlayers: state.remotePlayers.filter(p => p.id !== id) })),

    // --- LOCAL PARTY ---
    localParty: [], // Empty by default

    addPilot: (sessionId, deviceId) => set((state) => {
        // Check if already exists
        if (state.localParty.find(p => p.sessionId === sessionId)) return {};

        // Determine Input Type from Device ID
        let type: InputType = 'gamepad';
        let gpIndex = -1;

        if (deviceId === 'touch') {
            type = 'touch';
        } else if (deviceId === 'keyboard' || deviceId === 'keyboard_wasd') {
            type = 'keyboard_wasd';
        } else if (deviceId === 'keyboard_arrows') {
            type = 'keyboard_arrows' as InputType; // Ensure InputType definition supports this?
        } else if (deviceId.startsWith('gamepad:')) {
            type = 'gamepad';
            gpIndex = parseInt(deviceId.split(':')[1]);
        } else if (deviceId === 'kb1' || deviceId === 'kb2') {
            type = 'keyboard_wasd'; // or generic keyboard type
        }

        const newPilot = createPilot(sessionId, type, deviceId, gpIndex);
        newPilot.sessionId = sessionId; // Ensure explicit set

        // Determine Game Mode
        const newCount = state.localParty.length + 1;
        let mode = state.gameMode;
        if (newCount === 2) mode = 'splitscreen';

        return {
            localParty: [...state.localParty, newPilot],
            gameMode: mode
        };
    }),

    removePilot: (sessionId) => set((state) => {
        const party = state.localParty.filter(p => p.sessionId !== sessionId);
        let mode = state.gameMode;
        if (party.length < 2) mode = 'single';
        return { localParty: party, gameMode: mode };
    }),

    updatePilot: (index, updates) => set((state) => {
        const party = [...state.localParty];
        // Handle 0-based index
        const pilot = party.find(p => p.id === index);
        if (pilot) {
            Object.assign(pilot, updates);
            if (updates.ui) {
                // shallow merge UI
                pilot.ui = { ...pilot.ui, ...updates.ui };
            }
            if (updates.telemetry) {
                pilot.telemetry = { ...pilot.telemetry, ...updates.telemetry };
            }
        }
        return { localParty: party };
    }),

    updatePilotViewRotation: (index, x, y) => set((state) => {
        const party = [...state.localParty];
        const pilot = party.find(p => p.id === index);
        if (pilot) {
            pilot.ui.viewRotation = {
                x: pilot.ui.viewRotation.x + x,
                y: pilot.ui.viewRotation.y + y
            };
        }
        return { localParty: party };
    }),

    // Legacy (No-op or alias if needed, but SessionBridge handles this now)
    joinParty: () => { },
    leaveParty: () => { },

    joysticks: {},
    setPilotJoystickState: (id, jState) => set((state) => ({
        joysticks: { ...state.joysticks, [id]: jState }
    })),

    setPilotThrottle: (id, value) => set((state) => {
        // Need to update the specific pilot in localParty
        const party = [...state.localParty];
        const pilot = party.find(p => p.id === id);
        if (pilot) {
            pilot.throttle = value;
        }
        return { localParty: party };
    }),

    // --- TERRAIN ---
    terrainSeed: 12345,
    terrainParams: DEFAULT_TERRAIN_PARAMS,

    generateNewTerrain: () => set({ terrainSeed: Math.floor(Math.random() * 100000) }),
    setTerrainParam: (key, value) => set((state) => ({
        terrainParams: { ...state.terrainParams, [key]: value }
    })),

    // --- SYSTEM ---
    cameraResetTrigger: 0,
    triggerCameraReset: () => set((state) => ({ cameraResetTrigger: state.cameraResetTrigger + 1 })),

    isCameraTransitioning: false,
    setCameraTransitioning: (val) => set({ isCameraTransitioning: val }),

    isPaused: true, // Start Paused (In Menu)
    setIsPaused: (val) => set({ isPaused: val }),

    activeMenuTab: 'hangar',
    setActiveMenuTab: (tab) => set({ activeMenuTab: tab }),

    pilotPositions: [new Vector3(), new Vector3(), new Vector3(), new Vector3()],

    terrainRotation: 0,

    // Legacy setters that might be called (polyfill if needed)
    setPilotCursor: (index, cursorIndex) => {
        // Find pilot with index
        set((state) => {
            const party = [...state.localParty];
            const p = party.find(pi => pi.id === index);
            if (p) {
                p.ui.cursorIndex = cursorIndex;
            }
            return { localParty: party };
        });
    },

    setPilotStatus: (index, status) => {
        set((state) => {
            const party = [...state.localParty];
            const p = party.find(pi => pi.id === index);
            if (p) {
                p.ui.status = status;
            }
            return { localParty: party };
        });
    },

    // --- SQUADRON STATE ---
    // squadronAnchor: null,
    // setSquadronAnchor: (anchor) => set({ squadronAnchor: anchor }),

    abortMission: () => set((state) => ({
        mission: 'free',
        isPaused: true // Keep paused so we return to menu lobby
    }))
}));
