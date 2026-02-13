import { create } from 'zustand';

export type MainMenuScreen = 'squadron' | 'operations' | 'briefing';

// Available gameplay mode IDs for the lobby browser filter
// Add more here as modes are created: | 'tdm' | 'racing'
export type GameModeId = 'all' | 'free_flight';

// Lobby panel identifiers
export const LOBBY_PANELS = ['roster', 'mission', 'terrain'] as const;
export type LobbyPanelId = typeof LOBBY_PANELS[number];

interface MainMenuState {
    currentScreen: MainMenuScreen;
    setScreen: (screen: MainMenuScreen) => void;

    // Lobby browser: which mode tab is highlighted
    selectedModeFilter: GameModeId;
    setSelectedModeFilter: (mode: GameModeId) => void;

    // Overlay States
    isScreenConfigOpen: boolean;
    setScreenConfigOpen: (isOpen: boolean) => void;

    // Lobby session state (set when creating/joining from Operations)
    inLobby: boolean;
    setInLobby: (inLobby: boolean) => void;

    // Lobby Focus/Navigation State
    focusedZone: LobbyPanelId;
    focusedItem: number;
    carouselIndex: number;
    showFocus: boolean;
    setFocusedZone: (zone: LobbyPanelId) => void;
    setFocusedItem: (item: number | ((prev: number) => number)) => void;
    setCarouselIndex: (index: number | ((prev: number) => number)) => void;
    setShowFocus: (show: boolean) => void;

    // Roster Action Tray State
    openRosterMenu: number | null;
    rosterTrayIndex: number;
    setOpenRosterMenu: (id: number | null) => void;
    setRosterTrayIndex: (index: number | ((prev: number) => number)) => void;
}

export const useMainMenuStore = create<MainMenuState>((set) => ({
    currentScreen: 'squadron',
    setScreen: (screen) => set({ currentScreen: screen }),

    selectedModeFilter: 'all',
    setSelectedModeFilter: (mode) => set({ selectedModeFilter: mode }),

    isScreenConfigOpen: false,
    setScreenConfigOpen: (isOpen) => set({ isScreenConfigOpen: isOpen }),

    inLobby: false,
    setInLobby: (inLobby) => set({ inLobby }),

    // Lobby defaults
    focusedZone: 'roster',
    focusedItem: 0,
    carouselIndex: 0,
    showFocus: false,
    setFocusedZone: (zone) => set({ focusedZone: zone }),
    setFocusedItem: (item) => set((state) => ({
        focusedItem: typeof item === 'function' ? item(state.focusedItem) : item
    })),
    setCarouselIndex: (index) => set((state) => ({
        carouselIndex: typeof index === 'function' ? index(state.carouselIndex) : index
    })),
    setShowFocus: (show) => set({ showFocus: show }),

    // Roster specific state regarding action tray
    openRosterMenu: null,
    rosterTrayIndex: 0,
    setOpenRosterMenu: (id) => set({ openRosterMenu: id, rosterTrayIndex: 0 }), // Reset tray index on open
    setRosterTrayIndex: (index) => set((state) => ({
        rosterTrayIndex: typeof index === 'function' ? index(state.rosterTrayIndex) : index
    })),
}));

