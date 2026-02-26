import { Vector3, Quaternion } from 'three';
import { Time } from '../../kernel/Time';

export interface Projectile {
    id: number;
    position: Vector3;
    velocity: Vector3;
    quaternion: Quaternion;
    life: number;
    active: boolean;
}

export class ProjectileManager {
    public static instance: ProjectileManager;
    public projectiles: Projectile[] = [];
    private nextId = 0;
    private maxProjectiles = 100;

    constructor() {
        ProjectileManager.instance = this;
        // Pre-allocate
        for (let i = 0; i < this.maxProjectiles; i++) {
            this.projectiles.push({
                id: i,
                position: new Vector3(),
                velocity: new Vector3(),
                quaternion: new Quaternion(),
                life: 0,
                active: false
            });
        }
    }

    public spawn(position: Vector3, forward: Vector3, speed: number, ownerId: number) {
        // Find inactive
        const p = this.projectiles.find(p => !p.active);
        if (p) {
            p.active = true;
            p.life = 2.0; // seconds
            p.position.copy(position);
            p.velocity.copy(forward).normalize().multiplyScalar(speed);

            // Orient visual to match velocity
            p.quaternion.setFromUnitVectors(new Vector3(0, 0, 1), forward.clone().normalize());
        }
    }

    public update() {
        const dt = Time.dt;
        for (const p of this.projectiles) {
            if (p.active) {
                p.life -= dt;
                if (p.life <= 0) {
                    p.active = false;
                } else {
                    p.position.addScaledVector(p.velocity, dt);
                }
            }
        }
    }
}
