import { create } from 'zustand';

export type MainMenuScreen = 'squadron' | 'operations' | 'briefing';

// Available gameplay mode IDs for the lobby browser filter
// Add more here as modes are created: | 'tdm' | 'racing'
export type GameModeId = 'all' | 'free_flight';

interface MainMenuState {
    currentScreen: MainMenuScreen;
    setScreen: (screen: MainMenuScreen) => void;

    // Lobby browser: which mode tab is highlighted
    selectedModeFilter: GameModeId;
    setSelectedModeFilter: (mode: GameModeId) => void;

    // Overlay States
    isScreenConfigOpen: boolean;
    setScreenConfigOpen: (isOpen: boolean) => void;
}

export const useMainMenuStore = create<MainMenuState>((set) => ({
    currentScreen: 'squadron',
    setScreen: (screen) => set({ currentScreen: screen }),

    selectedModeFilter: 'all',
    setSelectedModeFilter: (mode) => set({ selectedModeFilter: mode }),

    isScreenConfigOpen: false,
    setScreenConfigOpen: (isOpen) => set({ isScreenConfigOpen: isOpen }),
}));
