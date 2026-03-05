import React, { useEffect } from 'react';
import { useStore } from './app/store/useStore';
import { SceneRoot } from './engine/render/SceneRoot';
import { UI } from './app/components/ui/UI';
import { FlightTuningMenu } from './app/components/ui/debug/FlightTuningMenu';
import { FPSMeter } from './app/components/ui/debug/FPSMeter';
import { IosInstallPrompt } from './app/components/ui/IosInstallPrompt';
import { FreeFlightModeInstance } from './app/modes/FreeFlight/FreeFlightMode';
import { MainMenuModeInstance } from './app/modes/MainMenu/MainMenuMode';
import { GameMode } from './engine/mode/GameMode';
import { SessionBridge } from './app/components/SessionBridge';

// import { GAMEPAD_FLIGHT, GAMEPAD_MENU, KEYBOARD_FLIGHT, KEYBOARD_MENU, KEYBOARD_FLIGHT_KB1, KEYBOARD_FLIGHT_KB2 } from './app/core/input/DefaultProfiles';
import { SessionState } from './engine/session/SessionState';
import { NetworkManager } from './engine/session/NetworkManager';

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
  const mission = useStore((state) => state.mission);
  const localParty = useStore((state) => state.localParty);
  const terrainSeed = useStore((state) => state.terrainSeed);
  const terrainParams = useStore((state) => state.terrainParams);

  // Global Network Connection Manager
  useEffect(() => {
    // 1. Connect to Platform Services on Mount
    // This ensures we are online even before entering the "Operations" screen
    NetworkManager.connectPlatform();

    // 2. Sync Network State to Global Store
    const unsubscribe = NetworkManager.subscribe((event: any) => {
      switch (event.type) {
        case 'CONNECTED':
          useStore.getState().setOnlineStatus('connected');
          break;
        case 'DISCONNECTED':
          useStore.getState().setOnlineStatus('disconnected');
          break;
        case 'GAME_DISCONNECTED':
          console.log('[App] Game Disconnected - Clearing Room State');
          useStore.getState().setRemotePlayers([]);
          useStore.getState().setCurrentRoomId(null);
          break;
        case 'MISSION_STARTED':
          console.log('[App] Mission started by Host');
          useStore.getState().setMission('free');
          break;
        case 'LOBBY_LIST':
          useStore.getState().setLobbies(event.lobbies);
          break;
        case 'ROOM_JOINED':
          useStore.getState().setRemotePlayers(event.players || []);
          if (event.config) {
            console.log('[App] Applying terrain config from server:', event.config);
            useStore.getState().setTerrainConfig(event.config.seed, event.config.terrainParams);
          }
          break;
        case 'PLAYER_JOINED':
          useStore.getState().addRemotePlayer(event.player);
          break;
        case 'PLAYER_LEFT':
          useStore.getState().removeRemotePlayer(event.playerId);
          break;
        case 'PLAYER_METADATA_UPDATE':
          // Update specific player in the list
          const currentPlayers = useStore.getState().remotePlayers;
          const updatedPlayers = currentPlayers.map(p =>
            p.id === event.player.id ? event.player : p
          );
          useStore.getState().setRemotePlayers(updatedPlayers);
          break;
      }
    });

    // 3. Sync initial state (in case we are already connected)
    if (NetworkManager.isConnected) {
      useStore.getState().setOnlineStatus('connected');
    }

    return () => {
      unsubscribe();
      // We do NOT disconnect here, because we want the connection to persist
      // throughout the app lifecycle.
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-slate-950 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <SceneRoot
          modes={MODES}
          cameras={CAMERAS}
          config={{
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
      <IosInstallPrompt />
    </div>
  );
};


export default App;
