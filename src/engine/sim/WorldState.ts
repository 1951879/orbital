import { PhysicsWorld } from './PhysicsWorld';

// Placeholder for Entity type until we define it strictly
export interface Entity {
    id: number;
    position: { x: number, y: number, z: number };
    rotation: { x: number, y: number, z: number, w: number };
}

export class WorldState {
    private static _entities: Map<number, Entity> = new Map();
    private static _airplanes: any[] = []; // Temporary type any to prevent circular imports
    private static _nextId = 0;

    public static get entities() {
        // Combined stream of generic entities and airplanes for now
        return this._airplanes;
    }

    public static registerAirplane(sim: any) {
        this._airplanes.push(sim);
    }

    public static createEntity(startPos: { x: number, y: number, z: number }): Entity {
        const id = this._nextId++;
        const entity: Entity = {
            id,
            position: { ...startPos },
            rotation: { x: 0, y: 0, z: 0, w: 1 }
        };
        this._entities.set(id, entity);
        return entity;
    }

    public static removeEntity(id: number) {
        this._entities.delete(id);
    }

    public static reset() {
        this._entities.clear();
        this._airplanes = [];
        this._nextId = 0;
    }

    public static update(dt: number) {
        PhysicsWorld.step(dt);

        // Update all active airplanes (Physics/Logic)
        this._airplanes.forEach(plane => plane.update());
    }
}
