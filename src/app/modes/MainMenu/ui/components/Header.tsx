import React from 'react';
import { useStore } from '../../../../store/useStore';
import { useMainMenuStore } from '../../MainMenuStore';
import { GamepadButton } from '@/src/app/core/ui/GamepadIcons';
import { useHostHints } from '../../../../core/hooks/useInputHints';
import { SharedHeader } from '@/src/app/core/ui/components/header/SharedHeader';
import type { LaunchState } from '@/src/app/core/ui/components/header/PrimaryLoadingButton';

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

    // Launch State
    let launchState: LaunchState = 'not-ready';
    if (inLobby && allReady && isHost) {
        launchState = 'ready';
    } else if (inLobby && allReady && !isHost) {
        launchState = 'waiting-host';
    }

    const handleLaunch = () => {
        if (launchState !== 'ready') return;
        console.log('[Header] Launching sortie');
        setMission('free');
    };

    const handleAbort = () => {
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
