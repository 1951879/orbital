
# Project: Orbital Sim - Hangar Overhaul: "The Surface Squadron"

## 1. The Vision
The "Squadron" tab (Hangar) takes place on the **planet's surface**, providing a seamless transition from the global orbit view.
*   **Persistent Base:** The squadron establishes a permanent "Base of Operations" at a fixed coordinate on the planet. They are always physically located there.
*   **Top-Down Inspection (Squadron Tab):** The camera positions itself directly above the formation. P1 can inspect their plane by rotating it with the Right Stick.
*   **Interactive Orbit (Mission Tab):** When zoomed out in the Mission/System tabs, Player 1 has full control over the planetary camera:
    *   **Left Stick:** Controls Zoom (Altitude).
    *   **Right Stick:** Controls Orbit (Rotation around the planet).

## 2. Technical Requirements

### A. The "Base" Anchor
We need a fixed coordinate on the procedural planet.
*   **Location:** Equatorial point `(0, 0, PlanetRadius)`.
*   **Up Vector:** At this location, "Up" is `(0, 0, 1)`. "North" is `(0, 1, 0)`.
*   **Camera Position:** `(0, 0, PlanetRadius + Zoom)`.
*   **Camera Orientation:** Look at `(0, 0, PlanetRadius)`. Camera Up is `(0, 1, 0)`.

### B. Dynamic Formation Logic
We introduce a `SpreadFactor` state that transitions based on the active view.
*   **Orbit Spread:** ~60 units separation. (Prevents large indicators from overlapping).
*   **Surface Spread:** ~12 units separation. (Realistic parking formation).
*   **Positions:**
    *   Calculated relative to the Anchor, aligned with the local "North" (Y-axis).
    *   **P1:** Center.
    *   **P2:** Right (`+X`).
    *   **P3:** Left (`-X`).
    *   **P4:** Back (`-Y`).

### C. Visual Indicators (Landing Zones)
Instead of generic UI overlays, we render 3D geometry in the scene.
*   **Geometry:** A `RingGeometry` or `Torus`.
*   **Color:** Matches Player Team Color (`localParty[i].color`).
*   **Scaling:**
    *   **Orbit:** Radius ~25 units.
    *   **Surface:** Radius ~5 units.
*   **Behavior:** The ring radius interpolates smoothly alongside the `SpreadFactor`.

### D. Input & Interaction
*   **Pilot State Update:** Add `viewRotation: { x: 0, y: 0 }` to `LocalPilot.ui`.
*   **Squadron View (Hangar):**
    *   **Right Stick:** Updates `pilot.ui.viewRotation`.
    *   **Effect:** Rotates the specific airplane mesh locally.
*   **Orbit View (Mission/Systems):**
    *   **Input Source:** Player 1 (Host) Input.
    *   **Left Stick Y:** Modifies Camera Distance (Zoom In/Out).
    *   **Right Stick X/Y:** Modifies Camera Orbit Angles (Theta/Phi).

## 3. Component Architecture

### Step 1: `SurfaceSquadron.tsx` (New Component)
Replaces `HangarScene.tsx`.
*   **Props:** `activeTab`.
*   **Internal State:** `spring` or `lerp` value for `transitionState` (0 = Surface, 1 = Orbit).
*   **Render Loop:**
    1.  Calculate current `Spread` and `RingRadius` based on `transitionState`.
    2.  For each pilot in `localParty`:
        *   Calculate Position (Anchor + Relative * Spread).
        *   Snap to Terrain Height (`getTerrainElevation`).
        *   Apply `LocalRotation` (From `pilot.ui.viewRotation`).
        *   Render `<Ring />` at ground level.
        *   Render `<Airplane />` at ground level.

### Step 2: `CameraController.tsx` Updates
*   **Squadron Mode:**
    *   Target: `(0, 0, PlanetRadius)`.
    *   Position: `(0, 0, PlanetRadius + 80)`.
    *   LookAt: Straight down.
*   **Orbit Mode:**
    *   **Manual Control:** Do not use `OrbitControls` auto-rotate.
    *   **State:** Maintain `orbitAngles` { theta, phi, radius }.
    *   **Update Loop:**
        *   Read P1 Joystick State from Store.
        *   `radius += LeftStick.y * zoomSpeed`.
        *   `theta += RightStick.x * orbitSpeed`.
        *   `phi += RightStick.y * orbitSpeed`.
        *   Convert Spherical -> Cartesian -> Apply to Camera Position.

### Step 3: `useArcadeInput.ts`
*   Add polling for Right Stick axes (`axes[2], axes[3]`) and map to `viewRotation` when in Hangar tab.
*   Note: For Orbit Camera, `CameraController` will read joystick state directly or via a shared ref to avoid UI lag.

## 4. Implementation Steps

1.  **Refactor Store:** Add `viewRotation` to `LocalPilot['ui']`.
2.  **Update Input Hook:** Capture Right Stick data.
3.  **Create `SurfaceSquadron`:** Implement the rendering logic.
4.  **Update `Scene.tsx`:** Swap `HangarScene` for `SurfaceSquadron`.
5.  **Update `CameraController`:** Implement manual Orbit logic using P1 input.
