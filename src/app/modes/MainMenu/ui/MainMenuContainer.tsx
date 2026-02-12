import React, { useEffect } from 'react';
import { useMainMenuStore, MainMenuScreen } from '../MainMenuStore';
import { Header } from './components/Header';
import { HubScreen } from './screens/HubScreen';
import { PlaySelectScreen } from './screens/PlaySelectScreen';
import { LobbyScreen } from './screens/LobbyScreen';
import { SessionState } from '../../../../engine/session/SessionState';

const TABS: MainMenuScreen[] = ['squadron', 'operations', 'briefing'];

export const MainMenuContainer: React.FC = () => {
    const currentScreen = useMainMenuStore((state) => state.currentScreen);
    const setScreen = useMainMenuStore((state) => state.setScreen);

    // Input Handling for Tab Navigation
    useEffect(() => {
        const handleInput = (playerId: number, action: string) => {
            // Only Host (Player 0) (or P1) controls the tabs
            // TODO: Better "Is Host" check? For now, ID 0 is host.
            if (playerId !== 0) return;

            if (action === 'TAB_NEXT') {
                const currentIndex = TABS.indexOf(currentScreen);
                const nextIndex = (currentIndex + 1) % TABS.length;
                setScreen(TABS[nextIndex]);
            } else if (action === 'TAB_PREV') {
                const currentIndex = TABS.indexOf(currentScreen);
                const prevIndex = (currentIndex - 1 + TABS.length) % TABS.length;
                setScreen(TABS[prevIndex]);
            }
        };

        const cleanup = SessionState.onInput(handleInput);
        return () => { cleanup(); };
    }, [currentScreen, setScreen]);

    // Render Active Screen
    const renderScreen = () => {
        switch (currentScreen) {
            case 'squadron': return <HubScreen />;
            case 'operations': return <PlaySelectScreen />;
            case 'briefing': return <LobbyScreen />;
            default: return <HubScreen />;
        }
    };

    return (
        <div className="fixed inset-0 z-40 flex flex-col pointer-events-none">
            {/* Background Gradient/Overlay (Optional) */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/0 via-slate-900/10 to-slate-900/40 pointer-events-none" />

            {/* Persistent Header */}
            <div className="pointer-events-auto">
                <Header />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 relative overflow-hidden pointer-events-auto">
                {renderScreen()}
            </div>

            {/* Modal Layer (Z-50) */}
            {/* <ScreenConfigModal /> */}
        </div>
    );
};
