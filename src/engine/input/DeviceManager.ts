
import { Vector2 } from 'three';

// Unique ID for a device (e.g., 'keyboard', 'gamepad:0')
export type DeviceID = string;

// Standard Map of Buttons/Axes
// Buttons: 0-16 (Standard Gamepad Mapping)
// Axes: 0-3 (Left Stick X/Y, Right Stick X/Y)
export interface RawInputState {
    buttons: boolean[]; // [A, B, X, Y, LB, RB, LT, RT, Select, Start, L3, R3, Up, Down, Left, Right, Home]
    axes: number[];     // [LX, LY, RX, RY]
    triggers: number[]; // [L2, R2] Analog (0-1)
}

export type DeviceCallback = (deviceId: DeviceID, connected: boolean) => void;

export class DeviceManager {
    private static _devices = new Map<DeviceID, RawInputState>();
    private static _listeners = new Set<DeviceCallback>();

    // Keyboard State (Internal)
    private static _keys = new Set<string>();
    private static _mouseDelta = new Vector2();
    private static _initialized = false;

    // Pointer Lock State
    private static _pointerLockEnabled = false;

    // --- PUBLIC API ---

    public static setVirtualAxis(deviceId: DeviceID, axisIndex: number, value: number) {
        let state = this._devices.get(deviceId);
        if (!state) {
            state = { buttons: [], axes: [], triggers: [] };
            this._devices.set(deviceId, state);
            this.emitDeviceChange(deviceId, true);
        }
        state.axes[axisIndex] = value;
    }

    public static setVirtualTrigger(deviceId: DeviceID, triggerIndex: number, value: number) {
        let state = this._devices.get(deviceId);
        if (!state) {
            state = { buttons: [], axes: [], triggers: [] };
            this._devices.set(deviceId, state);
            this.emitDeviceChange(deviceId, true);
        }
        state.triggers[triggerIndex] = value;
    }

    public static init() {
        if (this._initialized) return;
        this._initialized = true;

        // Keyboard & Mouse Listeners
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
        // Keyboard & Mouse Listeners
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('click', this.handleDocumentClick);

        // Gamepad Listeners (Connection only - Polling happens in update)
        window.addEventListener('gamepadconnected', (e) => this.emitDeviceChange(`gamepad:${e.gamepad.index}`, true));
        window.addEventListener('gamepaddisconnected', (e) => this.emitDeviceChange(`gamepad:${e.gamepad.index}`, false));

        // Initial Device Registration (Keyboard is always there)
        this.emitDeviceChange('keyboard', true);
    }

    public static cleanup() {
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        window.removeEventListener('keyup', this.handleKeyUp);
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('click', this.handleDocumentClick);
        this._devices.clear();
        this._initialized = false;
    }

    public static setPointerLockEnabled(enabled: boolean) {
        this._pointerLockEnabled = enabled;
        if (!enabled && document.pointerLockElement) {
            document.exitPointerLock();
        }
    }

    public static requestPointerLock() {
        if (this._pointerLockEnabled && !document.pointerLockElement) {
            document.body.requestPointerLock().catch(e => console.warn(e));
        }
    }

    public static exitPointerLock() {
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
    }

    public static onDeviceChange(cb: DeviceCallback) {
        this._listeners.add(cb);
    }

    public static offDeviceChange(cb: DeviceCallback) {
        this._listeners.delete(cb);
    }

    /**
     * Called once per frame by the Engine Loop
     */
    public static update() {
        // 1. Poll Gamepads
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        for (const gp of gamepads) {
            if (gp) {
                this.updateGamepadState(gp);
            }
        }

        // 2. Mouse Delta Reset happens AFTER consumers read it? 
        // Or we should let InputMapper consume it.
        // For now, we accumulate, and provide a way to read-and-reset if needed.
        // Actually, InputMapper handles frame consumption. We just hold current state.
    }

    // --- STATE ACCESS ---

    public static getDeviceState(id: DeviceID): RawInputState | undefined {
        if (id === 'keyboard') {
            return this.getKeyboardState();
        }
        return this._devices.get(id);
    }

    public static isKeyPressed(code: string): boolean {
        return this._keys.has(code);
    }

    // --- INTERNAL UPDATES ---

    private static updateGamepadState(gp: Gamepad) {
        const id = `gamepad:${gp.index}`;
        let state = this._devices.get(id);

        if (!state) {
            state = { buttons: [], axes: [], triggers: [] };
            this._devices.set(id, state);
            this.emitDeviceChange(id, true); // Just in case
        }

        // Map Buttons (Standard)
        gp.buttons.forEach((btn, i) => {
            state!.buttons[i] = btn.pressed;
        });

        // Map Triggers (Analog) - Usually Buttons 6 (LT) and 7 (RT)
        state.triggers[0] = gp.buttons[6]?.value || 0;
        state.triggers[1] = gp.buttons[7]?.value || 0;

        // Map Axes
        gp.axes.forEach((axis, i) => {
            // Apply simple deadzone at hardware level? Or Mapper level?
            // Mapper level allows per-profile settings. We pass RAW here.
            state!.axes[i] = axis;
        });
    }

    private static getKeyboardState(): RawInputState {
        // Keyboard doesn't fit RawInputState perfectly (infinite buttons).
        // Mappers will use `isKeyPressed` directly for Keyboard.
        // This is a placeholder to satisfy the type if needed generically.
        return { buttons: [], axes: [], triggers: [] };
    }

    private static handleKeyDown = (e: KeyboardEvent) => this._keys.add(e.code);
    private static handleKeyUp = (e: KeyboardEvent) => this._keys.delete(e.code);
    private static handleMouseMove = (e: MouseEvent) => {
        // Accumulate delta? Or just generic mouse pointer?
        // Pointer Lock dependent.
        if (document.pointerLockElement) {
            this._mouseDelta.x += e.movementX;
            this._mouseDelta.y += e.movementY;
        }
    };

    private static handleDocumentClick = () => {
        if (this._pointerLockEnabled && !document.pointerLockElement) {
            this.requestPointerLock();
        }
    };

    private static emitDeviceChange(id: DeviceID, connected: boolean) {
        this._listeners.forEach(cb => cb(id, connected));
    }
}
