// js/mobileControl.js

import { CONFIG } from './config.js';
import { GestureControl } from './gestureControl.js';
import { detectDevice } from './deviceDetection.js';

/**
 * Sets up mobile-optimized controls based on device detection.
 * @param {BABYLON.ArcRotateCamera} camera 
 * @param {BABYLON.Scene} scene
 * @returns {GestureControl|null} - Returns the gesture controller if on mobile
 */
export function setupMobileControls(camera, scene) {
    // Check if this device has touch capabilities
    const device = detectDevice();
    if (!device.hasTouch && !device.isTouchDevice) {
        console.log("No touch capability detected. Using standard controls.");
        return null;
    }

    console.log("Touch capability detected. Setting up touch-optimized controls.");
    
    // Apply mobile-specific camera settings
    optimizeCameraForMobile(camera);
    
    // Initialize gesture controller for touch input
    const gestureController = new GestureControl(scene, camera);
    
    // Handle device orientation changes
    setupOrientationHandler(camera, scene);
    
    return gestureController;
}

/**
 * Applies mobile-optimized settings to the camera.
 * @param {BABYLON.ArcRotateCamera} camera
 */
function optimizeCameraForMobile(camera) {
    // Adjust camera inertia for smoother movement
    camera.inertia = CONFIG.mobile.cameraInertia;
    
    // Reduce angular sensitivities to prevent jittery rotation
    camera.angularSensibilityX = CONFIG.mobile.angularSensibilityX;
    camera.angularSensibilityY = CONFIG.mobile.angularSensibilityY;
    
    // Adjust panning and zooming sensitivities
    camera.panningSensibility = CONFIG.mobile.panningSensibility;
    camera.wheelPrecision = CONFIG.mobile.wheelPrecision;
    
    // Lower inertia values for more responsive controls
    camera.panningInertia = 0.5; // Reduced from desktop default
    camera.angularInertia = 0.4; // Reduced for more immediate feedback
    
    // Camera radius limits are now handled by the CameraLimits system
    
    // Disable the default rotation behavior if using custom gesture controller
    if (camera.inputs.attached.pointers) {
        console.log("Configuring camera pointer inputs for mobile...");
        const pointerInput = camera.inputs.attached.pointers;
        
        // Disable built-in pinch to zoom
        pointerInput.pinchPrecision = 0;
        pointerInput.pinchDeltaPercentage = 0;
        
        // Set minimum distance for camera movement to avoid accidental moves
        pointerInput.panningSensibility = CONFIG.mobile.panningSensibility;
        
        // Use buttons parameter to control which pointer buttons trigger rotation
        // For mobile we want no buttons to trigger it (handled by our gesture controller)
        pointerInput.buttons = [1]; // Only first button (left click on desktop)
    }
    
    console.log("Mobile camera optimization applied.");
}

/**
 * Sets up handlers for device orientation changes.
 * @param {BABYLON.ArcRotateCamera} camera
 * @param {BABYLON.Scene} scene
 */
function setupOrientationHandler(camera, scene) {
    // Adjust camera and UI parameters when device orientation changes
    window.addEventListener('orientationchange', () => {
        console.log("Device orientation changed, adjusting camera settings...");
        
        // Add a small delay to allow the browser to complete the orientation change
        setTimeout(() => {
            // Recalculate aspect ratio
            scene.getEngine().resize();
            
            // Optionally adjust camera parameters based on orientation
            if (window.matchMedia("(orientation: portrait)").matches) {
                // Portrait specific adjustments if needed
                camera.radius = Math.min(camera.radius, CONFIG.cameraLimits.defaultLimits.zoom.max * 0.9);
            } else {
                // Landscape specific adjustments if needed
                camera.beta = Math.min(camera.beta, Math.PI / 2.5);
            }
        }, CONFIG.mobile.orientationChangeDelay);
    });

function addTouchDebugIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'touch-debug-indicator';
    indicator.style.cssText = `
        position: fixed;
        bottom: 10px;
        left: 10px;
        background: rgba(0, 255, 0, 0.7);
        color: white;
        padding: 5px 10px;
        border-radius: 5px;
        font-size: 12px;
        z-index: 10000;
        pointer-events: none;
    `;
    indicator.textContent = 'Touch Controls Active';
    document.body.appendChild(indicator);
    
    // Remove after 3 seconds
    setTimeout(() => {
        if (indicator.parentNode) {
            indicator.parentNode.removeChild(indicator);
        }
    }, CONFIG.mobile.touchIndicatorDuration);
}

}