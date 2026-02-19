import { create } from 'zustand';
import { Vector3, Quaternion } from 'three';

interface Projectile {
    id: number;
    position: Vector3;
    velocity: Vector3;
    ownerId: number;
    ttl: number; // Time to Live
}

interface Explosion {
    id: number;
    position: Vector3;
    scale: number;
    time: number;
}

interface FreeFlightState {
    projectiles: Projectile[];
    explosions: Explosion[];

    addProjectile: (p: Projectile) => void;
    updateProjectiles: (dt: number) => void;

    addExplosion: (pos: Vector3, scale: number) => void;
    removeExplosion: (id: number) => void;

    isPaused: boolean;
    setPaused: (paused: boolean) => void;

    isLoading: boolean;
    setLoading: (loading: boolean) => void;
}

let nextId = 0;

export const useFreeFlightStore = create<FreeFlightState>((set, get) => ({
    projectiles: [],
    explosions: [],

    addProjectile: (p) => set((state) => ({ projectiles: [...state.projectiles, p] })),

    updateProjectiles: (dt) => set((state) => {
        const next = state.projectiles
            .map(p => {
                p.position.addScaledVector(p.velocity, dt);
                p.ttl -= dt;
                return p;
            })
            .filter(p => p.ttl > 0);
        return { projectiles: next };
    }),

    addExplosion: (pos, scale) => set((state) => ({
        explosions: [...state.explosions, { id: nextId++, position: pos, scale, time: 0 }]
    })),

    removeExplosion: (id) => set((state) => ({
        explosions: state.explosions.filter(e => e.id !== id)
    })),

    isPaused: false,
    setPaused: (paused) => set({ isPaused: paused }),

    isLoading: false,
    setLoading: (loading) => set({ isLoading: loading })
}));
