import React from 'react';
import { GameMode } from '../../../engine/mode/GameMode';
import { MainMenuContainer } from './ui/MainMenuContainer';
import { SessionState } from '../../../engine/session/SessionState';
import { MAIN_MENU_PROFILE } from './MainMenuInput';
import { useStore } from '../../store/useStore';

// --- REACT COMPONENTS ---

const MainMenuScene: React.FC = () => {
    return null; // No 3D Scene for Menu (HTML Only)
};

const MainMenuUI: React.FC = () => {
    return <MainMenuContainer />;
};

const MainMenuViewport: React.FC<{ cameraRef: any }> = ({ cameraRef }) => {
    return null; // No Viewport/Camera needed
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
        useStore.getState().setIsPaused(true); // Keep physics paused
        // Reset Mission state if returning from game
        useStore.getState().setMission('main_menu');

        // Register Input Profile
        SessionState.registerDefaultProfile('gamepad', 'MENU', MAIN_MENU_PROFILE);
        SessionState.registerDefaultProfile('keyboard', 'MENU', MAIN_MENU_PROFILE);

        // Force Context to MENU
        SessionState.setContextForAll('MENU');
    }

    dispose() {
        console.log('[MainMenuMode] Dispose');
    }

    update(dt: number) {
        // Animation updates
    }
}

export const MainMenuModeInstance = new MainMenuModeLogic();
