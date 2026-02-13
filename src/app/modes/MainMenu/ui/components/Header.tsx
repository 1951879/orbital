import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../../../store/useStore';
import { useMainMenuStore } from '../../MainMenuStore';
import { GamepadButton } from '@/src/app/core/ui/GamepadIcons';
import { useHostHints } from '../../hooks/useInputHints';

// ─── ELLIPSIS MENU ───────────────────────────────────────────────────────────

const EllipsisMenu: React.FC = () => {
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const setScreenConfigOpen = useMainMenuStore((state) => state.setScreenConfigOpen);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const handleFS = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFS);
        return () => document.removeEventListener('fullscreenchange', handleFS);
    }, []);

    useEffect(() => {
        if (!open) return;
        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => console.error(err));
        } else {
            document.exitFullscreen();
        }
    };

    return (
        <div ref={menuRef} className="relative h-full flex items-center px-3">
            {/* Ellipsis Button */}
            <button
                onClick={() => setOpen(prev => !prev)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${open
                    ? 'bg-white/10 text-white'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                    }`}
                title="Options"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
                    <circle cx="12" cy="5" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="12" cy="19" r="2" />
                </svg>
            </button>

            {/* Tooltip-style Context Menu — left-aligned so it never clips */}
            {open && (
                <div className="absolute top-full left-0 mt-2 z-[100]">
                    {/* Arrow — positioned near the left to point at the button */}
                    <div className="w-3 h-3 bg-slate-800 border-t border-l border-white/15 rotate-45 absolute -top-1.5 left-4" />
                    {/* Menu Body */}
                    <div className="bg-slate-800 border border-white/15 rounded-lg shadow-2xl shadow-black/50 overflow-hidden min-w-[170px]">
                        <button
                            onClick={() => { setScreenConfigOpen(true); setOpen(false); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-[11px] font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-all"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-slate-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                            </svg>
                            Screen Layout
                        </button>
                        <div className="h-px bg-white/5 mx-2" />
                        <button
                            onClick={() => { toggleFullscreen(); setOpen(false); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-[11px] font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-all"
                        >
                            {isFullscreen ? (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-slate-500">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5M15 15l5.25 5.25" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-slate-500">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                                </svg>
                            )}
                            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── LAUNCH BUTTON ───────────────────────────────────────────────────────────

type LaunchState = 'not-ready' | 'waiting-host' | 'ready';

const LaunchButton: React.FC = () => {
    const localParty = useStore(state => state.localParty);
    const setMission = useStore(state => state.setMission);
    const setIsPaused = useStore(state => state.setIsPaused);
    const currentScreen = useMainMenuStore(state => state.currentScreen);
    const inLobby = useMainMenuStore(state => state.inLobby);

    const isHost = localParty.some(p => p.id === 0);
    const allReady = localParty.length > 0 && localParty.every(p => p.ui.status === 'ready');

    let state: LaunchState = 'not-ready';
    if (inLobby && allReady && isHost) {
        state = 'ready';
    } else if (inLobby && allReady && !isHost) {
        state = 'waiting-host';
    }

    const handleLaunch = () => {
        if (state !== 'ready') return;
        console.log('[Header] Launching sortie');
        setMission('free');
        setIsPaused(false);
    };

    const styles: Record<LaunchState, string> = {
        'not-ready': 'bg-slate-800/80 text-slate-600 border-slate-700 cursor-not-allowed',
        'waiting-host': 'bg-amber-900/30 text-amber-500/70 border-amber-700/40 cursor-not-allowed',
        'ready': 'bg-gradient-to-r from-blue-600 to-blue-500 text-white border-blue-400/50 hover:from-blue-500 hover:to-blue-400 hover:shadow-[0_0_25px_rgba(59,130,246,0.3)] active:scale-[0.97] cursor-pointer',
    };

    return (
        <button
            onClick={handleLaunch}
            disabled={state !== 'ready'}
            className={`h-full px-4 md:px-6 font-black text-[10px] md:text-xs uppercase tracking-[0.15em] border-0 border-l border-white/10 transition-all duration-200 ${styles[state]}`}
        >
            Launch
        </button>
    );
};

// ─── TAB LIST ────────────────────────────────────────────────────────────────

const TABS = [
    { id: 'squadron', label: 'SQUADRON' },
    { id: 'operations', label: 'OPERATIONS' },
    { id: 'briefing', label: 'BRIEFING' },
] as const;

// ─── HEADER ──────────────────────────────────────────────────────────────────

export const Header: React.FC = () => {
    const localParty = useStore((state) => state.localParty);
    const isOnline = useStore((state) => state.isOnline);
    const currentScreen = useMainMenuStore((state) => state.currentScreen);
    const setScreen = useMainMenuStore((state) => state.setScreen);
    const inLobby = useMainMenuStore((state) => state.inLobby);
    const setInLobby = useMainMenuStore((state) => state.setInLobby);

    const host = localParty.find(p => p.id === 0);
    const hostDevice = host?.input.deviceId || 'kb1';

    const hints = useHostHints();

    return (
        <div className="h-14 md:h-16 bg-slate-950/80 backdrop-blur-md border-b border-white/10 flex items-center z-50 shrink-0 shadow-2xl relative">

            {/* LEFT SECTION — hidden in portrait to save space */}
            <div className="contents portrait:hidden">
                {/* ELLIPSIS (left edge) */}
                <EllipsisMenu />

                {/* SEPARATOR */}
                <div className="w-px h-full bg-white/10" />

                {/* SQUAD DOTS */}
                <div className="flex items-center gap-1.5 px-3 md:px-4 h-full" title="Squad Status">
                    {Array.from({ length: 4 }).map((_, i) => {
                        const pilot = localParty.find(p => p.id === i);
                        let colorClass = 'bg-slate-700';
                        let glowClass = '';

                        if (pilot) {
                            if (pilot.ui.status === 'ready') {
                                colorClass = 'bg-green-500';
                                glowClass = 'shadow-[0_0_8px_rgba(34,197,94,0.8)]';
                            } else {
                                colorClass = 'bg-blue-500';
                                glowClass = 'shadow-[0_0_8px_rgba(59,130,246,0.8)]';
                            }
                        }

                        return (
                            <div
                                key={i}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${colorClass} ${glowClass}`}
                            />
                        );
                    })}
                </div>

                {/* SEPARATOR */}
                <div className="w-px h-full bg-white/10" />

                {/* NET STATUS */}
                <div className="flex items-center gap-2 px-3 md:px-4 h-full text-[10px] md:text-xs font-mono uppercase text-slate-400">
                    <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'bg-slate-700'}`} />
                    <span className="hidden sm:inline">NET</span>
                </div>

                {/* SEPARATOR */}
                <div className="w-px h-full bg-white/10" />
            </div>

            {/* TAB NAVIGATION — left-flexed in portrait, absolute-centered otherwise */}
            <div className="flex items-center gap-1 h-full portrait:pl-2 landscape:absolute landscape:left-1/2 landscape:-translate-x-1/2">
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
            </div>

            {/* RIGHT SPACER — pushes buttons to right edge */}
            <div className="flex-1" />

            {/* ABORT BUTTON (only when in lobby) */}
            {inLobby && (
                <button
                    onClick={() => { setInLobby(false); setScreen('operations'); }}
                    className="h-full px-4 md:px-5 font-bold text-[10px] md:text-xs uppercase tracking-[0.1em] border-0 border-l border-white/10 text-red-400/70 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
                >
                    Abort
                </button>
            )}

            {/* LAUNCH BUTTON (right edge, full height) */}
            <LaunchButton />
        </div>
    );
};
