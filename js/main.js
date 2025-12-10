/* ========================================================================
   3D VIEWER - MAIN APPLICATION ENTRY POINT
   ========================================================================
   
   PURPOSE:
   Main application initialization and scene creation for the 3D viewer.
   Coordinates all subsystems and handles the primary rendering loop.
   
   EXPORTS:
   - createScene() - Initialize and start the 3D viewer application
   
   DEPENDENCIES:
   - Camera control system for navigation
   - Model loading and management
   - UI components and controls
   - Post-processing effects
   - Mobile and touch support
   - Device detection
   
   ======================================================================== */

import { setupCamera, animateCamera } from './cameraControl.js';
import { loadModel, disposeCurrentModel } from './modelLoader.js';
import { setupUI } from './ui.js';
import { decompressUrlParameters, applyCameraParametersFromUrl, applyModelScaleFromUrl, applySettingsPanelFromUrl, getBackgroundColorFromUrl } from './urlManager.js';
import { addPostEffects } from './postProcessing.js';
import { getPickResult } from './picking.js';
import { disposePickingHelpers } from './picking.js';
import { CONFIG, setupLighting } from './config.js';  // Import the centralized configuration and lighting

// CONFIG is now properly imported in each module that needs it
import { setupMobileControls } from './mobileControl.js';
import { getDeviceInfo } from './utils/deviceManager.js';
import { CameraLimits } from './cameraLimits.js';
import { WindowEvents, ErrorMessages, triggerVerticesUpdate, triggerResolutionUpdate } from './helpers.js';
import { isSharedURL } from './utils/urlUtils.js';

/**
 * Global Variables
 */
let engine, scene, camera;
let pipeline = null; // For post-process reuse
let gestureController = null; // For mobile gesture control
let cameraLimits = null; // For camera movement limitations
let resizeHandlers = []; // Track resize handlers for cleanup


/**
 * Show early loading feedback for shared URLs
 */
function showSharedURLLoadingFeedback() {
    if (!isSharedURL()) return false;
    
    // Create early loading overlay
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'early-loading-overlay';
    loadingOverlay.innerHTML = `
        <div class="early-loading-content">
            <div class="loading-spinner-large"></div>
            <div class="loading-text">Loading shared scene...</div>
            <div class="loading-subtext">Initializing 3D viewer and applying settings</div>
        </div>
    `;
    
    // Add styles for the early loading overlay
    const style = document.createElement('style');
    style.textContent = `
        #early-loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            color: #ffffff;
        }
        
        .early-loading-content {
            text-align: center;
            max-width: 400px;
            padding: 2rem;
        }
        
        .loading-spinner-large {
            width: 60px;
            height: 60px;
            border: 4px solid rgba(255, 255, 255, 0.1);
            border-left: 4px solid #2196f3;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 1.5rem;
        }
        
        .loading-text {
            font-size: 1.2rem;
            font-weight: 500;
            margin-bottom: 0.5rem;
            color: #ffffff;
        }
        
        .loading-subtext {
            font-size: 0.9rem;
            color: rgba(255, 255, 255, 0.7);
            line-height: 1.4;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(loadingOverlay);
    
    return true;
}

/**
 * Remove early loading feedback overlay
 */
function removeSharedURLLoadingFeedback() {
    const overlay = document.getElementById('early-loading-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.3s ease-out';
        setTimeout(() => {
            overlay.remove();
        }, 300);
    }
}


/**
 * Initialize Engine and Scene
 */
async function initializeEngineAndScene(rendererType) {
    const canvas = document.getElementById("renderCanvas");
    
    let engine;
    let engineType = "WebGL";

    // Warn if WebGPU is preferred but we're in an insecure context
    if ((rendererType === 'webgpu' || (rendererType === 'auto' && CONFIG.engine.preferWebGPU)) && !window.isSecureContext) {
        console.warn("⚠️ WebGPU requires a Secure Context (HTTPS or localhost). WebGL will be used as fallback.");
    }

    const webGPUSupported = await BABYLON.WebGPUEngine.IsSupportedAsync;

    if (rendererType === 'webgpu' && webGPUSupported) {
        try {
            engine = new BABYLON.WebGPUEngine(canvas, {
                adaptToDeviceRatio: true,
                antialias: false
            });
            await engine.initAsync();
            engineType = "WebGPU";
            console.log("✓ WebGPU renderer initialized");
        } catch (error) {
            console.warn("WebGPU failed, falling back to WebGL:", error);
            if (CONFIG.engine.fallbackToWebGL) {
                engine = new BABYLON.Engine(canvas, true, CONFIG.engine);
            } else {
                throw new Error("WebGPU initialization failed and fallback to WebGL is disabled.");
            }
        }
    } else if (rendererType === 'auto' && CONFIG.engine.preferWebGPU && webGPUSupported) {
        try {
            engine = new BABYLON.WebGPUEngine(canvas, {
                adaptToDeviceRatio: true,
                antialias: false
            });
            await engine.initAsync();
            engineType = "WebGPU";
            console.log("✓ WebGPU renderer initialized");
        } catch (error) {
            console.warn("WebGPU failed, falling back to WebGL:", error);
            if (CONFIG.engine.fallbackToWebGL) {
                engine = new BABYLON.Engine(canvas, true, CONFIG.engine);
            } else {
                throw new Error("WebGPU initialization failed and fallback to WebGL is disabled.");
            }
        }
    } else {
        // WebGL fallback
        engine = new BABYLON.Engine(canvas, true, CONFIG.engine);
    }

    // Store renderer type for UI display
    engine.engineType = engineType;

    scene = new BABYLON.Scene(engine);

    // Set background color from URL if specified, otherwise use default
    const urlBackgroundColor = getBackgroundColorFromUrl();
    scene.clearColor = urlBackgroundColor || new BABYLON.Color3(0.1, 0.1, 0.1);

    // Setup lighting for GLB models (async for HDR loading)
    await setupLighting(scene);

    // Initialize custom properties for tracking loaded model
    scene.currentModel = null;
    scene.currentModelType = null;

    return { engine, scene, canvas };
}

/**
 * Setup wheel event prevention to stop parent page scrolling
 * When mouse wheel is used over the viewer canvas
 */
function setupWheelEventPrevention(canvas) {
    // Simple and effective approach: prevent wheel events directly on canvas
    canvas.addEventListener('wheel', (e) => {
        // Stop the event from bubbling to parent elements (like iframe parent)
        e.preventDefault();
        e.stopPropagation();

        // Create a new wheel event for Babylon.js to handle
        const newEvent = new WheelEvent('wheel', {
            deltaX: e.deltaX,
            deltaY: e.deltaY,
            deltaZ: e.deltaZ,
            deltaMode: e.deltaMode,
            clientX: e.clientX,
            clientY: e.clientY,
            button: e.button,
            buttons: e.buttons,
            bubbles: false  // Don't let it bubble
        });

        // Dispatch the new event to the camera input system
        if (camera && camera.inputs && camera.inputs.attached.mousewheel) {
            // Use the camera's internal wheel handling
            const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
            camera.radius *= zoomFactor;

            // Apply camera limits if they exist
            if (camera.lowerRadiusLimit !== null) {
                camera.radius = Math.max(camera.lowerRadiusLimit, camera.radius);
            }
            if (camera.upperRadiusLimit !== null) {
                camera.radius = Math.min(camera.upperRadiusLimit, camera.radius);
            }
        }
    }, { passive: false });

    console.log('Direct wheel event prevention setup - parent page scrolling disabled over viewer area');
}

/**
 * Setup Double-Click Pan
 */
function setupDoubleClickPan(scene, camera) {
    // Animation lock flag to prevent overlapping animations
    let isAnimating = false;

    const onDoubleTap = () => {
        handleDoubleTap(scene, camera, isAnimating, (val) => { isAnimating = val; });
    };

    scene.onPointerObservable.add((pointerInfo) => {
        if (
            pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOUBLETAP &&
            pointerInfo.event.button === 0
        ) {
            onDoubleTap();
        }
    });

    // Double-tap for touch
    let lastTap = 0;
    const doubleTapThreshold = CONFIG.gesture.doubleTapThreshold; // ms
    scene.onPointerObservable.add((pointerInfo) => {
        if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN) {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            if (tapLength < doubleTapThreshold && tapLength > 0) {
                onDoubleTap();
                lastTap = 0;
            } else {
                lastTap = currentTime;
            }
        }
    });
}

/**
 * Handles the double-tap/double-click event to animate the camera.
 */
function handleDoubleTap(scene, camera, isAnimating, setAnimating) {
    if (isAnimating) {
        return;
    }
    const pickResult = getPickResult(scene, camera, scene.pointerX, scene.pointerY);
    if (pickResult && pickResult.hit && pickResult.pickedPoint) {
        const distanceToPoint = BABYLON.Vector3.Distance(camera.target, pickResult.pickedPoint);
        // Use centralized camera limits from config
        const targetRadius = Math.max(
            Math.min(distanceToPoint * 3.5, CONFIG.cameraLimits.defaultLimits.zoom.max),
            CONFIG.cameraLimits.defaultLimits.zoom.min
        );

        setAnimating(true);
        const animationGroup = animateCamera(camera, pickResult.pickedPoint, targetRadius, 30, () => {
            setAnimating(false);
        });
        animationGroup.play();
    }
}

/**
 * Configure auto rotation
 */
function configureAutoRotation(camera) {
    if (camera.useAutoRotationBehavior && camera.autoRotationBehavior) {
        const autoConfig = CONFIG.camera.autoRotation;
        camera.autoRotationBehavior.idleRotationWaitTime = autoConfig.idleRotationWaitTime;
        camera.autoRotationBehavior.idleRotationSpeed = autoConfig.idleRotationSpeed;
        camera.autoRotationBehavior.idleRotationSpinUpTime = autoConfig.idleRotationSpinUpTime;
    }
}

/**
 * Cleanup Resources
 */
function cleanup(scene, engine) {
    // Remove resize handlers
    if (resizeHandlers.length > 0) {
        resizeHandlers.forEach(handler => WindowEvents.removeResizeCallback(handler));
        resizeHandlers = [];
    }

    // Dispose gesture controller if it exists
    if (gestureController) {
        try {
            gestureController.dispose();
        } catch (e) {
            console.warn("Error disposing gesture controller:", e);
        }
        gestureController = null;
    }

    // Dispose camera limits if it exists
    if (cameraLimits) {
        try {
            cameraLimits.dispose();
        } catch (e) {
            console.warn("Error disposing camera limits:", e);
        }
        cameraLimits = null;
    }


    // Dispose post-processing pipeline
    if (pipeline) {
        pipeline.dispose();
        pipeline = null;
    }

    // Dispose current model
    if (scene && scene.currentModel) {
        disposeCurrentModel(scene.currentModel, scene.currentModelType);
        scene.currentModel = null;
        scene.currentModelType = null;
    }

    // Dispose scene
    if (scene) {
        scene.dispose();
    }

    // Dispose engine
    if (engine) {
        engine.stopRenderLoop();
        engine.dispose();
    }
    disposePickingHelpers();

}

/**
 * Create the Scene
 */



async function setupScene(rendererType = 'WebGL') {
    // Show early loading feedback for shared URLs
    const isLoadingSharedURL = showSharedURLLoadingFeedback();
    
    try {
        const { engine: eng, scene: scn, canvas } = await initializeEngineAndScene(rendererType);
        engine = eng;
        scene = scn;

        // Setup wheel event prevention to stop parent page scrolling
        setupWheelEventPrevention(canvas);

        // Detect device using consolidated detection system
        const device = getDeviceInfo();
        const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0); // ADD THIS LINE
        const isMobile = device.isMobile; // Keep existing

        // Determine initial pixel ratio based on device type
        const initialPixelRatio = isMobile ? CONFIG.pixelRatio.mobile : CONFIG.pixelRatio.pc;

        // Set hardware scaling level based on initial pixel ratio
        engine.setHardwareScalingLevel(1 / initialPixelRatio);
        console.log(`Initial hardware scaling level set to: ${1 / initialPixelRatio} for ${isMobile ? 'mobile' : 'PC'}`);

        // Setup camera
        camera = setupCamera(scene, canvas, CONFIG);
        scene.activeCamera = camera;
        
        // Apply camera parameters from URL (position, FOV, etc.)
        applyCameraParametersFromUrl(camera);
        
        // Initialize camera limits system
        cameraLimits = new CameraLimits(scene, camera);
        scene.cameraLimits = cameraLimits; // Make it accessible from scene
        
        // TEST CODE - Verify camera limits integration
        setTimeout(() => {
        }, 2000);
        
        // Configure camera auto-rotation
        configureAutoRotation(camera);

        // Setup drag & drop functionality
        setupDragAndDrop(canvas, scene);

        // Double-click to center - only for desktop devices (conflicts with mobile touch)
        if (!device.hasTouch && !device.isTouchDevice) {
            setupDoubleClickPan(scene, camera);
        }

        // Setup touch-optimized controls if device has touch capability
        // This is additional to the default controls
        if (device.hasTouch || device.isTouchDevice) {
            try {
                // Setup touch controls - this doesn't replace default controls
                // but adds better touch handling
                gestureController = setupMobileControls(camera, scene);
            } catch (e) {
                console.warn("Error setting up touch controls:", e);
                // The default controls will still work even if this fails
            }
        }

        // Device debug info is now available in the developer tools panel


        // Post-processing
        pipeline = addPostEffects(scene, camera);
        
        // Initial anti-aliasing will be applied through the post-processing pipeline
        // FXAA can be toggled in the UI settings

        // UI
        setupUI(camera, scene, engine, initialPixelRatio);

        // Attempt to load a model from URL param or default
        const urlParams = decompressUrlParameters();
        const modelUrl = urlParams.get('model');

        

        if (modelUrl) {
            try {
                const decodedModelUrl = decodeURIComponent(modelUrl);
                console.log(`Loading model from URL parameter: ${decodedModelUrl}`);
                await loadModel(scene, decodedModelUrl, CONFIG.modelLoader.defaultFallbackModel);
            } catch (error) {
                console.error(ErrorMessages.MODEL.LOAD_FAILED('from URL parameter'), error);
                await loadModel(scene, CONFIG.modelLoader.defaultFallbackModel, CONFIG.modelLoader.defaultFallbackModel);
            }
        } else {
            await loadModel(scene, CONFIG.defaultModelUrl, CONFIG.modelLoader.defaultFallbackModel);
        }
        
        // Apply model scale from URL if present (must be after model loading)
        applyModelScaleFromUrl(scene);
        
        // Trigger vertices update for dev panel after initial model load
        triggerVerticesUpdate();
        
        // Apply camera limits from URL if present
        if (cameraLimits && urlParams.toString()) {
            cameraLimits.applyLimitsFromUrl(urlParams);
        }
        
        // Apply settings panel state from URL if present (must be after UI setup)
        applySettingsPanelFromUrl(camera, scene);

        // Remove early loading overlay once everything is initialized
        if (isLoadingSharedURL) {
            setTimeout(() => {
                removeSharedURLLoadingFeedback();
            }, 500); // Small delay to ensure everything is rendered
        }

        // Start render loop
        engine.runRenderLoop(() => {
            if (scene) {
                scene.render();
            }
        });

        // Handle window resize using centralized handler
        const engineResizeHandler = WindowEvents.createEngineResizeHandler(engine);
        WindowEvents.addResizeCallback(engineResizeHandler);
        resizeHandlers.push(engineResizeHandler);
        
        // Add resolution update trigger for dev panel
        const resolutionUpdateHandler = () => {
            triggerResolutionUpdate();
        };
        WindowEvents.addResizeCallback(resolutionUpdateHandler);
        resizeHandlers.push(resolutionUpdateHandler);

        // Handle scene disposal for cleanup
        scene.onDisposeObservable.add(() => {
            cleanup(scene, engine);
        });

    } catch (error) {
        console.error("Error during scene creation:", error);
        
        // Remove loading overlay on error
        if (isLoadingSharedURL) {
            removeSharedURLLoadingFeedback();
        }
        
        cleanup(scene, engine);
    }
}

export async function switchRenderer(rendererType) {
    const currentModelUrl = scene.currentModelUrl;

    // Clean up the existing scene and engine
    cleanup(scene, engine);

    // Re-create the canvas to avoid context issues
    const oldCanvas = document.getElementById('renderCanvas');
    const newCanvas = document.createElement('canvas');
    newCanvas.id = 'renderCanvas';
    newCanvas.style.cssText = oldCanvas.style.cssText; // Persist styles
    oldCanvas.parentNode.replaceChild(newCanvas, oldCanvas);

    // Re-initialize the scene with the new renderer
    await setupScene(rendererType);

    // Reload the model
    if (currentModelUrl) {
        await loadModel(scene, currentModelUrl, CONFIG.modelLoader.defaultFallbackModel);
    }
}

async function createScene() {
    const rendererPreference = localStorage.getItem('rendererPreference') || 'auto';
    await setupScene(rendererPreference);
}

/**
 * Setup drag and drop functionality for model files
 * @param {HTMLCanvasElement} canvas - The canvas element
 * @param {BABYLON.Scene} scene - The Babylon.js scene
 */
function setupDragAndDrop(canvas, scene) {
    // Prevent default drag behaviors on canvas
    canvas.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        canvas.style.filter = 'brightness(1.2)';
    });

    canvas.addEventListener('dragleave', (e) => {
        e.preventDefault();
        canvas.style.filter = 'none';
    });

    canvas.addEventListener('drop', async (e) => {
        e.preventDefault();
        canvas.style.filter = 'none';
        
        const files = e.dataTransfer.files;
        if (files.length > 0 && isValidModelFile(files[0])) {
            console.log('Drag & drop file detected:', files[0].name);
            try {
                // Pass the File object directly to loadModel
                await loadModel(scene, files[0], CONFIG.modelLoader.defaultFallbackModel);
                // Apply model scale from URL if present (for shared URLs)
                applyModelScaleFromUrl(scene);
                // Trigger vertices update for dev panel
                triggerVerticesUpdate();
            } catch (error) {
                console.error('Error loading dropped file:', error);
            }
        } else {
            console.warn('Invalid file format. Supported formats:', CONFIG.modelLoader.supportedFormats);
        }
    });
}

/**
 * Check if a file is a valid model file
 * @param {File} file - The file to validate
 * @returns {boolean} - True if file is valid
 */
function isValidModelFile(file) {
    if (!file || !file.name) return false;
    
    const extension = file.name.split('.').pop().toLowerCase();
    return CONFIG.modelLoader.supportedFormats.includes(extension);
}

// Start the application
createScene();