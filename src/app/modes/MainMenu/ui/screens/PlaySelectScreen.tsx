import React, { useEffect, useState, useCallback } from 'react';
import { useMainMenuStore, GameModeId } from '../../MainMenuStore';
import { SessionState } from '../../../../../engine/session/SessionState';

// --- Mode Registry ---
// Each entry describes a gameplay mode available for lobby creation/filtering.
// `missionKey` maps to MODES keys in App.tsx for launching.
const AVAILABLE_MODES: { id: GameModeId; name: string; icon: string; missionKey: string }[] = [
    { id: 'free_flight', name: 'Free Flight', icon: '✈️', missionKey: 'free' },
    // Future modes go here:
    // { id: 'tdm', name: 'Team Deathmatch', icon: '⚔️', missionKey: 'tdm' },
    // { id: 'racing', name: 'Canyon Run', icon: '🏁', missionKey: 'racing' },
];

// Full tab list: 'all' + each mode
const MODE_TABS: GameModeId[] = ['all', ...AVAILABLE_MODES.map(m => m.id)];

export const PlaySelectScreen: React.FC = () => {
    const currentScreen = useMainMenuStore(state => state.currentScreen);
    const setScreen = useMainMenuStore(state => state.setScreen);
    const selectedMode = useMainMenuStore(state => state.selectedModeFilter);
    const setSelectedMode = useMainMenuStore(state => state.setSelectedModeFilter);

    // Vertical cursor for the lobby list (0 = Create button, 1+ = lobbies)
    const [listIndex, setListIndex] = useState(0);

    const selectedModeData = AVAILABLE_MODES.find(m => m.id === selectedMode);

    // Lobby items: Create button is always first, future lobbies follow
    // For now, only the Create button exists
    const lobbyItems = [{ type: 'create' as const }];
    // Future: append actual lobbies here
    // e.g. ...filteredLobbies.map(l => ({ type: 'lobby', data: l }))

    const handleCreate = useCallback(() => {
        console.log('[PlaySelect] Creating operation:', selectedMode);
        setScreen('briefing');
    }, [selectedMode, setScreen]);

    // --- Input Handling ---
    useEffect(() => {
        // Only handle input when this screen is active
        if (currentScreen !== 'operations') return;

        const handleInput = (playerId: number, action: string) => {
            // Only host (P0) navigates
            if (playerId !== 0) return;

            switch (action) {
                case 'NAV_LEFT': {
                    const currentIdx = MODE_TABS.indexOf(selectedMode);
                    const prevIdx = (currentIdx - 1 + MODE_TABS.length) % MODE_TABS.length;
                    setSelectedMode(MODE_TABS[prevIdx]);
                    break;
                }
                case 'NAV_RIGHT': {
                    const currentIdx = MODE_TABS.indexOf(selectedMode);
                    const nextIdx = (currentIdx + 1) % MODE_TABS.length;
                    setSelectedMode(MODE_TABS[nextIdx]);
                    break;
                }
                case 'NAV_UP': {
                    setListIndex(prev => (prev - 1 + lobbyItems.length) % lobbyItems.length);
                    break;
                }
                case 'NAV_DOWN': {
                    setListIndex(prev => (prev + 1) % lobbyItems.length);
                    break;
                }
                case 'SELECT': {
                    // Activate the focused list item
                    const item = lobbyItems[listIndex];
                    if (item?.type === 'create') {
                        handleCreate();
                    }
                    // Future: if item.type === 'lobby', join that lobby
                    break;
                }
            }
        };

        const cleanup = SessionState.onInput(handleInput);
        return () => { cleanup(); };
    }, [currentScreen, selectedMode, setSelectedMode, listIndex, lobbyItems.length, handleCreate]);

    return (
        <div className="w-full h-full flex flex-col gap-6 p-4 max-w-5xl mx-auto">

            {/* MODE TAB BAR */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
                {/* "ALL" tab */}
                <button
                    onClick={() => setSelectedMode('all')}
                    className={`shrink-0 flex items-center px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 border leading-[1.5rem] ${selectedMode === 'all'
                        ? 'bg-white/10 text-white border-white/20 shadow-[0_0_10px_rgba(255,255,255,0.1)]'
                        : 'bg-transparent text-slate-500 border-transparent hover:text-slate-300 hover:bg-white/5'
                        }`}
                >
                    ALL
                </button>

                {/* Separator */}
                <div className="w-px h-6 bg-white/10 shrink-0" />

                {/* Mode tabs */}
                {AVAILABLE_MODES.map(mode => (
                    <button
                        key={mode.id}
                        onClick={() => setSelectedMode(mode.id)}
                        className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 border ${selectedMode === mode.id
                            ? 'bg-blue-600/20 text-blue-300 border-blue-500/40 shadow-[0_0_12px_rgba(59,130,246,0.2)]'
                            : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-white hover:border-white/10'
                            }`}
                    >
                        <span className={`text-base ${selectedMode === mode.id ? '' : 'grayscale opacity-60'} transition-all`}>
                            {mode.icon}
                        </span>
                        {mode.name}
                    </button>
                ))}
            </div>

            {/* CREATE OPERATION BUTTON */}
            <button
                onClick={handleCreate}
                className={`group w-full flex items-center gap-3 px-5 py-4 rounded-xl border transition-all duration-300 ${listIndex === 0
                        ? 'border-blue-500/50 bg-blue-600/10 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                        : 'border-dashed border-white/10 bg-white/[0.02] hover:border-blue-500/50 hover:bg-blue-600/10'
                    }`}
            >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all ${listIndex === 0
                        ? 'bg-blue-600/40 text-blue-300'
                        : 'bg-blue-600/20 text-blue-400 group-hover:bg-blue-600/40'
                    }`}>
                    +
                </div>
                <div className="flex flex-col text-left">
                    <span className="text-sm font-black text-white uppercase tracking-wide">
                        {selectedModeData
                            ? `Create ${selectedModeData.name} Operation`
                            : 'Create Operation'
                        }
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                        {selectedModeData
                            ? selectedModeData.icon + ' Local Game'
                            : 'Choose a mode and start playing'
                        }
                    </span>
                </div>
            </button>

            {/* LOBBY LIST (empty for now) */}
            <div className="flex-1 min-h-0 flex flex-col gap-3">
                <div className="flex justify-between items-end border-b border-white/10 pb-2">
                    <h3 className="text-white font-bold uppercase tracking-wider text-xs">
                        {selectedModeData ? `${selectedModeData.name} Lobbies` : 'All Lobbies'}
                    </h3>
                    <span className="text-[10px] text-slate-600 font-mono uppercase">Local Only</span>
                </div>

                {/* Empty State */}
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-2xl mb-3 opacity-20">📡</div>
                        <div className="text-sm text-slate-500 font-medium">No lobbies found</div>
                        <div className="text-[10px] text-slate-600 mt-1 font-mono">Create an operation above to get started</div>
                    </div>
                </div>
            </div>

        </div>
    );
};
