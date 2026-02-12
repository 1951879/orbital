import React, { useEffect } from 'react';
import { useStore } from './app/store/useStore';
import { SceneRoot } from './engine/render/SceneRoot';
import { UI } from './app/components/ui/UI';
import { FlightTuningMenu } from './app/components/ui/debug/FlightTuningMenu';
import { FPSMeter } from './app/components/ui/debug/FPSMeter';
import { FreeFlightModeInstance } from './app/modes/FreeFlight/FreeFlightMode';
import { MainMenuModeInstance } from './app/modes/MainMenu/MainMenuMode';
import { GameMode } from './engine/mode/GameMode';
import { SessionBridge } from './app/components/SessionBridge';

import { GAMEPAD_FLIGHT, GAMEPAD_MENU, KEYBOARD_FLIGHT, KEYBOARD_MENU, KEYBOARD_FLIGHT_KB1, KEYBOARD_FLIGHT_KB2 } from './app/core/input/DefaultProfiles';
import { SessionState } from './engine/session/SessionState';

// Import Cameras to Inject
import { ChaseCamera } from './app/core/cameras/ChaseCamera';
import { OrbitCamera } from './app/core/cameras/OrbitCamera';

// Register Default Input Profiles (Core -> Engine Injection)
// SessionState.registerDefaultProfile('gamepad', 'FLIGHT', GAMEPAD_FLIGHT);
// SessionState.registerDefaultProfile('gamepad', 'MENU', GAMEPAD_MENU);
// SessionState.registerDefaultProfile('keyboard', 'FLIGHT', KEYBOARD_FLIGHT); // Fallback
// SessionState.registerDefaultProfile('keyboard', 'MENU', KEYBOARD_MENU);

// Specific Flight Overrides
// SessionState.registerDefaultProfile('kb1', 'FLIGHT', KEYBOARD_FLIGHT_KB1);
// SessionState.registerDefaultProfile('kb2', 'FLIGHT', KEYBOARD_FLIGHT_KB2);

const MODES: Record<string, GameMode> = {
  'free': FreeFlightModeInstance,
  'main_menu': MainMenuModeInstance
};

const CAMERAS: Record<string, React.FC<any>> = {
  'chase': ChaseCamera,
  'orbit': OrbitCamera,
  'squadron': OrbitCamera,
  'menu': OrbitCamera // Mapping 'menu' to OrbitCamera
};

const App: React.FC = () => {
  // Extract Engine Config from Store (App Layer)
  const isPaused = useStore((state) => state.isPaused);
  const mission = useStore((state) => state.mission);
  const localParty = useStore((state) => state.localParty);
  const terrainSeed = useStore((state) => state.terrainSeed);
  const terrainParams = useStore((state) => state.terrainParams);

  return (
    <div className="relative w-full h-screen bg-slate-950 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <SceneRoot
          modes={MODES}
          cameras={CAMERAS}
          config={{
            isPaused,
            mission,
            localParty,
            terrainSeed,
            terrainParams
          }}
        >
          <SessionBridge />
        </SceneRoot>
      </div>
      <div className="absolute inset-0 z-10 pointer-events-none">
        <UI />
      </div>
      {/* Flight Tuning Menu (High Z-Index, Pointer Events Auto) */}
      <FlightTuningMenu />
      <FPSMeter />
    </div>
  );
};


export default App;
