import { Time } from './Time';
import { DeviceManager } from '../input/DeviceManager';
import { SessionState } from '../session/SessionState';

type TickCallback = () => void;

export class Loop {
    private static _isRunning: boolean = false;
    private static _rafId: number = 0;
    private static _callbacks: Set<TickCallback> = new Set();

    public static start() {
        if (this._isRunning) return;
        this._isRunning = true;

        let lastTime = performance.now();

        const step = (time: number) => {
            if (!this._isRunning) return;

            const dt = Math.min((time - lastTime) / 1000, 0.1); // Cap dt at 100ms
            lastTime = time;

            // 1. Update Subsystems
            Time.tick(dt, time / 1000);
            DeviceManager.update();
            SessionState.update(dt);

            // 2. Run Registered Systems (Sim Layer)
            this._callbacks.forEach(cb => cb());

            this._rafId = requestAnimationFrame(step);
        };

        this._rafId = requestAnimationFrame(step);
    }

    public static stop() {
        this._isRunning = false;
        cancelAnimationFrame(this._rafId);
    }

    public static register(callback: TickCallback) {
        this._callbacks.add(callback);
        return () => this._callbacks.delete(callback);
    }
}
