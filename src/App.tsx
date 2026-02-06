import React, { useEffect } from 'react';
import { SceneRoot } from './engine/render/SceneRoot';
import { UI } from './app/components/ui/UI';
import { FlightTuningMenu } from './app/components/ui/debug/FlightTuningMenu';

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
    </div>
  );
};


export default App;
