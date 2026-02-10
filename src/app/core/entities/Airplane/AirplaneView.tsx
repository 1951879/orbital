import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, SpotLight, Object3D, Vector3 } from 'three';
import { AirplaneGeometry } from './models/AirplaneGeometry';
import { AirplaneSim } from './AirplaneSim';
import { useAirplaneSound } from '../../../../hooks/useAirplaneSound'; // Fixed path
import { AIRPLANE_CONFIG } from './AirplaneConfig';
import { useStore } from '../../../store/useStore'; // Fixed path


/**
 * AirplaneView - Pure Presentation Layer
 * Reads from Sim layer, renders visuals only.
 * Bridges Sim state to Legacy Audio Hooks.
 */
export const AirplaneView: React.FC<{ sim: AirplaneSim; playerId: number; visible?: boolean }> = ({
    sim,
    playerId,
    visible = true
}) => {
    const groupRef = useRef<Group>(null);
    const meshRef = useRef<Group>(null);
    const noseLightRef = useRef<SpotLight>(null);
    const noseTargetRef = useRef<Object3D>(new Object3D());

    // --- AUDIO BRIDGE REFS ---
    // The sound hook expects generic React refs to read from every frame
    const speedRef = useRef(0);
    const inputRef = useRef({ x: 0, y: 0 });

    // --- GEOMETRY REFS ---
    // Direct Ref for 60fps visual updates (Exhaust) logic without re-renders
    const throttleRef = useRef(0);

    // --- LIGHT SETUP ---
    useMemo(() => {
        noseTargetRef.current.position.set(0, 0, 40);
    }, []);

    const sunDir = useMemo(() => new Vector3(20000, 10000, 10000).normalize(), []);
    const _vec3 = useMemo(() => new Vector3(), []);

    // --- MISSION STATE FOR EFFECTS ---
    // (Legacy Hide & Seek logic removed)
    const isSeeking = false;
    const isCaught = false;

    // --- AUDIO ---
    // We pass the refs that we will update in useFrame
    useAirplaneSound(
        sim.type,
        speedRef,
        inputRef,
        AIRPLANE_CONFIG.speed,
        0 // Pan (Default center for now, can implement stereo later)
    );

    useFrame(() => {
        if (!groupRef.current || !meshRef.current) return;

        // 1. Sync Physics
        groupRef.current.position.copy(sim.position);
        groupRef.current.quaternion.copy(sim.quaternion);

        // 2. Sync Visuals
        meshRef.current.rotation.set(0, 0, 0);
        meshRef.current.rotateX(sim.targetPitch);
        meshRef.current.rotateZ(sim.targetRoll);

        // 3. Update Audio/Effect Refs
        speedRef.current = sim.currentSpeed;
        throttleRef.current = sim.throttle;

        // Input Manager global state for sound modulation (pitch bend on G-force)
        // We can read directly from InputManager
        // Input Manager global state for sound modulation (pitch bend on G-force)
        // We can read directly from InputManager
        const input = sim.inputState;
        inputRef.current.x = input.x;
        inputRef.current.y = input.y;

        // 4. Light Logic
        // Calculate day/night fade based on sun direction
        _vec3.copy(sim.position).normalize();
        const dot = _vec3.dot(sunDir);
        const transitionWidth = 0.3;
        const fade = (dot + transitionWidth / 2) / transitionWidth; // 0..1
        const clampedFade = Math.max(0, Math.min(1, fade));
        const darknessIntensity = 1.0 - clampedFade;

        if (noseLightRef.current) {
            noseLightRef.current.intensity = 30 * darknessIntensity;
        }
    });

    if (isCaught) return null;

    return (
        <group ref={groupRef} visible={visible}>
            {/* Reticle is handled by separate component now? Or should be here? */}
            {/* Leaving Reticle out for now, it should probably be a HUD element, not World element */}

            <group ref={meshRef}>
                <group position={[0, 0, 3.0]} rotation={[0.26, 0, 0]}>
                    <primitive object={noseTargetRef.current} />
                    <spotLight
                        ref={noseLightRef}
                        target={noseTargetRef.current}
                        color="#e0f2fe"
                        distance={120}
                        angle={0.65}
                        penumbra={0.5}
                        decay={1.2}
                    />
                    {/* isSeeking && <ScannerCone /> (Legacy Removed) */}
                </group>

                <AirplaneGeometry type={sim.type} playerId={playerId} throttleRef={throttleRef} />
            </group>
        </group>
    );
};
