import { useEffect, useRef, useCallback } from 'react';
import { useMainMenuStore, LOBBY_PANELS, LobbyPanelId } from '../MainMenuStore';
import { SessionState } from '../../../../engine/session/SessionState';
import { useLayoutMode } from './useLayoutMode';

/**
 * Lobby panel descriptor for Open/Closed-compliant navigation.
 * Each panel declares its item count and activation handler,
 * so the hook doesn't need to know about specific zone logic.
 */
export interface LobbyPanelDescriptor {
    id: LobbyPanelId;
    maxItems: number;
    onActivate: (itemIndex: number) => void;
    onContext?: (itemIndex: number) => void;
    onTrayAction?: (itemIndex: number, actionIndex: number) => void;
}

/**
 * Hook that owns all lobby navigation: focus zones, carousel,
 * navMode (pointer vs discrete), and host input handling.
 *
 * LobbyScreen registers panels via descriptors and this hook
 * handles the rest.
 */
export const useLobbyInput = (panels: LobbyPanelDescriptor[]) => {
    const { mode: layoutMode } = useLayoutMode();
    const currentScreen = useMainMenuStore(state => state.currentScreen);
    const setScreen = useMainMenuStore(state => state.setScreen);

    const focusedZone = useMainMenuStore(state => state.focusedZone);
    const focusedItem = useMainMenuStore(state => state.focusedItem);
    const carouselIndex = useMainMenuStore(state => state.carouselIndex);
    const showFocus = useMainMenuStore(state => state.showFocus);
    const setFocusedZone = useMainMenuStore(state => state.setFocusedZone);
    const setFocusedItem = useMainMenuStore(state => state.setFocusedItem);
    const setCarouselIndex = useMainMenuStore(state => state.setCarouselIndex);
    const setShowFocus = useMainMenuStore(state => state.setShowFocus);
    const openRosterMenu = useMainMenuStore(state => state.openRosterMenu);

    const navMode = useRef<'pointer' | 'discrete'>('pointer');

    // Map panel IDs to descriptors for fast lookup
    const panelMap = useRef<Map<LobbyPanelId, LobbyPanelDescriptor>>(new Map());
    useEffect(() => {
        panelMap.current.clear();
        panels.forEach(p => panelMap.current.set(p.id, p));
    }, [panels]);

    // ─── Pointer detection (hide focus on mouse/touch) ──────────
    useEffect(() => {
        const handlePointer = () => {
            if (navMode.current !== 'pointer') {
                navMode.current = 'pointer';
                setShowFocus(false);
            }
        };
        window.addEventListener('mousemove', handlePointer);
        window.addEventListener('touchstart', handlePointer);
        return () => {
            window.removeEventListener('mousemove', handlePointer);
            window.removeEventListener('touchstart', handlePointer);
        };
    }, [setShowFocus]);

    // ─── Sync carousel index → focused zone ─────────────────────
    useEffect(() => {
        if (layoutMode === 'carousel') {
            setFocusedZone(LOBBY_PANELS[carouselIndex]);
        }
    }, [carouselIndex, layoutMode, setFocusedZone]);

    // ─── Host input handling ────────────────────────────────────
    useEffect(() => {
        if (currentScreen !== 'briefing') return;

        const handleInput = (playerId: number, action: string) => {
            if (playerId !== 0) return; // Only host navigates

            // Switch to discrete mode on any nav input
            if (navMode.current !== 'discrete') {
                navMode.current = 'discrete';
                setShowFocus(true);
            }

            const store = useMainMenuStore.getState();

            // ─── ROSTER TRAY INPUT MODE ─────────────────────────
            if (store.openRosterMenu !== null) {
                // If the tray is open, we trap input here to control it
                // This replaces the local useSlotInput hook in PlayerCard
                const currentTrayIndex = store.rosterTrayIndex;
                const slotIdx = store.openRosterMenu;

                // How many buttons?
                const isHostSlot = slotIdx === 0;
                // Host on own slot: [Resign] (1)
                // Host on other slot: [Ring, MakeHost, Kick] (3)
                // We assume we are the Host because only Host navigates
                const buttonCount = isHostSlot ? 1 : 3;

                switch (action) {
                    case 'NAV_LEFT':
                        store.setRosterTrayIndex((prev) => (prev - 1 + buttonCount) % buttonCount);
                        break;
                    case 'NAV_RIGHT':
                        store.setRosterTrayIndex((prev) => (prev + 1) % buttonCount);
                        break;
                    case 'SELECT': {
                        const descriptor = panelMap.current.get('roster'); // Hardcoded to roster for now as it's the only one with a tray
                        if (descriptor && descriptor.onTrayAction) {
                            descriptor.onTrayAction(slotIdx, currentTrayIndex);
                        }
                        break;
                    }
                    case 'BACK':
                    case 'CONTEXT':
                        store.setOpenRosterMenu(null); // Close tray
                        break;
                }
                return; // Stop processing lobby nav
            }

            // ─── STANDARD LOBBY NAV ─────────────────────────────
            const currentZone = store.focusedZone;
            const currentItem = store.focusedItem;
            const currentCarousel = store.carouselIndex;

            switch (action) {
                case 'NAV_LEFT': {
                    if (layoutMode === 'carousel') {
                        const newIdx = Math.max(0, currentCarousel - 1);
                        setCarouselIndex(newIdx);
                        setFocusedZone(LOBBY_PANELS[newIdx]);
                    } else {
                        const zoneIdx = LOBBY_PANELS.indexOf(currentZone);
                        const prevIdx = (zoneIdx - 1 + LOBBY_PANELS.length) % LOBBY_PANELS.length;
                        setFocusedZone(LOBBY_PANELS[prevIdx]);
                    }
                    setFocusedItem(0);
                    break;
                }
                case 'NAV_RIGHT': {
                    if (layoutMode === 'carousel') {
                        const newIdx = Math.min(LOBBY_PANELS.length - 1, currentCarousel + 1);
                        setCarouselIndex(newIdx);
                        setFocusedZone(LOBBY_PANELS[newIdx]);
                    } else {
                        const zoneIdx = LOBBY_PANELS.indexOf(currentZone);
                        const nextIdx = (zoneIdx + 1) % LOBBY_PANELS.length;
                        setFocusedZone(LOBBY_PANELS[nextIdx]);
                    }
                    setFocusedItem(0);
                    break;
                }
                case 'NAV_UP': {
                    setFocusedItem(Math.max(0, currentItem - 1));
                    break;
                }
                case 'NAV_DOWN': {
                    const descriptor = panelMap.current.get(currentZone);
                    const max = descriptor?.maxItems ?? 1;
                    setFocusedItem(Math.min(max - 1, currentItem + 1));
                    break;
                }
                case 'SELECT': {
                    const descriptor = panelMap.current.get(currentZone);
                    descriptor?.onActivate(currentItem);
                    break;
                }
                case 'CONTEXT': {
                    const descriptor = panelMap.current.get(currentZone);
                    if (descriptor?.onContext) {
                        descriptor.onContext(currentItem);
                    }
                    break;
                }
                case 'BACK': {
                    // Back does nothing for lobby navigation (handled by ABORT action in MainMenuContainer)
                    break;
                }
            }
        };

        const cleanup = SessionState.onInput(handleInput);
        return () => { cleanup(); };
        return () => { cleanup(); };
    }, [currentScreen, layoutMode, setScreen, setFocusedZone, setFocusedItem, setCarouselIndex, setShowFocus, openRosterMenu]);

    // ─── Touch swipe handling ───────────────────────────────────
    const touchStart = useRef<{ x: number; y: number } | null>(null);

    const onTouchStart = useCallback((e: React.TouchEvent) => {
        touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, []);

    const onTouchEnd = useCallback((e: React.TouchEvent) => {
        if (!touchStart.current) return;
        const dx = e.changedTouches[0].clientX - touchStart.current.x;
        const dy = e.changedTouches[0].clientY - touchStart.current.y;

        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
            const store = useMainMenuStore.getState();
            if (dx < 0 && store.carouselIndex < LOBBY_PANELS.length - 1) {
                setCarouselIndex(prev => prev + 1);
            } else if (dx > 0 && store.carouselIndex > 0) {
                setCarouselIndex(prev => prev - 1);
            }
        }
        touchStart.current = null;
    }, [setCarouselIndex]);

    return {
        focusedZone,
        focusedItem,
        carouselIndex,
        showFocus,
        onTouchStart,
        onTouchEnd,
    };
};
