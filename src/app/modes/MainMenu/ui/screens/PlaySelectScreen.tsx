import React from 'react';
import { Button } from '../kit/Button';
import { useMainMenuStore } from '../../MainMenuStore';

const GAME_MODES = [
    { id: 'free_flight', name: 'Free Flight', desc: 'No rules. Just fly.', icon: '✈️' },
    { id: 'team_deathmatch', name: 'Team Deathmatch', desc: 'Red vs Blue. 4v4.', icon: '⚔️' },
    { id: 'racing', name: 'Canyon Run', desc: 'High speed checkpoint race.', icon: '🏁' },
];

const MOCK_LOBBIES = [
    { id: '1', name: "Maverick's Room", mode: 'Team Deathmatch', map: 'Archipelago', players: 3, max: 8, ping: 45 },
    { id: '2', name: "Training Day", mode: 'Free Flight', map: 'Ocean', players: 1, max: 4, ping: 12 },
    { id: '3', name: "Dogfight 24/7", mode: 'Team Deathmatch', map: 'Desert', players: 7, max: 8, ping: 88 },
];

export const PlaySelectScreen: React.FC = () => {
    const setScreen = useMainMenuStore(state => state.setScreen);

    const handleCreateLobby = (modeId: string) => {
        console.log("Creating Lobby for", modeId);
        setScreen('briefing'); // Go to Briefing (Lobby)
    };

    const handleJoinLobby = (lobbyId: string) => {
        console.log("Joining Lobby", lobbyId);
        setScreen('briefing'); // Go to Briefing (Lobby)
    };

    return (
        <div className="w-full h-full flex flex-col gap-8 p-4 max-w-6xl mx-auto">
            {/* TOP: CREATE MATCH (Game Modes) */}
            <div className="flex flex-col gap-4">
                <h3 className="text-white font-bold uppercase tracking-wider text-sm border-b border-white/10 pb-2">Create Custom Operation</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {GAME_MODES.map(mode => (
                        <button
                            key={mode.id}
                            onClick={() => handleCreateLobby(mode.id)}
                            className="group relative bg-white/5 border border-white/10 hover:bg-white/10 hover:border-blue-500/50 rounded-xl p-6 text-left transition-all duration-300 hover:scale-[1.02]"
                        >
                            <div className="text-4xl mb-4 grayscale group-hover:grayscale-0 transition-all">{mode.icon}</div>
                            <div className="text-lg font-black text-white uppercase italic">{mode.name}</div>
                            <div className="text-xs text-slate-400 mt-1 font-mono">{mode.desc}</div>

                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[10px] bg-blue-600 text-white px-2 py-1 rounded font-bold uppercase">Create</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* BOTTOM: SERVER BROWSER */}
            <div className="flex-1 min-h-0 flex flex-col gap-4">
                <div className="flex justify-between items-end border-b border-white/10 pb-2">
                    <h3 className="text-white font-bold uppercase tracking-wider text-sm">Live Uplinks</h3>
                    <div className="text-[10px] text-slate-500 font-mono">REFRESHING...</div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                    {MOCK_LOBBIES.map(lobby => (
                        <div
                            key={lobby.id}
                            className="bg-slate-900/40 border border-white/5 p-3 rounded flex items-center justify-between hover:bg-slate-800 transition-colors cursor-pointer group"
                            onClick={() => handleJoinLobby(lobby.id)}
                        >
                            <div className="flex flex-col gap-0.5">
                                <div className="text-sm font-bold text-white group-hover:text-blue-300">{lobby.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono uppercase">
                                    {lobby.mode} • <span className="text-slate-500">{lobby.map}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="text-[10px] font-mono text-slate-400">
                                    {lobby.players}/{lobby.max} <span className="text-slate-600">PILOTS</span>
                                </div>
                                <div className={`text-[10px] font-mono ${lobby.ping < 50 ? 'text-green-500' : 'text-yellow-500'}`}>
                                    {lobby.ping}ms
                                </div>
                                <Button size="sm" variant="secondary" className="opacity-0 group-hover:opacity-100 transition-opacity">JOIN</Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
