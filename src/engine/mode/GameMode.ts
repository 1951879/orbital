import React from 'react';

export interface GameMode {
    id: string; // e.g. "free_flight" or "main_menu"

    // Components to Render
    SceneComponent: React.FC;
    UIComponent: React.FC;
    ViewportComponent?: React.FC<{
        player: any,
        cameraRef: any,
        cameras?: Record<string, React.FC<any>> // Injected Cameras
    }>;

    // Logic Loop
    update: (dt: number) => void;

    // Optional Layout Override (e.g. 'single' vs 'default')
    getLayoutOverride?: () => string;

    // Lifecycle
    init: () => void;
    dispose: () => void;
}
