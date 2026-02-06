
# ENGINE MULTIPLAYER ARCHITECTURE
Role: Generic Local Multiplayer & Session Management.
Core Philosophy: "The Engine manages the Couch; The App manages the Game."
The Engine knows *who* is playing and *how* they are controlling it. The App knows *what* they are playing.

## I. THE ARCHITECTURE LAYERS

### Layer 1: The Engine Session (SessionState)
**Role:** The Couch.
**Responsibility:** Manages generic "Players" and their resources (Inputs, Viewports).
**Components:**
*   `SessionState`: The central store for the physical session.
*   **Concepts:**
    *   `EnginePlayer`: A human slot (ID 0-3).
    *   `InputAssignment`: Links a `DeviceID` to this Player.
    *   `ViewportConfig`: Defines where this player draws on screen (Rect).
**Rule:** Completely GAME-AGNOSTIC. It doesn't know what a "Pilot" or "Airplane" is.

### Layer 2: The Viewport System (ViewportSystem)
**Role:** The Screen Splitter.
**Responsibility:** Renders the 3D Scene N times, once for each EnginePlayer.
**Components:**
*   `ViewportManager`: Calculates Scissor/Viewport rectangles based on player count (1, 2, 4).
*   **Logic:**
    *   Loops through `Session.players`.
    *   Sets GL Scissor/Viewport.
    *   Calls the App's `RenderScene(playerId)` callback.
**Rule:** Handles the *mechanics* of splitscreen, but not the *content*.

### Layer 3: The Session Bridge (SessionBridge)
**Role:** The Translator.
**Responsibility:** Syncs the Generic Engine Session to the Specific App State.
**Components:**
*   `SessionBridge`: A React Logic Component.
*   **Logic:**
    *   **On Player Join (Engine):** -> Call `App.createPilot(playerId)`.
    *   **On Player Leave (Engine):** -> Call `App.removePilot(playerId)`.
    *   **On Pause (App):** -> Call `Engine.setContext("MENU")`.
    *   **On Resume (App):** -> Call `Engine.setContext("FLIGHT")`.

### Layer 4: The Application State (AppState)
**Role:** The Game Logic.
**Responsibility:** Manages game concepts (Pilots, Teams, Scores, Vehicles).
**Components:**
*   `useStore`: The App's State Store.
*   **Concepts:**
    *   `LocalPilot`: The specific game avatar for an `EnginePlayer`.
    *   `AirplaneSim`: The physics entity controlled by that player.
**Rule:** The App NEVER manages inputs or splitscreen layout directly. It just consumes the Session.

---

## II. DATA FLOW

1.  **Hardware Event:** `Gamepad 0` presses 'A'.
2.  **Input Layer:** `InputMapper` sees 'A' -> translates to Action `"FIRE"`.
3.  **Session Layer:** `SessionState` sees `Player 0` triggered `"FIRE"`.
4.  **App Layer (Update Loop):**
    ```typescript
    // Inside AirplaneSim.update()
    const player = Session.getPlayer(this.playerId); // Get Generic Player
    if (player.input.getButton("FIRE")) {            // Check Generic Action
        this.fireMissile();                          // Execute Game Logic
    }
    ```

## III. IMPLEMENTATION GUIDELINES

### 1. Separation of Concerns
*   **Engine:** "Player 1 is using Gamepad 0."
*   **App:** "Player 1 is flying a Red Interceptor."

### 2. Viewport Rendering
The `SceneRoot` uses the `ViewportSystem` to render.
```tsx
<ViewportSystem
    renderScene={(player) => (
        <GameScene camera={player.camera} />
    )}
/>
```

### 3. Dynamic Joining
*   The **DeviceManager** detects a button press on an unassigned gamepad.
*   It calls `Session.addPlayer(deviceId)`.
*   The **SessionBridge** sees the new player and instantiates a `LocalPilot` and `AirplaneSim`.

## IV. CRITICAL EDGE CASES (SAFETY RULES)

### 1. Global Pause Policy
*   **Problem:** In splitscreen, if P1 opens the menu, P2 cannot continue flying safely.
*   **Rule:** If **ANY** player triggers a PAUSE action, the **ENTIRE** session pauses.
*   **State:** The App Layer sets `isPaused = true`.
*   **Context:** `SessionBridge` forces **ALL** players' Input Context to `"MENU"`.

### 2. Bridge Synchronization (The Race Condition)
*   **Problem:** `SessionState` updates (addPlayer) might fire before the App/Physics loop is ready.
*   **Rule:** `SessionBridge` is the "Gearbox". It must ensure that `WorldState.createEntity` happens **before** the next Render Frame.
*   **Mechanism:** Queued Updates or strict effect ordering.

### 3. Disconnection Safety
*   **Problem:** Battery dies mid-flight.
*   **Rule:** If a signed-in device disconnects:
    1.  Trigger **Global Pause**.
    2.  Show "Controller Disconnected" overlay.
    3.  Do NOT remove the player immediately (give time to reconnect).
