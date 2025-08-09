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
        upperRadiusLimit: 15.0,         // Fixed maximum zoom out distance (now handled by CameraLimits)
        lowerRadiusLimit: 2.5,          // Fixed minimum zoom in distance (now handled by CameraLimits)
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
        panningSensibility: 700,       // Increased for more responsive panning (was 500)
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
        pinchSensitivity: 0.0003,     // Increased sensitivity for more responsive mobile pinch zoom
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
    },

    /**
     * Camera Limits Configuration
     */
    
    cameraLimits: {
        enabled: true,                          // Enable camera limits by default
        autoCalculateOnLoad: true,              // Auto-calculate limits when model loads
        
        // Default restriction settings - what to enable by default
        defaultRestrictions: {
            zoom: true,                         // Limit zoom by default
            vertical: true,                     // Limit vertical rotation by default
            horizontal: false,                  // Don't limit horizontal by default (full 360°)
            panning: true                       // Enable panning by default
        },
        
        // Default limit values (used when auto-calculation isn't available)
        defaultLimits: {
            // Zoom limits
            zoom: {
                min: 2.5,                       // Minimum zoom distance
                max: 15.0                       // Maximum zoom distance
            },
            
            // Vertical rotation limits (in degrees - easier to understand)
            vertical: {
                upLimit: -80,                   // How far up you can look (-90° = straight up, 0° = forward)
                downLimit: 5                    // How far down you can look (90° = straight down, 0° = forward)
            },
            
            // Horizontal rotation limits (in degrees)
            horizontal: {
                leftLimit: -180,                // Left rotation limit
                rightLimit: 180                 // Right rotation limit
            },
            
            // Panning limits 
            panning: {
                maxDistance: 10.0               // Maximum distance camera target can move from center
            }
        },
        
    
        
        // UI settings
        ui: {
            showDegreesInsteadOfRadians: true,  // Display angles in degrees for user friendliness
            defaultHorizontalRestriction: false, // Don't restrict horizontal by default
            defaultPanningRestriction: true,    // Enable panning by default
            visualFeedback: true,               // Show visual feedback when hitting limits
            
            // Range control settings
            ranges: {
                zoom: { min: 0.1, max: 50, step: 0.1 },
                vertical: { min: 0, max: 180, step: 1 },
                horizontal: { min: -360, max: 360, step: 5 },
                panning: { min: 1, max: 50, step: 0.5 }
            }
        }
    }
};