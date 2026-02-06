
import React, { useEffect, useRef, useState } from 'react';
import { useSessionStore, EnginePlayer } from '../session/SessionState';
import { useFrame, useThree, extend } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { Vector4, Color, PerspectiveCamera as ThreePerspectiveCamera } from 'three';

// 1. Individual Viewport Component
const PlayerViewport: React.FC<{
    player: EnginePlayer,
    children: (player: EnginePlayer, cameraRef: React.MutableRefObject<ThreePerspectiveCamera | null>) => React.ReactNode
}> = ({ player, children }) => {
    const { gl, scene, size } = useThree();
    const cameraRef = useRef<ThreePerspectiveCamera>(null);

    useFrame(() => {
        const cam = cameraRef.current;
        if (!cam) return;

        // Calculate actual pixel values based on Canvas Size
        // viewport = { x: 0-1, y: 0-1, w: 0-1, h: 0-1 }
        // Y is usually bottom-up in Three.js? 
        // SessionState uses Top-Down logic (0,0 is Top Left)?
        // Helper recalculateViewports says:
        //   index 0 (Top) -> y=0.5. 
        //   ThreeJS setScissor (x, y, w, h) where y is from BOTTOM.
        //   So we need to flip Y.
        //   y_gl = 1 - y_session - h_session

        // Calculate Physical Pixels for GL Scissor directly from Drawing Buffer
        const width = gl.domElement.width;
        const height = gl.domElement.height;

        // CRITICAL: Y-Coordinate Flip
        // SessionState uses HTML-style coordinates (y=0 is TOP, y increases DOWNWARD)
        // WebGL uses bottom-left origin (y=0 is BOTTOM, y increases UPWARD)
        // Reference: glBottom = canvasRect.bottom - rect.bottom
        // Simplified: glY = height - (htmlY + htmlHeight)
        const htmlY = player.viewport.y;
        const htmlH = player.viewport.h;
        const glY = 1.0 - (htmlY + htmlH); // Flip to GL coords

        const px = Math.floor(player.viewport.x * width);
        const py = Math.floor(glY * height); // Use flipped Y
        const pw = Math.floor(player.viewport.w * width);
        const ph = Math.floor(player.viewport.h * height);

        gl.setViewport(px, py, pw, ph);
        gl.setScissor(px, py, pw, ph);
        gl.setScissorTest(true);

        // Render the scene with THIS camera
        // We assume 'scene' is the default scene containing world content
        gl.render(scene, cam);

    }, 11); // Priority 11 (after clear @ 10)

    return (
        <PerspectiveCamera
            ref={cameraRef}
            makeDefault={false} // We manage rendering manually
            position={[0, 0, 0]} // Manager will override
            fov={60}
            near={0.1}
            far={20000}
        >
            {children(player, cameraRef)}
        </PerspectiveCamera>
    );
};

// 2. Main System
interface ViewportSystemProps {
    children: (player: EnginePlayer, cameraRef: React.MutableRefObject<ThreePerspectiveCamera | null>) => React.ReactNode;
}

export const ViewportSystem: React.FC<ViewportSystemProps> = ({ children }) => {
    const players = useSessionStore(state => state.players);
    const { gl } = useThree();

    // Setup Main Render Loop
    // Priority 10: Run AFTER default render (Priority 0) to clear the "Ghost" full-screen render
    useFrame(() => {
        // Clear screen ONCE per frame
        gl.setScissorTest(false);
        gl.clear(true, true);
    }, 10); // Priority 10 (Override Default)

    // Force clear view offset on Default Camera (Just in case it polluted the state)
    const { camera: defaultCamera } = useThree();
    useEffect(() => {
        if (defaultCamera && (defaultCamera as any).clearViewOffset) {
            (defaultCamera as any).clearViewOffset();
            console.log('[ViewportSystem] Force cleared ViewOffset on Default Camera');
        }
    }, [defaultCamera]);

    // Disable auto-clear so we can render multiple viewports
    useEffect(() => {
        gl.autoClear = false;
        return () => {
            gl.autoClear = true;
        };
    }, [gl]);

    if (players.length === 0) return null;

    return (
        <>
            {players.map(p => (
                <group key={p.id}>
                    {/* Render the logic/hooks for this player */}
                    {/* We need to pass the Camera to the logic? 
                        The logic usually involves CameraManager looking for a Target.
                        The CameraManager typically controls 'useThree().camera'.
                        But here, we have a custom camera.
                        We need to solve the Camera Context.
                        
                        Solution: We don't render 'PlayerViewport' wrapping the children.
                        We render a Portal? No.
                        
                        We render the 'children' (Scene Content / CameraManager) and pass the Camera Ref?
                        Or simply: The 'children' IS the CameraManager, and we assume it works?
                        
                        Wait, CameraManager usually relies on 'useThree().camera'.
                        If we are in a sub-tree, 'useThree().camera' might still be the default one.
                        
                        We need a way to provide the specific camera to the CameraManager.
                    */}
                    <PlayerViewport player={p}>
                        {children}
                    </PlayerViewport>

                    {/* 
                       Alternative: Portals required for event isolation, but we are just rendering.
                       Let's assume we pass a Ref.
                     */}
                </group>
            ))}
        </>
    );
};

// 3. Simplified Implementation for Phase 4 Step 1
// We will just render the Viewports and let them be empty for now, 
// just to prove the Scissor Logic works.
// We will inject a text helper or simple box.

export const ScissorViewportSystem: React.FC<ViewportSystemProps> = ({ children }) => {
    const players = useSessionStore(state => state.players);
    console.log(`[ViewportSystem] Rendering with ${players.length} players`);
    const { gl, scene, size } = useThree();

    // Force clear view offset on Default Camera (Just in case it polluted the state)
    const { camera: defaultCamera } = useThree();
    useEffect(() => {
        if (defaultCamera && (defaultCamera as any).clearViewOffset) {
            (defaultCamera as any).clearViewOffset();
        }
    }, [defaultCamera]);

    // Handle SINGLE PLAYER Fallback (Standard R3F Behavior)
    if (players.length <= 1) {
        // Just render children directly. 
        // We need to provide a camera ref that points to the default camera efficiently
        // Or we pass a dummy ref since children usually access 'useThree().camera' anyway?
        // The 'children' generic expects (player, cameraRef).
        const p = players[0];
        if (!p) return null;

        // We use a Ref that points to the Default Camera for compatibility
        return (
            <SinglePlayerBridge player={p} defaultCam={defaultCamera}>
                {children}
            </SinglePlayerBridge>
        );
    }

    // --- MULTIPLAYER (Manual Scissor) ---

    useEffect(() => {
        gl.autoClear = false;
        return () => {
            gl.autoClear = true;
            gl.setScissorTest(false);

            // Reset Rendering Viewport to full screen to prevent menu from being clipped
            // Use domElement size directly to ensure full coverage
            const dw = gl.domElement.width;
            const dh = gl.domElement.height;
            console.log(`[ViewportSystem] Reset: DOM(${dw}x${dh}) vs ThreeSize(${size.width}x${size.height}) x DPR(${gl.getPixelRatio()})`);

            gl.setViewport(0, 0, dw, dh);
            gl.setScissor(0, 0, dw, dh);
        }
    }, [gl, size]);

    useFrame(() => {
        gl.setScissorTest(false);
        gl.clear(true, true);
    }, -1);

    return (
        <>
            {players.map(player => (
                <SingleViewport
                    key={player.id}
                    player={player}
                    scene={scene}
                    renderContent={children}
                />
            ))}
        </>
    );
};

// Bridge/Wrapper to adapt Single Player to the children signature
const SinglePlayerBridge: React.FC<{
    player: EnginePlayer,
    defaultCam: any,
    children: (player: EnginePlayer, cameraRef: React.MutableRefObject<ThreePerspectiveCamera | null>) => React.ReactNode
}> = ({ player, defaultCam, children }) => {
    const ref = useRef(defaultCam);
    useEffect(() => { ref.current = defaultCam; }, [defaultCam]);

    return <>{children(player, ref)}</>;
};

const SingleViewport = ({ player, scene, renderContent }: any) => {
    const { gl, size } = useThree();

    // Use manual camera instance to avoid Drei side-effects
    const cameraRef = useRef<ThreePerspectiveCamera>(new ThreePerspectiveCamera(60, 1, 0.1, 20000));

    // Ensure Ref matches the instance (for consumers)
    // We don't need to re-create it unless necessary, but useRef holds it.

    useFrame(() => {
        const cam = cameraRef.current;
        if (!cam) return;

        // Calculate Physical Pixels for GL Scissor directly from Drawing Buffer
        const width = gl.domElement.width;
        const height = gl.domElement.height;

        // CRITICAL: Y-Coordinate Flip (HTML top-down -> WebGL bottom-up)
        const htmlY = player.viewport.y;
        const htmlH = player.viewport.h;
        const glY = 1.0 - (htmlY + htmlH);

        const px = Math.floor(player.viewport.x * width);
        const py = Math.floor(glY * height);
        const pw = Math.floor(player.viewport.w * width);
        const ph = Math.floor(player.viewport.h * height);

        // Update Cam Aspect
        if (ph > 0) {
            cam.aspect = pw / ph;
            cam.updateProjectionMatrix();
        }

        // DEBUG: Ensure no View Offset persists
        cam.clearViewOffset();

        // LOGGING (Throttled)
        // LOGGING (Throttled)
        if (Math.random() < 0.005) {
            console.log(`[VP] P${player.id} Scissor: X${px} Y${py} W${pw} H${ph} (Canvas: ${width}x${height})`);
        }

        gl.setViewport(px, py, pw, ph);
        gl.setScissor(px, py, pw, ph);
        gl.setScissorTest(true);
        gl.render(scene, cam);
    }, 11);

    return (
        <group>
            {renderContent(player, cameraRef)}
        </group>
    );
}

export default ScissorViewportSystem;
