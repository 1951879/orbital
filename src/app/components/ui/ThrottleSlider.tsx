
import React, { useRef } from 'react';
import { useStore } from '../../store/useStore';

export const ThrottleSlider: React.FC<{ playerId: number }> = ({ playerId }) => {
  const pilotId = playerId - 1;
  // Fix: Use ?? 0.5 to allow 0 to be a valid value
  const throttle = useStore((state) => state.localParty[pilotId]?.throttle ?? 0);
  const setPilotThrottle = useStore((state) => state.setPilotThrottle);
  const invertPlayer2 = useStore((state) => state.invertPlayer2);
  const containerRef = useRef<HTMLDivElement>(null);

  const isInverted = playerId === 2 && invertPlayer2;

  const handleMove = (clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    let pct = 0;

    if (isInverted) {
      const distFromTop = clientY - rect.top;
      pct = Math.max(0, Math.min(1, distFromTop / rect.height));
    } else {
      const distFromBottom = rect.bottom - clientY;
      pct = Math.max(0, Math.min(1, distFromBottom / rect.height));
    }

    setPilotThrottle(pilotId, pct);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (e.targetTouches.length > 0) handleMove(e.targetTouches[0].clientY);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (e.targetTouches.length > 0) handleMove(e.targetTouches[0].clientY);
  };
  const onMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    const onMouseMove = (ev: MouseEvent) => handleMove(ev.clientY);
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    handleMove(e.clientY);
  };

  return (
    <div className="relative flex flex-col items-center gap-2 pointer-events-auto">
      <div
        ref={containerRef}
        className="relative w-10 h-40 bg-slate-800/40 backdrop-blur-sm rounded-full border border-slate-600/50 overflow-hidden cursor-ns-resize shadow-xl touch-none"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onMouseDown={onMouseDown}
      >
        <div
          className="absolute bottom-0 left-0 right-0 bg-blue-500/60 transition-[height] duration-75 ease-linear"
          style={{ height: `${throttle * 100}%` }}
        />
        <div
          className="absolute left-0 right-0 h-1 bg-white/80 shadow-[0_0_10px_rgba(255,255,255,0.5)]"
          style={{ bottom: `${throttle * 100}%`, transform: 'translateY(50%)' }}
        />
        <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none opacity-30">
          {[...Array(5)].map((_, i) => <div key={i} className="w-1/2 h-px bg-slate-300 mx-auto" />)}
        </div>
      </div>
      <span className="text-[10px] font-bold text-slate-400 tracking-wider">P{playerId} THR</span>
    </div>
  );
};
