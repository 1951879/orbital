import React, { useEffect } from 'react';
import { SceneRoot } from './engine/render/SceneRoot';
import { UI } from './app/components/ui/UI';
import { FlightTuningMenu } from './app/components/ui/debug/FlightTuningMenu';
import { FPSMeter } from './app/components/ui/debug/FPSMeter';

import { SessionState } from './engine/session/SessionState';
import { GAMEPAD_FLIGHT, GAMEPAD_MENU, KEYBOARD_FLIGHT, KEYBOARD_MENU } from './app/core/input/DefaultProfiles';

// Register Default Input Profiles (Core -> Engine Injection)
SessionState.registerDefaultProfile('gamepad', 'FLIGHT', GAMEPAD_FLIGHT);
SessionState.registerDefaultProfile('gamepad', 'MENU', GAMEPAD_MENU);
SessionState.registerDefaultProfile('keyboard', 'FLIGHT', KEYBOARD_FLIGHT);
SessionState.registerDefaultProfile('keyboard', 'MENU', KEYBOARD_MENU);

const App: React.FC = () => {
  return (
    <div className="relative w-full h-screen bg-slate-950 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <SceneRoot />
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
