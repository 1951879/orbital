
# Orbital Sim: Unified Menu Architecture (v2)

## 1. The Core Problem & Solution
**Issue:** Input logic (Joining) was coupled to Visual logic (Hangar Scene). When the view changed, the ability to join vanished.
**Solution:** Decouple **Input Management** from **Scene Rendering**.

## 2. Architecture: "The Three Layers"

### Layer A: The Input Manager (Always Active when Paused)
A new component `<InputManager />` (or hoisted hook usage) that sits at the top level of `MenuOverlay`.
*   **Responsibility:** 
    *   Polls all Gamepads.
    *   Detects "Button A" / "Start" on unassigned controllers -> Triggers `joinParty()`.
    *   Detects "Hold B" -> Triggers `leaveParty()`.
    *   *Crucial:* This runs regardless of which Tab is active.

### Layer B: The View Controller (Camera State)
The `CameraController` will react rigidly to `activeMenuTab`.
*   **Squadron (Hangar):** 
    *   **Pos:** Fixed, Zoomed In, High Angle.
    *   **Target:** The Grid Center.
    *   **Offset:** None (Full center).
*   **Mission / Systems (Orbit):**
    *   **Pos:** Zoomed Out, Orbiting.
    *   **Target:** Planet Center.
    *   **Offset:** `setViewOffset(width, height, -width * 0.25, 0)` (Shifts center to the Right 50%).
    *   *Note:* The UI will occupy the Left 50%.

### Layer C: The Visual Composition
*   **Canvas (Background):**
    *   Renders `GlobalTerrain`.
    *   Renders `HangarScene` (The Grid) *only* if `tab === 'hangar'`.
*   **UI Overlay (Foreground):**
    *   **Header:** Full width (Tabs: Squadron | Mission | Systems).
    *   **Body:**
        *   If `tab === 'hangar'`: **Transparent** (allows seeing the 3D grid).
        *   If `tab === 'mission'`: **Solid Panel** on Left 50% (Glass morphism).
        *   If `tab === 'systems'`: **Solid Panel** on Left 50%.
    *   **Footer:** Full width (Player Status Bar).

## 3. Implementation Steps

### Step 1: Hoisting Input
1.  Remove `useArcadeInput(true)` from `HangarScene.tsx`.
2.  Add `useArcadeInput(true)` to `MenuOverlay.tsx` (at the top level).
3.  **Constraint:** Ensure `useArcadeInput` ignores inputs from the "Host" controller if `useGamepadMenu` is already consuming them for navigation. (Likely handled by existing "assigned" check, but needs verification).

### Step 2: Camera & Layout Refactor
1.  Update `CameraController.tsx`:
    *   Add specific logic for `ORBIT_OFFSET` mode.
    *   Ensure smooth transition between `HANGAR` (Fixed) and `ORBIT_OFFSET` (OrbitControls enabled).
2.  Update `MenuOverlay.tsx`:
    *   Change the middle content container.
    *   **Dynamic Class:** 
        *   `hangar`: `pointer-events-none` (center is empty).
        *   `mission/config`: `w-1/2 bg-slate-950/80 backdrop-blur-xl border-r border-white/10`.

### Step 3: Hangar Scene Polish
1.  **The Grid:** Ensure the 3D planes are spaced to fit exactly within the "Central" view area, assuming the Header and Footer take up ~15% height each.
2.  **Cursors:** Keep the 3D Ring Cursors (Visuals are better than 2D DOM overlays for depth perception).

## 4. User Flow Walkthrough

1.  **Start:** Game is Paused. Tab is **Squadron**.
    *   **View:** Full screen 3D grid of planes.
    *   **UI:** Minimal Header/Footer.
    *   **Action:** P2 presses 'A'. P2 Joins. P2 Cursor appears on 3D Grid.

2.  **Navigation:** Host (P1) tabs to **Mission**.
    *   **View:** Camera smoothly pans out and shifts planet to the right. Grid fades out.
    *   **UI:** A glass panel slides in from the left covering the empty space.
    *   **State:** P2 is still "Ready" or "Selecting" in the footer.
    *   **Bug Fix:** P3 walks in, plugs in controller, presses 'A'. **P3 Joins successfully** (because Input hook is still running).

3.  **Launch:** Host presses "Launch".
    *   **View:** Camera resets to Flight Mode (splitscreen).
    *   **UI:** Overlay disappears. HUDs appear.

