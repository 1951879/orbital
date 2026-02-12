import React, { useState } from 'react';
import { Button } from '../kit/Button';
import { Card } from '../kit/Card';
import { useMainMenuStore } from '../../MainMenuStore';
import { useStore } from '../../../../store/useStore';

const MAPS = [
    { id: 'ocean_archipelago', name: 'Archipelago', desc: 'Islands and open water.' },
    { id: 'canyon_run', name: 'Red Canyon', desc: 'Tight turns and tunnels.' },
    { id: 'arctic_tundra', name: 'Frozen Tundra', desc: 'Low visibility snow storms.' },
];

export const LobbyScreen: React.FC = () => {
    const setScreen = useMainMenuStore(state => state.setScreen);
    const localParty = useStore(state => state.localParty);
    const [selectedMap, setSelectedMap] = useState(MAPS[0]);
    const [selectedMode, setSelectedMode] = useState('Team Deathmatch'); // Start with a default

    const handleLaunch = () => {
        console.log("LAUNCHING GAME", { map: selectedMap, mode: selectedMode });
        // Trigger Launch Logic
    };

    return (
        <div className="w-full h-full flex flex-col md:flex-row gap-8 p-4 max-w-7xl mx-auto">

            {/* LEFT: SETTINGS (Host Only) */}
            <div className="w-full md:w-1/3 flex flex-col gap-6">
                {/* Game Mode Selector */}
                <Card title="Mission Type">
                    <select
                        className="w-full bg-black/50 border border-white/10 text-white rounded p-2 focus:border-blue-500 outline-none uppercase font-bold"
                        value={selectedMode}
                        onChange={(e) => setSelectedMode(e.target.value)}
                    >
                        <option>Team Deathmatch</option>
                        <option>Free Flight</option>
                        <option>Canyon Run</option>
                        <option>Capture The Flag</option>
                    </select>
                    <div className="mt-2 text-xs text-slate-400">
                        Host can change this at any time.
                    </div>
                </Card>

                {/* Map Selector */}
                <Card title="Theatre of Operation">
                    <div className="flex flex-col gap-2">
                        {MAPS.map(map => (
                            <button
                                key={map.id}
                                onClick={() => setSelectedMap(map)}
                                className={`text-left p-3 rounded border transition-all ${selectedMap.id === map.id ? 'bg-blue-600 border-blue-400 text-white' : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10'}`}
                            >
                                <div className="font-bold uppercase text-xs">{map.name}</div>
                                <div className="text-[10px] opacity-70">{map.desc}</div>
                            </button>
                        ))}
                    </div>
                </Card>

                <Card title="Rules of Engagement">
                    <div className="flex flex-col gap-2 text-xs uppercase text-slate-400">
                        <div className="flex justify-between">
                            <span>Time Limit</span>
                            <span className="text-white">10:00</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Score Limit</span>
                            <span className="text-white">30 Kills</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Respawn Delay</span>
                            <span className="text-white">5s</span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* RIGHT: ROSTER / CHAT */}
            <div className="flex-1 flex flex-col gap-4">
                <Card title="Squad Roster" className="flex-1" noPadding>
                    <div className="p-4 grid grid-cols-1 gap-2">
                        {localParty.map((p, i) => (
                            <div key={i} className="flex items-center gap-4 bg-white/5 p-2 rounded">
                                <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center font-bold text-xs">
                                    P{p.id + 1}
                                </div>
                                <div className="flex-1">
                                    <div className="text-xs font-bold text-white uppercase" style={{ color: p.color }}>{p.name}</div>
                                    <div className="text-[9px] text-slate-400 uppercase">{p.airplane}</div>
                                </div>
                                <div className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded uppercase font-bold">
                                    READY
                                </div>
                            </div>
                        ))}
                        {/* Empty Slots */}
                        {[...Array(Math.max(0, 8 - localParty.length))].map((_, i) => (
                            <div key={`empty-${i}`} className="flex items-center gap-4 border border-dashed border-white/5 p-2 rounded opacity-50">
                                <div className="w-8 h-8 rounded bg-transparent border border-white/10" />
                                <div className="text-xs text-slate-600 uppercase italic">Waiting for connection...</div>
                            </div>
                        ))}
                    </div>
                </Card>

                <Button
                    size="lg"
                    onClick={handleLaunch}
                    className="bg-orange-600 border-orange-400 hover:bg-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.4)]"
                >
                    LAUNCH MISSION
                </Button>
            </div>

        </div>
    );
};
