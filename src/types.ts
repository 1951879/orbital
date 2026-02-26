
import { Vector3, Quaternion } from 'three';
import React from 'react';

export interface TerrainParams {
  waterLevel: number;    // 0.0 - 1.0
  mountainScale: number; // 0.0 - 2.0
  forestDensity: number; // 0.0 - 1.0
  desertDensity: number; // 0.0 - 1.0
  plantSize: number;     // 0.0 - 1.0 (Texture scale)
  planetRadius: number;  // 5.0 - 100.0
  mountainFrequency: number; // 0.1 - 5.0
}

export interface JoystickState {
  x: number; // -1 to 1
  y: number; // -1 to 1
  active: boolean;
}

export interface TouchConfig {
  joystickSize: number; // Scale multiplier (default 1.0)
}

export interface FlightTelemetry {
  altitude: number;
  speed: number;
  throttle: number;
  pitch: number; // radians
  roll: number;  // radians
}

import { AIRPLANE_TYPES } from './app/core/entities/Airplane/registry';

export type AirplaneType = (typeof AIRPLANE_TYPES)[number];

export type GameMode = 'single' | 'splitscreen';

export type MissionType = 'free' | 'main_menu';

export type MenuTabId = 'multiplayer' | 'hangar' | 'system' | 'config';

export type InputType =
  | 'touch'
  | 'mouse_kb'        // Mouse (Flight) + F/C (Throttle)
  | 'mouse_only'      // Mouse (Flight) + Scroll (Throttle)
  | 'keyboard_wasd'   // WASD (Flight) + F/C (Throttle)
  | 'keyboard_arrows' // Arrows (Flight) + ;/' (Throttle)
  | 'gamepad';        // Gamepad Axis + Triggers

export interface PlayerInputConfig {
  type: InputType;
  deviceId: string; // e.g. 'kb1', 'gamepad:0'
  gamepadIndex: number; // -1 if not gamepad
}

export type PilotStatus = 'joining' | 'selecting' | 'ready';

export interface LocalPilot {
  id: number;           // 0, 1, 2, 3 (Index)
  sessionId: number;    // Engine Session ID (usually matches id)
  uniqueId: string;     // Unique String ID (Random 8-char)
  name: string;         // Derived from uniqueId
  color: string;        // hex
  team: 1 | 2;

  input: PlayerInputConfig;
  airplane: AirplaneType;

  // UI State (Arcade Grid)
  ui: {
    cursorIndex: number; // 0-N (Plane Index)
    status: PilotStatus;
    viewRotation: { x: number, y: number }; // For inspecting plane in Hangar
  };

  // Physics
  telemetry: FlightTelemetry;
  throttle: number;
}

export interface RemotePlayerInfo {
  id: string;
  name: string;
  airplane: AirplaneType;
  color: string; // hex
  isReady: boolean;
  joinedAt: number;
}







export interface LobbyInfo {
  id: string;
  name: string;
  hostName: string;
  mode: string;               // "free_flight", "tdm", etc.
  playerCount: number;
  maxPlayers: number;
  gameServerAddress: string;
  terrainConfig: {
    seed: number;
    params: TerrainParams;
  };
}

export interface AppState {
  // Game Mode (View Configuration)
  gameMode: GameMode;
  setGameMode: (mode: GameMode) => void;

  // Mission State
  mission: MissionType;
  setMission: (mission: MissionType) => void;



  // --- SQUADRON STATE ---
  // squadronAnchor: Vector3 | null; 
  // setSquadronAnchor: (anchor: Vector3 | null) => void;

  // Multiplayer Options
  splitDirection: 'horizontal' | 'vertical';
  setSplitDirection: (dir: 'horizontal' | 'vertical') => void;

  invertPlayer2: boolean;
  setInvertPlayer2: (inv: boolean) => void;

  // ONLINE MULTIPLAYER STATE
  isMultiplayerEnabled: boolean;
  setMultiplayerEnabled: (enabled: boolean) => void;

  isOnline: boolean;
  ping: number;
  setPing: (ms: number) => void;

  socketStatus: 'disconnected' | 'connecting' | 'connected';
  remotePlayers: RemotePlayerInfo[];

  // Lobby / Room State
  lobbies: LobbyInfo[];
  currentRoomId: string | null;
  setLobbies: (lobbies: LobbyInfo[]) => void;
  setCurrentRoomId: (id: string | null) => void;

  // Socket Instance (Singleton)
  // Socket Instance (Singleton) - MOVED TO NetworkManager
  // socket: any | null; 
  // setSocket: (socket: any | null) => void;

  setOnlineStatus: (status: 'disconnected' | 'connecting' | 'connected') => void;
  setRemotePlayers: (players: RemotePlayerInfo[]) => void;
  addRemotePlayer: (player: RemotePlayerInfo) => void;
  removeRemotePlayer: (id: string) => void;

  // --- LOCAL PARTY STATE (PHASE 1 REFACTOR) ---
  localParty: LocalPilot[];

  // Session Bridge Actions
  addPilot: (sessionId: number, deviceId: string) => void;
  removePilot: (sessionId: number) => void;

  updatePilot: (index: number, updates: Partial<LocalPilot>) => void;
  updatePilotViewRotation: (index: number, x: number, y: number) => void; // New Action

  // Deprecated/Legacy (Remove later or alias)
  // joinParty: (input: PlayerInputConfig) => void; 
  // leaveParty: (index: number) => void;

  // Unified Input State (Replaces individual P1/P2 joysticks)
  joysticks: Record<number, JoystickState>;
  setPilotJoystickState: (id: number, state: JoystickState) => void;
  setPilotThrottle: (id: number, value: number) => void;

  // Terrain Generation State
  terrainSeed: number;
  terrainParams: TerrainParams;

  // Actions
  generateNewTerrain: () => void;
  setTerrainConfig: (seed: number, params: TerrainParams) => void;
  setTerrainParam: (key: keyof TerrainParams, value: number) => void;

  // Camera Control
  cameraResetTrigger: number;
  triggerCameraReset: () => void;

  isCameraTransitioning: boolean;
  setCameraTransitioning: (isTransitioning: boolean) => void;

  // Game State
  // isPaused removed - handled per-mode

  // Menu Persistence
  activeMenuTab: MenuTabId;
  setActiveMenuTab: (tab: MenuTabId) => void;

  // Shared World State (For Physics/Shadows)
  pilotPositions: Vector3[]; // [0]=P1, [1]=P2, etc.

  terrainRotation: number;

  // Arcade Actions
  setPilotCursor: (index: number, cursorIndex: number) => void;
  setPilotStatus: (index: number, status: PilotStatus) => void;
  abortMission: () => void;

  // Touch UI Config
  touchConfig: TouchConfig;
  setTouchConfig: (config: Partial<TouchConfig>) => void;
}
