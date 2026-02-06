
# The "Lockbox" Architecture: A Strategy for Scaling with AI Coders

## 1. The Core Philosophy
To avoid Context Window Limits and Regression (AI breaking finished code), we must treat the application not as one big project, but as **One Stable Shell** and **Many Independent Plugins**.

### The Golden Rule
**"If a feature is finished, it becomes a Library."**
The AI should treat finished components (like your `Airplane.tsx` or `NetworkSync`) exactly like it treats `node_modules`: It can *import* them and *use* them, but it is **forbidden** from opening them to "tweak" them.

---

## 2. Directory Structure Reform
We will restructure the project to physically separate "Frozen" code from "Active" code.

```text
src/
├── core/                 <-- THE FROZEN SHELL (High Stability)
│   ├── engine/           (The Canvas, Renderer, Camera Rig)
│   ├── network/          (Socket logic, Telemetry hooks)
│   ├── input/            (Joystick normalizing, Keyboard hooks)
│   └── state/            (The Global Zustand Store - ONLY global primitives)
│
├── features/             <-- THE PLUGINS (Independent Modules)
│   ├── navigation/       (The Flight Physics & Controls)
│   ├── terrain/          (The Planet, Water, Atmosphere)
│   ├── hangar/           (The 3D Menu System)
│   └── hud/              (The 2D UI Overlay system)
│
├── missions/             <-- DYNAMIC GAMEPLAY MODULES
│   ├── chase/            (Specific rules, scoring, overlays for Chase)
│   ├── hide_seek/        (Specific rules for Hide & Seek)
│   └── free_flight/      
│
├── registry/             <-- THE CONNECTORS
│   └── MissionRegistry.ts (Maps IDs to Mission Modules)
│
└── types/                <-- THE CONTRACT (The most important folder)
    └── index.ts          (Shared interfaces. The AI *only* needs to read this)
```

---

## 3. Implementation Strategies

### A. The "Context Firewall" Workflow
When asking the AI to build a new feature (e.g., "Capture the Flag"):

1.  **Do NOT** provide the content of `Scene.tsx`, `Airplane.tsx`, or `useStore.ts`.
2.  **DO** provide the content of `types.ts` and `registry/MissionRegistry.ts`.
3.  **Prompt:** "Create a new mission module in `missions/ctf/`. It must implement the `MissionModule` interface defined in `types.ts`. Assume the `core` components exist and accept the props defined in the types."

**Why this works:** The AI hallucinates less when it has *less* code but *clearer* types. It assumes the "Black Boxes" work perfectly.

### B. The "Mission Module" Pattern (Solving the Monolith Scene)
Currently, `Scene.tsx` imports every controller (`ChaseController`, `HideAndSeekController`, etc). This forces `Scene.tsx` to change every time a game mode is added.

**Refactor Target:**
Create a Generic Mission Container.

```typescript
// types.ts
export interface MissionModule {
  id: string;
  ControllerComponent: React.FC; // The Logic (headless)
  OverlayComponent: React.FC;    // The HUD
  WorldComponent?: React.FC;     // Specific 3D objects (Rings, Flags)
  configSchema: ConfigItem[];    // Settings for the menu
}
```

**The Shell (`Scene.tsx`):**
```tsx
// It doesn't import "Chase" or "HideSeek". It imports the Active Module.
const ActiveMission = MissionRegistry.get(currentMissionId);

return (
  <Canvas>
     <CoreWorld />
     <ActiveMission.WorldComponent />
     <ActiveMission.ControllerComponent />
  </Canvas>
);
```

### C. State Slicing (Solving the Monolith Store)
The `useStore.ts` file is becoming a bottleneck.

**Strategy:**
1.  **Global Store:** Keeps *only* primitives shared by everyone: `localParty`, `isPaused`, `activeMissionId`.
2.  **Feature Stores:** Each feature folder gets its own store.
    *   `missions/chase/store.ts` -> Holds `teamScores`, `timeLeft`.
    *   `missions/hide_seek/store.ts` -> Holds `hidingTimer`, `seekerId`.
3.  **Lifecycle:** When a mission starts, it mounts its store. When it ends, the store is wiped.

---

## 4. How to "Lock" Features

To prevent the AI from refactoring finished code:

1.  **File Read-Only Mode (Mental Model):** Explicitly tell the AI: "Files in `core/` are READ-ONLY. You may import them, but do not output XML changes for them."
2.  **Facade Exports:** Create `core/index.ts`. Export *only* what is safe to use.
    *   *Bad:* `import { internalHelper } from './core/internal'`
    *   *Good:* `import { NetworkClient } from '@core'`
3.  **Strict Prop Interfaces:** If you need to change how the Plane looks, you don't edit `Airplane.tsx`. You pass a new prop `skin={...}`. If the prop doesn't exist, you plan a specific "Core Upgrade" task separately from "Feature Work".

---

## 5. The Step-by-Step Refactor Plan (Future Work)

**Step 1: The Great Decoupling**
Move `ChaseController`, `HideAndSeekController`, `FollowLeaderController` out of `components/` and into `missions/<name>/`.

**Step 2: The Registry**
Create `MissionRegistry` that maps string IDs to these moved components. Update `Scene.tsx` to render dynamically based on the registry, removing the hardcoded imports.

**Step 3: Type Extraction**
Ensure `types.ts` is the absolute source of truth. If the AI knows `types.ts`, it doesn't need to see the implementation of `useNetworkSync`.

**Step 4: Feature Isolation**
When you want to add "Capture the Flag":
1.  Create `missions/ctf/`.
2.  Create `missions/ctf/CTFController.tsx`.
3.  Create `missions/ctf/CTFHUD.tsx`.
4.  Register it in `MissionRegistry`.
*Result:* You added a whole game mode without modifying a single existing logic file (except the registry array).
