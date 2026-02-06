
# Project: Orbital Sim - UX Overhaul Plan (v8 - Master Spec)

## 1. Core Philosophy: "The Party Bus" (Lobby-First Architecture)
The application transitions to a persistent **Local Party** system.
- **Boot State:** App initializes with a Party of 1 (The "Host").
- **Expansion:** New input devices join dynamically via "Press Any Button".
- **Persistence:** The Party persists across Game Modes.

## 2. Updated User Flow: "The Arcade Hangar"

### A. The Dashboard (Main Menu)
*   **Visual Style:** Full-screen overlay, "Glass Cockpit" aesthetic.
*   **Zone 1: The Fleet Grid (Top 80%)**
    *   A responsive grid of large **Plane Cards**.
    *   Each card features a dynamic 3D thumbnail or stylized schematic.
    *   **Behavior:** Non-exclusive selection (Multiple players can pick the same plane).
*   **Zone 2: The Flight Deck (Bottom 20%)**
    *   A horizontal row of **Pilot Slots**.
    *   Displays current status: `JOIN` | `SELECTING` | `READY`.

### B. Interaction Model: Simultaneous Selection
*   **Cursors:** Each active pilot controls a color-coded cursor (Border/Glow on grid items).
*   **Input Flow:**
    *   **D-Pad/Stick:** Move Cursor.
    *   **Button A (South):** Select Plane (Locks selection, sets status to READY).
    *   **Button B (East):** Deselect/Back (Sets status to SELECTING).
    *   **Start Button (Non-Host):** Toggle Ready Status.
    *   **Start Button (Host):** 
        *   If anyone is NOT ready: "Waiting for pilots..." (Shake effect).
        *   If all ready: **LAUNCH MISSION**.

## 3. Technical Architecture Refactor

### A. Data Layer (`useStore.ts` & `types.ts`)
**Critical Breaking Change:** Remove `p1*`/`p2*`. Replace with `localParty`.

```typescript
export interface LocalPilot {
  id: number;              // 0, 1, 2...
  name: string;            // "Pilot 1"
  input: PlayerInputConfig;
  plane: AirplaneType;
  team: 1 | 2;
  
  // UI State
  ui: {
      cursorIndex: number; // Index of grid item (0..N)
      status: 'joining' | 'selecting' | 'ready';
  }
  
  // Physics State (Mutable/Transient)
  telemetry: FlightTelemetry; 
}

// Store
localParty: LocalPilot[];
```

### B. The Grid Renderer (`Scene.tsx`)
*   Replace static split-check with a loop.
*   **Layout Logic:**
    *   1 Pilot: Full Screen.
    *   2 Pilots: Horizontal Split (Top/Bottom).
    *   3-4 Pilots: 2x2 Grid.

### C. Input Manager (`useMultiplayerMenu` hook)
*   Poll all gamepads every frame.
*   **Join Logic:** If a button is pressed on an unregistered Gamepad -> `addPilot()`.
*   **Nav Logic:** Map inputs to the specific Pilot's `ui.cursorIndex`.

### D. Audio Engine (Spatial Isolation)
*   **Problem:** Two identical planes produce muddy, overlapping audio.
*   **Solution:** Stereo Panning based on Player ID/Screen Position.
    *   **Player 1 (Left/Top):** Pan -0.5 (Left Ear).
    *   **Player 2 (Right/Bottom):** Pan +0.5 (Right Ear).
*   **Implementation:** Update `useAirplaneSound` to inject a `StereoPannerNode` into the audio graph (`Oscillator -> Gain -> Panner -> Destination`).

## 4. Atomic Implementation Roadmap & Implementation Notes

### Phase 1: The "Party" Data Structure (Store Logic)
*   **Goal:** Fully operational `localParty` logic in `useStore.ts` that replaces `p1Input`/`p2Input`.
*   **Implementation Notes:**
    *   **`joinParty(inputConfig)`:**
        *   Check if `inputConfig` is already assigned to an existing pilot. If so, ignore.
        *   If not, find the first available `id` (0..3).
        *   Push new `LocalPilot` object to `localParty`.
        *   Assign default Plane based on ID (P1: Interceptor, P2: Raptor, P3: Bomber, P4: Scout).
        *   Assign Team Color based on ID (Blue, Amber, Green, Red).
    *   **`leaveParty(index)`:**
        *   Splice the array? Or mark as inactive? *Decision:* Splice to remove, but re-indexing might be messy for existing views. *Better:* Filter out by ID.
    *   **Joystick Refactor (Critical):**
        *   Currently `joystickState` (P1) and `joystickStateP2` are root-level variables. This doesn't scale to 4 players.
        *   **Action:** Replace `joystickState` and `joystickStateP2` with `joysticks: Record<number, JoystickState>`.
        *   Update `VirtualJoystick` to write to `joysticks[playerId]`.
        *   Update `useFlightInput` to read from `joysticks[playerId]`.

### Phase 2: Dynamic Input & Audio Hooks (The "Wiring")
*   **Goal:** `Airplane.tsx` should accept `pilotIndex` and just "work" without caring if it's Player 1 or Player 4.
*   **Implementation Notes:**
    *   **`useFlightInput.ts`:**
        *   Remove all `playerId === 1 ? state.p1Input : state.p2Input` ternaries.
        *   Replace with `const pilot = useStore(s => s.localParty[playerId])`.
        *   Guard clause: `if (!pilot) return`.
        *   Input Source: `pilot.input`.
    *   **`useAirplaneSound.ts`:**
        *   Add argument `pan: number` (-1.0 to 1.0).
        *   Inside `useEffect`, create `const panner = ctx.createStereoPanner()`.
        *   Connect: `Nodes -> MasterGain -> Panner -> Destination`.
        *   Apply `panner.pan.value = pan`.
    *   **`Airplane.tsx`:**
        *   Calculate Pan: `const pan = playerId === 0 ? -0.5 : (playerId === 1 ? 0.5 : 0)`.
        *   (Refine logic for 3-4 players later, for now P1/P2 split is priority).

### Phase 3: The Viewport Engine (Rendering)
*   **Goal:** Dynamic splitting of the screen based on `localParty.length`.
*   **Implementation Notes:**
    *   **`Scene.tsx`:**
        *   Remove `<PlayerInstance id={1}>` hardcoding.
        *   Render: `{localParty.map((pilot) => <PlayerInstance key={pilot.id} pilot={pilot} ... />)}`.
    *   **`Renderer` Component:**
        *   Accept `pilots` array prop instead of `isSplit` boolean.
        *   **Loop Logic:**
            *   Iterate through `pilots`.
            *   Calculate `gl.setScissor` and `gl.setViewport` based on array length:
                *   1 Pilot: `0, 0, w, h`
                *   2 Pilots: `0, h/2, w, h/2` (Top) AND `0, 0, w, h/2` (Bottom).
            *   Call `gl.render(scene, camera)` for each.
        *   **Performance:** Ensure `gl.autoClear = false` and clear manually once per frame.

### Phase 4: UI Overhaul (Arcade Grid)
*   **Goal:** The visual menu for selecting planes.
*   **Implementation Notes:**
    *   Create `components/ui/ArcadeMenu.tsx`.
    *   **Structure:**
        *   `PlaneGrid`: Flex/Grid layout.
        *   `CursorOverlay`: Absolute positioned divs that transition `transform` to match grid item positions.
    *   **State:** Derived entirely from `localParty[i].ui.cursorIndex`.
    *   **Hook:** `useMultiplayerMenu` updates `localParty[i].ui.cursorIndex` based on that pilot's input.

### Phase 5: Network Patching
*   **Goal:** Syncing the party over the wire.
*   **Implementation Notes:**
    *   Update `socket.emit('telemetry')` to include `pilotId`.
    *   Currently, the server assumes 1 Socket = 1 Plane.
    *   *Correction for V1:* Keep 1 Socket = 1 Main Plane for now to avoid server rewrite.
    *   *Future:* Loop through local party and emit telemetry for each.
