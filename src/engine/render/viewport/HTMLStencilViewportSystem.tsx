import React, { useRef } from 'react';
// Force TS Re-index

import { PerspectiveCamera } from '@react-three/drei';
import { PerspectiveCamera as ThreePerspectiveCamera } from 'three';
import { useSessionStore } from '../../session/SessionState';
import { ViewportRenderer } from './ViewportRenderer';

interface Props {
    children: (player: any, cameraRef: React.RefObject<ThreePerspectiveCamera>) => React.ReactNode;
    viewRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
}

// Helper component to manage a stable ref for each player's camera
const ViewportCameraWrapper: React.FC<{
    player: any;
    index: number;
    children: Props['children'];
    registerCamera: (index: number, ref: ThreePerspectiveCamera | null) => void;
}> = ({ player, index, children, registerCamera }) => {
    // Create a stable ref for this specific camera
    const camRef = useRef<ThreePerspectiveCamera>(null);

    // Sync with the parent's array whenever the ref updates or on mount/unmount
    // However, PerspectiveCamera uses a callback ref or forwardRef.
    // We can just use the ref callback on PerspectiveCamera to update both.

    return (
        <PerspectiveCamera
            manual
            makeDefault={index === 0}
            ref={(ref) => {
                camRef.current = ref;
                registerCamera(index, ref);
            }}
            position={[0, 10, 10]}
        >
            {/* Pass the STABLE camRef to the child (CameraManager) */}
            {children(player, camRef)}
        </PerspectiveCamera>
    );
};

export const HTMLStencilViewportSystem: React.FC<Props> = ({ children, viewRefs }) => {
    const players = useSessionStore(state => state.players);
    const cameraRefs = useRef<(ThreePerspectiveCamera | null)[]>([]);

    const registerCamera = (index: number, ref: ThreePerspectiveCamera | null) => {
        cameraRefs.current[index] = ref;
    };

    return (
        <>
            {/* Layer 2: Cameras & Scene Content */}
            {players.map((player, i) => (
                <ViewportCameraWrapper
                    key={player.id}
                    player={player}
                    index={i}
                    children={children}
                    registerCamera={registerCamera}
                />
            ))}

            {/* Layer 3: The Render Loop */}
            <ViewportRenderer
                cameraRefs={cameraRefs}
                viewRefs={viewRefs}
                playerCount={players.length}
            />
        </>
    );
};
