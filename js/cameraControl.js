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
 * Sets up the ArcRotateCamera with specified configurations.
 * @param {BABYLON.Scene} scene 
 * @param {HTMLCanvasElement} canvas 
 * @param {Object} config 
 * @returns {BABYLON.ArcRotateCamera}
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
        autoRotationBehavior.idleRotationWaitTime = 5000;
        autoRotationBehavior.idleRotationSpeed = 0.01;
        autoRotationBehavior.idleRotationSpinUpTime = 3000;
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
 * Animates the camera to a new target and radius.
 * @param {BABYLON.ArcRotateCamera} camera 
 * @param {BABYLON.Vector3} newTarget 
 * @param {number} newRadius 
 * @param {number} duration 
 * @param {Function} onAnimationEnd 
 * @returns {BABYLON.AnimationGroup}
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