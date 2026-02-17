
import React, { useRef, useLayoutEffect } from 'react';
import { useStore } from '../../../../store/useStore';

interface Props {
    pilotId: number; // 0-based ID
    className?: string;
    style?: React.CSSProperties;
    paused?: boolean; // New Prop
}

export const GameHUD: React.FC<Props> = ({ pilotId, className, style, paused = false }) => {
    // Refs for DOM elements to update directly
    const speedRef = useRef<HTMLSpanElement>(null);
    const altRef = useRef<HTMLSpanElement>(null);
    const pitchRef = useRef<HTMLSpanElement>(null);
    const rollRef = useRef<HTMLSpanElement>(null);
    const throttleBarRef = useRef<HTMLDivElement>(null);
    const pingRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        let reqId: number;

        const loop = () => {
            // Check passed prop instead of global store
            if (paused) {
                // If paused from parent, we can stop the loop or just return.
                // But since parent might unmount/hide us, this is double safety.
                reqId = requestAnimationFrame(loop);
                return;
            }

            const state = useStore.getState();

            // Robust Lookup by ID
            const pilot = state.localParty.find(p => p.id === pilotId);
            if (!pilot) {
                reqId = requestAnimationFrame(loop);
                return;
            }
            const telemetry = pilot.telemetry;

            // === COMMON UPDATE (Ping) ===
            if (pingRef.current && pilotId === 0) {
                if (state.isOnline) {
                    pingRef.current.style.display = 'flex';
                    const p = state.ping;
                    pingRef.current.innerText = `PING: ${p}ms`;
                    pingRef.current.style.color = p > 150 ? '#ef4444' : (p > 80 ? '#facc15' : '#4ade80');
                } else {
                    pingRef.current.style.display = 'none';
                }
            }

            // === FREE FLIGHT UPDATES ===
            if (speedRef.current) {
                const spd = Math.round(telemetry.speed * 10);
                speedRef.current.innerText = spd.toString();
            }
            if (altRef.current) {
                const alt = Math.max(0, Math.round(telemetry.altitude * 10));
                altRef.current.innerText = alt.toString();
                altRef.current.style.color = alt < 100 ? '#ef4444' : '#e2e8f0';
            }
            if (pitchRef.current) {
                const deg = Math.round(telemetry.pitch * (180 / Math.PI));
                pitchRef.current.innerText = `${deg}°`;
            }
            if (rollRef.current) {
                const deg = Math.round(telemetry.roll * (180 / Math.PI));
                rollRef.current.innerText = `${deg}°`;
            }
            if (throttleBarRef.current) {
                const pct = Math.round(telemetry.throttle * 100);
                throttleBarRef.current.style.width = `${pct}%`;
                throttleBarRef.current.style.backgroundColor = pct > 90 ? '#ef4444' : '#3b82f6';
            }

            reqId = requestAnimationFrame(loop);
        };

        // Only run loop if not paused
        if (!paused) {
            reqId = requestAnimationFrame(loop);
        }

        return () => cancelAnimationFrame(reqId);
    }, [pilotId, paused]); // Add paused to deps

    if (paused) return null;

    // Scaling Logic: If we have > 2 players, scale down the HUD slightly to fit the grid cells better
    const playerCount = useStore.getState().localParty.length;
    const scaleClass = playerCount > 2 ? 'scale-75 origin-bottom' : 'scale-100';

    // --- CONTAINER STYLES ---
    // A unified container that fits both modes
    const containerClass = `pointer-events-none flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-900/60 backdrop-blur-md border border-slate-700/50 shadow-2xl min-w-[200px] max-w-[300px] ${scaleClass} ${className}`;


    return (
        <div className={containerClass} style={style}>

            {/* === FREE FLIGHT LAYOUT === */}
            <div className="flex gap-6 text-sm font-mono font-bold tracking-wider text-slate-400">
                <div className="flex flex-col items-end w-14">
                    <span className="text-[9px] uppercase text-slate-500">SPD</span>
                    <span ref={speedRef} className="text-white text-lg leading-none">0</span>
                </div>

                <div className="w-20 flex flex-col justify-center gap-1">
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-600/50">
                        <div ref={throttleBarRef} className="h-full bg-blue-500 w-1/2 transition-colors duration-200" />
                    </div>
                    <div className="flex justify-between text-[8px] text-slate-600 uppercase px-0.5">
                        <span>THR</span>
                    </div>
                </div>

                <div className="flex flex-col items-start w-14">
                    <span className="text-[9px] uppercase text-slate-500">ALT</span>
                    <span ref={altRef} className="text-white text-lg leading-none">0</span>
                </div>
            </div>

            <div className="flex gap-4 text-[10px] font-mono text-slate-500 mt-1 relative">
                <div className="flex gap-1">
                    <span>P:</span>
                    <span ref={pitchRef} className="text-slate-300 font-bold">0°</span>
                </div>
                <div className="w-px h-3 bg-slate-700" />
                <div className="flex gap-1">
                    <span>R:</span>
                    <span ref={rollRef} className="text-slate-300 font-bold">0°</span>
                </div>
            </div>

            {/* Global Ping Overlay */}
            {pilotId === 0 && (
                <div
                    ref={pingRef}
                    className="absolute -right-20 top-0 hidden bg-black/40 px-1.5 py-0.5 rounded text-[9px] font-bold"
                >
                    PING: 0ms
                </div>
            )}

        </div>
    );
};
