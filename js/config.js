// js/config.js

/* ========================================================================
   3D VIEWER CONFIGURATION
   Centralized configuration for all application settings
   ======================================================================== */

export const CONFIG = {

    /* ====================================================================
       APPLICATION SETTINGS
       ==================================================================== */
    
    /**
     * Default model to load on startup
     */
    defaultModelUrl: "https://raw.githubusercontent.com/CedricGuillemet/dump/master/Halo_Believe.splat",

    /**
     * Model loader settings
     */
    modelLoader: {
        supportedFormats: ['splat', 'ply', 'spz', 'gltf', 'glb', 'obj'],
        defaultFallbackModel: "https://raw.githubusercontent.com/CedricGuillemet/dump/master/Halo_Believe.splat",
        defaultModelScale: 1.0
    },

    /* ====================================================================
       RENDERING & ENGINE
       ==================================================================== */

    /**
     * Babylon.js engine configuration
     */
    engine: {
        preserveDrawingBuffer: true,
        stencil: true,
        disableWebGL2Support: false,
        antialias: false                    // Use post-processing instead
    },

    /**
     * Rendering quality settings
     */
    pixelRatio: {
        mobile: 0.8,                        // Lower for mobile performance
        pc: 1.2                             // Higher for desktop quality
    },

    /**
     * Post-processing effects
     */
    postProcessing: {
        sharpenEnabled: true,
        sharpenEdgeAmount: 0.62,
        fxaaEnabled: true,
        antiAliasing: {
            type: 'fxaa',                   // 'none', 'fxaa', 'taa'
            taaEnabled: false,
            taaSamples: 64
        }
    },

    /**
     * Scene lighting configuration
     */
    lighting: {
        // Primary HDR environment lighting
        hdr: {
            environmentUrl: "https://playground.babylonjs.com/textures/environment.dds",
            intensity: 1.0,
            useFillLight: true,
            fillLightIntensity: 0.1,
            fillLightColor: [1, 1, 1]
        },
        
        // Fallback lighting (if HDR fails)
        hemisphere: {
            intensity: 0.6,
            diffuse: [1, 1, 1],
            specular: [0.2, 0.2, 0.2],
            groundColor: [0.2, 0.2, 0.3]
        },
        directional: {
            intensity: 0.8,
            direction: [-0.5, -1, -0.5],
            diffuse: [1, 1, 1],
            specular: [0.3, 0.3, 0.3]
        }
    },

    /* ====================================================================
       CAMERA CONTROLS
       ==================================================================== */

    /**
     * Base camera settings
     */
    camera: {
        // Initial position
        alpha: -Math.PI / 4,                // Horizontal angle
        beta: Math.PI / 3,                  // Vertical angle  
        radius: 4,                          // Distance from target
        
        // Clipping planes
        minZ: 0.1,
        maxZ: 1000,
        
        // Desktop sensitivity
        angularSensibilityX: 2500,
        angularSensibilityY: 2500,
        panningSensibility: 1000,
        wheelPrecision: 100,
        panningInertia: 0.6,
        
        // Auto-rotation
        useAutoRotationBehavior: true,
        autoRotation: {
            idleRotationWaitTime: 5000,     // Wait before starting (ms)
            idleRotationSpeed: 0.01,        // Rotation speed
            idleRotationSpinUpTime: 3000    // Spin-up time (ms)
        }
    },

    /**
     * Mobile camera overrides
     */
    mobile: {
        cameraInertia: 0.3,
        pinchPrecision: 30,
        angularSensibilityX: 3000,
        angularSensibilityY: 3000,
        panningSensibility: 700,
        wheelPrecision: 80,
        minimumPinchDistance: 15,
        minimumPanDistance: 8,
        touchActionDelay: 100,
        gestureStabilityThreshold: 5,
        inertiaTransitionTime: 150
    },

    /**
     * Camera movement limits
     */
    cameraLimits: {
        enabled: true,
        autoCalculateOnLoad: true,
        
        // What restrictions to enable by default
        defaultRestrictions: {
            zoom: true,
            vertical: true,
            horizontal: false,              // Full 360° by default
            panning: true
        },
        
        // Default limit values
        defaultLimits: {
            zoom: {
                min: 2.5,
                max: 15.0
            },
            vertical: {
                upLimit: -80,               // Degrees (-90° = straight up)
                downLimit: 5                // Degrees (90° = straight down)
            },
            panning: {
                maxDistance: 10.0
            }
        },
        
        // UI configuration
        ui: {
            showDegreesInsteadOfRadians: true,
            defaultHorizontalRestriction: false,
            defaultPanningRestriction: true,
            visualFeedback: true,
            ranges: {
                zoom: { min: 0.5, max: 30, step: 0.1 },
                vertical: { min: 0, max: 180, step: 1 },
                horizontal: { min: -360, max: 360, step: 5 },
                panning: { min: 1, max: 50, step: 0.5 }
            }
        }
    },

    /* ====================================================================
       INPUT & GESTURES
       ==================================================================== */

    /**
     * Touch and gesture settings
     */
    gesture: {
        doubleTapThreshold: 300,
        doubleClickThreshold: 300,
        pinchDebounceThreshold: 80,
        pinchSensitivity: 0.0003,
        tapMaxDistance: 10,
        gestureChangeTimeout: 350,
        enableGestureExclusivity: true,
        smoothingFactor: 0.2
    },

    /* ====================================================================
       USER INTERFACE
       ==================================================================== */

    /**
     * UI update and refresh settings
     */
    ui: {
        updateFrequency: 450                // UI update frequency (ms)
    }

};