# Orbital Sim Codebase Analysis

## 1. Networking Architecture (Critical)
**Issue:** Multiplayer Sync is limited to Player 1.
The `useTelemetryLoop` hook currently only emits telemetry for the first pilot in the local party:
```typescript
const p1 = state.localParty[0];
// ...
socket.emit('telemetry', { ... });
```
**Impact:** If a user starts a Split-Screen session (Local Party of 2+), the second player (P2) is **invisible** to the online server. The server protocol appears to assume 1 Socket = 1 Plane.
**Recommendation:** 
1. Update the server `telemetry` event to accept an array of pilot states.
2. Update `useTelemetryLoop` to iterate over all valid pilots in `localParty` and emit a unified packet or individual packets for each.

## 2. Audio Context Resource Leak
**Issue:** Multiple AudioContexts.
In `useAirplaneSound.ts`, a new `AudioContext` is instantiated inside the hook:
```typescript
const ctx = new Ctx(); // inside useEffect
```
**Impact:** Browsers typically limit the number of active `AudioContexts` (e.g., Chrome allows max 6). If a 4-player game starts, or if components remount frequently, the app will hit this limit, causing audio to fail silently or throw errors.
**Recommendation:** Move the `AudioContext` creation to a singleton module (e.g., `audioManager.ts`) or use a persistent `useRef` at the App level, sharing the same context instance across all `Airplane` components.

## 3. Chase Mode Logic Hardcoding
**Issue:** Scoring Logic limited to P1 vs P2.
In `useStore.ts` -> `tickChaseScore`, the distance calculation calculates the dot product between `pilotPositions[0]` and `pilotPositions[1]` only.
**Impact:** If P3 or P4 are playing, or if the teams are uneven, the specific spatial mechanics of "Chaser vs Evader" will not calculate distance correctly for those players. They will accumulate generic points but the "Distance Bar" will likely show data irrelevant to them.
**Recommendation:** The logic needs to calculate the distance to the *nearest opposing team member* rather than a hardcoded index.

## 4. Touch UI Scalability
**Issue:** Hardcoded Touch Controls.
In `UI.tsx`, touch controls are manually rendered:
```typescript
{/* P1 CONTROLS */}
{showP1Touch && ...}
{/* P2 CONTROLS */}
{showP2Touch && ...}
```
**Impact:** If the party size expands to 3 or 4 players (e.g., on a large touch table device or via mobile emulation), P3 and P4 will have no way to steer.
**Recommendation:** The UI controls generation should iterate over `activePilots` just like the HUD generation does, rendering a `VirtualJoystick` for any pilot where `input.type === 'touch'`.

## 5. React State Mutation Pattern
**Observation:** Telemetry Bypass.
In `Airplane.tsx`, telemetry is updated via direct mutation:
```typescript
const pilot = storeState.localParty[playerId - 1];
if (pilot) {
    pilot.telemetry.speed = currentSpeed.current;
    // ...
}
```
**Analysis:** This is actually a **good performance decision** for 60FPS loops, as it avoids triggering React Reconciliation for every frame of physics. However, it relies on `GameHUD` knowing to poll this mutable data via `requestAnimationFrame`.
**Recommendation:** This pattern is fragile. Ensure strict type safety or create a dedicated `TransientStore` (using `zustand/vanilla`) for physics data to separate it explicitly from the Reactive UI state (menus/lobbies).

## 6. Input System "Magic Numbers"
**Issue:** Keyboard mapped to indexes 100+.
In `useArcadeInput.ts`:
```typescript
gpIndex = 100 + pilotIndex; // For keyboard
```
**Impact:** While unlikely to collide with real Gamepads (which usually map 0-4), this "Magic Number" approach makes the input system harder to debug and extend.
**Recommendation:** Use a string-based ID system for input sources (e.g., `device: "gamepad:0"` vs `device: "keyboard:p1"`) rather than overloading the integer index.
