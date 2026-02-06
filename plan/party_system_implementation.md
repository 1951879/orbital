
# Project: Orbital Sim - Party System Implementation Master Plan

## 1. Executive Summary
**Goal:** Transition from a hardcoded "Single/Split" architecture to a dynamic **Local Party System** supporting 1-4 players.
**Core Concept:** "The Party Bus". Players join a persistent lobby via input activation. The game renders viewports dynamically based on the party size.

---

## 2. Current State Snapshot (v1.0)
*   **Store:** `localParty` is the single source of truth.
*   **Scene:** Rendering loop iterates over `localParty` (supports 1-4 viewports).
*   **UI:** `MissionTab` (3-column grid) and `ArcadeMenu` (Grid) are fully operational.
*   **Input:** `useArcadeInput` handles multi-user menu navigation and joining.
*   **Audio:** Stereo Panning is implemented but needs refinement for 4-player grid (currently handled via rudimentary `playerId` modulo).

---

## 3. Detailed Implementation Steps

### Phase 1: Data & Store Architecture (The Foundation)
**Objective:** Establish `localParty` as the single source of truth.

*   [x] **1.1. Refactor `useStore` State Shape**
    *   Define `LocalPilot` interface (ID, Name, Team, InputConfig, Plane, Status).
    *   Initialize `localParty` with default Host (P1).
    *   Create `joysticks` record for unified input state.

*   [x] **1.2. Implement `joinParty(inputConfig)` Action**
    *   Validate if input (Gamepad Index) is already assigned.
    *   Auto-assign Plane (Interceptor -> Raptor -> Bomber -> Scout).
    *   Auto-assign Team Color.

### Phase 2: Input Layer & Interaction
**Objective:** Allow any controller to control the UI and join the game.

*   [x] **2.1. Global Input Listener (`App.tsx`)**
    *   Trigger `joinParty()` on detection of new input.

*   [x] **2.2. Multi-User Menu Hook (`useArcadeInput.ts`)**
    *   Poll all connected gamepads every frame.
    *   Map inputs to specific Pilot IDs.
    *   Handle Navigation, Selection, and Status Toggles.

*   [x] **2.3. Hangar Tab Logic**
    *   Render `ArcadeMenu` as the default view.
    *   Implement "Ready" toggle logic.

*   [ ] **2.4. Party Management Interactions (In Progress)**
    *   **Drop Out:** Implement "Hold B to Leave" for P2-P4.
    *   **Launch Feedback:** Visual feedback when Host tries to launch with unready players.

### Phase 3: Rendering & Viewport Engine
**Objective:** Render N players efficiently.

*   [x] **3.1. Dynamic Scene Graph (`Scene.tsx`)**
    *   Map `localParty` to `<PlayerInstance />`.

*   [x] **3.2. Viewport Manager (`ViewportRenderer`)**
    *   Dynamic Scissor/Viewport calculations for 1-4 players.

### Phase 4: Audio Spatialization (The "Immersion" Patch)
**Objective:** 3D Audio positioning for local multiplayer.

*   [x] **4.1. Refactor `useAirplaneSound`**
    *   Implemented `StereoPannerNode`.
    *   Currently pans based on `playerId` (Odds Right, Evens Left).
    *   *Improvement:* Map explicit screen quadrant to Pan value.

---

## 4. Progress Checklist

### Store & Data
- [x] `LocalPilot` Type Definition
- [x] `useStore.localParty` implementation
- [x] `joinParty` logic
- [x] `leaveParty` logic
- [x] `MissionTab` implementation

### Input & UI
- [x] `useArcadeInput` (Multi-user polling)
- [x] `ArcadeMenu` (Grid Visualization)
- [ ] **"Hold B to Drop Out"** (Logic in `useArcadeInput`)
- [ ] **Launch Rejection Feedback** (Visuals in `SquadronFooter`)

### Rendering (Scene)
- [x] Dynamic `<PlayerInstance>` mapping
- [x] `ViewportRenderer` logic (1-4 players)

### Gameplay
- [x] Chase Mode Logic (Team-based scoring)
- [x] Free Flight Logic

---

## 5. Next Immediate Action
**Implement Drop Out & Launch Feedback:**
1.  Update `useArcadeInput` to track hold duration on 'B' button for P2-P4 to trigger `leaveParty`.
2.  Update `SquadronFooter` to show a "WAITING FOR SQUADRON" error state when launch is blocked.
