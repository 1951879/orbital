
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { useGamepadMenu } from '../../../hooks/useGamepadMenu';
import { useArcadeInput } from '../../../hooks/useArcadeInput';
import { MissionTab } from './tabs/MissionTab';
import { ConfigTab, CONFIG_ITEMS } from './tabs/ConfigTab';
import { SquadronTab } from './tabs/SquadronTab';
import { SquadronFooter } from './SquadronFooter';
import { PRESETS } from './tabs/data';
import { TerrainParams, MenuTabId } from '../../../types';
import { LbIcon, RbIcon, StartIcon, AIcon, SelectIcon, BIcon, YIcon } from './ButtonIndicators';


// Tabs
const TABS: { id: MenuTabId | string, label: string }[] = [
    { id: 'hangar', label: 'Squadron' },
    { id: 'multiplayer', label: 'Mission' },
    { id: 'config', label: 'Systems' }
];

export const MenuOverlay: React.FC<{ onTogglePause: () => void }> = ({ onTogglePause }) => {
    const isPaused = useStore((state) => state.isPaused);
    const localParty = useStore((state) => state.localParty);
    const activeTab = useStore((state) => state.activeMenuTab);
    const setActiveTab = useStore((state) => state.setActiveMenuTab);

    // Store Actions
    const mission = useStore((state) => state.mission);
    const setMission = useStore((state) => state.setMission);
    const abortMission = useStore((state) => state.abortMission);
    const setTerrainParam = useStore((state) => state.setTerrainParam);
    const generateNewTerrain = useStore((state) => state.generateNewTerrain);
    const terrainParams = useStore((state) => state.terrainParams);

    // Multiplayer
    const isMultiplayerEnabled = useStore((state) => state.isMultiplayerEnabled);

    // Local State
    const [focusIndex, setFocusIndex] = useState(0);
    const [launchError, setLaunchError] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // GLOBAL INPUT MANAGER
    useArcadeInput(true, activeTab);

    // Determine Host
    const hostPilot = localParty[0];
    const hostGamepadIndex = (hostPilot && hostPilot.input.type === 'gamepad') ? hostPilot.input.gamepadIndex : null;

    const isPendingLaunch = false; // Simplified as only Free Flight exists now

    const isMissionInProgress = useMemo(() => {
        return mission !== 'main_menu';
    }, [mission]);

    useEffect(() => {
        setFocusIndex(0);
    }, [activeTab]);

    useEffect(() => { setLaunchError(null); }, [activeTab, isPaused]);

    // Fullscreen Detection
    useEffect(() => {
        const handleFS = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFS);
        return () => document.removeEventListener('fullscreenchange', handleFS);
    }, []);

    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err) => console.error(err));
        } else {
            document.exitFullscreen();
        }
    }, []);

    // ... Navigation Logic ...
    const handleNavigate = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
        if (activeTab === 'hangar') return;

        if (activeTab === 'config') {
            const maxIndex = CONFIG_ITEMS.length - 1;
            if (direction === 'up') setFocusIndex(prev => Math.max(0, prev - 1));
            else if (direction === 'down') setFocusIndex(prev => Math.min(maxIndex, prev + 1));
            else if (direction === 'left' || direction === 'right') {
                const item = CONFIG_ITEMS[focusIndex];
                if (item && item.key !== 'regen') {
                    const current = terrainParams[item.key as keyof TerrainParams];
                    const delta = direction === 'right' ? item.step : -item.step;
                    let next = current + delta;
                    next = Math.max(item.min, Math.min(item.max, next));
                    setTerrainParam(item.key as keyof TerrainParams, next);
                }
            }
            return;
        }

        if (activeTab === 'multiplayer') {
            // Layout: 
            // Row 1: 0, 1, 2 (3 Cols)
            // Row 2: 3 (1 Col - Free Flight)
            // Row 3: 4, 5, 6, 7 (4 Cols - Presets) - Was 7+ before

            // Re-mapping indices for MissionTab:
            // 0,1,2 = System
            // 3 = Free Flight
            // 4,5,6,7 = Presets

            const totalItems = 8; // 0-7

            if (direction === 'up') {
                if (focusIndex >= 4) {
                    // From Row 3 (Presets) -> Row 2 (Free Flight)
                    setFocusIndex(3);
                } else if (focusIndex === 3) {
                    // From Row 2 -> Row 1
                    setFocusIndex(1); // Center
                }
            } else if (direction === 'down') {
                if (focusIndex <= 2) {
                    // From Row 1 -> Row 2
                    setFocusIndex(3);
                } else if (focusIndex === 3) {
                    // From Row 2 -> Row 3
                    setFocusIndex(4);
                }
            } else if (direction === 'left') setFocusIndex(prev => Math.max(0, prev - 1));
            else if (direction === 'right') setFocusIndex(prev => Math.min(totalItems - 1, prev + 1));
        }
    }, [activeTab, focusIndex, terrainParams, setTerrainParam]);

    const handleArcadeLaunch = useCallback(() => {
        if (localParty.length === 0) return;
        const allReady = localParty.every(p => p.ui.status === 'ready');
        if (allReady) {
            // If in Main Menu, set mission to 'free' to Start Game
            if (mission === 'main_menu') {
                setMission('free');
            } else {
                // If In-Game (Paused), Toggle Pause to Resume
                onTogglePause();
            }
            setLaunchError(null);
        } else {
            setLaunchError("WAITING FOR SQUADRON");
            setTimeout(() => setLaunchError(null), 1500);
        }
    }, [localParty, onTogglePause, mission, setMission]);

    const handleAction = useCallback(() => {
        if (activeTab === 'hangar') return;

        if (activeTab === 'config') {
            const item = CONFIG_ITEMS[focusIndex];
            if (item && item.key === 'regen') generateNewTerrain();
        }

        if (activeTab === 'multiplayer') {
            if (focusIndex === 0) {
                const current = useStore.getState().splitDirection;
                useStore.getState().setSplitDirection(current === 'horizontal' ? 'vertical' : 'horizontal');
            }
            else if (focusIndex === 1) {
                const current = useStore.getState().invertPlayer2;
                useStore.getState().setInvertPlayer2(!current);
            }
            else if (focusIndex === 2) {
                const current = useStore.getState().isMultiplayerEnabled;
                useStore.getState().setMultiplayerEnabled(!current);
            }
            else if (focusIndex === 3) {
                // Selection of "Free Flight" just confirms it, doesn't launch yet?
                // Or typically resets to Free Flight mode?
                // For now, no-op or maybe emphasize selection.
            }
            else if (focusIndex >= 4) {
                const presetIdx = focusIndex - 4;
                if (PRESETS[presetIdx]) {
                    const p = PRESETS[presetIdx];
                    Object.entries(p.params).forEach(([k, v]) => {
                        setTerrainParam(k as any, v as number);
                    });
                    generateNewTerrain();
                }
            }
        }
    }, [activeTab, focusIndex, setMission, generateNewTerrain, setTerrainParam]);

    const handleAbortAction = useCallback(() => {
        if (mission !== 'main_menu') {
            // Abort Mission -> Go back to Main Menu
            setMission('main_menu');
            // We don't need abortMission() from store if we just set mission?
            // Store's abortMission sets mission='free' and isPaused=true.
            // We want mission='main_menu'.
        }
    }, [mission, setMission]);

    const gamepadHandlers = useMemo(() => ({
        onTogglePause: (activeTab === 'hangar' || isPendingLaunch) ? handleArcadeLaunch : onTogglePause,
        onTabPrev: () => {
            const idx = TABS.findIndex(t => t.id === activeTab);
            const prev = TABS[(idx - 1 + TABS.length) % TABS.length];
            setActiveTab(prev.id as MenuTabId);
        },
        onTabNext: () => {
            const idx = TABS.findIndex(t => t.id === activeTab);
            const next = TABS[(idx + 1) % TABS.length];
            setActiveTab(next.id as MenuTabId);
        },
        onNavigate: handleNavigate,
        onAction: handleAction,
        onAltAction: isMissionInProgress ? handleAbortAction : undefined,
        onBack: () => { }, // No config mode to exit
        onReset: () => { }
    }), [activeTab, handleArcadeLaunch, onTogglePause, setActiveTab, handleNavigate, handleAction, handleAbortAction, isPendingLaunch, isMissionInProgress]);

    useGamepadMenu(isPaused, gamepadHandlers, true, hostGamepadIndex);

    const handleHeaderAction = () => {
        if (activeTab === 'hangar' || isPendingLaunch) {
            handleArcadeLaunch();
        } else {
            onTogglePause();
        }
    };

    const isSidebarVisible = activeTab !== 'hangar';

    return (
        <div className="fixed inset-0 z-40 flex flex-col portrait:flex-col-reverse landscape:flex-col pointer-events-none">

            {/* HEADER */}
            <div className="h-12 md:h-16 bg-slate-950/90 backdrop-blur-xl border-b border-white/5 flex items-center px-4 md:px-8 pointer-events-auto shadow-2xl flex-shrink-0 z-50">
                <div className="max-w-7xl mx-auto w-full flex items-center h-full gap-4">

                    {/* Tabs Container */}
                    <div className="flex-1 flex h-full items-center justify-center gap-0 md:gap-4">
                        {TABS.map(t => {
                            const isActive = activeTab === t.id;
                            return (
                                <button
                                    key={t.id}
                                    onClick={() => setActiveTab(t.id as MenuTabId)}
                                    className={`
                            flex-1 max-w-[120px] md:max-w-[200px] h-full text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center relative
                            ${isActive ? 'text-white' : 'text-slate-500 hover:text-slate-300'}
                          `}
                                >
                                    {t.label}
                                    {isActive && (
                                        <div className="absolute bottom-0 left-2 right-2 md:left-4 md:right-4 h-[2px] bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Right Controls */}
                    <div className="flex items-center gap-2 md:gap-4 flex-shrink-0 border-l border-white/10 pl-2 md:pl-4">
                        <button
                            onClick={toggleFullscreen}
                            className="group flex items-center justify-center rounded-full border border-slate-600/50 transition-all duration-300 bg-slate-800/50 hover:bg-slate-700/80 text-slate-400 hover:text-blue-300 p-1.5 md:p-2"
                            title="Toggle Fullscreen"
                        >
                            {isFullscreen ? (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 md:w-5 md:h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5M15 15l5.25 5.25" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 md:w-5 md:h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                                </svg>
                            )}
                        </button>

                        <button
                            onClick={handleHeaderAction}
                            className={`
                          group flex items-center justify-center rounded-full 
                          border transition-all duration-300 shadow-lg backdrop-blur-md p-1.5 md:p-2
                          ${activeTab === 'hangar' || isPendingLaunch
                                    ? 'bg-blue-600 hover:bg-blue-500 border-blue-400 text-white shadow-[0_0_10px_rgba(37,99,235,0.5)]'
                                    : 'bg-green-600 hover:bg-green-500 border-green-400 text-white shadow-[0_0_10px_rgba(34,197,94,0.5)]'}
                        `}
                            title={activeTab === 'hangar' || isPendingLaunch ? "Launch Mission" : "Resume Game"}
                        >
                            {activeTab === 'hangar' || isPendingLaunch ? (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 md:w-5 md:h-5">
                                    <path fillRule="evenodd" d="M12.97 3.97a.75.75 0 011.06 0l7.5 7.5a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 11-1.06-1.06l6.22-6.22H3a.75.75 0 010-1.5h16.19l-6.22-6.22a.75.75 0 010-1.06z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 md:w-5 md:h-5">
                                    <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* MIDDLE CONTENT */}
            <div className="flex-1 relative flex flex-col sm:flex-row overflow-hidden">
                {isSidebarVisible || activeTab === 'hangar' ? (
                    <div className="w-full h-1/2 sm:w-1/2 sm:h-full bg-slate-950/80 backdrop-blur-xl border-t sm:border-t-0 sm:border-r border-white/10 flex flex-col p-6 overflow-y-auto pointer-events-auto shadow-2xl relative z-10 slide-in-from-left-custom">
                        {activeTab === 'multiplayer' && (
                            <MissionTab
                                focusIndex={focusIndex}
                            />
                        )}
                        {activeTab === 'config' && <ConfigTab focusIndex={focusIndex} />}
                        {activeTab === 'hangar' && <SquadronTab />}
                    </div>
                ) : (
                    <div className="w-full h-full pointer-events-none" />
                )}
            </div>

            {/* FOOTER */}
            <div className="bg-slate-950/90 backdrop-blur-xl border-t border-white/10 pointer-events-auto flex-shrink-0 z-50">
                <div className="px-4 py-1.5 md:py-2.5 flex justify-between items-center text-[9px] md:text-[10px] text-slate-500 font-mono uppercase border-b border-slate-800/50">
                    <div className="flex items-center">
                        <LbIcon className="mr-1" /><RbIcon className="mr-1" /> <span className="ml-1">Tab</span>
                        <span className="mx-2">•</span>
                        <StartIcon className="mr-1" /> {activeTab === 'hangar' || isPendingLaunch ? 'Launch' : 'Resume'}
                    </div>

                    {isMissionInProgress ? (
                        <button
                            onClick={() => abortMission()}
                            className="flex items-center text-red-500 hover:text-red-400 transition-colors"
                        >
                            <YIcon className="mr-1 bg-red-500 border-red-700 text-white" /> ABORT MISSION
                        </button>
                    ) : (
                        activeTab === 'hangar' ? (
                            <div className="flex items-center gap-4 hidden md:flex">
                                <div className="flex items-center"><AIcon className="mr-1" /> Select / Ready</div>
                                <div className="flex items-center">Hold <BIcon className="mx-1" /> Drop Out</div>
                            </div>
                        ) : null
                    )}
                </div>

                <SquadronFooter launchError={launchError} />
            </div>
        </div>
    );
};
