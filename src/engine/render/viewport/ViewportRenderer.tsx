import React, { useLayoutEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Vector4, Quaternion, Vector3 } from 'three';

interface Props {
    cameraRefs: React.MutableRefObject<(PerspectiveCamera | null)[]>;
    viewRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
    playerCount: number;
}

/**
 * Manages the WebGL rendering into the stencils defined by ViewportStencilLayout.
 * Runs in the main render loop.
 */
export const ViewportRenderer: React.FC<Props> = ({ cameraRefs, viewRefs, playerCount }) => {
    const { gl, scene, size } = useThree();

    // Disable auto-clear because we manage clearing manually
    useLayoutEffect(() => {
        gl.autoClear = false;
        // Restore on unmount
        return () => {
            gl.autoClear = true;
            gl.setScissorTest(false);
            gl.setViewport(0, 0, size.width, size.height);
            gl.setScissor(0, 0, size.width, size.height);
        };
    }, [gl, size]);

    useFrame(() => {
        // 1. Clear the entire screen once per frame
        // We need to clear depth/color/stencil buffers
        gl.setViewport(0, 0, size.width, size.height);
        gl.setScissor(0, 0, size.width, size.height);
        gl.setScissorTest(true);
        gl.clear(true, true, true);

        // 2. Render each player's view
        for (let i = 0; i < playerCount; i++) {
            const div = viewRefs.current[i];
            const camera = cameraRefs.current[i];

            if (!div || !camera) continue;

            // Measure the div in screen (CSS) pixels
            const rect = div.getBoundingClientRect();

            // Calculate WebGL viewport parameters
            // Note: Three.js/WebGL Y-axis is bottom-up, DOM is top-down.
            // We also need to account for the canvas position if it's not full screen (though it usually is).
            const canvasRect = gl.domElement.getBoundingClientRect();

            // Compute relative position within the canvas
            // This handles if the canvas is offset or scaled
            const left = rect.left - canvasRect.left;

            // Invert Y for WebGL
            const bottom = canvasRect.height - (rect.bottom - canvasRect.top);





            const width = rect.width;
            const height = rect.height;

            // Apply Viewport & Scissor
            gl.setViewport(left, bottom, width, height);
            gl.setScissor(left, bottom, width, height);
            gl.setScissorTest(true);

            // Update Camera Aspect Ratio if changed
            if (height > 0) {
                const aspect = width / height;
                if (Math.abs(camera.aspect - aspect) > 0.001) {
                    camera.aspect = aspect;
                    camera.updateProjectionMatrix();
                }
            }

            // Render Scene
            gl.render(scene, camera);
        }
    }, 1); // Render priority 1 (after default render, though we disabled default render via autoClear usually)

    return null;
};
