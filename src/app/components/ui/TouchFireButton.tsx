import React, { useRef } from 'react';
import { DeviceManager } from '../../../engine/input/DeviceManager';

export const TouchFireButton: React.FC<{ playerId: number }> = ({ playerId }) => {
    const pilotId = playerId - 1;
    const containerRef = useRef<HTMLDivElement>(null);

    const handlePress = (pressed: boolean) => {
        DeviceManager.setVirtualButton(`touch:${pilotId}`, 0, pressed);
    };

    const onTouchStart = (e: React.TouchEvent) => {
        e.stopPropagation();
        handlePress(true);
    };
    const onTouchEnd = (e: React.TouchEvent) => {
        e.stopPropagation();
        handlePress(false);
        // iOS sometimes fires touchcancel instead of touchend
    };

    const onTouchCancel = (e: React.TouchEvent) => {
        e.stopPropagation();
        handlePress(false);
    }

    const onMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        handlePress(true);
    };
    const onMouseUp = (e: React.MouseEvent) => {
        e.stopPropagation();
        handlePress(false);
    };
    const onMouseLeave = (e: React.MouseEvent) => {
        e.stopPropagation();
        handlePress(false);
    };

    return (
        <div className="relative flex flex-col items-center gap-2 pointer-events-auto">
            <div
                ref={containerRef}
                className="relative w-16 h-16 bg-red-600/60 active:bg-red-500/80 backdrop-blur-sm rounded-full border border-red-400/50 shadow-xl touch-none flex items-center justify-center cursor-pointer transition-colors"
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
                onTouchCancel={onTouchCancel}
                onMouseDown={onMouseDown}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseLeave}
            >
                <span className="text-white/80 font-bold text-sm tracking-widest select-none pointer-events-none">FIRE</span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 tracking-wider">P{playerId} WPN</span>
        </div>
    );
};
