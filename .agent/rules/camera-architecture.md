# Camera Architecture Rules

## Core Principle: Separate Files Per Camera Mode

Camera modes MUST be implemented as **separate, focused components**. Do NOT create monolithic camera controllers with mode-switching state machines.

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
└── CameraManager.tsx            # Mode switching coordinator
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

### 4. **Mode Switching**
Use a dedicated `CameraManager.tsx` component:
```tsx
// ✅ CORRECT
export const CameraManager: React.FC = () => {
  const mode = useStore(s => s.cameraMode);
  
  if (mode === 'chase') return <ChaseCamera />;
  if (mode === 'squadron') return <SquadronCamera />;
  if (mode === 'orbit') return <OrbitCamera />;
};
```

```tsx
// ❌ WRONG - Don't do this
export const CameraController = () => {
  const mode = useStore(s => s.cameraMode);
  
  useFrame(() => {
    if (mode === 'chase') { /* 100 lines */ }
    else if (mode === 'squadron') { /* 100 lines */ }
    else if (mode === 'orbit') { /* 100 lines */ }
  });
};
```

### 5. **Layer Separation**
Follow Diamond Architecture:
- **Engine Layer** (`src/engine/render/cameras/`): Generic, reusable cameras
- **App Layer** (`src/app/gamemodes/*/`): Game-specific camera behaviors

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
