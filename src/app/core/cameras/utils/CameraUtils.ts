import { Vector3, Camera } from 'three';

/**
 * Cubic ease-in-out function for smooth transitions
 *
 * @param t - The time value (0 to 1)
 * @returns The eased value
 */
export const easeInOutCubic = (t: number): number => {
    return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

/**
 * Linearly interpolate between two Vector3 values
 *
 * @param start - The starting vector
 * @param end - The ending vector
 * @param t - The interpolation factor (0 to 1)
 * @returns A new Vector3 with the result
 */
export const lerpVector3 = (
    start: Vector3,
    end: Vector3,
    t: number
): Vector3 => {
    return new Vector3().lerpVectors(start, end, t);
};

/**
 * Smoothly interpolate camera position and look target
 *
 * @param camera - The camera to transform
 * @param targetPos - The desired position
 * @param targetLookAt - The point to look at
 * @param targetUp - The up vector
 * @param delta - Time delta
 * @param posSpeed - Speed of position interpolation
 * @param lookSpeed - Speed of look/up interpolation
 */
export const smoothCameraTransform = (
    camera: Camera,
    targetPos: Vector3,
    targetLookAt: Vector3,
    targetUp: Vector3,
    delta: number,
    posSpeed: number = 5.0,
    lookSpeed: number = 3.0
): void => {
    camera.position.lerp(targetPos, delta * posSpeed);
    camera.up.lerp(targetUp, delta * lookSpeed);
    camera.lookAt(targetLookAt);
};

/**
 * Check if camera needs to snap (teleported far away)
 *
 * @param camera - The camera to check
 * @param targetPos - The target position
 * @param threshold - Distance threshold to trigger snap
 * @returns True if the camera should snap
 */
export const shouldSnapCamera = (
    camera: Camera,
    targetPos: Vector3,
    threshold: number = 500
): boolean => {
    return camera.position.distanceTo(targetPos) > threshold;
};
