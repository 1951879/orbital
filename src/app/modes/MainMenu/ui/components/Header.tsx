import React, { useState, useEffect } from 'react';
import { useStore } from '../../../../store/useStore';
import { useMainMenuStore } from '../../MainMenuStore';
import { Button } from '../kit/Button';
import { LbIcon, RbIcon } from '@/src/app/core/ui/GamepadIcons';
import { useGamepadDetector } from '@/src/app/core/ui/useGamepadDetector';

export const Header: React.FC = () => {
    const localParty = useStore((state) => state.localParty);
    const isOnline = useStore((state) => state.isOnline);
    const setScreenConfigOpen = useMainMenuStore((state) => state.setScreenConfigOpen);
    const currentScreen = useMainMenuStore((state) => state.currentScreen);
    const setScreen = useMainMenuStore((state) => state.setScreen);

    const hasGamepad = useGamepadDetector();

    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const handleFS = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFS);
        return () => document.removeEventListener('fullscreenchange', handleFS);
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => console.error(err));
        } else {
            document.exitFullscreen();
        }
    };

    return (
        <div className="h-14 md:h-16 bg-slate-950/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4 md:px-8 z-50 shrink-0 shadow-2xl relative">
            {/* LEFT: SQUAD STATUS */}
            <div className="flex items-center gap-4 md:gap-8">
                {/* Stats */}
                <div className="flex items-center gap-2 md:gap-4 text-[10px] md:text-xs font-mono uppercase text-slate-400">
                    {/* Squad Dots */}
                    <div className="flex items-center gap-1.5" title="Squad Status">
                        {Array.from({ length: 4 }).map((_, i) => {
                            const pilot = localParty.find(p => p.id === i);
                            let colorClass = 'bg-slate-700'; // Default: Empty/Inactive
                            let glowClass = '';

                            if (pilot) {
                                if (pilot.ui.status === 'ready') {
                                    colorClass = 'bg-green-500'; // Ready
                                    glowClass = 'shadow-[0_0_8px_rgba(34,197,94,0.8)]';
                                } else {
                                    colorClass = 'bg-blue-500'; // Joined/Selecting
                                    glowClass = 'shadow-[0_0_8px_rgba(59,130,246,0.8)]';
                                }
                            }

                            return (
                                <div
                                    key={i}
                                    className={`w-2 h-2 rounded-full transition-all duration-300 ${colorClass} ${glowClass}`}
                                />
                            );
                        })}
                    </div>

                    {/* Separator */}
                    <div className="w-px h-8 bg-white/10 mx-1" />

                    {/* Net Status */}
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'bg-slate-700'}`} />
                        <span className="hidden sm:inline">NET</span>
                    </div>
                </div>
            </div>

            {/* CENTER: TAB NAVIGATION */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
                {hasGamepad && <LbIcon />}
                <div className="flex items-center gap-1">
                    {[
                        { id: 'squadron', label: 'SQUADRON' },
                        { id: 'operations', label: 'OPERATIONS' },
                        { id: 'briefing', label: 'BRIEFING' }
                    ].map(tab => {
                        const isActive = currentScreen === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setScreen(tab.id as any)}
                                className={`px-2 py-1 md:px-4 md:py-1.5 rounded text-[10px] md:text-xs font-bold uppercase transition-all ${isActive
                                    ? 'bg-white/10 text-white shadow-[0_0_10px_rgba(255,255,255,0.2)]'
                                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
                {hasGamepad && <RbIcon />}
            </div>

            {/* RIGHT: OPTIONS */}
            <div className="flex items-center gap-1 md:gap-2">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setScreenConfigOpen(true)}
                    title="Screen Options"
                    className="px-1 md:px-3"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 md:w-5 md:h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                    </svg>
                </Button>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleFullscreen}
                    title="Toggle Fullscreen"
                >
                    {isFullscreen ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 md:w-5 md:h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5M15 15l5.25 5.25" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 md:w-5 md:h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                        </svg>
                    )}
                </Button>
            </div>
        </div>
    );
};
