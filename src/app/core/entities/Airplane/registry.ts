
import { Vector3 } from 'three';
import { AirplaneDef, AudioConfig } from './models/AirplaneDef';

// ==================================================================================
// AIRPLANE REGISTRY — The barrel that collects all model definitions.
//
// To add a new airplane:
//   1. Create a new file in this folder (e.g. NewPlane.tsx)
//   2. Export a default AirplaneDef descriptor
//   3. Import it here and add it to the ALL_DEFS array
// ==================================================================================

import InterceptorDef from './models/Interceptor';
import RaptorDef from './models/Raptor';
import BomberDef from './models/Bomber';
import ScoutDef from './models/Scout';
import ViperDef from './models/Viper';
import MantaDef from './models/Manta';
import CorsairDef from './models/Corsair';
import EagleDef from './models/Eagle';
import FalconDef from './models/Falcon';
import TempestDef from './models/Tempest';
import PhantomDef from './models/Phantom';
import StarlingDef from './models/Starling';

/** Ordered list of all airplane definitions. Order determines UI display order. */
const ALL_DEFS: AirplaneDef[] = [
    InterceptorDef,
    RaptorDef,
    BomberDef,
    ScoutDef,
    ViperDef,
    MantaDef,
    CorsairDef,
    EagleDef,
    FalconDef,
    TempestDef,
    PhantomDef,
    StarlingDef,
];

// ---- Derived type ----

/** All registered airplane type keys. */
export const AIRPLANE_TYPES = ALL_DEFS.map(d => d.type);

// ---- Lookup maps (backward-compatible with old AirplaneConfig exports) ----

/** Full registry keyed by type string. */
export const AIRPLANE_REGISTRY: Record<string, AirplaneDef> =
    Object.fromEntries(ALL_DEFS.map(d => [d.type, d]));

/** Per-type visual scale factors. */
export const AIRPLANE_SCALES: Record<string, number> =
    Object.fromEntries(ALL_DEFS.map(d => [d.type, d.scale]));

/** Per-type collision hull points. */
export const COLLISION_POINTS: Record<string, Vector3[]> =
    Object.fromEntries(ALL_DEFS.map(d => [d.type, d.collisionPoints]));

/** Per-type audio synthesis config. */
export const AIRPLANE_AUDIO_CONFIG: Record<string, AudioConfig> =
    Object.fromEntries(ALL_DEFS.map(d => [d.type, d.audio]));

/** UI picker data — name & description per plane. */
export const PLANES: { id: string; name: string; desc: string }[] =
    ALL_DEFS.map(d => ({ id: d.type, name: d.name, desc: d.description }));
