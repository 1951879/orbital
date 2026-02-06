import React, { useMemo, useState } from 'react';
import { useStore } from '../../../store/useStore';
import { PRESETS } from './data';
import { useSocketActions } from '../../../../hooks/useNetworkSync';

interface Props {
    focusIndex: number;
}

interface CardProps {
    active: boolean;
    focused: boolean;
    children: React.ReactNode;
    colorClass: string;
    onClick?: () => void;
    className?: string;
    disabled?: boolean;
}

const Card: React.FC<CardProps> = ({
    active,
    focused,
    children,
    colorClass,
    onClick,
    className = "",
    disabled = false
}) => (
    <div
        onClick={!disabled ? onClick : undefined}
        className={`
            relative p-3 rounded-xl border-2 transition-all duration-200 flex flex-col justify-between overflow-hidden
            ${disabled ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer'}
            ${active
                ? `${colorClass} bg-opacity-20 border-opacity-100 shadow-[0_0_20px_rgba(255,255,255,0.15)]`
                : 'bg-slate-900/40 border-slate-700/50'
            }
            ${focused
                ? 'scale-[1.02] border-white/90 shadow-2xl z-10 ring-1 ring-white/30 bg-slate-800/80'
                : (active ? '' : 'hover:bg-slate-800/60 hover:border-slate-600')
            }
            ${className}
        `}
    >
        {active && <div className={`absolute inset-0 bg-gradient-to-br ${colorClass} opacity-10 pointer-events-none`} />}
        {children}
    </div>
);

export const MissionTab: React.FC<Props> = ({ focusIndex }) => {
    // Global State
    const mission = useStore((state) => state.mission);
    const setMission = useStore((state) => state.setMission);

    const localParty = useStore((state) => state.localParty);
    const terrainParams = useStore((state) => state.terrainParams);
    const setTerrainParam = useStore((state) => state.setTerrainParam);
    const generateNewTerrain = useStore((state) => state.generateNewTerrain);

    // Configuration State
    const splitDirection = useStore((state) => state.splitDirection);
    const setSplitDirection = useStore((state) => state.setSplitDirection);
    const invertPlayer2 = useStore((state) => state.invertPlayer2);
    const setInvertPlayer2 = useStore((state) => state.setInvertPlayer2);

    // Online State
    const isMultiplayerEnabled = useStore((state) => state.isMultiplayerEnabled);
    const setMultiplayerEnabled = useStore((state) => state.setMultiplayerEnabled);
    const socketStatus = useStore((state) => state.socketStatus);
    const lobbies = useStore((state) => state.lobbies);
    const currentRoomId = useStore((state) => state.currentRoomId);
    const { joinRoom, leaveRoom } = useSocketActions();

    const playerCount = localParty.length;
    const hasSplitScreen = playerCount >= 2;

    const handleSetMission = (type: 'free') => {
        setMission('free');
    };

    const applyPreset = (p: typeof PRESETS[0]) => {
        Object.entries(p.params).forEach(([k, v]) => {
            setTerrainParam(k as any, v as number);
        });
        generateNewTerrain();
    };

    const toggleSplit = () => setSplitDirection(splitDirection === 'horizontal' ? 'vertical' : 'horizontal');
    const toggleInvert = () => setInvertPlayer2(!invertPlayer2);
    const toggleOnline = () => setMultiplayerEnabled(!isMultiplayerEnabled);

    return (
        <div className="flex flex-col gap-4 p-4 max-w-6xl mx-auto w-full animate-in fade-in slide-in-from-left-4 duration-300">

            {/* ROW 1: SYSTEM CONTROLS (Indices 0, 1, 2) */}
            <div>
                <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">System Config</h2>
                <div className="grid grid-cols-3 gap-4 h-24">

                    {/* 0: VIEW SPLIT */}
                    <Card
                        active={splitDirection === 'horizontal'}
                        focused={focusIndex === 0}
                        colorClass="bg-indigo-500 border-indigo-500"
                        onClick={toggleSplit}
                        disabled={!hasSplitScreen}
                    >
                        <div className="flex justify-between items-start">
                            <span className="text-[10px] font-bold uppercase text-slate-300">Layout</span>
                            <div className={`p-1 rounded border ${splitDirection === 'horizontal' ? 'border-indigo-400 bg-indigo-500/20' : 'border-slate-600'}`}>
                                {splitDirection === 'horizontal'
                                    ? <div className="flex flex-col gap-0.5"><div className="w-4 h-1.5 bg-current rounded-[1px]" /><div className="w-4 h-1.5 bg-current rounded-[1px]" /></div>
                                    : <div className="flex gap-0.5"><div className="w-1.5 h-4 bg-current rounded-[1px]" /><div className="w-1.5 h-4 bg-current rounded-[1px]" /></div>
                                }
                            </div>
                        </div>
                        <div className="text-lg font-black text-white uppercase tracking-wider">
                            {splitDirection === 'horizontal' ? 'H-Split' : 'V-Split'}
                        </div>
                    </Card>

                    {/* 1: INVERT VISOR */}
                    <Card
                        active={invertPlayer2}
                        focused={focusIndex === 1}
                        colorClass="bg-violet-500 border-violet-500"
                        onClick={toggleInvert}
                        disabled={!hasSplitScreen}
                    >
                        <div className="flex justify-between items-start">
                            <span className="text-[10px] font-bold uppercase text-slate-300">Visor P2</span>
                            <div className={`w-6 h-3 rounded-full relative transition-colors ${invertPlayer2 ? 'bg-violet-500' : 'bg-slate-700'}`}>
                                <div className={`absolute top-0.5 w-2 h-2 bg-white rounded-full transition-transform ${invertPlayer2 ? 'left-3.5' : 'left-0.5'}`} />
                            </div>
                        </div>
                        <div className="text-lg font-black text-white uppercase tracking-wider">
                            {invertPlayer2 ? 'Inverted' : 'Standard'}
                        </div>
                    </Card>

                    {/* 2: ONLINE UPLINK */}
                    <Card
                        active={isMultiplayerEnabled}
                        focused={focusIndex === 2}
                        colorClass="bg-emerald-500 border-emerald-500"
                        onClick={toggleOnline}
                    >
                        <div className="flex justify-between items-start">
                            <span className="text-[10px] font-bold uppercase text-slate-300">Uplink</span>
                            <div className={`w-6 h-3 rounded-full relative transition-colors ${isMultiplayerEnabled ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                                <div className={`absolute top-0.5 w-2 h-2 bg-white rounded-full transition-transform ${isMultiplayerEnabled ? 'left-3.5' : 'left-0.5'}`} />
                            </div>
                        </div>
                        <div className="flex justify-between items-end">
                            <div className="text-lg font-black text-white uppercase tracking-wider">
                                {isMultiplayerEnabled ? 'Online' : 'Offline'}
                            </div>
                            <div className={`text-[9px] font-mono font-bold ${socketStatus === 'connected' ? 'text-emerald-300' : 'text-slate-500'}`}>
                                {socketStatus === 'connected' ? 'CONNECTED' : (isMultiplayerEnabled ? 'SEARCHING...' : 'DISABLED')}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* LOBBY LIST (Conditional) */}
            {isMultiplayerEnabled && (
                <div className="bg-slate-900/40 border border-slate-700/50 rounded-xl p-3 animate-in fade-in slide-in-from-top-2">
                    <h3 className="text-[9px] font-bold uppercase text-emerald-500 mb-2">Available Planets</h3>
                    {lobbies.length === 0 ? (
                        <div className="text-center text-[10px] text-slate-600 py-2 italic">No signals detected...</div>
                    ) : (
                        <div className="grid grid-cols-2 gap-2">
                            {lobbies.map(lobby => {
                                const isCurrent = currentRoomId === lobby.id;
                                return (
                                    <button
                                        key={lobby.id}
                                        onClick={() => isCurrent ? leaveRoom() : joinRoom(lobby.id)}
                                        className={`
                                      flex justify-between items-center p-2 rounded border text-left transition-all
                                      ${isCurrent ? 'bg-emerald-900/30 border-emerald-500/50' : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800'}
                                  `}
                                    >
                                        <div>
                                            <div className={`text-[10px] font-bold uppercase ${isCurrent ? 'text-white' : 'text-slate-300'}`}>{lobby.name}</div>
                                            <div className="text-[8px] text-slate-500">{lobby.playerCount}/{lobby.maxPlayers} Pilots</div>
                                        </div>
                                        {isCurrent && <div className="text-[8px] font-bold text-emerald-400 uppercase">Active</div>}
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            <div className="w-full h-px bg-slate-800/50 my-1" />

            {/* ROW 2: MISSION PROTOCOLS (Index 3) */}
            <div>
                <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Protocol</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-32">
                    {/* 3: FREE FLIGHT */}
                    <Card
                        active={mission === 'free'}
                        focused={focusIndex === 3}
                        colorClass="bg-blue-500 border-blue-500"
                        onClick={() => handleSetMission('free')}
                    >
                        <div>
                            <div className={`text-[10px] font-bold uppercase mb-1 ${mission !== 'free' ? 'text-blue-300' : 'text-slate-400'}`}>Standard</div>
                            <div className="text-xl font-black text-white uppercase tracking-wider">Free Flight</div>
                        </div>
                        <div className="text-[9px] text-slate-400 font-mono">// UNRESTRICTED</div>
                    </Card>
                </div>
            </div>

            {/* ROW 3: SECTORS (Indices 4, 5, 6, 7) */}
            <div className="flex-1">
                <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Sector</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {PRESETS.map((p, i) => {
                        const idx = i + 4; // Shifted from 7 to 4
                        const isSelected = p.params.planetRadius === terrainParams.planetRadius;
                        const isFocused = focusIndex === idx;

                        return (
                            <Card
                                key={p.name}
                                active={isSelected}
                                focused={isFocused}
                                colorClass="bg-amber-500 border-amber-500"
                                onClick={() => applyPreset(p)}
                                className="h-24"
                            >
                                <div className="flex flex-col h-full justify-between">
                                    <div className="flex justify-between items-start">
                                        <span className={`text-xs font-bold uppercase ${isSelected ? 'text-white' : 'text-slate-300'}`}>{p.name}</span>
                                        <span className="text-[8px] font-mono text-amber-400 bg-amber-900/30 px-1.5 py-0.5 rounded">{p.params.planetRadius}u</span>
                                    </div>
                                    <p className="text-[9px] text-slate-500 leading-tight">{p.desc}</p>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
