
import React from 'react';
import { Vector3 } from 'three';

// ==================================================================================
// AIRPLANE DEFINITION — The self-contained descriptor for a single airplane model.
//
// Every model file in this folder exports a default AirplaneDef.
// The registry barrel (registry.ts) collects them and derives all lookup maps.
// ==================================================================================

/** Props passed to every airplane model component by the registry. */
export interface AirplaneModelProps {
    playerId?: number;
    throttle?: number;
    throttleRef?: React.MutableRefObject<number>;
    scale: number;
}

/** Audio synthesis parameters for procedural engine sound. */
export interface AudioConfig {
    engineBaseFreq: number;
    engineType: OscillatorType;
    engineMix: number;
    whineBaseFreq: number;
    whineType: OscillatorType;
    whineModulation: number;
    whineMix: number;
    rumbleMix: number;
    rumbleFilterFreq: number;
    windMix: number;
    windTone: number;
    maneuverNoiseOffset: number;
    volMult: number;
}

/** Physics multipliers for differentiating flight characteristics. */
export interface FlightStats {
    turnSpeed: number;       // Multiplier (Default 1.0)
    maxSpeed: number;        // Multiplier (Default 1.0)
    acceleration: number;    // Multiplier (Default 1.0)
    agility: number;         // Multiplier (Default 1.0)
}

/** Complete descriptor for one airplane type. */
export interface AirplaneDef {
    /** Unique type key, e.g. 'interceptor' */
    type: string;
    /** Display name for UI, e.g. 'Interceptor' */
    name: string;
    /** Short description for plane picker */
    description: string;
    /** Visual scale factor */
    scale: number;
    /** Hand-tuned collision hull points */
    collisionPoints: Vector3[];
    /** Audio synthesis config */
    audio: AudioConfig;
    /** Flight characteristics (optional, defaults to 1.0) */
    stats?: FlightStats;
    /** The React Three Fiber component that renders this plane's 3D mesh */
    Component: React.FC<AirplaneModelProps>;
}
