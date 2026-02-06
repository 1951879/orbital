
# ENGINE INPUT ARCHITECTURE
Role: Device-Agnostic, Multi-User Input System.
Core Philosophy: "Semantic Actions over Raw Keys". The game logic asks "Did Player 1 F.I.R.E?", not "Is Spacebar pressed?".

## I. THE 4-LAYER MODEL

### Layer 1: Hardware Abstraction (DeviceManager)
**Role:** The physical reality.
**Responsibility:** Detects hardware and normalizes raw signals.
**Components:**
*   `DeviceManager`: Polling loop for Gamepads, Listeners for Keyboard/Mouse.
*   **Concepts:**
    *   `DeviceID`: Unique string (e.g., `Keyboard`, `Gamepad:0`).
    *   `RawState`: Map of Button Indices -> Booleans, Axis Indices -> Floats (-1 to 1).
**Rule:** NO game logic allowed. Pure I/O.

### Layer 2: The Input Mapper (InputMapper)
**Role:** The Translator.
**Responsibility:** Converts Raw Hardware Inputs into Semantic Game Actions.
**Components:**
*   `InputMapper`: The logic engine that resolves actions.
*   **Concepts:**
    *   `Actions`: Semantic strings (e.g., `"FIRE"`, `"PITCH"`, `"NAV_UP"`).
    *   `Bindings`: JSON map of `Action -> List<HardwareInput>`.
    *   `Composite Handling`: Combining logic (e.g., `KeyW` + `KeyS` -> `AxisY`).
**Rule:** Input Mappers are stateless config processors.

### Layer 3: Session Assignment (SessionState)
**Role:** The Owner.
**Responsibility:** Assigns an Input Mapper to a human Player Slot.
**Components:**
*   `SessionState`: The store of "Who is playing".
*   **Concepts:**
    *   `PlayerID`: 0-3 (The human slot).
    *   `Assignment`: `PlayerID` owns `InputMapper` (which owns `DeviceID`).
**Rule:** Game logic queries the **Player**, not the Device.
*   `Session.getPlayer(0).input.getButton("FIRE")` -> ✅
*   `keyboard.isPressed("Space")` -> ❌

### Layer 4: Context Management (InputContext)
**Role:** The Mode Switcher.
**Responsibility:** Determines *which* set of Bindings are active.
**Concepts:**
*   `Context`: A discrete state (e.g., `"MENU"`, `"FLIGHT"`, `"CUTSCENE"`).
*   `Profile`: A set of Bindings valid for a specific Context.
**Rule:** Only ONE context is active per player at a time.
*   "MENU" Context: Left Stick = Navigation.
*   "FLIGHT" Context: Left Stick = Pitch/Roll.
**Safety:** Explicit context guarantees no accidental actions (firing missiles in menus).

---

## II. IMPLEMENTATION GUIDELINES

### 1. Defining Actions
Actions should be abstract verbs, not noun-descriptions of keys.
*   ✅ `PRIMARY_FIRE`
*   ✅ `THROTTLE_UP`
*   ❌ `SPACEBAR`
*   ❌ `RIGHT_TRIGGER`

### 2. Context Switching
The Application Layer is responsible for setting the context based on game state.
*   **Paused?** -> Set Context `"MENU"`.
*   **Flying?** -> Set Context `"FLIGHT"`.
*   **Lobby?** -> Set Context `"MENU"`.

### 3. Split-Screen Handling
*   Each `EnginePlayer` has their own independent `InputMapper`.
*   P1's Mapper reads from `Gamepad:0`.
*   P2's Mapper reads from `Gamepad:1`.
*   Calling `player.getAxis("MOVE_X")` automatically reads from the correct device. No `if (id === 0)` logic in game code.

### 4. Code Structure
```
src/engine/input/
├── DeviceManager.ts   # Hardware Polling
├── InputMapper.ts     # Action Resolution
└── definitions/       # Default Profiles (JSON/TS)

src/engine/session/
└── SessionState.ts    # Player -> Mapper Assignment
```

### 5. Hardware Reliability
*   **Disconnects:** `DeviceManager` must emit `DEVICE_LOST` events. The Engine must gracefully handle vanishing devices.
*   **Hot-Swapping:** If a controller reconnects, the system should attempt to reassign it to the previous player if possible.
