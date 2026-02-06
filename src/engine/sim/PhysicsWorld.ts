import RAPIER from '@dimforge/rapier3d-compat';

export class PhysicsWorld {
    private static _world: RAPIER.World;
    private static _isReady = false;
    private static _initPromise: Promise<void> | null = null;

    public static get world(): RAPIER.World {
        if (!this._world) throw new Error("PhysicsWorld not initialized");
        return this._world;
    }

    public static async init() {
        if (this._isReady) {
            // console.log("PhysicsWorld already ready.");
            return;
        }

        if (this._initPromise) {
            // console.log("PhysicsWorld init already pending, waiting...");
            return this._initPromise;
        }

        console.log("PhysicsWorld initializing...");
        this._initPromise = (async () => {
            try {
                await RAPIER.init();
                console.log("RAPIER WASM loaded.");

                // Rapier expects explicit {x,y,z}
                const gravity = { x: 0.0, y: 0.0, z: 0.0 };
                this._world = new RAPIER.World(gravity);

                this._isReady = true;
                console.log("PhysicsWorld init complete. World created.");
            } catch (err) {
                console.error("Failed to initialize PhysicsWorld:", err);
                throw err;
            }
        })();

        return this._initPromise;
    }

    public static step(dt: number) {
        if (!this._isReady || !this._world) return;

        try {
            // Rapier timestep property might need to be set; usually it defaults to 1/60
            // Setting it every frame if we want variable dt, but 0.016 is fixed.
            this._world.timestep = dt;
            this._world.step();
        } catch (e) {
            console.error("PhysicsWorld crash during step:", e);
            // Emergency stop to prevent loop panic spam
            this._isReady = false;
        }
    }
}
