/**
 * Calculate view offset for UI elements (sidebars, headers, footers)
 * Returns pixel offset to shift camera view
 */
// Optional context for Orbit mode
export interface OrbitContext {
    isMenuOpen: boolean;
}

export const calculateViewOffset = (
    mode: 'orbit' | 'squadron' | 'chase',
    screenWidth: number,
    screenHeight: number,
    orbitContext?: OrbitContext
): { x: number; y: number } => {
    const isLandscape = screenWidth > screenHeight;

    // Orbit mode: Shift for Sidebar Menu (Multiplayer/Config)
    if (mode === 'orbit' && orbitContext?.isMenuOpen && isLandscape) {
        return { x: -screenWidth * 0.25, y: 0 };
    }

    // Default: No offset
    return { x: 0, y: 0 };
};

/**
 * Check if view offset is significant enough to apply
 */
export const isSignificantOffset = (offset: { x: number; y: number }): boolean => {
    return Math.abs(offset.x) > 1 || Math.abs(offset.y) > 1;
};
