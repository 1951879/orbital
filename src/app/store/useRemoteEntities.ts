import { create } from 'zustand';
import { Vector3, Quaternion } from 'three';

// ============================================================
// REMOTE ENTITY STATE
//
// Two-tier pattern matching the existing remoteTelemetry approach:
//
// 1. Mutable Map (remoteEntityState) — high-frequency (60Hz)
//    Position, quaternion, throttle. Read inside useFrame.
//    NEVER triggers React re-renders.
//
// 2. Zustand store (useRemoteEntities) — low-frequency (lifecycle)
//    Entity added/removed, room state.
//    Triggers re-renders ONLY when entity list changes.
// ============================================================

// ---- Mutable high-frequency state ----

export interface RemoteEntityData {
    id: string;
    type: string;
    ownerId: string;
    // Current interpolated position (read in useFrame)
    pos: Vector3;
    quat: Quaternion;
    // Target from latest snapshot (written on network receive)
    targetPos: Vector3;
    targetQuat: Quaternion;
    // Custom data
    throttle: number;
    currentSpeed: number;
    altitude: number;
}

/** Mutable store for 60Hz entity state. Read in useFrame, never triggers re-renders. */
export const remoteEntityState = new Map<string, RemoteEntityData>();

// ---- Zustand store for lifecycle (triggers re-renders) ----

interface RemoteEntitiesStore {
    /** Entity IDs currently in the scene (used to trigger re-renders on add/remove). */
    entityIds: string[];

    /** Current game server room ID. */
    roomId: string | null;

    /** Whether we're in a game room. */
    isInRoom: boolean;

    /** Add a remote entity — call when entity spawns. */
    addEntity: (id: string, type: string, ownerId: string, pos: [number, number, number], quat: [number, number, number, number]) => void;

    /** Remove a remote entity — call when entity despawns. */
    removeEntity: (entityId: string) => void;

    /** Set room state. */
    setRoomState: (roomId: string | null, isInRoom: boolean) => void;

    /** Clear all. */
    clear: () => void;
}

export const useRemoteEntities = create<RemoteEntitiesStore>((set) => ({
    entityIds: [],
    roomId: null,
    isInRoom: false,

    addEntity: (id, type, ownerId, pos, quat) => {
        if (!remoteEntityState.has(id)) {
            remoteEntityState.set(id, {
                id,
                type,
                ownerId,
                pos: new Vector3(pos[0], pos[1], pos[2]),
                quat: new Quaternion(quat[0], quat[1], quat[2], quat[3]),
                targetPos: new Vector3(pos[0], pos[1], pos[2]),
                targetQuat: new Quaternion(quat[0], quat[1], quat[2], quat[3]),
                throttle: 0.5,
                currentSpeed: 0,
                altitude: 0,
            });
        }
        set((state) => {
            if (state.entityIds.includes(id)) return state;
            return { entityIds: [...state.entityIds, id] };
        });
    },

    removeEntity: (entityId) => {
        remoteEntityState.delete(entityId);
        set((state) => ({
            entityIds: state.entityIds.filter(id => id !== entityId),
        }));
    },

    setRoomState: (roomId, isInRoom) => set({ roomId, isInRoom }),

    clear: () => {
        remoteEntityState.clear();
        set({ entityIds: [], roomId: null, isInRoom: false });
    },
}));

/**
 * Apply a WorldSnapshot to the mutable state.
 * Called at ~60Hz from NetworkManager subscriber.
 * Does NOT trigger React re-renders — just updates mutable Maps.
 * Only triggers Zustand re-render if entity list changes (new spawn/despawn).
 */
export function applyWorldSnapshot(
    entities: Array<{
        id: string;
        type: string;
        ownerId: string;
        position: [number, number, number];
        quaternion: [number, number, number, number];
        velocity: [number, number, number];
        custom: Record<string, number>;
    }>,
    localChannelId: string | null,
) {
    const newIds: string[] = [];
    let listChanged = false;

    for (const e of entities) {
        // Skip our own entities
        if (e.ownerId === localChannelId) continue;

        newIds.push(e.id);

        const existing = remoteEntityState.get(e.id);
        if (existing) {
            // Update targets (mutable — no re-render)
            existing.targetPos.set(e.position[0], e.position[1], e.position[2]);
            existing.targetQuat.set(e.quaternion[0], e.quaternion[1], e.quaternion[2], e.quaternion[3]);
            existing.throttle = e.custom?.throttle ?? existing.throttle;
            existing.currentSpeed = e.custom?.currentSpeed ?? existing.currentSpeed;
            existing.altitude = e.custom?.altitude ?? existing.altitude;
        } else {
            // New entity — add to both mutable and Zustand
            listChanged = true;
            remoteEntityState.set(e.id, {
                id: e.id,
                type: e.type,
                ownerId: e.ownerId,
                pos: new Vector3(e.position[0], e.position[1], e.position[2]),
                quat: new Quaternion(e.quaternion[0], e.quaternion[1], e.quaternion[2], e.quaternion[3]),
                targetPos: new Vector3(e.position[0], e.position[1], e.position[2]),
                targetQuat: new Quaternion(e.quaternion[0], e.quaternion[1], e.quaternion[2], e.quaternion[3]),
                throttle: e.custom?.throttle ?? 0.5,
                currentSpeed: e.custom?.currentSpeed ?? 0,
                altitude: e.custom?.altitude ?? 0,
            });
        }
    }

    // Check for despawned entities
    const store = useRemoteEntities.getState();
    for (const existingId of store.entityIds) {
        if (!newIds.includes(existingId)) {
            listChanged = true;
            remoteEntityState.delete(existingId);
        }
    }

    // Only update Zustand (trigger re-render) if the entity list actually changed
    if (listChanged) {
        useRemoteEntities.setState({ entityIds: newIds });
    }
}
