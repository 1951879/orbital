
# Orbital Sim: The "Black Box" Architecture Reform

## 1. Executive Summary
We are transitioning from a **Monolithic React App** to a **Modular Engine Architecture**. 
The goal is to create "Black Boxes" — self-contained modules with strict Inputs/Outputs. This allows you to say "AI, build a Capture the Flag mode" without the AI needing to read the code for the Terrain generation or the Input handling.

## 2. The Core "Black Boxes" (Modules)

We will reorganize `src/` into strictly defined domains.

### A. `modules/terrain/` (The Planet Engine)
*   **Goal:** Independent visual fidelity and physics heightmaps.
*   **Encapsulation:**
    *   **Input:** `seed`, `radius`, `waterLevel`, `biomeParams`.
    *   **Output:** `<PlanetMesh />` (React Component), `getHeightAt(x,y,z)` (Utility Function).
    *   **Isolation:** The planet does not know about players. It just renders geometry and provides height data.
*   **Future Proofing:** You can upgrade this to use Chunked LOD or Compute Shaders later without breaking the flight physics, as long as `getHeightAt` still works.

### B. `modules/input/` (The Control Adapter)
*   **Goal:** Abstract hardware devices into "Intent".
*   **Problem:** Currently, `Airplane.tsx` reads `gamepad.axes[1]`.
*   **Solution:**
    *   **Raw Layer:** Drivers for Gamepad, Keyboard, Touch.
    *   **Normalization Layer:** Maps device-specific data to a standard format (e.g., `-1 to 1`).
    *   **Intent Layer:** `usePilotIntent(pilotId)`. Returns `{ pitch: number, roll: number, throttle: number, fire: boolean, menu: boolean }`.
    *   **Benefit:** To add "Touch Controls," you only work in this folder. The Airplane component never changes.

### C. `modules/physics/` (The Flight Model)
*   **Goal:** Pure math, no rendering.
*   **Structure:**
    *   `class FlightModel`.
    *   **Input:** `currentTransform`, `inputs`, `deltaTime`.
    *   **Output:** `nextTransform`, `velocity`.
*   **Benefit:** You can unit test flight mechanics without loading the 3D scene. You can also have different flight models for different game modes (e.g., "ArcadePhysics" vs "SimPhysics").

### D. `modules/lobby/` (The Session Manager)
*   **Goal:** Manage "Who is here" separately from "What are they doing".
*   **State:** `SessionStore`.
    *   `peers`: Map of connected sockets.
    *   `localInputs`: Map of local devices.
    *   `pilots`: The union of local and remote players.
*   **Responsibility:** Handles joining, leaving, team assignment, and color selection. It creates the "Roster" passed to the Game Mode.

### E. `modules/ui/` (The Design System)
*   **Goal:** Consistent look and feel.
*   **Components:** `Button`, `Panel`, `Slider`, `Header`, `Toast`.
*   **Rule:** These components contain **NO game logic**. They take props like `onClick`, `label`, `isActive`.

---

## 3. The "Mission System" (Game Modes)

This is the most critical change. A Game Mode is no longer hardcoded into `Scene.tsx`. It is a **Plugin**.

**Directory:** `src/missions/`

### The Mission Interface
Every mission (Chase, HideSeek, FreeFlight) must export a standard definition:

```typescript
interface MissionDefinition {
  id: string;
  name: string;
  
  // 1. The State Manager (Zustand slice specific to this mode)
  store: MissionStore; 
  
  // 2. The 3D World Elements (Rings, Flags, Spawners)
  WorldComponent: React.FC;
  
  // 3. The 2D UI (HUD, Scoreboard)
  HUDComponent: React.FC;
  
  // 4. Logic Loop (Runs every frame)
  useMissionLogic: () => void;
  
  // 5. Configuration (For the menu)
  configSchema: ConfigItem[];
  
  // 6. Network Encoder (How to sync this mode's specific data)
  serialize: (state) => object;
  deserialize: (data) => void;
}
```

### The "Active Mission" Wrapper
`Scene.tsx` becomes very dumb. It just asks: "What is the active mission?" and renders its components.

```tsx
// Scene.tsx (Simplified)
const Mission = MissionRegistry.get(activeMissionId);

return (
  <>
    <Planet />
    <Mission.WorldComponent /> {/* Renders Rings for FollowLeader */}
    
    {pilots.map(pilot => (
       <Airplane 
          flightModel={Mission.physicsOverride || DefaultPhysics} 
       />
    ))}
  </>
)
```

---

## 4. The Data Flow (Telemetry & Multiplayer)

To support future online modes robustly:

**Current Problem:** The socket event sends specific fields (`pos`, `rot`).
**New Solution:** The "Entity State" Protocol.

1.  **Core Packet:** Every frame, we send:
    *   `pilotId`
    *   `transform` (Position/Rotation)
    *   `velocity`
    *   `inputState` (Buttons pressed)

2.  **Mission Packet:** The Active Mission can attach extra data.
    *   *Hide & Seek:* `{ isHidden: true, lockOnTarget: 2 }`
    *   *Follow Leader:* `{ score: 50, ringsCollected: [...] }`

3.  **Replication:** The `useNetworkSync` hook becomes generic. It receives the packet and dispatches the *Mission Portion* to the *Mission Store*, and the *Core Portion* to the *Physics Store*.

---

## 5. Implementation Roadmap (Step-by-Step)

We will not break the app. We will migrate piece by piece.

### Phase 1: Input Extraction (Low Risk)
1.  Create `modules/input`.
2.  Move `useFlightInput` and `useArcadeInput` there.
3.  Refactor them to return a standardized `InputState` object.
4.  Update `Airplane.tsx` to consume `InputState`.

### Phase 2: Terrain Isolation (Medium Risk)
1.  Create `modules/terrain`.
2.  Move `BlueprintSphere`, `terrain.ts` (noise logic), and shaders there.
3.  Ensure `Airplane.tsx` calls `TerrainModule.getHeightAt()` instead of importing local utils.

### Phase 3: The Mission Registry (High Reward)
1.  Create `src/missions/free_flight`, `src/missions/chase`, etc.
2.  Move `ChaseController`, `ChaseHUD` into `src/missions/chase`.
3.  Create the `MissionRegistry` to map IDs to these folders.
4.  Update `Scene.tsx` to dynamically render the active mission components.

### Phase 4: Multiplayer Refactor (High Complexity)
1.  Update Server to broadcast generic "Entity Lists".
2.  Update Client to handle variable payload structures.

---

## 6. Exploratory Questions for You

1.  **Performance:** How many players do you envision for *Online*? (4 vs 16 drastically changes the networking logic).
2.  **Persistence:** Do you want player stats (Rank, Planes Unlocked) to save to local storage or a database eventually?
3.  **Assets:** Are we sticking to procedural generation + simple geometries, or will you eventually want to load GLTF models? (This affects how we structure the Asset Loader).

