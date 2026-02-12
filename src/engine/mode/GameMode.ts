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

    // Lifecycle
    init: () => void;
    dispose: () => void;
}
