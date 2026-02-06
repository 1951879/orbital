import { Vector3 } from 'three';
import { SimplexNoise, getTerrainElevation } from '../../utils/terrain';
import { TerrainParams } from '../../../types';
// If types are in src/types.ts and we are in src/engine/sim/terrain/
// Path should be ../../../types

export class TerrainManager {
    private static _instance: TerrainManager;
    private _simplex: SimplexNoise;
    private _params: TerrainParams;
    private _seed: number = 0;

    private constructor() {
        // Default init
        this._simplex = new SimplexNoise(0);
        this._params = {
            waterLevel: 0,
            mountainScale: 1,
            forestDensity: 0,
            desertDensity: 0,
            plantSize: 0,
            planetRadius: 50,
            mountainFrequency: 1
        };
    }

    public static get instance(): TerrainManager {
        if (!this._instance) {
            this._instance = new TerrainManager();
        }
        return this._instance;
    }

    public updateConfig(seed: number, params: TerrainParams) {
        // Only update if changed to avoid unnecessary allocs (though Simplex is cheap)
        if (seed !== this._seed) {
            this._seed = seed;
            this._simplex = new SimplexNoise(seed);
            console.log(`[TerrainManager] Updated Seed: ${seed}`);
        }
        this._params = { ...params };
    }

    public getElevation(x: number, y: number, z: number): number {
        return getTerrainElevation(x, y, z, this._simplex, this._params);
    }

    public getElevationAt(pos: Vector3): number {
        // Project position to unit sphere surface for noise lookup?
        // getTerrainElevation expects 3D coords.
        // Usually we pass the point on the sphere surface.

        // Ensure we query at the radius-normalized position if logic requires it
        // But getTerrainElevation inside uses actual 3D coords usually?
        // Checking utils/terrain.ts: 
        // "getTerrainElevation(x, y, z...)"

        // IMPORTANT: The noise function often expects the coordinate ON THE FLIGHT SPHERE (radius ~500)
        // or ON THE UNIT SPHERE.
        // Let's look at AirplaneSim.ts again.
        // "const centerDirection = this.position.clone().normalize().multiplyScalar(planetRadius);"

        // So we should normalize and scale to planet radius before querying to ensure consistency/cache hits if any
        return this.getElevation(pos.x, pos.y, pos.z);
    }

    /**
     * Helper to get surface height at a specific direction from center
     */
    public getSurfaceHeight(pos: Vector3): number {
        const radius = this._params.planetRadius;

        // 1. Get direction vector on surface
        const surfacePos = pos.clone().normalize().multiplyScalar(radius);

        // 2. Get noise displacement
        const h = this.getElevation(surfacePos.x, surfacePos.y, surfacePos.z);

        // 3. Return total distance from center (Radius + Height)
        return radius + h;
    }
}
