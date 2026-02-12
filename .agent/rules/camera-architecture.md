# Camera Architecture Rules

## Core Principle: Injection-Based Camera System

Cameras are implemented as **separate, focused components** in the App Layer and injected into the Engine. The Engine does NOT know about specific camera modes.

---

## File Structure

```
src/engine/render/
├── cameras/
│   ├── ChaseCamera.tsx          # Follows entity from behind
│   ├── OrbitCamera.tsx          # Free spherical orbit
│   ├── SquadronCamera.tsx       # Formation/hangar view
│   ├── CinematicCamera.tsx      # Scripted camera paths (future)
│   ├── SpectatorCamera.tsx      # Multiplayer spectator (future)
│   └── utils/
│       ├── CameraUtils.ts       # Shared math (easing, lerp, etc.)
│       ├── ViewOffset.ts        # UI compensation logic
│       └── Transitions.ts       # Transition easing functions

```

---

## Design Rules

### 1. **Single Responsibility**
Each camera file handles ONE camera behavior only:
- ✅ `ChaseCamera.tsx`: Follow ship logic, offset calculation, altitude adaptation
- ✅ `OrbitCamera.tsx`: Spherical coordinates, zoom, rotation
- ❌ `CameraController.tsx` with `if (mode === 'chase')` branches

### 2. **File Size Limit**
Keep individual camera files **under 200 lines**. If larger, extract utilities.

### 3. **Shared Logic**
Extract common code to `cameras/utils/`:
- Easing functions (cubic, quadratic, etc.)
- View offset calculations
- Camera lerp/smoothing helpers
- Transition state management

### 4. **Mode Switching (Injection)**
Instead of a `CameraManager`, the App Layer maps names to components and injects them into the Engine:

```tsx
// App.tsx
const CAMERAS = {
  'chase': ChaseCamera,
  'orbit': OrbitCamera,
  'squadron': OrbitCamera
};

<SceneRoot cameras={CAMERAS} ... />
```

The Engine simply renders:
```tsx
// SceneRoot.tsx
<activeMode.ViewportComponent cameras={cameras} ... />
```

### 5. **Layer Separation**
Follow Diamond Architecture:
- **Engine Layer** (`src/engine/render/`): Generic Viewport System (receives cameras)
- **App Layer** (`src/app/core/cameras/`): Specific camera implementations

Example:
```
src/app/gamemodes/
├── Deathmatch/
│   └── DeathMatchCamera.tsx     # Custom camera for this mode
└── Racing/
    └── RacingCamera.tsx         # Custom camera for this mode
```

### 6. **Transitions**
Handle transitions in `CameraManager.tsx` or a dedicated `CameraTransition.tsx`:
- Capture start/end camera states
- Interpolate position, rotation, up vector
- Use easing functions from `cameras/utils/Transitions.ts`

### 7. **Testing**
Each camera MUST be testable in isolation:
- Export camera logic as pure functions where possible
- Mock `useFrame` and `useThree` for unit tests
- Test edge cases (gimbal lock, teleports, etc.) per camera

---

## Implementation Checklist

When adding a new camera mode:
- [ ] Create `cameras/[ModeName]Camera.tsx`
- [ ] Keep file under 200 lines
- [ ] Extract shared logic to `cameras/utils/`
- [ ] Add mode to `CameraManager.tsx`
- [ ] Document camera behavior in file header
- [ ] Add transition logic if needed
- [ ] Write unit tests

---

## Migration Notes

**Legacy Code**: `components/CameraController.tsx` (434 lines) is DEPRECATED.
- Do NOT add new modes to this file
- Gradually migrate modes to separate files
- Delete legacy file once migration is complete

---

## Rationale

This approach provides:
- ✅ **Clarity**: Each file has one clear purpose
- ✅ **Scalability**: Add new cameras without touching existing code
- ✅ **Testability**: Unit test each camera in isolation
- ✅ **Maintainability**: Easier debugging and code review
- ✅ **Parallel Development**: No merge conflicts on camera code
- ✅ **Reusability**: Engine cameras work across multiple games

Avoids:
- ❌ 400+ line files with complex state machines
- ❌ Tight coupling between unrelated camera modes
- ❌ Hard-to-test monolithic components
- ❌ Merge conflicts when multiple developers work on cameras
