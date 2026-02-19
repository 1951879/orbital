import React from 'react';
import { useStore } from '../../../../store/useStore';
import { useMainMenuStore } from '../../MainMenuStore';
import { GamepadButton } from '@/src/app/core/ui/GamepadIcons';
import { useHostHints } from '../../../../core/hooks/useInputHints';
import { SharedHeader } from '@/src/app/core/ui/components/header/SharedHeader';
import type { LaunchState } from '@/src/app/core/ui/components/header/PrimaryLoadingButton';
import { NetworkManager } from '@/src/engine/session/NetworkManager';

// ─── TAB LIST ────────────────────────────────────────────────────────────────

const TABS = [
    { id: 'squadron', label: 'SQUADRON' },
    { id: 'operations', label: 'OPERATIONS' },
    { id: 'briefing', label: 'BRIEFING' },
] as const;

// ─── HEADER ──────────────────────────────────────────────────────────────────

export const Header: React.FC = () => {
    const localParty = useStore((state) => state.localParty);
    const setMission = useStore(state => state.setMission);
    const currentScreen = useMainMenuStore((state) => state.currentScreen);
    const setScreen = useMainMenuStore((state) => state.setScreen);
    const inLobby = useMainMenuStore((state) => state.inLobby);
    const setInLobby = useMainMenuStore((state) => state.setInLobby);
    const setScreenConfigOpen = useMainMenuStore((state) => state.setScreenConfigOpen);

    const host = localParty.find(p => p.id === 0);
    const hostDevice = host?.input.deviceId || 'kb1';
    const hints = useHostHints();

    const isHost = localParty.some(p => p.id === 0);
    const allReady = localParty.length > 0 && localParty.every(p => p.ui.status === 'ready');

    // Launch State Logic (Global Ready & Host Check)
    const isOnline = useStore(state => state.isOnline);
    const remotePlayers = useStore(state => state.remotePlayers);

    const currentRoomId = useStore(state => state.currentRoomId);

    let launchState: LaunchState = 'not-ready';
    let isLobbyHost = localParty.some(p => p.id === 0); // Default offline assumption

    // If we are online OR in a room OR have data, we MUST use online logic
    if (isOnline || currentRoomId || remotePlayers.length > 0) {
        // Online Logic: Determine true Lobby Host via joinedAt sort
        // 1. Merge Local & Remote (Conceptually)
        // We know remotePlayers contains EVERYONE when online (including self, reflected by server)
        // The "Lobby Host" is the player with the earliest joinedAt

        if (remotePlayers.length > 0) {
            const sorted = [...remotePlayers].sort((a, b) => {
                if (a.joinedAt !== b.joinedAt) return a.joinedAt - b.joinedAt;
                return a.id.localeCompare(b.id);
            });

            const hostId = sorted[0].id;
            const myChannelId = NetworkManager.channelId;
            // Am I the host? (Does hostId start with my channelId?)
            isLobbyHost = !!myChannelId && hostId.startsWith(myChannelId);

            // Are ALL players ready?
            const allRemoteReady = remotePlayers.every(p => p.isReady);
            // Local party ready check is implicit if remotePlayers is up to date (since we send updates)
            // But for responsiveness, we also check local state
            const localReady = localParty.every(p => p.ui.status === 'ready');

            // Global Ready = All Remote (which includes us eventually) AND Local (instant)
            // Actually, remotePlayers might strictly filter out "us" in RosterPanel logic? 
            // verifying: useStore.remotePlayers usually includes everyone sent by server.
            // RosterPanel merges them. 
            // Let's assume remotePlayers is the source of truth for "Everyone in Room".
            // WAIT: updatePilot ONLY updates local state. NetworkManager sends update.
            // Server broadcasts update. remotePlayers updates.
            // So remotePlayers IS the truth.

            if (allRemoteReady && localReady) {
                launchState = isLobbyHost ? 'ready' : 'waiting-host';
            }
        } else {
            // Connected but roster not synced yet? Wait.
            launchState = 'not-ready';
        }

    } else {
        // Offline Logic
        if (allReady) {
            launchState = 'ready';
        }
    }

    const handleLaunch = () => {
        if (launchState !== 'ready') return;
        console.log('[Header] Launching sortie');
        setMission('free');
    };

    const handleAbort = () => {
        // If we are in a lobby, we must leave it on the network
        if (inLobby) {
            // Check if we are connected to a game room
            if (useStore.getState().currentRoomId) {
                NetworkManager.leaveRoom(); // Helper for leaveGameRoom
            }
            // Check if we are connected to platform lobby
            if (useStore.getState().isOnline) {
                NetworkManager.leaveLobby();
            }
            // Clear local state immediately for responsiveness
            useStore.getState().setRemotePlayers([]);
            useStore.getState().setCurrentRoomId(null);
        }

        setInLobby(false);
        setScreen('operations');
    };

    // Center Content: Tabs
    const Tabs = (
        <>
            {host && hints.showGamepad && (
                <GamepadButton type={hints.gamepadType} button="LB" />
            )}
            {host && hints.showKeyboard && !hints.showGamepad && (
                <span className="min-w-[20px] h-5 px-1 border border-slate-500 rounded flex items-center justify-center text-[9px] font-bold text-slate-400">
                    {hostDevice === 'kb2' ? 'DEL' : 'Q'}
                </span>
            )}

            {TABS.map(tab => {
                const isActive = currentScreen === tab.id;
                const isLocked = tab.id === 'briefing' && !inLobby;
                return (
                    <button
                        key={tab.id}
                        onClick={() => !isLocked && setScreen(tab.id as any)}
                        disabled={isLocked}
                        className={`px-2 py-1 md:px-4 h-full flex items-center text-[10px] md:text-xs uppercase transition-all border-b-2 ${isActive
                            ? 'text-white font-black border-blue-500'
                            : isLocked
                                ? 'text-slate-700 font-medium border-transparent cursor-not-allowed'
                                : 'text-slate-500 font-medium border-transparent hover:text-slate-300'
                            }`}
                    >
                        {tab.label}
                    </button>
                );
            })}

            {host && hints.showGamepad && (
                <GamepadButton type={hints.gamepadType} button="RB" />
            )}
            {host && hints.showKeyboard && !hints.showGamepad && (
                <span className="min-w-[20px] h-5 px-1 border border-slate-500 rounded flex items-center justify-center text-[9px] font-bold text-slate-400">
                    {hostDevice === 'kb2' ? 'PGDN' : 'E'}
                </span>
            )}
        </>
    );

    return (
        <SharedHeader
            centerContent={Tabs}
            onAbort={handleAbort}
            showAbort={inLobby}
            onPrimary={handleLaunch}
            primaryLabel="LAUNCH"
            primaryState={launchState}
            onSettings={() => setScreenConfigOpen(true)}
        />
    );
};
