import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../../../store/useStore';
import { useMainMenuStore } from '../../MainMenuStore';
import { SessionState } from '../../../../../engine/session/SessionState';
import { ReadyToggle } from '../components/ReadyToggle';
import { GamepadButton } from '@/src/app/core/ui/GamepadIcons';
import { useSlotInput } from '../../hooks/useSlotInput';
import { useSlotHints, useHostHints } from '../../../../core/hooks/useInputHints';
import { NetworkManager } from '../../../../../engine/session/NetworkManager';

interface RosterPanelProps {
    focusedItem: number;
    showFocus: boolean;
    isHost: boolean; // Local Party Leader status (Passed from LobbyScreen)
}

// ─── PLAYER CARD ─────────────────────────────────────────────────────────────

interface PlayerCardProps {
    slotIdx: number;
    pilot: any;
    isFocused: boolean;
    isHostView: boolean; // "Is the viewer the lobby host?" (Controls Kick/Resign permissions)
    isLobbyHost: boolean; // "Is THIS player the lobby host?" (Controls Crown icon)
    isLocalPartyLeader: boolean; // For border styling
    isLocal: boolean;
    displayColor: string;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ slotIdx, pilot, isFocused, isHostView, isLobbyHost, isLocalPartyLeader, isLocal, displayColor }) => {
    const updatePilot = useStore(state => state.updatePilot);
    const openRosterMenu = useMainMenuStore(state => state.openRosterMenu);
    const setOpenRosterMenu = useMainMenuStore(state => state.setOpenRosterMenu);

    const isReady = pilot.ui.status === 'ready';
    const isOpen = openRosterMenu === slotIdx;
    const cardRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        if (!isOpen) return;
        const handleClick = (e: MouseEvent) => {
            if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
                setOpenRosterMenu(null);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [isOpen, setOpenRosterMenu]);

    const handleKick = () => {
        SessionState.removePlayer(slotIdx);
        setOpenRosterMenu(null);
    };

    const handleRing = () => {
        // TODO: Implement ring/ping functionality
        console.log(`[Roster] Ring player ${slotIdx}`);
        setOpenRosterMenu(null);
    };

    const handleMakeHost = () => {
        // TODO: Implement transfer host
        console.log(`[Roster] Transfer host to player ${slotIdx}`);
        setOpenRosterMenu(null);
    };

    const handleResignHost = () => {
        // TODO: Implement resign host
        console.log(`[Roster] Resign as host`);
        setOpenRosterMenu(null);
    };

    // Toggle Ready Logic
    const handleReady = () => {
        const newStatus = pilot.ui.status === 'ready' ? 'selecting' : 'ready';
        // 1. Local Update (Instant feedback + Offline support)
        updatePilot(slotIdx, { ui: { ...pilot.ui, status: newStatus } });

        // 2. Network Sync (If online)
        if (useStore.getState().isOnline) {
            // We need to construct the unique ID for this pilot
            // Rule: channelId + "_" + pilotId
            const channelId = NetworkManager.channelId;
            if (channelId) {
                NetworkManager.sendPlayerMetadata({
                    playerId: `${channelId}_${pilot.id}`,
                    isReady: newStatus === 'ready'
                });
            }
        }
    };

    const isHostSlot = slotIdx === 0;

    // Style determination
    // 1. Uniform Background
    const bgClass = 'bg-slate-950/60';

    // 2. Base Border & Glows
    let borderClass = 'border-white/20'; // More visible base
    if (isReady) {
        borderClass = 'border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.2)]';
    }

    // 3. Focus Override (Maintains BG, overrides border color)
    if (isFocused) {
        borderClass = 'border-blue-500/80 shadow-[0_0_12px_rgba(59,130,246,0.4)]';
    }

    // 4. Local Indicator (Persistent Left Border)
    // "keep indicators on left", "visible when ready", "non-leader more yellow"
    if (isLocal) {
        // Leader: Amber-400 (Bright)
        // Member: Yellow-700 (Dimmer/Darker Yellow)
        const indicatorColor = isLocalPartyLeader ? 'border-l-yellow-400' : 'border-l-yellow-400/35';
        borderClass += ` border-l-[4px] ${indicatorColor}`;
    }

    const isActive = !!pilot;
    const hints = useSlotHints(pilot);
    const hostHints = useHostHints();
    const trayFocusIndex = useMainMenuStore(state => state.rosterTrayIndex);
    const trayWidth = isHostSlot ? '56px' : (isHostView ? '168px' : '112px');
    const trayInnerWidth = isHostSlot ? 'w-[56px]' : (isHostView ? 'w-[168px]' : 'w-[112px]');

    const getTrayButtonStyle = (index: number) => {
        const isSelected = isOpen && trayFocusIndex === index;
        return isSelected
            ? 'bg-amber-500 text-slate-900 shadow-[0_0_8px_rgba(245,158,11,0.5)] z-10' // Active/Focused style
            : 'text-slate-400 hover:text-amber-400 hover:bg-amber-500/10';
    };

    useSlotInput(
        pilot?.input.type || 'gamepad',
        pilot?.input.deviceId || '',
        pilot?.input.gamepadIndex ?? -1,
        isActive,
        {
            onPrev: () => { },
            onNext: () => { },
            onConfirm: () => { },
            onReady: handleReady,
        }
    );

    return (
        <div
            ref={cardRef}
            className={`relative flex items-stretch rounded-lg border transition-all ${isOpen ? 'z-50 overflow-visible' : 'overflow-hidden'} ${bgClass} ${borderClass}`}
        >
            {/* Card Content */}
            <div className="flex items-center gap-3 px-3 py-2.5 flex-1 min-w-0">
                {/* Color dot */}
                <div
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-lg"
                    style={{ backgroundColor: displayColor, boxShadow: `0 0 8px ${displayColor}40` }}
                />
                {/* Name + plane */}
                <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white uppercase tracking-wider truncate flex items-center gap-1.5">
                        {pilot.name}
                        {isLobbyHost && (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-amber-400 shrink-0" style={{ filter: 'drop-shadow(0 0 3px rgba(251,191,36,0.4))' }}>
                                <path d="M2 17l2-11 5 5 3-7 3 7 5-5 2 11H2zm1 1h18v2H3v-2z" />
                            </svg>
                        )}
                    </div>
                    <div className="text-[9px] font-mono text-slate-500 uppercase">
                        {pilot.airplane}
                    </div>
                </div>
            </div>

            {/* Ready Toggle */}
            <div className="flex items-center px-2 border-l border-white/5">
                <ReadyToggle
                    isReady={isReady}
                    hints={isLocal ? hints : undefined}
                    onClick={isLocal ? handleReady : undefined}
                    className="scale-90 origin-right"
                />
            </div>

            {/* Expanded action buttons — overlays card content from right */}
            <div
                className={`absolute top-0 bottom-0 flex items-stretch transition-all duration-200 ease-out overflow-hidden ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
                style={{ right: '28px', width: isOpen ? trayWidth : '0px', opacity: isOpen ? 1 : 0 }}
            >
                <div className={`flex items-stretch shrink-0 ${trayInnerWidth} bg-slate-900/90 backdrop-blur-sm`}>
                    {isHostSlot ? (
                        /* Host's tray: Resign Host (slashed crown) */
                        <button
                            onClick={handleResignHost}
                            className={`flex-1 flex items-center justify-center transition-all border-l border-white/10 ${getTrayButtonStyle(0)}`}
                            title="Resign as Host"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 relative">
                                <path d="M2 17l2-11 5 5 3-7 3 7 5-5 2 11H2zm1 1h18v2H3v-2z" />
                                <line x1="3" y1="22" x2="21" y2="2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                            </svg>
                        </button>
                    ) : (
                        /* Other players' tray: Ring, Make Host, Kick */
                        <>
                            {/* Ring */}
                            <button
                                onClick={handleRing}
                                className={`flex-1 flex items-center justify-center transition-all border-l border-white/10 ${getTrayButtonStyle(0)}`}
                                title="Ring Player"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                                </svg>
                            </button>
                            {/* Make Host */}
                            <button
                                onClick={handleMakeHost}
                                className={`flex-1 flex items-center justify-center transition-all border-l border-white/10 ${getTrayButtonStyle(1)}`}
                                title="Make Host"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                                    <path d="M2 17l2-11 5 5 3-7 3 7 5-5 2 11H2zm1 1h18v2H3v-2z" />
                                </svg>
                            </button>
                            {/* Kick - Only show if host */}
                            {isHostView && (
                                <button
                                    onClick={handleKick}
                                    className={`flex-1 flex items-center justify-center transition-all border-l border-white/10 ${getTrayButtonStyle(2)}`}
                                    title="Kick Player"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3-3l3-3m0 0l-3-3m3 3H9" />
                                    </svg>
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Ellipsis button — full height, right edge */}
            <button
                onClick={(e) => { e.stopPropagation(); setOpenRosterMenu(isOpen ? null : slotIdx); }}
                className={`w-7 flex items-center justify-center shrink-0 transition-all border-l ${isOpen
                    ? 'bg-slate-950/90 text-white border-white/10'
                    : 'text-slate-600 hover:text-slate-300 hover:bg-white/5 border-white/5'
                    }`}
            >
                {(isFocused || isOpen) ? (
                    hostHints.showGamepad ? (
                        <div className="scale-90"><GamepadButton type={hostHints.gamepadType} button="Y" /></div>
                    ) : hostHints.showKeyboard ? (
                        <span className="h-4 min-w-[16px] px-1 border border-current rounded flex items-center justify-center text-[9px] font-bold text-slate-400">
                            {hostHints.keyboardDevice === 'kb2' ? '5' : 'T'}
                        </span>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-3.5 h-3.5">
                            <circle cx="12" cy="5" r="2" />
                            <circle cx="12" cy="12" r="2" />
                            <circle cx="12" cy="19" r="2" />
                        </svg>
                    )
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-3.5 h-3.5">
                        <circle cx="12" cy="5" r="2" />
                        <circle cx="12" cy="12" r="2" />
                        <circle cx="12" cy="19" r="2" />
                    </svg>
                )}
            </button>

            {/* Tray Hints (Gamepad only, when open) */}
            {isOpen && hostHints.showGamepad && (
                <div className="absolute top-full right-0 mt-2 flex items-center justify-end gap-3 pointer-events-none z-50 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 opacity-80 drop-shadow-md">
                        <div className="flex gap-0.5">
                            <GamepadButton type={hostHints.gamepadType} button="DPadLeft" className="w-3.5 h-3.5" />
                            <GamepadButton type={hostHints.gamepadType} button="DPadRight" className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-white">Select Action</span>
                    </div>

                    <div className="flex items-center gap-1.5 opacity-80 drop-shadow-md">
                        <GamepadButton type={hostHints.gamepadType} button="A" className="w-3.5 h-3.5" />
                        <span className="text-[9px] font-bold uppercase tracking-wider text-white">Confirm</span>
                    </div>
                </div>
            )}
        </div >
    );
};

// ─── ROSTER PANEL ────────────────────────────────────────────────────────────

export const RosterPanel: React.FC<RosterPanelProps> = ({ focusedItem, showFocus, isHost }) => {
    const localParty = useStore(state => state.localParty);
    const remotePlayers = useStore(state => state.remotePlayers);
    const openRosterMenu = useMainMenuStore(state => state.openRosterMenu);

    // Sort logic: "sort the players in the roster by the order they joined the lobby"
    const isOnline = useStore(state => state.isOnline);
    const myChannelId = NetworkManager.channelId;

    const hostHints = useHostHints();

    // Build Uniform Display List
    const displayList = React.useMemo(() => {
        // Prevent "Offline Jump": If online but no data, return empty to show loading
        if (isOnline && remotePlayers.length === 0) {
            return [];
        }

        if (!isOnline || !myChannelId) {
            // Offline Mode: Show Local Party
            return localParty.map((p, index) => {
                const total = localParty.length;
                const hue = (index / total) * 360;
                return {
                    id: `local_${p.id}`,
                    name: p.name,
                    airplane: p.airplane,
                    color: p.color,
                    isReady: p.ui.status === 'ready',
                    joinedAt: 0,
                    isLocal: true,
                    localSlotIdx: p.id,
                    pilot: p,
                    isLocalPartyLeader: p.id === 0,
                    isLobbyHost: p.id === 0,
                    displayColor: `hsl(${hue}, 80%, 60%)`,
                };
            });
        }

        // Online & Have Data
        const merged = remotePlayers.map(rp => {
            const isLocal = rp.id.startsWith(myChannelId + '_');
            let localPilot: any = null;
            let localSlotIdx = -1;

            if (isLocal) {
                const parts = rp.id.split('_');
                const pilotId = parseInt(parts[parts.length - 1]);
                if (!isNaN(pilotId)) {
                    localPilot = localParty.find(p => p.id === pilotId);
                    localSlotIdx = pilotId;
                }
            }

            return {
                id: rp.id,
                name: rp.name,
                airplane: rp.airplane,
                color: rp.color,
                isReady: localPilot ? (localPilot.ui.status === 'ready') : rp.isReady,
                joinedAt: rp.joinedAt || 0,
                isLocal,
                localSlotIdx,
                pilot: localPilot || {
                    id: -1,
                    name: rp.name,
                    airplane: rp.airplane,
                    color: rp.color,
                    ui: { status: rp.isReady ? 'ready' : 'selecting' },
                    input: { type: 'network', deviceId: rp.id }
                },
                isLocalPartyLeader: isLocal && localSlotIdx === 0,
                isLobbyHost: false, // Calculate after sort
            };
        });

        // Add pending locals
        localParty.forEach(lp => {
            const expectedId = `${myChannelId}_${lp.id}`;
            if (!merged.find(m => m.id === expectedId)) {
                merged.push({
                    id: expectedId,
                    name: lp.name,
                    airplane: lp.airplane,
                    color: lp.color,
                    isReady: lp.ui.status === 'ready',
                    joinedAt: Date.now(),
                    isLocal: true,
                    localSlotIdx: lp.id,
                    pilot: lp,
                    isLocalPartyLeader: lp.id === 0,
                    isLobbyHost: false,
                });
            }
        });

        // Sort: Earliest joinedAt is top
        const sorted = merged.sort((a, b) => (a.joinedAt - b.joinedAt) || a.id.localeCompare(b.id));

        // Assign colors based on sorted position
        return sorted.map((p, index) => {
            const total = sorted.length;
            const hue = (index / total) * 360;
            return {
                ...p,
                isLobbyHost: index === 0,
                displayColor: `hsl(${hue}, 80%, 60%)`
            };
        });

    }, [isOnline, myChannelId, remotePlayers, localParty]);

    // Derive Host Privileges (for Kick/Resign actions)
    // "Am I the lobby host?" = "Is the top player (Crown) a local player?"
    const amILobbyHost = displayList.length > 0 && displayList[0].isLocal;

    return (
        <div className="flex flex-col h-full relative">
            {/* Local Dimmer for inactive cards when menu is open */}
            {openRosterMenu !== null && hostHints.showGamepad && (
                <div className="absolute inset-0 bg-black/60 z-40 pointer-events-none transition-opacity duration-200" />
            )}

            <div className={`flex flex-col gap-1.5 flex-1 p-3 ${openRosterMenu !== null ? 'overflow-visible' : 'overflow-y-auto'}`}>
                {displayList.length === 0 && isOnline ? (
                    <div className="flex items-center justify-center h-full opacity-50">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-4 h-4 border-2 border-slate-500 border-t-white rounded-full animate-spin" />
                            <span className="text-[10px] uppercase tracking-widest text-slate-400">Connecting</span>
                        </div>
                    </div>
                ) : (
                    displayList.map((item, index) => {
                        const isFocused = showFocus && focusedItem === index;

                        return (
                            <div key={item.id} className="relative">


                                <PlayerCard
                                    slotIdx={item.isLocal ? item.localSlotIdx : -1}
                                    pilot={item.pilot}
                                    isFocused={isFocused}
                                    isHostView={amILobbyHost} // Correctly derived from Roster Order, ignoring ambiguous 'isHost' prop
                                    isLobbyHost={item.isLobbyHost}
                                    isLocalPartyLeader={item.isLocalPartyLeader}
                                    isLocal={item.isLocal}
                                    displayColor={item.displayColor}
                                />


                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
