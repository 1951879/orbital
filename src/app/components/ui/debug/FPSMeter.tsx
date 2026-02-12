
import React, { useEffect, useRef, useState } from 'react';

export const FPSMeter: React.FC = () => {
    const [history, setHistory] = useState<number[]>(new Array(30).fill(60));
    const lastTime = useRef(performance.now());
    const frames = useRef(0);
    const rafId = useRef<number>(0);

    useEffect(() => {
        const loop = () => {
            const now = performance.now();
            frames.current++;

            if (now - lastTime.current >= 200) { // Update every 200ms
                const fps = Math.round((frames.current * 1000) / (now - lastTime.current));

                setHistory(prev => {
                    const next = [...prev, fps];
                    if (next.length > 30) next.shift();
                    return next;
                });

                frames.current = 0;
                lastTime.current = now;
            }

            rafId.current = requestAnimationFrame(loop);
        };

        rafId.current = requestAnimationFrame(loop);
        return () => {
            if (rafId.current) cancelAnimationFrame(rafId.current);
        };
    }, []);

    const max = 70; // Fixed scale for consistency
    const points = history.map((fps, i) => {
        const x = i * (60 / 29); // Width 60px
        const y = 30 - Math.min((fps / max) * 30, 30); // Height 30px
        return `${x},${y}`;
    }).join(' ');

    const currentFps = history[history.length - 1];

    return (
        <div className="fixed z-[10000] top-0 left-0 bg-black border border-white/10 p-1 rounded pointer-events-auto select-none shadow-lg flex flex-col items-center group">
            <svg width="60" height="30" className="overflow-hidden">
                <polyline
                    fill="none"
                    stroke={currentFps < 30 ? "#ef4444" : "#4ade80"}
                    strokeWidth="3"
                    points={points}
                />
            </svg>
            <span className="text-[10px] font-mono font-bold text-white absolute bottom-[2px] right-[2px] min-w-[2ch] text-right pointer-events-none group-hover:opacity-100 opacity-100">{currentFps}</span>
        </div>
    );
};
