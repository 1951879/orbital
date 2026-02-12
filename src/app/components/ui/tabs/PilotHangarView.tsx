

import React, { useState, useRef } from 'react';
import { View } from '@react-three/drei';
import { AirplaneGeometry } from '../../../core/entities/Airplane/models/AirplaneGeometry';
import { LocalPilot } from '../../../../types';
import { useStore } from '../../../store/useStore';

interface PilotHangarViewProps {
    pilot: LocalPilot;
    onCycle: (dir: number) => void;
}

export const PilotHangarView: React.FC<PilotHangarViewProps> = ({ pilot, onCycle }) => {
    const touchStart = useRef<number | null>(null);
    const isReady = pilot.ui.status === 'ready';

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStart.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStart.current === null) return;
        const deltaX = e.changedTouches[0].clientX - touchStart.current;
        if (Math.abs(deltaX) > 50) {
            onCycle(deltaX > 0 ? -1 : 1);
        }
        touchStart.current = null;
    };

    return (
        <div
            className="w-full h-full relative"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {/* 3D View Portal */}
            <View className="absolute inset-0 z-0">
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1500} />

                <group rotation={[pilot.ui.viewRotation.y, pilot.ui.viewRotation.x, 0]}>
                    <AirplaneGeometry type={pilot.airplane} throttle={0} />
                </group>

                {/* Visual Floor Shadow for Hangar feel */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
                    <planeGeometry args={[10, 10]} />
                    <meshStandardMaterial color="#020617" transparent opacity={0.5} />
                </mesh>
            </View>

            {/* UI Overlay */}
            <div className={`absolute inset-0 z-10 flex flex-col justify-between p-4 pointer-events-none transition-colors duration-500 ${isReady ? 'bg-green-500/10' : 'bg-transparent'}`}>
                <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-tighter">Pilot {pilot.id + 1}</span>
                        <span className="text-sm font-black text-white italic uppercase">{pilot.name}</span>
                    </div>
                </div>

                <div className="flex justify-between items-end">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${isReady ? 'bg-green-600 border-green-400 text-white shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                        {isReady ? 'MISSION READY' : (pilot.airplane.toUpperCase().replace('_', ' '))}
                    </span>

                    {!isReady && (
                        <div className="flex gap-1 animate-pulse">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500/20" />
                        </div>
                    )}
                </div>
            </div>

            {/* Selection Border */}
            <div className={`absolute inset-0 border-2 rounded-xl transition-all duration-300 pointer-events-none ${isReady ? 'border-green-500 shadow-[inset_0_0_20px_rgba(34,197,94,0.2)]' : 'border-white/5 opacity-50 group-hover:opacity-100 group-hover:border-blue-500/30'}`} />
        </div>
    );
};
