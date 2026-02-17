import React from 'react';
import { HeaderShell } from './HeaderShell';
import { EllipsisMenu } from './EllipsisMenu';
import { SquadStatus } from './SquadStatus';
import { NetworkStatus } from './NetworkStatus';
import { PrimaryLoadingButton, LaunchState } from './PrimaryLoadingButton';
import { GamepadButton } from '../../GamepadIcons';
import { useHostHints } from '../../../hooks/useInputHints';

interface SharedHeaderProps {
    // Center slot — tabs, title, or custom content
    title?: string;
    centerContent?: React.ReactNode;

    // Right-side buttons
    onAbort?: () => void;
    abortLabel?: string;
    showAbort?: boolean;

    onPrimary?: () => void;
    primaryLabel?: string;
    primaryState?: LaunchState;

    // Left-side options
    showSquadron?: boolean;
    showNetwork?: boolean;

    // Callbacks
    onSettings?: () => void;
}

// ─── GAMEPAD HINT (internal) ────────────────────────────────────────────────

const GamepadHint: React.FC<{ action: 'Start' | 'Select' }> = ({ action }) => {
    const hints = useHostHints();
    if (!hints.showGamepad) return null;
    return <GamepadButton type={hints.gamepadType} button={action} />;
};

// ─── SHARED HEADER ──────────────────────────────────────────────────────────

export const SharedHeader: React.FC<SharedHeaderProps> = ({
    title,
    centerContent,
    onAbort,
    abortLabel = 'Abort',
    showAbort = true,
    onPrimary,
    primaryLabel = 'LAUNCH',
    primaryState = 'ready',
    showSquadron = true,
    showNetwork = true,
    onSettings,
}) => {
    return (
        <HeaderShell>
            {/* LEFT SECTION (Responsive Hidden) */}
            <div className="contents portrait:hidden">
                <EllipsisMenu onSettings={onSettings} />

                {/* SEPARATOR */}
                <div className="w-px h-full bg-white/10" />

                {showSquadron && <SquadStatus />}

                {/* SEPARATOR */}
                {showSquadron && <div className="w-px h-full bg-white/10" />}

                {showNetwork && <NetworkStatus />}

                {/* SEPARATOR */}
                {showNetwork && <div className="w-px h-full bg-white/10" />}
            </div>

            {/* CENTER (Tabs or Title) */}
            <div className="flex items-center gap-1 h-full portrait:pl-2 landscape:absolute landscape:left-1/2 landscape:-translate-x-1/2">
                {title && (
                    <div className="text-white/90 font-black italic tracking-widest text-sm md:text-base drop-shadow-md">
                        {title}
                    </div>
                )}
                {centerContent}
            </div>

            {/* SPACER */}
            <div className="flex-1" />

            {/* RIGHT CONTENT — Abort + Primary */}
            <div className="flex h-full">
                {showAbort && onAbort && (
                    <button
                        onClick={onAbort}
                        className="h-full px-4 md:px-5 font-bold text-[10px] md:text-xs uppercase tracking-[0.1em] border-0 border-l border-white/10 text-red-400/70 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 flex items-center gap-3"
                    >
                        <GamepadHint action="Select" />
                        {abortLabel}
                    </button>
                )}
                {onPrimary && (
                    <PrimaryLoadingButton
                        onClick={onPrimary}
                        state={primaryState}
                        label={primaryLabel}
                        hint={<GamepadHint action="Start" />}
                    />
                )}
            </div>
        </HeaderShell>
    );
};
