
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../../store/useStore';
import { SessionState } from '../../../engine/session/SessionState';

export const SquadronFooter: React.FC<{ launchError?: string | null }> = ({ launchError }) => {
    const localParty = useStore((state) => state.localParty);
    const setPilotStatus = useStore((state) => state.setPilotStatus);
    const maxSlots = 4;

    // Context Menu State
    const [contextMenu, setContextMenu] = useState<{ rect: DOMRect, buttonRect: DOMRect, pilotId: number, color: string } | null>(null);

    const handleSlotClick = (e: React.MouseEvent, pilotId: number) => {
        // Left Click: Toggle Ready
        const pilot = localParty.find(p => p.id === pilotId);
        if (pilot) {
            const newStatus = pilot.ui.status === 'ready' ? 'selecting' : 'ready';
            setPilotStatus(pilotId, newStatus);
        }
    };

    const handleContext = (e: React.MouseEvent, pilotId: number, color: string) => {
        e.preventDefault();
        e.stopPropagation();

        // Toggle Context Menu
        if (contextMenu && contextMenu.pilotId === pilotId) {
            setContextMenu(null);
        } else {
            const buttonRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            // Get Slot Rect (Parent of the button)
            const parent = (e.currentTarget as HTMLElement).parentElement;
            if (parent) {
                const rect = parent.getBoundingClientRect();
                setContextMenu({ rect, buttonRect, pilotId, color });
            }
        }
    };

    const handleLeave = (pilotId: number) => {
        SessionState.removePlayer(pilotId);
        setContextMenu(null);
    };

    const handleJoin = (slotIndex: number) => {
        // Add unique keyboard player for this slot
        SessionState.addPlayer(`keyboard_${slotIndex}`);
    };

    return (
        <div className="relative h-12 md:h-24 border-t border-slate-800/50 bg-slate-950 shrink-0 flex flex-col justify-center">
            {/* LAUNCH ERROR OVERLAY (Toast Style) */}
            {launchError && (
                <div className="absolute inset-x-0 -top-10 flex justify-center pointer-events-none z-50">
                    <div className="bg-red-600 text-white px-4 py-1 rounded text-[10px] font-black uppercase tracking-widest shadow-lg border border-red-400 animate-bounce">
                        {launchError}
                    </div>
                </div>
            )}

            {/* CONTEXT MENU (Portal to Body for reliable positioning) */}
            {contextMenu && createPortal(
                <>
                    {/* BACKDROP (Invisible Click-catcher) */}
                    <div className="fixed inset-0 z-[99]" onClick={() => setContextMenu(null)} onContextMenu={(e) => e.preventDefault()} />

                    {/* MENU */}
                    <div
                        className="fixed z-[100] flex flex-col shadow-2xl rounded overflow-hidden"
                        style={{
                            left: contextMenu.rect.left,
                            width: contextMenu.rect.width,
                            bottom: window.innerHeight - contextMenu.rect.top + 6, // Slightly higher for arrow
                            borderLeft: `2px solid ${contextMenu.color}`
                        }}
                    >
                        <button
                            onClick={() => handleLeave(contextMenu.pilotId)}
                            className="bg-slate-900 border border-slate-700 text-red-500 font-bold uppercase text-[9px] md:text-sm py-3 px-4 text-left hover:bg-slate-800 transition-colors flex items-center gap-2"
                        >
                            <span>Leave Party</span>
                        </button>
                    </div>

                    {/* ARROW */}
                    <div
                        className="fixed z-[101] w-3 h-3 bg-slate-900 border-r border-b border-slate-700 rotate-45"
                        style={{
                            left: contextMenu.buttonRect.left + (contextMenu.buttonRect.width / 2) - 6,
                            bottom: window.innerHeight - contextMenu.rect.top + 6 - 6,
                        }}
                    />
                </>,
                document.body
            )}

            <div className="flex gap-2 h-full px-2 py-1.5 md:py-3 md:px-4">
                {[...Array(maxSlots)].map((_, i) => {
                    const pilot = localParty.find(p => p.id === i); // Ensure we map to correct ID if sparse, though usually packed
                    // Actually localParty might be packed [0, 1] but IDs might be 0, 2 if 1 left? 
                    // SessionState re-uses IDs? "Find first available Scanline ID". Yes.
                    // But localParty array from store might be unordered? 
                    // Better to find by ID.

                    const hasPilot = !!pilot;

                    if (hasPilot) {
                        const isReady = pilot.ui.status === 'ready';
                        const isBlocking = launchError && !isReady;
                        const isOpen = contextMenu?.pilotId === pilot.id;

                        // Base style for the card container
                        const baseStyle = `
                            flex-1 rounded border-l-2 flex flex-row transition-all duration-200 relative overflow-hidden
                            ${isReady ? 'bg-slate-800/80 border-white' : 'bg-slate-900/40 border-slate-700'}
                            ${isBlocking ? 'bg-red-900/20' : ''}
                        `;

                        return (
                            <div
                                key={pilot.id}
                                className={baseStyle}
                                style={{ borderLeftColor: pilot.color }}
                            >
                                {/* Background Tint (Global) */}
                                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundColor: pilot.color }} />

                                {/* MAIN CLICK AREA (Toggle Ready) */}
                                <button
                                    onClick={(e) => handleSlotClick(e, pilot.id)}
                                    className="flex-grow flex flex-col justify-center px-2 py-1.5 md:p-3 text-left hover:bg-white/5 active:bg-black/10 transition-colors outline-none group"
                                >
                                    <div className="flex justify-between items-center leading-none h-full w-full">
                                        {/* Name & Input */}
                                        <div className="flex flex-col justify-center">
                                            <span className={`text-[9px] md:text-sm font-bold uppercase truncate max-w-[60px] md:max-w-none ${isReady ? 'text-white' : 'text-slate-400'}`}>
                                                {pilot.name}
                                            </span>
                                            <span className="text-[8px] md:text-[10px] text-slate-500 hidden md:block mt-0.5">
                                                {pilot.input.type === 'gamepad' ? `CONTROLLER ${pilot.input.gamepadIndex + 1}` : (pilot.input.type === 'touch' ? 'TOUCH CONTROL' : 'KEYBOARD/MOUSE')}
                                            </span>
                                        </div>

                                        {/* Status Text (Moved Left to avoid button) */}
                                        <div className="flex flex-col items-end mr-1">
                                            <span className={`text-[8px] md:text-xs font-black uppercase tracking-wider ${isReady ? 'text-green-400' : 'text-slate-600'}`}>
                                                {isReady ? 'READY' : 'SEL'}
                                            </span>
                                            {!isReady && (
                                                <span className="text-[7px] text-slate-600 uppercase md:hidden mt-0.5">Tap</span>
                                            )}
                                        </div>
                                    </div>
                                </button>

                                {/* OPTIONS BUTTON (Right Strip) */}
                                <button
                                    onClick={(e) => handleContext(e, pilot.id, pilot.color)}
                                    onContextMenu={(e) => handleContext(e, pilot.id, pilot.color)}
                                    className={`w-8 md:w-12 h-full flex flex-col items-center justify-center gap-[3px] border-l border-white/5 transition-colors cursor-pointer shrink-0 ${isOpen ? 'bg-white/10' : 'hover:bg-white/10 active:bg-black/20'}`}
                                >
                                    {isOpen ? (
                                        // X Icon
                                        <div className="relative w-4 h-4">
                                            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white rotate-45 transform origin-center"></div>
                                            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white -rotate-45 transform origin-center"></div>
                                        </div>
                                    ) : (
                                        // Dots
                                        <>
                                            <div className="w-[3px] h-[3px] rounded-full bg-slate-500 group-hover:bg-slate-300"></div>
                                            <div className="w-[3px] h-[3px] rounded-full bg-slate-500 group-hover:bg-slate-300"></div>
                                            <div className="w-[3px] h-[3px] rounded-full bg-slate-500 group-hover:bg-slate-300"></div>
                                        </>
                                    )}
                                </button>
                            </div>
                        );
                    } else {
                        // EMPTY SLOT
                        return (
                            <button
                                key={`empty-${i}`}
                                onClick={() => handleJoin(i)}
                                className="flex-1 rounded border border-dashed border-slate-800 bg-slate-900/20 flex flex-col justify-center items-center opacity-40 hover:opacity-60 hover:bg-slate-800/40 transition-all cursor-pointer group active:scale-95"
                            >
                                <span className="text-[8px] md:text-[10px] font-bold text-slate-700 group-hover:text-slate-500 uppercase">Slot {i + 1}</span>
                                <span className="text-[7px] text-slate-800 group-hover:text-slate-600 uppercase hidden md:block mt-1">Tap to Join</span>
                                <span className="text-[7px] text-slate-800 group-hover:text-slate-600 uppercase md:hidden mt-1">+ Join</span>
                            </button>
                        );
                    }
                })}
            </div>
        </div>
    );
};
