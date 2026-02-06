import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useStore } from '../../../app/store/useStore';
import { getTerrainElevation, SimplexNoise } from '../../utils/terrain';

/**
 * Squadron Camera - Formation/Hangar View
 * 
 * Features:
 * - Anchor-based positioning (locks to planet surface when pilots join)
 * - Adaptive zoom based on pilot count
 * - Smooth orbit transition when empty
 * - UI vertical offset compensation
 */
import { Camera } from 'three';

interface SquadronCameraProps {
    cameraRef?: React.MutableRefObject<Camera | null>;
}

export const SquadronCamera: React.FC<SquadronCameraProps> = ({ cameraRef }) => {
    const { camera: defaultCamera, size } = useThree();
    // Use provided camera ref, or fall back to default context camera
    const camera = cameraRef?.current || defaultCamera;

    const terrainParams = useStore((state) => state.terrainParams);
    const terrainSeed = useStore((state) => state.terrainSeed);
    const terrainRotation = useStore((state) => state.terrainRotation);
    const localParty = useStore((state) => state.localParty);
    const radius = terrainParams.planetRadius;
    const squadronAnchor = useStore((state) => state.squadronAnchor);
    const setSquadronAnchor = useStore((state) => state.setSquadronAnchor);

    const _target = useRef(new Vector3());
    const _desiredPos = useRef(new Vector3());

    // Initialize desired position to current camera position to prevent dive
    React.useLayoutEffect(() => {
        // Force clear any offset when entering Squadron Mode
        if ((camera as any).clearViewOffset) (camera as any).clearViewOffset();
        _desiredPos.current.copy(camera.position);

        return () => {
            // Cleanup: Ensure we don't leave any offset
            if ((camera as any).clearViewOffset) (camera as any).clearViewOffset();
        };
    }, [camera]);

    // Cleanup anchor on unmount so we always reform at current location
    React.useEffect(() => {
        return () => setSquadronAnchor(null);
    }, [setSquadronAnchor]);

    const orbitAngle = useRef(0);

    // Noise generator for snapping to terrain
    const simplex = React.useMemo(() => new SimplexNoise(terrainSeed), [terrainSeed]);

    useFrame((state, delta) => {
        const pilotCount = localParty.length;
        const hasPilots = pilotCount > 0;

        // --- 1. ANCHOR LIFECYCLE ---
        if (hasPilots && !squadronAnchor) {
            // Lock camera view to equator when first pilot joins
            const camPos = camera.position.clone();
            const dir = new Vector3(camPos.x, 0, camPos.z).normalize();
            if (dir.lengthSq() < 0.1) dir.set(0, 0, 1);

            const newAnchor = dir.multiplyScalar(radius);
            setSquadronAnchor(newAnchor);
        } else if (!hasPilots && squadronAnchor) {
            // Release anchor when party disbands
            setSquadronAnchor(null);
        }

        // --- 2. ORBIT SYNC ---
        if (hasPilots && squadronAnchor) {
            // Sync to anchor angle for smooth transition when exiting
            const angle = Math.atan2(squadronAnchor.x, squadronAnchor.z);
            orbitAngle.current = angle;
        } else {
            // Slow orbit when roaming
            orbitAngle.current += delta * 0.1;
        }

        // --- 3. ADAPTIVE ZOOM ---
        let adaptiveDist = 25.0;
        if (hasPilots) {
            // Bounding box dimensions based on pilot count
            let width = 3.0;
            let height = 3.0;

            if (pilotCount >= 4) {
                width = 7.0;
                height = 15.0;
            } else if (pilotCount === 3) {
                width = 7.0;
                height = 12.0;
            } else if (pilotCount === 2) {
                width = 7.0;
                height = 12.0;
            }

            // Calculate distance to fit formation in view
            const camFov = (camera as any).fov || 50;
            const fovRad = camFov * Math.PI / 180 / 2;
            const aspect = size.width / size.height;

            const fitHeightDist = height / (2 * Math.tan(fovRad));
            const fitWidthDist = width / (2 * Math.tan(fovRad) * aspect);

            adaptiveDist = Math.max(fitHeightDist, fitWidthDist, 10.0);
        }

        // --- 4. CALCULATE TARGETS ---

        // A. Orbit Mode (No Pilots)
        // A. Orbit Mode (No Pilots)
        const camFov = (camera as any).fov || 50;
        const fovRad = camFov * Math.PI / 180;
        // Distance to fit sphere: d = r / sin(fov/2)
        // Add padding (1.8x) for comfy orbit
        const idealOrbitDist = (radius * 1.8) / Math.sin(fovRad / 2);

        const orbitTarget = new Vector3(0, 0, 0);
        const orbitPos = new Vector3(
            Math.sin(orbitAngle.current) * idealOrbitDist,
            radius * 0.4, // Keep some elevation relative to size
            Math.cos(orbitAngle.current) * idealOrbitDist
        );

        // B. Squadron Mode (Has Pilots)
        let squadTarget = orbitTarget;
        let squadPos = orbitPos;

        if (squadronAnchor) {
            // Build tangent frame
            const n = squadronAnchor.clone().normalize();
            const r = new Vector3(0, 1, 0).cross(n).normalize();
            const f = n.clone().cross(r).normalize();

            // Calculate Terrain Height at Anchor (Must account for Terrain Rotation)
            const rotAnchor = squadronAnchor.clone().applyAxisAngle(new Vector3(0, 1, 0), -terrainRotation);

            // NOTE: The SimplexNoise is generated in "Local Space" (No Rotation).
            // Since the Planet Mesh is rotated by `terrainRotation`, we must query noise at `Rotate(-Rot, WorldPos)`.
            const h = getTerrainElevation(rotAnchor.x, rotAnchor.y, rotAnchor.z, simplex, terrainParams);
            const terrainAltitude = Math.max(0, h); // Ensure we don't go below sea level if that logic exists, though h can be negative

            // Dynamic centering based on pilot count
            let centeringY = 0;
            let centeringX = 0;

            if (pilotCount >= 4) centeringY = -1.5;
            else if (pilotCount === 3) centeringY = -0.4;
            else if (pilotCount === 2) {
                centeringY = -0.3;
                centeringX = 1.0;
            }

            // UI vertical offset to compensate for footer
            const uiVerticalOffset = -0.5;
            const totalForwardOffset = centeringY + uiVerticalOffset;

            // Calculate target point on surface ADJUSTED FOR TERRAIN
            const surfaceBase = squadronAnchor.clone().normalize().multiplyScalar(radius + terrainAltitude + 2.0); // +2.0 to look slightly above ground at plane center

            squadTarget = surfaceBase
                .add(f.clone().multiplyScalar(totalForwardOffset))
                .add(r.clone().multiplyScalar(centeringX));

            // Position camera perpendicular to target
            const forwardOut = squadTarget.clone().normalize();
            squadPos = forwardOut.multiplyScalar(radius + terrainAltitude + 5.0 + adaptiveDist);
        }

        // --- 5. INTERPOLATE ---
        const goalTarget = hasPilots && squadronAnchor ? squadTarget : orbitTarget;
        const goalPos = hasPilots && squadronAnchor ? squadPos : orbitPos;

        _target.current.lerp(goalTarget, delta * 2.0);
        _desiredPos.current.lerp(goalPos, delta * 2.0);

        // --- 6. APPLY ---
        if (hasPilots) {
            // console.log(`[Cam] Anchor: ${squadronAnchor?.toArray()} Target: ${_target.current.toArray()} Pos: ${_desiredPos.current.toArray()} Rot: ${terrainRotation}`);
        }

        camera.position.lerp(_desiredPos.current, delta * 3.0);
        camera.lookAt(_target.current);
    });

    return null;
};
