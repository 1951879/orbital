import React, { useRef, useState } from 'react';
import { useStore } from '../../store/useStore';
import { DeviceManager } from '../../../engine/input/DeviceManager';

export const VirtualJoystick: React.FC<{ playerId: number }> = ({ playerId }) => {
  const pilotId = playerId - 1;
  const setPilotJoystickState = useStore((state) => state.setPilotJoystickState);
  const invertPlayer2 = useStore((state) => state.invertPlayer2);
  const containerRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);

  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);

  const MAX_RADIUS = 48;
  const isInverted = playerId === 2 && invertPlayer2;

  const handleStart = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    setIsActive(true);
    updateJoystick(clientX, clientY);
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isActive || !containerRef.current) return;
    updateJoystick(clientX, clientY);
  };

  const handleEnd = () => {
    setIsActive(false);
    setKnobPos({ x: 0, y: 0 });
    setPilotJoystickState(pilotId, { x: 0, y: 0, active: false });
    DeviceManager.setVirtualAxis(`touch:${pilotId}`, 0, 0);
    DeviceManager.setVirtualAxis(`touch:${pilotId}`, 1, 0);
  };

  const updateJoystick = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerY = rect.top + rect.height / 2;
    const centerX = rect.left + rect.width / 2;

    let dx = clientX - centerX;
    let dy = clientY - centerY;

    if (isInverted) {
      dx = -dx;
      dy = -dy;
    }

    const distance = Math.sqrt(dx * dx + dy * dy);
    const limitedDist = Math.min(distance, MAX_RADIUS);
    const angle = Math.atan2(dy, dx);
    const newX = Math.cos(angle) * limitedDist;
    const newY = Math.sin(angle) * limitedDist;

    setKnobPos({ x: newX, y: newY });
    const normX = newX / MAX_RADIUS;
    const normY = newY / MAX_RADIUS;
    setPilotJoystickState(pilotId, {
      x: normX,
      y: normY,
      active: true
    });
    DeviceManager.setVirtualAxis(`touch:${pilotId}`, 0, normX);
    DeviceManager.setVirtualAxis(`touch:${pilotId}`, 1, normY);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-28 h-28 bg-slate-800/40 backdrop-blur-sm rounded-full border border-slate-600/50 touch-none pointer-events-auto shadow-2xl"
      onTouchStart={(e) => {
        e.stopPropagation();
        if (e.targetTouches.length > 0) handleStart(e.targetTouches[0].clientX, e.targetTouches[0].clientY);
      }}
      onTouchMove={(e) => {
        e.stopPropagation();
        if (e.targetTouches.length > 0) handleMove(e.targetTouches[0].clientX, e.targetTouches[0].clientY);
      }}
      onTouchEnd={(e) => { e.stopPropagation(); handleEnd(); }}
    >
      <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-slate-500 rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div
        ref={knobRef}
        className="absolute top-1/2 left-1/2 w-12 h-12 bg-blue-500/80 rounded-full shadow-lg border border-blue-300/30"
        style={{
          transform: `translate(calc(-50% + ${knobPos.x}px), calc(-50% + ${knobPos.y}px))`,
          transition: isActive ? 'none' : 'transform 0.2s ease-out'
        }}
      />
      <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-slate-500 tracking-wider">
        P{playerId}
      </div>
    </div>
  );
};