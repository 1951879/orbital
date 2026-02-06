
# Plan: Mobile-First Responsive UI & "The Datapad" Layout

## 1. The Design Goal
To transition the current "Full Screen Modal" menu into a persistent **"Split-View Datapad"**:
*   **Menu Mode (Paused):** 
    *   Menu occupies exactly **Left 50%** of the screen (on Desktop/Landscape).
    *   **Single Viewport:** Regardless of party size, only **Player 1's View** (or a dedicated Orbit Cam) is rendered.
    *   **Camera Shift:** The camera projection offset is shifted so the Planet appears centered in the *Right 50%* of the screen.
*   **Flight Mode (Active):**
    *   Menu disappears.
    *   Screen splits based on `localParty` count (1, 2, or 4 viewports).
    *   HUDs appear.

## 2. The "Camera Shift" Mechanic
To allow the user to view/orbit the planet while the menu is open, we utilize `THREE.PerspectiveCamera.setViewOffset`.

*   **Standard View:** Center (0, 0).
*   **Menu Open (Landscape):** 
    *   Menu Width: 50% (`width * 0.5`).
    *   Visible Area Center: 75% of screen width.
    *   Required Shift: We need the camera's center to move *Left* by 25% of the full width.
    *   Formula: `x = -width * 0.25`.

## 3. Component Refactoring Strategy

### A. `MenuOverlay.tsx` (The Container)
*   **Layout:**
    *   **Landscape/Desktop:** `left-0 top-0 bottom-0 w-1/2 border-r border-white/10`.
    *   **Portrait (Mobile):** `bottom-0 left-0 right-0 h-[50vh] border-t border-white/10`.
*   **Visuals:** Remove the "floating card" look; make it a solid (glassy) panel docked to the side/bottom.

### B. `Scene.tsx` (Viewport Logic)
*   **Active Pilots:**
    *   IF `isPaused`: `activePilots = [localParty[0]]` (Force single view).
    *   ELSE: `activePilots = localParty`.
*   **Effect:** This ensures the screen unsplits immediately when pausing, allowing for a clean look at the planet.

### C. `CameraController.tsx` (The Logic)
*   Update `calculateDesiredViewOffset` to return `{ x: -width * 0.25, y: 0 }` when in Landscape Menu mode.

## 4. Interaction Model
*   **Orbit Controls:** The `OrbitControls` attached to the camera will naturally receive input from the Right Half of the screen (canvas) because the Left Half is covered by the Menu div (which stops propagation).
*   **Gamepad:** Gamepad menu navigation remains active. Gamepad *orbit* controls (Right Stick) should work in the menu mode for looking at the planet.

