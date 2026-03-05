import React, { useState, useEffect } from 'react';

export const IosInstallPrompt: React.FC = () => {
    const [isIos, setIsIos] = useState(false);
    const [isStandalone, setIsStandalone] = useState(true); // default true to avoid flash
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);

        // Typecast needed because standalone is an Apple-specific non-standard property
        const nav = window.navigator as any;
        const isStandaloneBrowser = ('standalone' in nav) && nav.standalone;

        setIsIos(isIosDevice);
        setIsStandalone(!!isStandaloneBrowser);

        if (isIosDevice && !isStandaloneBrowser) {
            const dismissed = localStorage.getItem('iosInstallPromptDismissed');
            if (!dismissed) {
                // Add a small delay so it doesn't pop up instantly
                const timer = setTimeout(() => setShowPrompt(true), 2000);
                return () => clearTimeout(timer);
            }
        }
    }, []);

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('iosInstallPromptDismissed', 'true');
    };

    if (!showPrompt) return null;

    return (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-[90%] max-w-sm bg-slate-800/95 backdrop-blur-md border border-slate-700/50 shadow-2xl rounded-2xl p-4 z-[100] text-slate-100 flex flex-col gap-3 font-sans animate-in fade-in slide-in-from-bottom-5 duration-500">
            <button
                onClick={handleDismiss}
                className="absolute top-2 right-3 text-slate-400 hover:text-white transition-colors text-lg p-1"
                aria-label="Close prompt"
            >
                ✕
            </button>
            <div className="flex items-center gap-4 mt-1">
                <div className="w-14 h-14 bg-slate-700/50 rounded-xl flex items-center justify-center shrink-0 border border-slate-600/50 overflow-hidden shadow-inner">
                    <img src="/apple-touch-icon.png" alt="App Icon" className="w-full h-full object-cover" />
                </div>
                <div>
                    <h3 className="font-bold text-base text-white tracking-wide">Install Blueprint</h3>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-[220px]">
                        For a true <span className="text-blue-400 font-medium">fullscreen</span> experience, add this simulation to your home screen.
                    </p>
                </div>
            </div>

            <div className="bg-slate-900/50 rounded-lg p-3 text-xs text-slate-300 border border-slate-800 flex items-center gap-2 mt-1">
                <span className="text-sm">1.</span>
                <span>Tap the Share icon</span>
                <span className="inline-flex items-center justify-center w-6 h-6 bg-slate-100 text-slate-900 rounded-[4px] font-bold text-sm shadow-sm mx-1">
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
                </span>
                <span>below.</span>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3 text-xs text-slate-300 border border-slate-800 flex items-center gap-2">
                <span className="text-sm">2.</span>
                <span>Select <strong className="text-white">"Add to Home Screen"</strong></span>
            </div>
        </div>
    );
};
