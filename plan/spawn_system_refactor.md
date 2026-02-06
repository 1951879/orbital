
# Technical Plan: Unified Spherical Spawn System

## 1. Problem Analysis
The current spawning logic is fragmented and mathematically inconsistent for a planetary environment.

### The "Opposite Sides" Bug
The user reported that removing the X-offset caused planes to spawn on opposite sides of a small planet. This is likely caused by:
1.  **Linear vs. Spherical Mismatch:** The current code sets positions using Cartesian `[x, y, z]` coordinates relative to `(0,0,0)`. On a small planet (e.g., Radius=30), moving `y = -10` linearly does not wrap around the curvature; it moves the object deep underground or far into space depending on the anchor, potentially flipping the coordinate system when normalized.
2.  **Scene Prop Interference:** `Scene.tsx` passes a default `startOffset` of `[0, index * 10, 0]`. Even if `Airplane.tsx` overrides this, the initial render might be using the prop before the effect fires, causing a physics collision that "ejects" one plane at infinite velocity.
3.  **Coordinate Singularity:** Spawning exactly at `(0, 0, Radius)` (The North Pole of the game world) often causes `lookAt` functions to flip unpredictably because the "Up" vector and the "Forward" vector align.

### The Variables
Currently, all these variables affect where a plane appears:
*   **Store:** `terrainParams.planetRadius` (Global Scale).
*   **Store:** `terrainParams.mountainScale` (affects Altitude).
*   **Component State:** `START_HEIGHT_OFFSET` (Hardcoded 12.0).
*   **Props:** `startOffset` (Passed from `Scene.tsx`).
*   **Local Logic:** `resetPosition` internal overrides in `Airplane.tsx`.
*   **Physics:** `checkCollision` (Can displace planes instantly if they spawn overlapping).

## 2. The Solution: "The Formation Engine"

We need to move **all** positioning math out of `Airplane.tsx` and into a pure utility system that calculates **Spherical Transform Matrices**.

### A. The Coordinate System Standard
All spawns should be defined by:
1.  **Orbit Angles:** `Theta` (Longitude), `Phi` (Latitude).
2.  **Altitude:** Height above terrain surface.
3.  **Heading:** Rotation relative to North.

### B. The Formation Utility (`utils/formations.ts`)
We will create a function that returns the exact World Position (Vector3) and Quaternion for any pilot based on the Mission Mode.

```typescript
type SpawnConfig = {
    mode: 'free' | 'chase' | 'follow_leader' | 'hide_seek';
    planetRadius: number;
    terrainHeight: number;
    pilotIndex: number;
    totalPilots: number;
    team: 1 | 2;
}

export function calculateSpawnTransform(config: SpawnConfig): { pos: Vector3, rot: Quaternion } {
    // 1. Determine "Anchor" Point (Lat/Long) based on Mode
    // 2. Determine "Local Offset" (Formation slot)
    // 3. Project Local Offset onto Sphere Surface (Great Circle math)
    // 4. Calculate Height (Radius + Terrain + Clearance)
    // 5. Return precise Vector3 and Quaternion
}
```

### C. Proposed Spawning Logic per Mode

#### 1. Follow The Leader (Convoy)
*   **Concept:** A snake-like line projected on the sphere surface.
*   **Math:** 
    *   Leader is at `Anchor`.
    *   Followers are at `Anchor - (ForwardVector * Gap * Index)`.
    *   *Crucial:* This subtraction must happen in **Spherical Space** (adjusting Latitude/Longitude), not Linear Space (adjusting X/Y), to ensure they wrap around the planet correctly.

#### 2. Chase (Interception)
*   **Concept:** Two teams on opposite sides of a Great Circle, flying towards each other.
*   **Math:** 
    *   Team 1 Anchor: `Longitude 0`.
    *   Team 2 Anchor: `Longitude +SeparationAngle`.
    *   Wingmen: Offset by `Latitude` slightly (Flying V formation).

#### 3. Hide & Seek (Scatter)
*   **Concept:** Random distribution within a specific hemisphere.
*   **Math:** 
    *   Random `Theta` and `Phi` within constraints.

## 3. Implementation Steps

### Step 1: Create `utils/formations.ts`
Implement the spherical projection math.
*   `getSphericalCoordinate(radius, theta, phi)`
*   `applySurfaceOffset(startPos, forwardDist, rightDist, planetRadius)` -> Returns new Pos on curve.

### Step 2: Create a `useSpawnPoint` Hook
This hook will reside in `Scene.tsx` (or a higher controller).
*   It subscribes to `mission`, `terrainParams`, etc.
*   It calculates the *target* transform for every pilot.
*   It passes `initialPos` and `initialRot` as **props** to `Airplane.tsx`.

### Step 3: Refactor `Airplane.tsx`
*   **Remove:** `resetPosition` logic related to calculation.
*   **Remove:** `COLLISION_GEO` hardcoding (move to types or config).
*   **Action:** On mount (or when `resetTrigger` changes), simply teleport `innerRigRef` to the prop-provided values.

## 4. Why This Fixes "Opposite Sides"
By calculating positions using `applySurfaceOffset` instead of `position.y -= 1.5`, we ensure that moving "backwards" follows the curvature of the planet.
*   **Linear:** Moving -10 Y on a small sphere moves you *inside* the planet or off into space.
*   **Spherical:** Moving -10 units "South" moves you along the surface curve, maintaining correct altitude and relative distance.

## 5. Collision Safety
The new system will pre-calculate positions. We can run a `validateSpawnPoints` function that checks `distance(p1, p2)` before rendering. If they are too close ( < 2.0u), the system can automatically add spacing *before* the physics engine engages, preventing ejection bugs.
