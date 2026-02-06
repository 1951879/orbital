---
trigger: always_on
---

SYSTEM ARCHITECTURE: PROJECT ORBITAL
Role: High-Performance 3D Web Application Core Philosophy: "Diamond Architecture" with Strict Unidirectional Dependencies. Execution Model: Main Thread Simulation (Worker-Ready Encapsulation).

I. THE ARCHITECTURAL LAYERS (The "Diamond")
Code must be organized into four distinct layers. Dependency flow is strictly unidirectional: Higher layers depend on Lower layers. Lower layers NEVER import from Higher layers.

Layer 1: The Kernel (src/engine/kernel/ & src/engine/input/)
Role: The Hardware Abstraction Layer.
Responsibility: Manages the raw execution environment.
Components:
Loop: Manages the requestAnimationFrame cycle and Fixed Timesteps.
InputManager (src/engine/input): Normalizes distinct input sources (Mouse, Touch, Keyboard) into a unified InputState.
Time: Handles Delta Time (dt) and Clock synchronization.
Rule: NO React code. NO Rendering logic. Pure TypeScript classes only.

Layer 2: The Simulation (src/engine/sim/)
Role: The Mathematical "Source of Truth".
Responsibility: Calculates the state of the world (Physics, AI, Logic).
Components:
WorldState: The central data store for all entities.
PhysicsWorld: Wrapper around rapier3d-compat. DO NOT USE @react-three/rapier logic here.
FloatingOrigin: Manages the coordinate system rebasing (shifting the world center).
LogicSystems: Pure functions that mutate entity state based on rules.
Rule: This layer runs at a fixed tick rate. It uses Mutable State (Classes/TypedArrays) for performance.

Layer 3: The Presentation (src/engine/render/)
Role: The Visualization Layer.
Responsibility: Reads Layer 2 and draws it to the screen.
Components:
SceneRoot: The React-Three-Fiber entry point.
ViewSync: Components that read from WorldState inside useFrame to update 3D objects.
CameraDirector: Controls the camera based on WorldState focus targets.
Rule: Components here READ from the Sim layer. They do not hold game logic. They purely reflect the current state.
Rule: R3F usage (@react-three/fiber, @react-three/drei) is strictly limited to this layer.

Layer 4: The Application (src/app/)
Role: The Content & Business Logic.
Responsibility: Defines what the app is.
Components:
GameModes/: Specific logic for "Deathmatch", "Free Roam", etc.
UI/: 2D React overlays (HUDs, Menus).
Assets/: 3D Model definitions and textures.
Rule: This layer "plugs into" the Engine. It creates Entities via EntityConfigs.


II. CRITICAL TECHNICAL DECISIONS
1. Physics Engine
Engine: rapier3d-compat (Raw).
Constraint: Do NOT use @react-three/rapier components (<RigidBody>) for game logic.
Pattern: The Sim layer manages the RAPIER.World. The Render layer synchronizes meshes to RAPIER.RigidBody positions.
2. Asset Pipeline (Entity Configs)
Problem: The Sim layer cannot load .glb files to know their size/shape.
Solution: Use Entity Configs (JSON/TS objects).
Example:
export const SHIP_CONFIG = {
  collider: { type: 'capsule', radius: 2, height: 10 },
  mass: 500,
  turnRate: 1.5
};
Workflow: Sim loads SHIP_CONFIG to build physics. Render loads Ship.glb to draw visuals.

3. Precision & Floating Origin
Precision: Standard 32-bit Floating Point (Vector3).
Scale: Planets < 100km diameter.
Rebasing: When the player moves > 5000 units from (0,0,0), the Sim layer shifts all Entity positions and the RAPIER.World bodies by -PlayerPosition. The Render layer sees a seamless transition.

4. Component-Entity Separation
Rule: Strict file separation to avoid cyclic dependencies.
Structure:
src/app/entities/Ship/ShipSim.ts (Logic/Physics config)
src/app/entities/Ship/ShipView.tsx (Visuals/JSX)

III. STATE MANAGEMENT
Law 1: The Reactive Store (Zustand)
Use for: UI State, Scores, Game Phase (Lobby vs Game).
Behavior: Updates trigger React re-renders.
Law 2: The Mutable Store (Direct Access)
Use for: Position, Velocity, Health, Cooldowns.
Behavior: NEVER triggers React re-renders. Accessed via direct reference in the Game Loop.
IV. DIRECTORY STRUCTURE
src/
├── engine/              # The Reusable Core
│   ├── kernel/          # Loop, Time
│   ├── input/           # DeviceManager, InputMapper
│   ├── sim/             # Physics (Rapier), WorldState, Systems
│   ├── render/          # R3F Root, ViewSync
│   └── utils/           # Math helpers
│
├── app/                 # The Specific Application (Orbital)
│   ├── entities/        # Paired Sim/View definitions
│   ├── ui/              # HUD, Menus
│   └── store/           # Zustand Stores
│
└── assets/              # Static files