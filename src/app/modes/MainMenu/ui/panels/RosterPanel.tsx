import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../../../store/useStore';
import { useMainMenuStore } from '../../MainMenuStore';
import { SessionState } from '../../../../../engine/session/SessionState';
import { ReadyToggle } from '../components/ReadyToggle';
import { GamepadButton } from '@/src/app/core/ui/GamepadIcons';
import { useSlotInput } from '../../hooks/useSlotInput';
import { useSlotHints, useHostHints } from '../../../../core/hooks/useInputHints';

interface RosterPanelProps {
    focusedItem: number;
    showFocus: boolean;
    isHost: boolean;
}

// ─── PLAYER CARD ─────────────────────────────────────────────────────────────

interface PlayerCardProps {
    slotIdx: number;
    pilot: any;
    isFocused: boolean;
    isHost: boolean;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ slotIdx, pilot, isFocused, isHost }) => {
    const updatePilot = useStore(state => state.updatePilot);
    const openRosterMenu = useMainMenuStore(state => state.openRosterMenu);
    const setOpenRosterMenu = useMainMenuStore(state => state.setOpenRosterMenu);

    const isReady = pilot.ui.status === 'ready';
    const isOpen = openRosterMenu === slotIdx;
    const cardRef = useRef<HTMLDivElement>(null);

    // Track which button in the tray is focused (0..N)
    // const [trayFocusIndex, setTrayFocusIndex] = useState(0); // MOVED TO GLOBAL STORE

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
        updatePilot(slotIdx, { ui: { ...pilot.ui, status: newStatus } });
    };

    const isHostSlot = slotIdx === 0;
    // Determine available actions for this slot
    // Host on own slot: Resign
    // Host on other slot: Ring, MakeHost, Kick
    // Client on own slot: MakeHost (if enabled?), Resign (N/A) -> Actually client only sees Ring/MakeHost on others?
    // Spec: "if a player opens their own tray they will only see the makehost/ resign as host buttons"
    // Spec: "if a non host player opens another player's tray, they should only see the makehost and ring buttons"

    // Let's define the actions array dynamically
    // But for now, let's stick to the structure we have in JSX and map indices to it.
    // Host Slot (0): [Resign] (length 1)
    // Other Slots (>0): [Ring, MakeHost, Kick] (length 3, indices 0,1,2)
    // Wait, the spec says "only the host can kick players".
    // So if I am a client looking at another client, I see Ring, MakeHost. (length 2)

    // For simplicity in this iteration, assuming we are the HOST viewing this or conforming to the UI structure:
    // The current JSX has two branches: isHostSlot ? (1 button) : (3 buttons).
    // The 'Kick' button is only valid if I am the host.
    // Let's refine the button count so navigation works.

    const isLocalUserHost = isHost; // Passed from props
    // We need to know WHO is opening the menu to decide what buttons to show.
    // But keeping it simple based on the current UI structure:
    // If isHostSlot -> 1 button.
    // Else -> 3 buttons (Ring, MakeHost, Kick).
    // We should probably hide Kick if !isHost.

    const buttonCount = isHostSlot ? 1 : (isHost ? 3 : 2); // Hide Kick if not host

    const trayWidth = isHostSlot ? '56px' : (isHost ? '168px' : '112px');
    const trayInnerWidth = isHostSlot ? 'w-[56px]' : (isHost ? 'w-[168px]' : 'w-[112px]');

    // Input Handling
    const isActive = !!pilot;
    const hints = useSlotHints(pilot);
    const hostHints = useHostHints();
    const trayFocusIndex = useMainMenuStore(state => state.rosterTrayIndex);

    // Only the OWNER of the slot can Toggle Ready or Close their own menu via B
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

    // Helper to get focus style for tray buttons
    const getTrayButtonStyle = (index: number) => {
        const isSelected = isOpen && trayFocusIndex === index;
        return isSelected
            ? 'bg-amber-500 text-slate-900 shadow-[0_0_8px_rgba(245,158,11,0.5)] z-10' // Active/Focused style
            : 'text-slate-400 hover:text-amber-400 hover:bg-amber-500/10';
    };

    // Actions are now handled in LobbyScreen via onTrayAction
    // We just render the buttons visuals.
    // NOTE: Mouse click handlers still needed for mouse support?
    // references handleRing, handleMakeHost, handleKick, handleResignHost which we should probably keep for mouse clicks
    // or we can remove them if we rely 100% on the global input?
    // Let's keep them for mouse clicks for now, but they should really call the same logic.
    // actually checking the previous implementation, handleKick calls SessionState.removePlayer directly
    // which matches LobbyScreen logic. So keeping them is fine for mouse.

    return (
        <div
            ref={cardRef}
            className={`relative flex items-stretch rounded-lg border transition-all ${isOpen ? 'z-50 overflow-visible' : 'overflow-hidden'} ${isFocused
                ? 'border-blue-500/70 bg-blue-600/10 shadow-[0_0_12px_rgba(59,130,246,0.15)]'
                : isReady
                    ? 'bg-green-900/20 border-green-500/30'
                    : 'bg-white/5 border-white/5'
                }`}
        >
            {/* Card Content */}
            <div className="flex items-center gap-3 px-3 py-2.5 flex-1 min-w-0">
                {/* Color dot */}
                <div
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-lg"
                    style={{ backgroundColor: pilot.color, boxShadow: `0 0 8px ${pilot.color}40` }}
                />
                {/* Name + plane */}
                <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white uppercase tracking-wider truncate flex items-center gap-1.5">
                        {pilot.name}
                        {slotIdx === 0 && (
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
                    hints={hints}
                    onClick={handleReady}
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
                            {isHost && (
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
    const openRosterMenu = useMainMenuStore(state => state.openRosterMenu);

    const hostHints = useHostHints();

    return (
        <div className="flex flex-col h-full relative">
            {/* Local Dimmer for inactive cards when menu is open */}
            {openRosterMenu !== null && hostHints.showGamepad && (
                <div className="absolute inset-0 bg-black/60 z-40 pointer-events-none transition-opacity duration-200" />
            )}

            <div className={`flex flex-col gap-1.5 flex-1 p-3 ${openRosterMenu !== null ? 'overflow-visible' : 'overflow-y-auto'}`}>
                {localParty.map((pilot, index) => {
                    const slotIdx = pilot.id;
                    const isFocused = showFocus && focusedItem === index;

                    return (
                        <PlayerCard
                            key={slotIdx}
                            slotIdx={slotIdx}
                            pilot={pilot}
                            isFocused={isFocused}
                            isHost={isHost}
                        />
                    );
                })}
            </div>
        </div>
    );
};
