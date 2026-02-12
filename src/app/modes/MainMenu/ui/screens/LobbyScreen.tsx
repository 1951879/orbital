import React from 'react';
import { View, PerspectiveCamera, OrbitControls } from '@react-three/drei';
import { useStore } from '../../../../store/useStore';
import { useMainMenuStore } from '../../MainMenuStore';
import { BlueprintSphere } from '../../../../core/env/BlueprintSphere';
import { SunLight } from '../../../../core/env/SunLight';
import { Card } from '../kit/Card';
import { TerrainParams } from '../../../../../types';

// --- PLANET PREVIEW (R3F View) ---
const PlanetPreview: React.FC = () => {
    const planetRadius = useStore(state => state.terrainParams.planetRadius);
    const camDist = planetRadius * 3;

    return (
        <View className="absolute inset-0">
            <PerspectiveCamera makeDefault position={[0, camDist * 0.3, camDist]} fov={45} />
            <OrbitControls
                enablePan={false}
                enableZoom={true}
                minDistance={planetRadius * 1.5}
                maxDistance={planetRadius * 6}
                autoRotate
                autoRotateSpeed={0.5}
            />
            <BlueprintSphere />
            <SunLight />
        </View>
    );
};

// --- TERRAIN SLIDER ---
const TerrainSlider: React.FC<{
    label: string;
    paramKey: keyof TerrainParams;
    min: number;
    max: number;
    step: number;
}> = ({ label, paramKey, min, max, step }) => {
    const value = useStore(state => state.terrainParams[paramKey]);
    const setParam = useStore(state => state.setTerrainParam);

    return (
        <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider w-28 shrink-0">
                {label}
            </span>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={e => setParam(paramKey, parseFloat(e.target.value))}
                className="flex-1 h-1 accent-blue-500 bg-white/10 rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-400
                    [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(59,130,246,0.4)]"
            />
            <span className="text-[10px] font-mono text-slate-500 w-10 text-right">
                {typeof value === 'number' ? value.toFixed(value >= 10 ? 0 : 1) : value}
            </span>
        </div>
    );
};

// --- MAIN COMPONENT ---
export const LobbyScreen: React.FC = () => {
    const localParty = useStore(state => state.localParty);
    const setMission = useStore(state => state.setMission);
    const setIsPaused = useStore(state => state.setIsPaused);
    const generateNewTerrain = useStore(state => state.generateNewTerrain);
    const terrainSeed = useStore(state => state.terrainSeed);
    const selectedMode = useMainMenuStore(state => state.selectedModeFilter);

    const modeName = selectedMode === 'free_flight' ? 'Free Flight' : 'Free Flight'; // Only mode for now

    const handleLaunch = () => {
        console.log('[LobbyScreen] Launching sortie:', selectedMode);
        setMission('free');
        setIsPaused(false);
    };

    return (
        <div className="w-full h-full flex gap-4 p-4 max-w-7xl mx-auto">

            {/* LEFT COLUMN: Flight Manifest + Mission Brief */}
            <div className="w-2/5 max-w-[320px] flex flex-col gap-4 shrink-0">

                {/* FLIGHT MANIFEST */}
                <Card title="✈ FLIGHT MANIFEST" variant="dark" className="flex-1" noPadding>
                    <div className="flex flex-col gap-1 p-3">
                        {[0, 1, 2, 3].map(slotIdx => {
                            const pilot = localParty.find(p => p.id === slotIdx);
                            if (pilot) {
                                const isReady = pilot.ui.status === 'ready';
                                return (
                                    <div
                                        key={slotIdx}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all ${isReady
                                            ? 'bg-green-900/20 border-green-500/30'
                                            : 'bg-white/5 border-white/5'
                                            }`}
                                    >
                                        {/* Color dot */}
                                        <div
                                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-lg"
                                            style={{ backgroundColor: pilot.color, boxShadow: `0 0 8px ${pilot.color}40` }}
                                        />
                                        {/* Name + plane */}
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-bold text-white uppercase tracking-wider truncate">
                                                {pilot.name}
                                            </div>
                                            <div className="text-[9px] font-mono text-slate-500 uppercase">
                                                {pilot.airplane}
                                            </div>
                                        </div>
                                        {/* Ready indicator */}
                                        <div className={`text-[8px] font-bold uppercase tracking-widest ${isReady ? 'text-green-400' : 'text-slate-600'
                                            }`}>
                                            {isReady ? 'RDY' : 'STBY'}
                                        </div>
                                    </div>
                                );
                            }
                            // Empty slot
                            return (
                                <div
                                    key={slotIdx}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-dashed border-white/5 bg-transparent"
                                >
                                    <div className="w-2.5 h-2.5 rounded-full bg-white/10 shrink-0" />
                                    <span className="text-[10px] font-mono text-slate-700 uppercase">
                                        Empty Slot
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </Card>

                {/* MISSION BRIEF */}
                <Card title="📋 MISSION BRIEF" variant="dark" noPadding>
                    <div className="p-3 space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-mono text-slate-500 uppercase">Sortie Type</span>
                            <span className="text-xs font-bold text-white uppercase tracking-wider">{modeName}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-mono text-slate-500 uppercase">Objectives</span>
                            <span className="text-[10px] font-mono text-slate-400">None — Free Ops</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-mono text-slate-500 uppercase">Rules of Engagement</span>
                            <span className="text-[10px] font-mono text-slate-400">Unrestricted</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-mono text-slate-500 uppercase">Time Limit</span>
                            <span className="text-[10px] font-mono text-slate-400">Unlimited</span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* RIGHT COLUMN: AO + Controls + Launch */}
            <div className="flex-1 flex flex-col gap-4 min-w-0">

                {/* AREA OF OPERATIONS — 3D Planet Preview */}
                <div className="flex-1 rounded-xl border border-white/10 relative overflow-hidden min-h-[300px]">
                    {/* Section label */}
                    <div className="absolute top-0 left-0 right-0 z-10 px-4 py-2 bg-gradient-to-b from-black/60 to-transparent">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            🌍 Area of Operations
                        </span>
                    </div>
                    <PlanetPreview />
                </div>

                {/* TERRAIN CONFIG */}
                <Card variant="glass" noPadding>
                    <div className="px-4 py-3 space-y-2.5">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Terrain Parameters</span>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-mono text-slate-600">SEED: {terrainSeed}</span>
                                <button
                                    onClick={generateNewTerrain}
                                    className="text-[10px] px-2 py-0.5 rounded border border-white/10 text-slate-400
                                        hover:text-white hover:border-blue-500/50 hover:bg-blue-600/10 transition-all"
                                    title="Randomize Terrain"
                                >
                                    🔄
                                </button>
                            </div>
                        </div>
                        <TerrainSlider label="Planet Size" paramKey="planetRadius" min={5} max={100} step={1} />
                        <TerrainSlider label="Mountains" paramKey="mountainScale" min={0} max={2} step={0.1} />
                        <TerrainSlider label="Water Level" paramKey="waterLevel" min={0} max={1} step={0.05} />
                        <TerrainSlider label="Mtn Frequency" paramKey="mountainFrequency" min={0.1} max={5} step={0.1} />
                    </div>
                </Card>

                {/* LAUNCH BUTTON */}
                <button
                    onClick={handleLaunch}
                    className="w-full py-4 rounded-xl font-black text-lg uppercase tracking-[0.2em] transition-all duration-300
                        bg-gradient-to-r from-blue-600 to-blue-500 text-white
                        hover:from-blue-500 hover:to-blue-400 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]
                        active:scale-[0.98]"
                >
                    Launch
                </button>
            </div>

        </div>
    );
};
