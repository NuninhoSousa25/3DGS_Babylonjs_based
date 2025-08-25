/* ========================================================================
   3D VIEWER - CAMERA CONTROL & NAVIGATION
   ========================================================================
   
   PURPOSE:
   Manages camera setup, navigation controls, and smooth camera animations.
   Provides arc-rotate camera with touch support, auto-rotation, and 
   configurable limits. Handles both desktop and mobile interactions.
   
   EXPORTS:
   - setupCamera() - Initialize and configure arc-rotate camera
   - animateCamera() - Smooth camera movement to target position
   
   FEATURES:
   - Arc-rotate camera with configurable limits
   - Touch and mouse navigation support
   - Auto-rotation with idle detection
   - Smooth animation system
   - Responsive sensitivity settings
   - Mobile-optimized controls
   
   DEPENDENCIES:
   - Babylon.js camera system
   - Configuration constants for camera settings
   - Gesture control for advanced touch handling
   
   ======================================================================== */

import { CONFIG } from './config.js';
import { GestureControl } from './gestureControl.js';

/**
 * Creates and configures an ArcRotateCamera with optimized settings for 3D model viewing
 * @param {BABYLON.Scene} scene - The Babylon.js scene to attach the camera to
 * @param {HTMLCanvasElement} canvas - HTML canvas element for camera controls
 * @param {Object} config - Configuration object containing camera settings
 * @param {Object} config.camera - Camera-specific configuration
 * @param {number} config.camera.alpha - Initial horizontal rotation angle (radians)
 * @param {number} config.camera.beta - Initial vertical rotation angle (radians) 
 * @param {number} config.camera.radius - Initial distance from target
 * @param {number} config.camera.minZ - Near clipping plane
 * @param {boolean} config.camera.useAutoRotationBehavior - Enable auto-rotation when idle
 * @returns {BABYLON.ArcRotateCamera} Configured camera ready for 3D model viewing
 * @description Sets up camera with mobile-optimized controls, auto-rotation, wheel precision,
 *              and integrates with camera limits system for restricted viewing areas
 */
export function setupCamera(scene, canvas, config) {
    const cam = new BABYLON.ArcRotateCamera(
        "Camera",
        config.camera.alpha,
        config.camera.beta,
        config.camera.radius,
        new BABYLON.Vector3(0, 0, 0),
        scene
    );
    cam.attachControl(canvas, true);
    cam.minZ = config.camera.minZ;
    cam.maxZ = config.camera.maxZ;
    cam.panningSensibility = config.camera.panningSensibility || 1000;
    cam.angularSensibilityX = config.camera.angularSensibilityX;
    cam.angularSensibilityY = config.camera.angularSensibilityY;
    cam.wheelPrecision = config.camera.wheelPrecision;
    cam.panningInertia = config.camera.panningInertia;
    cam.useAutoRotationBehavior = config.camera.useAutoRotationBehavior;

    // Camera limits are now set by the CameraLimits system based on UI settings

    if (cam.useAutoRotationBehavior) {
        const autoRotationBehavior = cam.autoRotationBehavior;
        autoRotationBehavior.idleRotationWaitTime = CONFIG.camera.autoRotation.idleRotationWaitTime;
        autoRotationBehavior.idleRotationSpeed = CONFIG.camera.autoRotation.idleRotationSpeed;
        autoRotationBehavior.idleRotationSpinUpTime = CONFIG.camera.autoRotation.idleRotationSpinUpTime;
    }

    // Camera constraints are now handled by the CameraLimits system

    // Set initial camera position after scene is ready
    scene.executeWhenReady(() => {
        cam.radius = config.camera.radius;
        cam.alpha = config.camera.alpha;
        cam.beta = config.camera.beta;
        cam.target = new BABYLON.Vector3(0, 0, 0);
    });

    return cam;
}

/**
 * Smoothly animates camera to focus on a new target position with specified zoom level
 * @param {BABYLON.ArcRotateCamera} camera - The camera to animate
 * @param {BABYLON.Vector3} newTarget - 3D coordinates to focus camera on
 * @param {number} newRadius - New distance from target after animation
 * @param {number} [duration=30] - Animation duration in frames (30 = ~0.5s at 60fps)
 * @param {Function} [onAnimationEnd] - Optional callback function when animation completes
 * @returns {BABYLON.AnimationGroup} Animation group that can be controlled or disposed
 * @description Creates smooth camera transitions for model inspection, picking interactions,
 *              and view resets. Respects camera limits and integrates with the CameraLimits system.
 * @example
 * // Animate to picked point
 * const animation = animateCamera(camera, pickedPoint, 5, 30, () => console.log('Done'));
 */
export function animateCamera(camera, newTarget, newRadius, duration = 30, onAnimationEnd) {
    // Camera limits will be enforced by the CameraLimits system
    
    const animationGroup = new BABYLON.AnimationGroup("cameraCenterAnimation");

    // Target animation
    const targetAnimation = new BABYLON.Animation(
        "targetPan",
        "target",
        30,
        BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    targetAnimation.setKeys([
        { frame: 0, value: camera.target.clone() },
        { frame: duration, value: newTarget }
    ]);

    // Radius animation
    const radiusAnimation = new BABYLON.Animation(
        "radiusAdjust",
        "radius",
        30,
        BABYLON.Animation.ANIMATIONTYPE_FLOAT,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    radiusAnimation.setKeys([
        { frame: 0, value: camera.radius },
        { frame: duration, value: newRadius }
    ]);

    animationGroup.addTargetedAnimation(targetAnimation, camera);
    animationGroup.addTargetedAnimation(radiusAnimation, camera);
    animationGroup.normalize(0, duration);

    if (onAnimationEnd) {
        animationGroup.onAnimationEndObservable.addOnce(onAnimationEnd);
    }

    return animationGroup;
}