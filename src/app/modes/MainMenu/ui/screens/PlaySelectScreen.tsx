import React, { useEffect, useState, useCallback } from 'react';
import { useMainMenuStore, GameModeId } from '../../MainMenuStore';
import { SessionState } from '../../../../../engine/session/SessionState';
import { NetworkManager } from '../../../../../engine/session/NetworkManager';
import { useStore } from '../../../../store/useStore';
import { LobbyInfo } from '../../../../../types';

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
    const setInLobby = useMainMenuStore(state => state.setInLobby);

    // Online state
    const lobbies = useStore(state => state.lobbies);
    const setLobbies = useStore(state => state.setLobbies);
    const setCurrentRoomId = useStore(state => state.setCurrentRoomId);
    // Use global online state
    const isOnline = useStore(state => state.isOnline);

    // Vertical cursor for the lobby list (0 = Create button, 1+ = lobbies)
    const [listIndex, setListIndex] = useState(0);

    const selectedModeData = AVAILABLE_MODES.find(m => m.id === selectedMode);

    // Filter lobbies by selected mode
    const filteredLobbies = selectedMode === 'all'
        ? lobbies
        : lobbies.filter(l => l.mode === selectedMode);

    // Lobby items: Create button first, then actual lobbies
    const lobbyItems: ({ type: 'create' } | { type: 'lobby'; data: LobbyInfo })[] = [
        { type: 'create' },
        ...filteredLobbies.map(l => ({ type: 'lobby' as const, data: l })),
    ];

    // ---- Connect to Platform Services on mount ----
    // ---- Connect to Platform Services (Moved to App.tsx) ----
    // We only listen for screen-specific events here if needed, but lobbies are synced via App.tsx now.
    useEffect(() => {
        if (currentScreen !== 'operations') return;

        // Still need to listen for Join/Create events to switch screens
        const unsubscribeLobbyEvents = NetworkManager.subscribe((event) => {
            switch (event.type) {
                case 'LOBBY_CREATED':
                    NetworkManager.connectGameServer(event.gameServerAddress);
                    setCurrentRoomId(event.roomId);
                    setInLobby(true);
                    setScreen('briefing');
                    break;
                case 'LOBBY_JOINED':
                    NetworkManager.connectGameServer(event.gameServerAddress);
                    setCurrentRoomId(event.roomId);
                    setInLobby(true);
                    setScreen('briefing');
                    break;
            }
        });

        return () => {
            unsubscribeLobbyEvents();
        };
    }, [currentScreen]);

    // ---- Actions ----
    const handleCreate = useCallback(() => {
        const localParty = useStore.getState().localParty;
        const hostName = localParty[0]?.name || 'Unknown Pilot';
        const terrainParams = useStore.getState().terrainParams;
        const terrainSeed = useStore.getState().terrainSeed;

        if (isOnline) {
            // Online: create lobby via platform services
            console.log('[PlaySelect] Creating lobby with terrain config:', { seed: terrainSeed });
            NetworkManager.createLobby({
                name: `${hostName}'s Lobby`,
                hostName,
                mode: selectedMode === 'all' ? 'free_flight' : selectedMode,
                terrainConfig: { seed: terrainSeed, params: terrainParams },
                localPlayerCount: localParty.length,
            });
        } else {
            // Offline: go directly to briefing (local-only)
            console.log('[PlaySelect] Creating local operation:', selectedMode);
            setInLobby(true);
            setScreen('briefing');
        }
    }, [selectedMode, setScreen, setInLobby, isOnline]);

    const handleJoinLobby = useCallback((lobby: LobbyInfo) => {
        const localParty = useStore.getState().localParty;
        const playerName = localParty[0]?.name || 'Unknown Pilot';
        NetworkManager.joinLobby(lobby.id, playerName, localParty.length);
    }, []);

    // --- Input Handling ---
    useEffect(() => {
        if (currentScreen !== 'operations') return;

        const handleInput = (playerId: number, action: string) => {
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
                    const item = lobbyItems[listIndex];
                    if (item?.type === 'create') {
                        handleCreate();
                    } else if (item?.type === 'lobby') {
                        handleJoinLobby(item.data);
                    }
                    break;
                }
            }
        };

        const cleanup = SessionState.onInput(handleInput);
        return () => { cleanup(); };
    }, [currentScreen, selectedMode, setSelectedMode, listIndex, lobbyItems.length, handleCreate, handleJoinLobby]);

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

                {/* Connection status indicator (REMOVED - now in Header) */}
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
                        {isOnline
                            ? (selectedModeData ? selectedModeData.icon + ' Online Lobby' : 'Host a new lobby')
                            : (selectedModeData ? selectedModeData.icon + ' Local Game' : 'Choose a mode and start playing')
                        }
                    </span>
                </div>
            </button>

            {/* LOBBY LIST */}
            <div className="flex-1 min-h-0 flex flex-col gap-3">
                <div className="flex justify-between items-end border-b border-white/10 pb-2">
                    <h3 className="text-white font-bold uppercase tracking-wider text-xs">
                        {selectedModeData ? `${selectedModeData.name} Lobbies` : 'All Lobbies'}
                    </h3>
                    <span className="text-[10px] text-slate-600 font-mono uppercase">
                        {isOnline ? `${filteredLobbies.length} Active` : 'Local Only'}
                    </span>
                </div>

                {filteredLobbies.length > 0 ? (
                    <div className="flex-1 overflow-y-auto flex flex-col gap-2 scrollbar-none">
                        {filteredLobbies.map((lobby, idx) => {
                            const itemIdx = idx + 1; // +1 because Create is index 0
                            const isSelected = listIndex === itemIdx;
                            return (
                                <button
                                    key={lobby.id}
                                    onClick={() => handleJoinLobby(lobby)}
                                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl border transition-all duration-200 text-left ${isSelected
                                        ? 'border-cyan-500/50 bg-cyan-600/10 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                                        : 'border-white/5 bg-white/[0.02] hover:border-cyan-500/30 hover:bg-cyan-600/5'
                                        }`}
                                >
                                    {/* Lobby icon */}
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${isSelected
                                        ? 'bg-cyan-600/30 text-cyan-300'
                                        : 'bg-white/5 text-slate-400'
                                        }`}>
                                        🌐
                                    </div>

                                    {/* Lobby info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-white truncate">{lobby.name}</span>
                                            <span className="text-[10px] font-mono text-slate-500 uppercase shrink-0">{lobby.mode}</span>
                                        </div>
                                        <div className="text-[10px] text-slate-500 font-mono">
                                            Hosted by {lobby.hostName}
                                        </div>
                                    </div>

                                    {/* Player count */}
                                    <div className="flex items-center gap-1 shrink-0">
                                        <span className={`text-sm font-bold ${lobby.playerCount >= lobby.maxPlayers ? 'text-red-400' : 'text-cyan-400'}`}>
                                            {lobby.playerCount}
                                        </span>
                                        <span className="text-[10px] text-slate-600 font-mono">/{lobby.maxPlayers}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    /* Empty State */
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <div className="text-2xl mb-3 opacity-20">📡</div>
                            <div className="text-sm text-slate-500 font-medium">
                                {isOnline ? 'No lobbies found' : 'No lobbies available'}
                            </div>
                            <div className="text-[10px] text-slate-600 mt-1 font-mono">
                                {isOnline
                                    ? 'Create an operation above to get started'
                                    : 'Start platform services to browse online lobbies'
                                }
                            </div>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
};
