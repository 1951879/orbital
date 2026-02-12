import { create } from 'zustand';

export type MainMenuScreen = 'squadron' | 'operations' | 'briefing';

interface MainMenuState {
    currentScreen: MainMenuScreen;
    setScreen: (screen: MainMenuScreen) => void;

    // Overlay States
    isScreenConfigOpen: boolean;
    setScreenConfigOpen: (isOpen: boolean) => void;
}

export const useMainMenuStore = create<MainMenuState>((set) => ({
    currentScreen: 'squadron',
    setScreen: (screen) => set({ currentScreen: screen }),

    isScreenConfigOpen: false,
    setScreenConfigOpen: (isOpen) => set({ isScreenConfigOpen: isOpen }),
}));
