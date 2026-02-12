
import { MathUtils } from 'three';
import { DeviceManager, DeviceID } from './DeviceManager';

export type ActionName = string;
export type InputContext = 'GLOBAL' | 'MENU' | 'FLIGHT' | 'CUTSCENE';

// A binding defines HOW a raw input maps to an Action
export interface InputBinding {
    deviceType: 'keyboard' | 'gamepad' | 'mouse';

    // Identifiers
    key?: string;      // For Keyboard (e.g. 'KeyW')
    button?: number;   // For Gamepad Button Index (0-16)
    axis?: number;     // For Gamepad Axis Index (0-3)
    triggerIndex?: number; // For Analog Triggers (0=L2, 1=R2)
    mouseAxis?: 'x' | 'y';

    // Modifiers
    invert?: boolean;
    deadzone?: number;
    sensitivity?: number;

    // Composite (For Keyboard Axis simulation)
    // value: 1.0 (Positive) or -1.0 (Negative)
    value?: number;
}

// A Profile is a collection of bindings for a Context
export type InputProfile = Record<ActionName, InputBinding[]>;

export class InputMapper {
    private assignedDevice?: DeviceID; // e.g., 'gamepad:0'
    private contextProfiles = new Map<InputContext, InputProfile>();
    private activeContext: InputContext = 'GLOBAL';

    constructor(assignedDevice?: DeviceID) {
        this.assignedDevice = assignedDevice;
    }

    public setContext(ctx: InputContext) {
        this.activeContext = ctx;
    }

    public loadProfile(ctx: InputContext, profile: InputProfile) {
        this.contextProfiles.set(ctx, profile);
    }

    public getAssignedDevice(): DeviceID | undefined {
        return this.assignedDevice;
    }

    public setAssignedDevice(id: DeviceID) {
        this.assignedDevice = id;
    }

    public getActions(ctx: InputContext): ActionName[] {
        const profile = this.contextProfiles.get(ctx);
        return profile ? Object.keys(profile) : [];
    }

    // --- QUERY API ---

    public getButton(action: ActionName): boolean {
        const bindings = this.resolveBindings(action);
        if (!bindings) return false;

        for (const binding of bindings) {
            if (this.checkBindingButton(binding)) return true;
        }
        return false;
    }

    public getAxis(action: ActionName): number {
        const bindings = this.resolveBindings(action);
        if (!bindings) return 0;

        let totalValue = 0;
        for (const binding of bindings) {
            totalValue += this.checkBindingAxis(binding);
        }

        // Clamp to -1 to 1
        return MathUtils.clamp(totalValue, -1, 1);
    }

    // --- INTERNAL RESOLUTION ---

    private resolveBindings(action: ActionName): InputBinding[] | undefined {
        // 1. Try Active Context
        const profile = this.contextProfiles.get(this.activeContext);
        if (profile && profile[action]) return profile[action];

        // 2. Try Global (Fallback)
        if (this.activeContext !== 'GLOBAL') {
            const global = this.contextProfiles.get('GLOBAL');
            if (global && global[action]) return global[action];
        }

        return undefined;
    }

    private checkBindingButton(b: InputBinding): boolean {
        // Keyboard
        if (b.deviceType === 'keyboard') {
            return b.key ? DeviceManager.isKeyPressed(b.key) : false;
        }

        // Gamepad
        if (b.deviceType === 'gamepad' && this.assignedDevice && this.assignedDevice.startsWith('gamepad')) {
            const state = DeviceManager.getDeviceState(this.assignedDevice);
            if (!state || b.button === undefined) return false;
            return state.buttons[b.button];
        }

        return false;
    }

    private checkBindingAxis(b: InputBinding): number {
        // Keyboard (Simulated Axis)
        if (b.deviceType === 'keyboard') {
            if (b.key && DeviceManager.isKeyPressed(b.key)) {
                return b.value || 1.0;
            }
            return 0;
        }

        // Gamepad Axis
        if (b.deviceType === 'gamepad' && this.assignedDevice && this.assignedDevice.startsWith('gamepad')) {
            const state = DeviceManager.getDeviceState(this.assignedDevice);
            if (!state) return 0;


            let raw = 0;
            if (b.axis !== undefined) raw = state.axes[b.axis];
            if (b.triggerIndex !== undefined) raw = state.triggers[b.triggerIndex];

            // Apply Deadzone
            if (Math.abs(raw) < (b.deadzone || 0.1)) raw = 0;

            // Apply Inversion
            if (b.invert) raw *= -1;

            // Apply Sensitivity
            if (b.sensitivity) raw *= b.sensitivity;

            return raw;
        }

        return 0;
    }
}
