import React, { useMemo, useCallback } from 'react';
import { View, PerspectiveCamera } from '@react-three/drei';

import { useStore } from '../../../../store/useStore';
import { useMainMenuStore, LOBBY_PANELS } from '../../MainMenuStore';
import { BlueprintSphere } from '../../../../core/env/BlueprintSphere';
import { SunLight } from '../../../../core/env/SunLight';
import { useLayoutMode } from '../../hooks/useLayoutMode';
import { OrbitCamera } from '../../../../core/cameras/OrbitCamera';
import { useLobbyInput, LobbyPanelDescriptor } from '../../hooks/useLobbyInput';
import { Card } from '../kit/Card';
import { CarouselIndicator } from '../kit/CarouselIndicator';
import { RosterPanel } from '../panels/RosterPanel';
import { MissionPanel } from '../panels/MissionPanel';
import { TerrainPanel } from '../panels/TerrainPanel';
import { SessionState } from '../../../../../engine/session/SessionState';
import { useHostHints } from '../../../../core/hooks/useInputHints';
import { PRESETS } from '../../../../components/ui/tabs/data';
import { TerrainParams } from '../../../../../types';
import { NetworkManager } from '../../../../../engine/session/NetworkManager';

// ─── PANEL LABEL REGISTRY ────────────────────────────────────────────────────

const PANEL_LABELS = [
    { id: 'roster', label: 'ROSTER' },
    { id: 'mission', label: 'MISSION' },
    { id: 'terrain', label: 'AO PRESETS' },
] as const;

const PANEL_TITLES: Record<string, string> = {
    roster: '✈ ROSTER',
    mission: '📋 MISSION',
    terrain: '🌍 AO PRESETS',
};

// ─── PLANET PREVIEW ──────────────────────────────────────────────────────────

const PREVIEW_FOV = 45;

const PlanetPreview: React.FC = () => {
    const planetRadius = useStore(state => state.terrainParams.planetRadius);
    const initDist = planetRadius * 6;

    return (
        <View className="absolute inset-0">
            <PerspectiveCamera makeDefault position={[0, initDist * 0.3, initDist]} fov={PREVIEW_FOV} />
            <OrbitCamera
                autoRotate
                autoRotateSpeed={0.05}
                minDistance={planetRadius * 1.7}
                maxDistance={planetRadius * 8}
            />
            <BlueprintSphere />
            <SunLight />
        </View>
    );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export const LobbyScreen: React.FC = () => {
    const { mode: layoutMode, orientation } = useLayoutMode();
    const localParty = useStore(state => state.localParty);
    const setTerrainParam = useStore(state => state.setTerrainParam);
    const generateNewTerrain = useStore(state => state.generateNewTerrain);
    const openRosterMenu = useMainMenuStore(state => state.openRosterMenu);
    const hostHints = useHostHints();

    const isHost = localParty.some(p => p.id === 0);
    const inLobby = useMainMenuStore(state => state.inLobby);

    // ─── Auto-Join Game Room (Briefing Phase) ───────────────
    React.useEffect(() => {
        const onGameConnected = () => {
            const store = useStore.getState();
            // Pass the entire local party, not just the first pilot
            const localParty = store.localParty;
            const room = store.currentRoomId;
            if (room && localParty.length > 0) {
                console.log('[LobbyScreen] Joining Game Room:', room, 'with party:', localParty);
                NetworkManager.joinGameRoom(room, localParty);
            }
        };

        if (NetworkManager.isGameConnected) {
            onGameConnected();
        }

        const unsub = NetworkManager.subscribe(e => {
            if (e.type === 'GAME_CONNECTED') onGameConnected();
        });
        return () => { unsub(); };
    }, []);

    // ─── Panel descriptors (O/C: each panel declares its own behavior) ──
    const panelDescriptors: LobbyPanelDescriptor[] = useMemo(() => [
        {
            id: 'roster',
            maxItems: localParty.length || 1,
            onActivate: (itemIndex: number) => {
                // Do nothing. Roster actions are handled by the card's internal tray.
            },
            onContext: (itemIndex: number) => {
                const slotId = localParty[itemIndex]?.id;
                if (slotId !== undefined) {
                    useMainMenuStore.getState().setOpenRosterMenu(slotId);
                }
            },
            onTrayAction: (itemIndex: number, actionIndex: number) => {
                const slotId = localParty[itemIndex]?.id;
                if (slotId === undefined) return;

                const isHostSlot = slotId === 0;

                if (isHostSlot) {
                    // Resign
                    console.log(`[Roster] Resign Host`);
                    // TODO: Implement Resign
                    useMainMenuStore.getState().setOpenRosterMenu(null);
                } else {
                    if (actionIndex === 0) {
                        // Ring
                        console.log(`[Roster] Ring player ${slotId}`);
                        useMainMenuStore.getState().setOpenRosterMenu(null);
                    } else if (actionIndex === 1) {
                        // Make Host
                        console.log(`[Roster] Transfer host to player ${slotId}`);
                        useMainMenuStore.getState().setOpenRosterMenu(null);
                    } else if (actionIndex === 2) {
                        // Kick (Only valid if host)
                        if (isHost) {
                            SessionState.removePlayer(slotId);
                            useMainMenuStore.getState().setOpenRosterMenu(null);
                        }
                    }
                }
            }
        },

        {
            id: 'mission',
            maxItems: 0,
            onActivate: () => { },
        },
        {
            id: 'terrain',
            maxItems: PRESETS.length + 1,
            onActivate: (itemIndex: number) => {
                if (itemIndex < PRESETS.length) {
                    const preset = PRESETS[itemIndex];
                    Object.entries(preset.params).forEach(([k, v]) => {
                        setTerrainParam(k as keyof TerrainParams, v as number);
                    });
                    generateNewTerrain();
                } else {
                    generateNewTerrain();
                }
            },
        },
    ], [isHost, localParty, setTerrainParam, generateNewTerrain]);

    // ─── Hook: navigation, focus, carousel ──────────────────────
    const {
        focusedZone, focusedItem, carouselIndex, showFocus,
        onTouchStart, onTouchEnd,
    } = useLobbyInput(panelDescriptors);

    // ─── Render panel by ID ─────────────────────────────────────
    const renderPanel = (panelId: string) => {
        const isFocused = focusedZone === panelId;
        switch (panelId) {
            case 'roster':
                return (
                    <RosterPanel
                        focusedItem={isFocused ? focusedItem : -1}
                        showFocus={showFocus && isFocused}
                        isHost={isHost}
                    />
                );
            case 'mission':
                return (
                    <MissionPanel
                        focusedItem={isFocused ? focusedItem : -1}
                        showFocus={showFocus && isFocused}
                    />
                );
            case 'terrain':
                return (
                    <TerrainPanel
                        focusedItem={isFocused ? focusedItem : -1}
                        showFocus={showFocus && isFocused}
                    />
                );
            default:
                return null;
        }
    };

    // ─── CAROUSEL LAYOUT (phone) ────────────────────────────────
    if (layoutMode === 'carousel') {
        const isPortrait = orientation === 'portrait';
        const activePanel = LOBBY_PANELS[carouselIndex];

        return (
            <div className={`w-full h-full flex ${isPortrait ? 'flex-col' : 'flex-row'}`}>
                {/* Preview side */}
                <div className={`relative overflow-hidden ${isPortrait ? 'h-1/2 w-full' : 'w-1/2 h-full order-2'}`}>
                    <PlanetPreview />
                    <div className="absolute top-0 left-0 right-0 z-10 px-3 py-1.5 bg-gradient-to-b from-black/60 to-transparent">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                            🌍 Area of Operations
                        </span>
                    </div>
                </div>

                {/* Carousel side */}
                <div
                    className={`flex flex-col ${isPortrait ? 'h-1/2 w-full' : 'w-1/2 h-full order-1'}`}
                    onTouchStart={onTouchStart}
                    onTouchEnd={onTouchEnd}
                >
                    <div className="flex-1 min-h-0 overflow-hidden">
                        <Card noPadding variant="dark" className="h-full rounded-none border-0">
                            {renderPanel(activePanel)}
                        </Card>
                    </div>
                    <div className="bg-black/80 border-t border-white/5">
                        <CarouselIndicator panels={PANEL_LABELS} activeIndex={carouselIndex} />
                    </div>
                </div>
            </div>
        );
    }

    // ─── GRID LAYOUT (desktop / TV) ─────────────────────────────

    return (
        <div className="w-full h-full flex flex-row">
            {/* Left: 3 columns */}
            <div className="flex-1 flex flex-col min-w-0 h-full p-3 gap-3">
                <div className="flex-1 min-h-0 flex flex-row gap-3">
                    {LOBBY_PANELS.map(panelId => (
                        <Card
                            key={panelId}
                            title={PANEL_TITLES[panelId]}
                            focused={showFocus && focusedZone === panelId}
                            noPadding
                            variant="dark"
                            className={`flex-1 min-w-0 flex flex-col ${panelId === 'roster' && openRosterMenu !== null ? 'z-50 overflow-visible' : 'relative'}`}
                        >
                            {renderPanel(panelId)}
                        </Card>
                    ))}
                </div>
            </div>

            {/* Right: Planet Preview */}
            <div className="w-[33%] max-w-[40%] h-full relative overflow-hidden border-l border-white/10">
                <PlanetPreview />
                <div className="absolute top-0 left-0 right-0 z-10 px-4 py-2 bg-gradient-to-b from-black/60 to-transparent">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        🌍 Area of Operations
                    </span>
                </div>
            </div>

            {/* Dimmer for Roster Tray (Gamepad only) */}
            {
                openRosterMenu !== null && hostHints.showGamepad && (
                    <div className="fixed inset-0 bg-black/40 z-40 transition-opacity duration-200" />
                )
            }
        </div >
    );
};
