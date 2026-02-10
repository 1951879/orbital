
import { create } from 'zustand';
import { DeviceID, DeviceManager } from '../input/DeviceManager';
import { InputMapper, InputContext } from '../input/InputMapper';
import { InputProfile } from '../input/InputMapper';



export interface EnginePlayer {
    id: number;           // 0-3
    deviceId: DeviceID;
    input: InputMapper;
    isConnected: boolean; // False if device disconnects
}

interface SessionStateModel {
    players: EnginePlayer[];
    splitMode: 'horizontal' | 'vertical'; // For 2 players
}

// Zustand store for React reactivity (UI Bridging)
// BUT we also expose a static Manager for the Game Loop (Performance)
export const useSessionStore = create<SessionStateModel>(() => ({
    players: [],
    splitMode: 'horizontal'
}));

export class SessionState {
    private static _players: Map<number, EnginePlayer> = new Map();
    private static _leaveTimers: Map<number, number> = new Map(); // PlayerID -> Time Held
    private static _pauseLocks: Map<number, boolean> = new Map(); // PlayerID -> Was Pressed
    private static _inputListeners: Set<(playerId: number, action: string) => void> = new Set();

    public static onInput(callback: (playerId: number, action: string) => void) {
        this._inputListeners.add(callback);
        return () => this._inputListeners.delete(callback);
    }

    public static init() {
        // Listen to Device Changes
        DeviceManager.onDeviceChange(this.handleDeviceChange);
        // No auto-join. Party starts empty.
    }

    public static update(dt: number) {
        // 1. Poll for New Joins (Unassigned Gamepads)
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        for (const gp of gamepads) {
            if (!gp) continue;
            const devId = `gamepad:${gp.index}`;

            // Is it already assigned?
            let assigned = false;
            for (const p of this._players.values()) {
                if (p.deviceId === devId) { assigned = true; break; }
            }
            if (assigned) continue;

            // Check for 'A' button press to Join (Button 0)
            const state = DeviceManager.getDeviceState(devId);
            // Button 0 is standard A/Cross
            if (state && state.buttons[0]) {
                this.addPlayer(devId);
            }
        }

        // 2. Poll for Leave (Assigned Gamepads) - Hold 'LEAVE_SESSION' (B)
        this._players.forEach(p => {
            const isHolding = p.input.getButton('LEAVE_SESSION'); // Same as BACK
            let current = this._leaveTimers.get(p.id) || 0;

            if (isHolding) {
                // Increment Hold Timer
                current += dt;
                this._leaveTimers.set(p.id, current);

                if (current > 2.0) { // 2 Seconds Hold -> LEAVE
                    // Only trigger once
                    if (current - dt <= 2.0) {
                        console.log(`[Session] Player ${p.id} Left via Hold`);
                        this.removePlayer(p.id);
                        this._leaveTimers.set(p.id, 0); // Reset
                    }
                }
            } else {
                // Released?
                if (current > 0) {
                    // Was holding
                    if (current < 0.5) {
                        // Short Press -> Tap (BACK)
                        this._inputListeners.forEach(cb => cb(p.id, 'BACK'));
                    }
                    // Reset
                    this._leaveTimers.set(p.id, 0);
                }
            }

            // 3. Poll for PAUSE (Start / Enter)
            const isPausePressed = p.input.getButton('PAUSE');
            const wasPausePressed = this._pauseLocks.get(p.id) || false;

            if (isPausePressed && !wasPausePressed) {
                console.log(`[Session] Player ${p.id} requested PAUSE`);
                this._inputListeners.forEach(cb => cb(p.id, 'PAUSE'));
            }
            this._pauseLocks.set(p.id, isPausePressed);
        });
    }

    public static get players(): EnginePlayer[] {
        return Array.from(this._players.values());
    }

    public static getPlayer(id: number): EnginePlayer | undefined {
        return this._players.get(id);
    }

    private static _defaultProfiles = new Map<string, InputProfile>();

    public static registerDefaultProfile(deviceType: string, context: InputContext, profile: InputProfile) {
        const key = `${deviceType}:${context}`;
        this._defaultProfiles.set(key, profile);
    }

    // --- PLAYER MANAGEMENT ---

    public static addPlayer(deviceId: DeviceID): EnginePlayer | undefined {
        // Prevent duplicates
        for (const p of this._players.values()) {
            if (p.deviceId === deviceId) return p; // Already joined
        }

        if (this._players.size >= 4) return undefined; // Full

        // Find first available Scanline ID
        let id = 0;
        while (this._players.has(id)) id++;

        const mapper = new InputMapper(deviceId);

        // Load Default Profiles dynamically
        this._defaultProfiles.forEach((profile, key) => {
            const [pDevice, pContext] = key.split(':');
            if (deviceId.startsWith(pDevice)) {
                mapper.loadProfile(pContext as InputContext, profile);
            }
        });

        // Mouse? (Future)

        const player: EnginePlayer = {
            id,
            deviceId,
            input: mapper,
            isConnected: true
        };

        // Apply current Global Context
        player.input.setContext(this._currentContext);

        this._players.set(id, player);
        this.syncStore();

        console.log(`[Session] Player ${id} joined with ${deviceId}. Total: ${this._players.size}`);
        return player;
    }

    public static removePlayer(id: number) {
        if (this._players.delete(id)) {
            this.syncStore();
            console.log(`[Session] Player ${id} left`);
        }
    }

    public static setContextForAll(ctx: InputContext) {
        this._currentContext = ctx;
        this._players.forEach(p => p.input.setContext(ctx));
    }

    private static _currentContext: InputContext = 'MENU';

    // --- INTERNAL LOGIC ---

    private static handleDeviceChange = (deviceId: DeviceID, connected: boolean) => {
        // Find if this device is assigned to a player
        let assignedPlayer: EnginePlayer | undefined;
        for (const p of this._players.values()) {
            if (p.deviceId === deviceId) assignedPlayer = p;
        }

        if (connected) {
            // Reconnect?
            if (assignedPlayer && !assignedPlayer.isConnected) {
                assignedPlayer.isConnected = true;
                this.syncStore();
            }
        } else {
            // Disconnect
            if (assignedPlayer) {
                assignedPlayer.isConnected = false;
                // EDGE CASE: Global Pause should be triggered by Bridge listening to Store
                this.syncStore();
            }
        }
    };



    private static syncStore() {
        useSessionStore.setState({
            players: Array.from(this._players.values())
        });
    }
}
