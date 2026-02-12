import React from 'react';
import { GameMode } from '../../../engine/mode/GameMode';
import { MainMenuContainer } from './ui/MainMenuContainer';
import { SessionState } from '../../../engine/session/SessionState';
import { MAIN_MENU_GAMEPAD, MAIN_MENU_KB1, MAIN_MENU_KB2 } from './input/MainMenuInput';
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

        // Register Input Profiles
        // NOTE: SessionState uses startsWith() for matching deviceId to profile key.
        // So 'keyboard_wasd' will match 'keyboard_wasd:MENU'
        // And 'gamepad:0' will match 'gamepad:MENU'

        SessionState.registerDefaultProfile('gamepad', 'MENU', MAIN_MENU_GAMEPAD);

        // Keyboard Profiles (KB1 = WASD, KB2 = PL;')
        SessionState.registerDefaultProfile('kb1', 'MENU', MAIN_MENU_KB1);
        SessionState.registerDefaultProfile('kb2', 'MENU', MAIN_MENU_KB2);

        // Fallback for generic 'keyboard'




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
