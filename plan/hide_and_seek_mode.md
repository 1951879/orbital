
# Feature Spec: Hide & Seek Mode (v3 - Approved)

## 1. Core Concept
A asymmetrical multiplayer mode where one pilot (The Seeker) attempts to locate and "tag" other pilots (The Hiders). 
The mode emphasizes using the procedural terrain (canyons, forests, mountains) to break Line of Sight.

## 2. Configuration & Rules
The mode is fully configurable via a "Match Settings" panel in the Mission Tab.

### Configurable Parameters
| Parameter | Default | Description |
| :--- | :--- | :--- |
| **Hiding Time** | 9s | Time for hiders to scatter while Seeker is blind. |
| **Seek Time** | 120s | Time limit for the Seeker to find everyone. |
| **Cone Angle** | 45° | The capture cone angle (22.5° deviation from center). |
| **Lock-On Time** | 1.0s | How long the Hider must be in the cone to be caught. |
| **Catch Dist** | 20u | Maximum range for a capture. |
| **Seeker Selection**| Random | **Random**: Randomly picks a pilot.<br>**Host**: Player 1 is always seeker.<br>**Rotational**: Winner of previous round becomes Seeker (or Hider?). |

## 3. Game Flow

### Phase 1: The Blindfold (Hiding Phase)
*   **Spawn:** All planes spawn in a cluster at a random location.
*   **Hiders:** Controls active immediately. Goal: Break Line of Sight (LoS).
*   **Seeker:** 
    *   **Controls:** **LOCKED** (Throttle forced to 0, Input ignored).
    *   **Camera:** **FORCED LOOK DOWN**. The camera is locked pointing directly at the ground (local -Y axis) so they strictly cannot see where hiders fly.
    *   **UI:** "SYSTEM REBOOTING... [Timer]" overlaid on screen.

### Phase 2: The Hunt (Seeking Phase)
*   **Seeker:** Controls unlock. Camera resets to normal flight view.
*   **Timer:** Counts down from **120s**.
*   **Hiders:** Must stay hidden.

### Phase 3: The Catch (Lock-On Mechanic)
To prevent "lucky" fly-by tags, we implement a **Lock-On System**.

1.  **Detection:** Seeker points nose at Hider.
2.  **Validation:**
    *   Distance < **20u**.
    *   Angle < **45°**.
    *   **Raycast Check:** A physics ray is fired from Seeker to Hider. If it hits `GlobalTerrain` first, **NO LOCK**.
3.  **Locking:** 
    *   If Valid: A progress bar/reticle fills up on the Hider (0% -> 100% over **1.0s**).
    *   If LoS breaks or Angle exceeds 45°: Lock progress decays rapidly.
4.  **Capture:** When progress hits 100%, Hider is caught.

### Phase 4: Elimination & Spectating
*   **Caught Hider:** 
    *   **Visual:** Explosion effect.
    *   **State:** **SPECTATOR ORBIT**. The camera pulls back to the "Pause/Orbit" view (zoomed out, orbiting the planet). 
    *   **Input:** Flight controls disabled. Camera controls (Rotation/Zoom) enabled so they can watch the rest of the match.
    *   **Mesh:** The Hider's plane mesh is hidden or removed.

### Phase 5: End Game
*   **Seeker Wins:** All Hiders caught before time runs out.
*   **Hiders Win:** Time runs out and at least 1 Hider survives.

---

## 4. Technical Architecture

### A. State Management (`types.ts`)
We add a dedicated configuration object and state slice.
```typescript
export type SeekerSelectionMode = 'random' | 'host' | 'rotational';

export interface HideAndSeekConfig {
    hidingTime: number;
    seekingTime: number;
    coneAngle: number;
    lockOnTime: number;
    catchDistance: number;
    seekerSelection: SeekerSelectionMode;
}

export interface HideAndSeekState {
    active: boolean;
    phase: 'setup' | 'hiding' | 'seeking' | 'game_over';
    timer: number;
    seekerId: number; // Pilot ID
    
    // Status of all players
    playerStatus: Record<number, 'hiding' | 'caught' | 'seeking'>;
    
    // Transient Lock-On State (For UI/Logic)
    // Map<TargetPilotId, LockProgress(0-1)>
    currentLocks: Record<number, number>; 
}
```

### B. Controller Logic (`HideAndSeekController.tsx`)
*   **Raycasting:** Use `three.js` Raycaster against the `GlobalTerrain` mesh.
*   **Camera Override:** 
    *   Pass `forceLookDown` to `CameraController` when `phase === 'hiding' && myId === seekerId`.
    *   Pass `forceOrbit` to `CameraController` when `playerStatus[myId] === 'caught'`.

### C. UI Implementation (`HideAndSeekHUD.tsx`)
*   **Seeker HUD:** Show Lock-on reticles on valid targets.
*   **Hider HUD:** Show "WARNING: LOCK DETECTED" if Seeker is locking on.
*   **Config UI:** A pop-over or expansion panel in `MissionTab` to set the sliders.

---

## 5. Implementation Roadmap
1.  **Types & Store:** Add `HideAndSeekConfig` and `HideAndSeekState` to `useStore`.
2.  **Controller:** Create `HideAndSeekController` to handle the game loop (timers, raycasts, lock-on).
3.  **Camera:** Update `CameraController` to support `forceLookDown` (Blindfold) and reuse existing `ORBIT` mode for Spectators.
4.  **UI:** Update `MissionTab` with the new Config UI and create the specific `HideAndSeekHUD`.
