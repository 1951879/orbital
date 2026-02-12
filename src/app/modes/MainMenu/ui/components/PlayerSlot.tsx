import React, { useRef, useState, useEffect } from 'react';
import { View, PerspectiveCamera, OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useStore } from '@/src/app/store/useStore';
import { AirplaneGeometry } from '@/src/app/core/entities/Airplane/models/AirplaneGeometry';
import { PLANES } from '@/src/app/components/ui/tabs/data';
import { useSlotInput } from '../hooks/useSlotInput';
import { AIcon, BIcon, DPadLeftIcon, DPadRightIcon, XIcon } from '@/src/app/core/ui/GamepadIcons';
import { useGamepadDetector } from '@/src/app/core/ui/useGamepadDetector';

// --- CONTROLS COMPONENT ---
const SlotControls: React.FC<{ gamepadIndex: number }> = ({ gamepadIndex }) => {
    const { camera, gl } = useThree();
    const controlsRef = useRef<OrbitControlsImpl>(null);

    useFrame((state, dt) => {
        if (!controlsRef.current || gamepadIndex < 0) return;

        const gp = navigator.getGamepads()[gamepadIndex];
        if (gp) {
            // Right Stick (Axes 2 & 3)
            const rx = gp.axes[2] || 0;
            const ry = gp.axes[3] || 0;
            const deadzone = 0.1;

            if (Math.abs(rx) > deadzone || Math.abs(ry) > deadzone) {
                // Rotate Camera
                const speed = 16 * dt;
                controlsRef.current.setAzimuthalAngle(controlsRef.current.getAzimuthalAngle() - rx * speed);
                controlsRef.current.setPolarAngle(controlsRef.current.getPolarAngle() - ry * speed);
                controlsRef.current.update();
            }
        }
    });

    return (
        <OrbitControls
            ref={controlsRef}
            enablePan={false}
            enableZoom={true}
            minDistance={2}
            maxDistance={8}
            autoRotate={false}
            makeDefault
        />
    );
};

interface PlayerSlotProps {
    index: number; // Slot Index (0-3)
}

export const PlayerSlot: React.FC<PlayerSlotProps> = ({ index }) => {
    const localParty = useStore(state => state.localParty);
    const updatePilot = useStore(state => state.updatePilot);
    const [hasGamepads, setHasGamepads] = useState(false);
    const isGamepadActive = useGamepadDetector();

    // Sync local state for existing logic (if needed, or replace usages)
    useEffect(() => {
        setHasGamepads(isGamepadActive);
    }, [isGamepadActive]);

    // Find pilot for this slot (if any)
    const pilot = localParty.find(p => p.id === index);
    const isActive = !!pilot;

    const handleJoin = (e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation();
        e.preventDefault();

        import('@/src/engine/session/SessionState').then(({ SessionState }) => {
            SessionState.addPlayer(index === 0 ? 'keyboard_wasd' : `gamepad:${index - 1}`, index);
        });
    };

    const handleLeave = (e: React.MouseEvent) => {
        e.stopPropagation();
        import('@/src/engine/session/SessionState').then(({ SessionState }) => {
            SessionState.removePlayer(index);
        });
    };

    // Cycle Plane Logic
    const handleCycle = (dir: number) => {
        if (!pilot) return;
        const currentIdx = PLANES.findIndex(p => p.id === pilot.airplane);
        let nextIdx = (currentIdx + dir + PLANES.length) % PLANES.length;
        updatePilot(index, { airplane: PLANES[nextIdx].id });
    };

    const handleReady = () => {
        if (!pilot) return;
        const newStatus = pilot.ui.status === 'ready' ? 'selecting' : 'ready';
        updatePilot(index, { ui: { ...pilot.ui, status: newStatus } });
    };

    // Bind Inputs (Buttons/Stick L)
    useSlotInput(
        pilot?.input.type || 'gamepad',
        pilot?.input.gamepadIndex ?? -1,
        isActive,
        {
            onPrev: () => handleCycle(-1),
            onNext: () => handleCycle(1),
            onConfirm: handleReady
        }
    );

    // Render Empty Slot
    if (!isActive) {
        return (
            <div className="flex-1 min-w-[140px] md:min-w-[200px] border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-4 bg-white/5 hover:bg-white/10 transition-colors group cursor-pointer" onClick={handleJoin}>
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-white/40 group-hover:text-white">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                </div>
                {/* Text only if gamepad detected */}
                {isGamepadActive && (
                    <span className="text-sm font-mono uppercase text-white/40 group-hover:text-white tracking-widest flex items-center gap-2">
                        <AIcon /> to Join
                    </span>
                )}
            </div>
        );
    }

    // Render Active Slot
    const isReady = pilot.ui.status === 'ready';
    const planeName = PLANES.find(p => p.id === pilot.airplane)?.name || 'Unknown';
    const gpIndex = pilot.input.type === 'gamepad' ? pilot.input.gamepadIndex : -1;

    return (
        <div className={`flex-1 min-w-[140px] md:min-w-[200px] relative rounded-xl overflow-hidden border-2 transition-all duration-300 flex flex-col ${isReady ? 'border-green-500 bg-transparent' : 'border-white/10 bg-transparent'}`}>

            {/* 3D VIEWPORT */}
            <div className="flex-1 relative min-h-[150px]">
                <View className="absolute inset-0">
                    <ambientLight intensity={1.5} />
                    <spotLight position={[5, 10, 5]} angle={0.5} penumbra={1} intensity={900} />
                    <pointLight position={[-10, -10, -10]} intensity={1} />

                    <PerspectiveCamera makeDefault position={[0, 0, 3.5]} fov={50} />

                    <SlotControls gamepadIndex={gpIndex} />

                    <group rotation={[0.7, -0.5, 0]} position={[0, -0.2, 0]}>
                        <AirplaneGeometry type={pilot.airplane} />
                    </group>
                </View>

                {/* HEADER: KICK BUTTON & B-HINT */}
                <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
                    {isGamepadActive && isActive && (
                        <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-full backdrop-blur-sm animate-pulse">
                            <BIcon />
                            <span className="text-[9px] font-bold text-white uppercase shadow-black drop-shadow-md">Hold</span>
                        </div>
                    )}
                    <button
                        onClick={handleLeave}
                        className="p-1.5 rounded-full bg-black/40 text-white/50 hover:text-red-400 hover:bg-black/60 transition-all"
                        title="Remove Player"
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* OVERLAY: PLANE SELECTION */}
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between z-10">
                    <div className="flex items-center gap-1">
                        {isGamepadActive && <DPadLeftIcon />}
                        <button
                            onClick={() => handleCycle(-1)}
                            className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                            </svg>
                        </button>
                    </div>

                    <span className="text-sm font-bold text-white uppercase tracking-wider drop-shadow-md">{planeName}</span>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => handleCycle(1)}
                            className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                        </button>
                        {isGamepadActive && <DPadRightIcon />}
                    </div>
                </div>
            </div>

            {/* FOOTER: PLAYER INFO & READY */}
            <div className={`h-12 flex items-center justify-between px-4 border-t transition-colors ${isReady ? 'bg-green-900/20 border-green-500/50' : 'bg-black/60 border-white/10'}`}>
                {/* Left: Name */}
                <span className="text-xs font-bold font-mono uppercase tracking-widest" style={{ color: pilot.color }}>
                    {pilot.name}
                </span>

                {/* Right: Ready Check */}
                <div
                    className="flex items-center gap-2 cursor-pointer group"
                    onClick={handleReady}
                >
                    <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${isReady ? 'text-green-400' : 'text-slate-500 group-hover:text-slate-300'} flex items-center gap-2`}>
                        {isGamepadActive && <AIcon />}
                        READY
                    </span>
                    <div className={`w-4 h-4 border rounded flex items-center justify-center transition-all ${isReady ? 'bg-green-500 border-green-500 text-black' : 'border-slate-600 group-hover:border-slate-400 bg-transparent'}`}>
                        {isReady && (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                                <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                            </svg>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
