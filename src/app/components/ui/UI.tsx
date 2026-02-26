
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { VirtualJoystick } from './VirtualJoystick';
import { ThrottleSlider } from './ThrottleSlider';
import { TouchFireButton } from './TouchFireButton';
import { MenuOverlay } from './MenuOverlay';




export const UI: React.FC = () => {
    const mission = useStore((state) => state.mission);
    const gameMode = useStore((state) => state.gameMode);

    // Phase 3: Use localParty for dynamic HUD rendering
    const localParty = useStore((state) => state.localParty);

    // Multiplayer Store
    const splitDirection = useStore((state) => state.splitDirection);
    const invertPlayer2 = useStore((state) => state.invertPlayer2);
    const p1Input = localParty[0]?.input || { type: 'mouse_kb' };

    // --- FULLSCREEN DETECTION REMOVED FROM HERE (Moved to MenuOverlay) ---

    // --- DYNAMIC LAYOUT LOGIC (Matches Scene.tsx) ---
    const activePilots = useMemo(() => localParty.slice(0, 4), [localParty]);

    const getContainerClasses = () => {
        if (activePilots.length === 1) return "w-full h-full";
        if (activePilots.length === 2) {
            return splitDirection === 'horizontal' ? "flex flex-col w-full h-full" : "flex flex-row w-full h-full";
        }
        return "grid grid-cols-2 grid-rows-2 w-full h-full";
    };

    // Dynamic Styles for Controls
    // Logic: Center the controls if in split-screen mode with touch input active, BUT ONLY IN FLIGHT MODE.
    const isTouchActive = p1Input.type === 'touch' || (gameMode === 'splitscreen' && localParty[1]?.input.type === 'touch');
    const shouldCenterControls = gameMode === 'splitscreen' && isTouchActive;

    const btnSizeClass = shouldCenterControls ? "w-12 h-12" : "w-14 h-14";
    const iconSizeClass = "w-6 h-6";

    const controlsContainerClass = shouldCenterControls
        ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex-row gap-8 items-center"
        : "top-6 right-6 flex-col gap-3 items-end";

    return (
        <>


            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between">

                {/* HEADER INFO (Top Left) */}
                <div className="absolute top-6 left-6 z-50 pointer-events-auto">
                    <div className="flex gap-4">
                        {activePilots.length > 1 && (
                            <div className="bg-black/50 backdrop-blur px-3 py-1 rounded text-[10px] text-white/70 border border-white/10 font-mono animate-in fade-in">
                                {activePilots.map(p => `P${p.id + 1}: ${p.input.type === 'gamepad' ? 'GP' + p.input.gamepadIndex : p.input.type}`).join(' | ')}
                            </div>
                        )}
                    </div>
                </div>

                {/* --- MENU OVERLAY (PAUSED) --- */}
                {/* Don't show menu during game over screens, let the specialized overlays handle it */}
                {/* --- MENU OVERLAY REMOVED --- */}
                {/* Menu Overlay is now handled by the active GameMode's UIComponent */}

                {/* --- DYNAMIC HUD & CONTROLS GRID --- */}
                {/* This container replicates the Viewport layout so HUDs align perfectly */}
                <div className={`absolute inset-0 pointer-events-none ${getContainerClasses()}`}>
                    {activePilots.map((pilot, index) => {
                        // Special Inversion Logic for P2 in Horizontal Split
                        const isP2Horizontal = activePilots.length === 2 && index === 1 && splitDirection === 'horizontal';
                        const isInverted = isP2Horizontal && invertPlayer2;

                        // Positioning Styles
                        // If inverted: Rotate 180 and stick to "top" (which is visual bottom for them)
                        const hudStyle: React.CSSProperties = isInverted
                            ? { top: '24px', left: '50%', transform: 'translateX(-50%) rotate(180deg)' }
                            : { bottom: '24px', left: '50%', transform: 'translateX(-50%)' };

                        const controlsStyle: React.CSSProperties = isInverted
                            ? { top: '24px', transform: 'rotate(180deg)' } // Controls container needs specific positioning relative to corner
                            : { bottom: '24px' };

                        return (
                            <div key={pilot.id} className="relative w-full h-full overflow-hidden">
                                {mission !== 'main_menu' && (
                                    <>
                                        {/* STANDARD HUD (Moved to Mode) */}
                                        {/* <GameHUD pilotId={pilot.id} /> REMOVED */}

                                        {/* TOUCH CONTROLS */}
                                        {pilot.input.type === 'touch' && (
                                            <>
                                                <div
                                                    className="absolute z-20 transition-all duration-300 pointer-events-auto"
                                                    style={{
                                                        ...controlsStyle,
                                                        left: isInverted ? 'auto' : '24px',
                                                        right: isInverted ? '24px' : 'auto'
                                                    }}
                                                >
                                                    <VirtualJoystick playerId={pilot.id + 1} />
                                                </div>
                                                <div
                                                    className="absolute z-20 transition-all duration-300 pointer-events-auto flex flex-row items-end gap-6"
                                                    style={{
                                                        ...controlsStyle,
                                                        right: isInverted ? 'auto' : '24px',
                                                        left: isInverted ? '24px' : 'auto'
                                                    }}
                                                >
                                                    {!isInverted && <TouchFireButton playerId={pilot.id + 1} />}
                                                    <ThrottleSlider playerId={pilot.id + 1} />
                                                    {isInverted && <TouchFireButton playerId={pilot.id + 1} />}
                                                </div>
                                            </>
                                        )}
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>

            </div>


        </>
    );
};
