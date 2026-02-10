import React, { useEffect, useRef } from 'react';

interface Props {
    playerCount: number;
    // We can add 'grid' support here if needed for 3-4 players, currently focusing on 1-2 based on usage
    // but the CSS implementation handles up to 4 easily.
    onRefsReady: (refs: (HTMLDivElement | null)[]) => void;
}

/**
 * Renders an invisible HTML grid that defines the viewport areas for each player.
 * The WebGL renderer measures these divs to determine where to draw.
 */
export const ViewportStencilLayout: React.FC<Props> = ({ playerCount, onRefsReady }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Update refs when player count changes
    useEffect(() => {
        // Trim refs array if needed, though mostly we just want to ensure we pass the current set
        onRefsReady(itemRefs.current.slice(0, playerCount));
    }, [playerCount, onRefsReady]);

    // CSS classes based on player count
    const getContainerClass = () => {
        switch (playerCount) {
            case 1:
                return "w-full h-full";
            case 2:
                // Default to horizontal split (top/bottom) for mobile friendliness, 
                // or we could check aspect ratio. For now, let's assume standard split.
                // Actually, typical split screen is usually horizontal split (top/bottom) or vertical (left/right).
                // Let's use a flexible class that we can tweak or pass as a prop later.
                // For now: Vertical split (Left/Right) is standard for wide screens, Horizontal (Top/Bottom) for tall.
                // We'll use Flexbox.
                return "flex flex-col w-full h-full";
            /* 
               logic: 
               Mobile (portrait default): flex-col (Top/Bottom)
               Desktop (landscape default): flex-row (Left/Right)
               Tailwind 'md' breakpoint handles the switch.
            */
            case 3:
            case 4:
                return "grid grid-cols-2 grid-rows-2 w-full h-full";
            default:
                return "w-full h-full";
        }
    };

    return (
        <div className={`absolute inset-0 pointer-events-none z-0 ${getContainerClass()}`} ref={containerRef}>
            {Array.from({ length: playerCount }).map((_, i) => (
                <div
                    key={i}
                    ref={(el) => { itemRefs.current[i] = el; }}
                    className="relative w-full h-full flex-1 min-w-0 min-h-0"
                    style={{
                        // Debug border - remove or make transparent in prod
                        // border: '1px solid rgba(255,0,0,0.1)' 
                    }}
                />
            ))}
        </div>
    );
};
