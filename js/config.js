// js/config.js

/**
 * Centralized Configuration Object
 */
export const CONFIG = {
    /**
     * Default URL to load the initial model.
     */
    defaultModelUrl: "https://raw.githubusercontent.com/CedricGuillemet/dump/master/Halo_Believe.splat",
   // defaultModelUrl: "./splat.ply",

    /**
     * Camera Configuration
     */
    camera: {
        alpha: -Math.PI / 4,            // Horizontal angle
        beta: Math.PI / 3,              // Vertical angle
        radius: 4,                      // Distance from target
        upperRadiusLimit: 7.0,          // Fixed maximum zoom out distance
        lowerRadiusLimit: 2.0,          // Fixed minimum zoom in distance
        minZ: 0.1,                      // Minimum Z clipping plane
        maxZ: 1000,                     // Maximum Z clipping plane
        angularSensibilityX: 2500,      // Mouse sensitivity for horizontal rotation
        angularSensibilityY: 2500,      // Mouse sensitivity for vertical rotation
        panningSensibility: 1000,       // Mouse sensitivity for panning
        wheelPrecision: 100,            // Zoom speed
        panningInertia: 0.6,            // Panning inertia
        useAutoRotationBehavior: true,  // Auto-rotation is enabled by default
        autoRotation: {
            idleRotationWaitTime: 5000,   // Wait time before auto-rotation starts (ms)
            idleRotationSpeed: 0.01,      // Auto-rotation speed
            idleRotationSpinUpTime: 3000  // Spin-up time for auto-rotation (ms)
        }
    },

    /**
     * Mobile-Specific Configuration
     */
    mobile: {
        cameraInertia: 0.3,            // Increased inertia to reduce jitter (was 0.05)
        pinchPrecision: 30,            // Reduced sensitivity to improve stability (was 20)
        angularSensibilityX: 3000,     // Reduced sensitivity to prevent jittery rotation (was 1800)
        angularSensibilityY: 3000,     // Reduced sensitivity to prevent jittery rotation (was 1800)
        panningSensibility: 500,       // Increased for smoother panning (was 400)
        wheelPrecision: 80,            // Adjusted wheel precision for mobile (was 60)
        minimumPinchDistance: 15,      // Increased threshold to prevent accidental pinch (was 10)
        minimumPanDistance: 8,         // Increased threshold to prevent accidental pan (was 5)
        touchActionDelay: 100,         // Delay before registering a touch action (ms)
        gestureStabilityThreshold: 5,  // Minimum pixel movement to register gesture direction
        inertiaTransitionTime: 150     // Time for inertia transition after gesture (ms)
    },

    /**
     * Gesture Configuration
     */
    gesture: {
        doubleTapThreshold: 500,      // Reduced for quicker response (was 700 ms)
        doubleClickThreshold: 500,    // Reduced for quicker response (was 700 ms)
        pinchDebounceThreshold: 80,   // Increased to prevent gesture conflicts (was 50 ms)
        pinchSensitivity: 0.00015,    // Decreased sensitivity for smoother zoom (was 0.0002)
        tapMaxDistance: 10,           // Maximum distance a "tap" can move
        gestureChangeTimeout: 350,    // Timeout between different gestures (ms)
        enableGestureExclusivity: true, // Only allow one gesture type at a time
        smoothingFactor: 0.2          // Smoothing factor for touch movements (0-1, higher = smoother)
    },

    /**
     * Engine Configuration
     */
    engine: {
        preserveDrawingBuffer: true,   // Preserve the drawing buffer
        stencil: true,                 // Enable stencil buffer
        disableWebGL2Support: false,   // Disable WebGL2 support if necessary
        antialias: false,              // Disable default anti-aliasing (use FXAA instead)
    },

    /**
     * UI Configuration
     */
    ui: {
        updateFrequency: 450,          // UI update frequency in milliseconds
    },

    /**
     * Post-Processing Configuration
     */
    postProcessing: {
        sharpenEnabled: true,          // Enable sharpening filter
        sharpenEdgeAmount: 0.62,       // Fixed edge amount for sharpening
        fxaaEnabled: true,             // Enable FXAA anti-aliasing
    },

    /**
     * Model Loader Configuration
     */
    modelLoader: {
        supportedFormats: ['splat', 'ply', 'spz', 'gltf', 'glb'],  // Supported file formats
        defaultFallbackModel: "https://raw.githubusercontent.com/CedricGuillemet/dump/master/Halo_Believe.splat", // Fallback model URL
        defaultModelScale: 1.0,         // Default fixed scale for all models
    },


    pixelRatio: {
        mobile: 0.8,   // Pixel ratio for mobile devices
        pc: 1.2        // Pixel ratio for PC/Desktop
    }
};