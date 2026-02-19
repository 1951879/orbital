import React, { useEffect } from 'react';
import { useMainMenuStore, MainMenuScreen } from '../MainMenuStore';
import { Header } from './components/Header';
import { HubScreen } from './screens/HubScreen';
import { PlaySelectScreen } from './screens/PlaySelectScreen';
import { LobbyScreen } from './screens/LobbyScreen';
import { SessionState } from '../../../../engine/session/SessionState';
import { useStore } from '../../../store/useStore';
import { NetworkManager } from '../../../../engine/session/NetworkManager';

const TABS: MainMenuScreen[] = ['squadron', 'operations', 'briefing'];

export const MainMenuContainer: React.FC = () => {
    const currentScreen = useMainMenuStore((state) => state.currentScreen);
    const setScreen = useMainMenuStore((state) => state.setScreen);
    const inLobby = useMainMenuStore((state) => state.inLobby);

    // Input Handling for Tab Navigation
    useEffect(() => {
        const handleInput = (playerId: number, action: string) => {
            // Only Host (Player 0) (or P1) controls the tabs
            // TODO: Better "Is Host" check? For now, ID 0 is host.
            if (playerId !== 0) return;

            const maxIndex = inLobby ? TABS.length - 1 : TABS.indexOf('briefing') - 1;

            if (action === 'TAB_NEXT') {
                const currentIndex = TABS.indexOf(currentScreen);
                const nextIndex = currentIndex + 1;
                if (nextIndex <= maxIndex) setScreen(TABS[nextIndex]);
            } else if (action === 'TAB_PREV') {
                const currentIndex = TABS.indexOf(currentScreen);
                const prevIndex = currentIndex - 1;
                if (prevIndex >= 0) setScreen(TABS[prevIndex]);
            } else if (action === 'LAUNCH') {
                const state = useStore.getState();
                const currentRoomId = state.currentRoomId;

                // 1. Online Launch (Host Only)
                if (currentRoomId && NetworkManager.isGameConnected) {
                    // TODO: meaningful host check? For now trust server to ignore non-hosts or UI hides it
                    // Header.tsx has complex logic to determine if we are the lobby host.
                    // For now, let's just Try to start it.
                    console.log('[MainMenuContainer] Gamepad Launch (Network)');
                    NetworkManager.startMission();
                    return;
                }

                // 2. Offline Launch (Local only)
                const localParty = state.localParty;
                const isHost = localParty.some(p => p.id === 0);
                const allReady = localParty.length > 0 && localParty.every(p => p.ui.status === 'ready');

                if (inLobby && allReady && isHost) {
                    console.log('[MainMenuContainer] Gamepad Launch (Local)');
                    state.setMission('free');
                }
            } else if (action === 'ABORT') {
                if (inLobby) {
                    NetworkManager.leaveRoom();
                    NetworkManager.disconnectGameServer();
                    useMainMenuStore.getState().setInLobby(false);
                    setScreen('operations');
                }
            }
        };

        const cleanup = SessionState.onInput(handleInput);
        return () => { cleanup(); };
    }, [currentScreen, setScreen, inLobby]);

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
