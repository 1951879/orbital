import React from 'react';
import { NetworkManager } from '../../../../../engine/session/NetworkManager';
import { useMainMenuStore } from '../../MainMenuStore';
import { useStore } from '../../../../store/useStore';
import { PRESETS } from '../../../../components/ui/tabs/data';
import { PresetCard } from '../kit/PresetCard';
import { TerrainParams } from '../../../../../types';

interface TerrainPanelProps {
    focusedItem: number;
    showFocus: boolean;
    isHost: boolean;
}

export const TerrainPanel: React.FC<TerrainPanelProps> = ({ focusedItem, showFocus, isHost }) => {
    const terrainParams = useStore(state => state.terrainParams);
    const setTerrainParam = useStore(state => state.setTerrainParam);
    const generateNewTerrain = useStore(state => state.generateNewTerrain);
    const terrainSeed = useStore(state => state.terrainSeed);

    // Check if we are in a lobby
    const inLobby = useMainMenuStore(state => state.inLobby);

    const sendUpdate = (newSeed: number, newParams: TerrainParams) => {
        if (!inLobby) return;

        const lobbyId = useStore.getState().currentRoomId;

        if (lobbyId) {
            NetworkManager.updateLobbySettings(lobbyId, { seed: newSeed, params: newParams });
            // Also update the active Game Room (so connected clients see it immediately)
            NetworkManager.updateRoomConfig({ seed: newSeed, terrainParams: newParams });
        }
    };

    const applyPreset = (p: typeof PRESETS[0]) => {
        if (!isHost) return;

        // Merge current params with preset params to ensure full TerrainParams
        const newParams: TerrainParams = {
            ...terrainParams,
            ...p.params
        };

        // Local update
        Object.entries(p.params).forEach(([k, v]) => {
            setTerrainParam(k as keyof TerrainParams, v as number);
        });
        const newSeed = Math.floor(Math.random() * 100000);
        useStore.getState().setTerrainConfig(newSeed, newParams);

        // Network
        sendUpdate(newSeed, newParams);
    };

    const handleRandomize = () => {
        if (!isHost) return;
        const newSeed = Math.floor(Math.random() * 100000);
        useStore.getState().setTerrainConfig(newSeed, terrainParams);
        sendUpdate(newSeed, terrainParams);
    };

    // Check which preset is currently active (match on planetRadius)
    const activePresetIdx = PRESETS.findIndex(p =>
        p.params.planetRadius === terrainParams.planetRadius
    );

    return (
        <div className={`flex flex-col h-full p-3 gap-3 ${!isHost ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
            {!isHost && (
                <div className="absolute inset-0 z-10 flex items-center justify-center">
                    <span className="bg-black/80 text-white text-xs px-2 py-1 rounded border border-white/20">
                        Host Control Only
                    </span>
                </div>
            )}

            {/* Preset List (1-column stack) */}
            <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
                {PRESETS.map((preset, i) => (
                    <PresetCard
                        key={preset.name}
                        name={preset.name}
                        desc={preset.desc}
                        badge={`${preset.params.planetRadius}u`}
                        active={i === activePresetIdx}
                        focused={showFocus && focusedItem === i}
                        onClick={() => applyPreset(preset)}
                    />
                ))}
            </div>

            {/* Seed info + Randomize (bottom) */}
            <div className="flex items-center justify-between pt-1 border-t border-white/5">
                <span className="text-[9px] font-mono text-slate-600 uppercase">Seed: {terrainSeed}</span>
                <button
                    onClick={handleRandomize}
                    disabled={!isHost}
                    className={`text-[10px] px-2 py-0.5 rounded border transition-all ${showFocus && focusedItem === PRESETS.length
                        ? 'border-blue-500/50 text-blue-300 bg-blue-600/10'
                        : 'border-white/10 text-slate-400 hover:text-white hover:border-blue-500/50 hover:bg-blue-600/10'
                        }`}
                    title="Randomize Terrain"
                >
                    🔄 Randomize
                </button>
            </div>
        </div>
    );
};
