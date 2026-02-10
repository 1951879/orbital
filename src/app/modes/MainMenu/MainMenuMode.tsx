import React from 'react';
import { GameMode } from '../../../engine/mode/GameMode';
import { SurfaceSquadron } from './SurfaceSquadron';
import { MenuOverlay } from '../../components/ui/MenuOverlay';
import { OrbitCamera } from '../../core/cameras/OrbitCamera';
import { SunLight } from '../../core/env/SunLight';
import { BlueprintSphere } from '../../core/env/BlueprintSphere';
import { useStore } from '../../store/useStore';

// --- REACT COMPONENTS ---

const MainMenuScene: React.FC = () => {
    return (
        <>
            <SunLight />
            <BlueprintSphere />
            <SurfaceSquadron />
        </>
    );
};

const MainMenuUI: React.FC = () => {
    // We pass a no-op togglePause because in MainMenuMode, "Pause" doesn't really exist in the same way.
    // The Menu IS the mode. But MenuOverlay expects it.
    // Actually, in MainMenuMode, "Resume" probably shouldn't be an option unless we have a 'lastMission' state?
    // But for now, the equivalent of "Toggle Pause" in Main Menu might be "Launch" if they hit Start?
    // Let's just pass a no-op or handle it in MenuOverlay.
    return <MenuOverlay onTogglePause={() => { }} />;
};

const MainMenuViewport: React.FC<{ cameraRef: any }> = ({ cameraRef }) => {
    return <OrbitCamera cameraRef={cameraRef} />;
};

// --- MODE LOGIC CLASS ---
export class MainMenuModeLogic implements GameMode {
    id = 'main_menu';

    // Components
    SceneComponent: React.FC = MainMenuScene;
    UIComponent: React.FC = MainMenuUI;
    ViewportComponent: React.FC<{ player: any, cameraRef: any }> = (props) => <MainMenuViewport {...props} />;

    init() {
        console.log('[MainMenuMode] Init');
        // Reset any game state if needed?
        // Ensure "isPaused" is true?
        // Actually, "isPaused" is a bit ambiguous now.
        // If we are in MainMenuMode, are we "Paused"?
        // Technically "isPaused" controls the Menu Overlay visibility in FreeFlight.
        // In MainMenuMode, the overlay is ALWAYS visible (via UIComponent).
        // So we might want `isPaused = false` so the engine runs, but the Overlay is rendered by UIComponent.
        // OR `isPaused` just means "Physics Paused".

        // Let's set isPaused = true to stop physics/input from doing weird things if they leak?
        // But SurfaceSquadron has animations.

        useStore.getState().setIsPaused(true);
    }

    dispose() {
        console.log('[MainMenuMode] Dispose');
    }

    update(dt: number) {
        // Visual updates only (Camera, primitive animations)
        // No physics step needed for the Hangar (unless we add physics props)
    }
}

export const MainMenuModeInstance = new MainMenuModeLogic();
