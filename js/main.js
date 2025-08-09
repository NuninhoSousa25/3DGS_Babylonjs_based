// js/main.js
import { setupCamera, animateCamera } from './cameraControl.js';
import { loadModel, disposeCurrentModel } from './modelLoader.js';
import { setupUI } from './ui.js';
import { addPostEffects } from './postProcessing.js';
import { getPickResult } from './picking.js';
import { CONFIG } from './config.js';  // Import the centralized configuration
import { setupMobileControls } from './mobileControl.js';
import { detectDevice } from './deviceDetection.js';
import { CameraLimits } from './camera_limits.js';

/**
 * Global Variables
 */
let engine, scene, camera;
let pipeline = null; // For post-process reuse
let gestureController = null; // For mobile gesture control
let cameraLimits = null; // For camera movement limitations

/**
 * Initialize Engine and Scene
 */
function initializeEngineAndScene() {
    const canvas = document.getElementById("renderCanvas");
    // Using config to fine-tune engine
    engine = new BABYLON.Engine(canvas, true, {
        preserveDrawingBuffer: CONFIG.engine.preserveDrawingBuffer,
        stencil: CONFIG.engine.stencil,
        disableWebGL2Support: CONFIG.engine.disableWebGL2Support,
        antialias: CONFIG.engine.antialias
    });
    scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3(0.1, 0.1, 0.1);

    // Initialize custom properties for tracking loaded model
    scene.currentModel = null;
    scene.currentModelType = null;

    return { engine, scene, canvas };
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
        console.log("Auto-rotation configured");
    }
}

/**
 * Cleanup Resources
 */
function cleanup(scene, engine) {
    // Dispose gesture controller if it exists
    if (gestureController) {
        try {
            gestureController.dispose();
            console.log("Gesture controller disposed.");
        } catch (e) {
            console.warn("Error disposing gesture controller:", e);
        }
        gestureController = null;
    }

    // Dispose camera limits if it exists
    if (cameraLimits) {
        try {
            cameraLimits.dispose();
            console.log("Camera limits disposed.");
        } catch (e) {
            console.warn("Error disposing camera limits:", e);
        }
        cameraLimits = null;
    }


    // Dispose post-processing pipeline
    if (pipeline) {
        pipeline.dispose();
        pipeline = null;
        console.log("Post-processing pipeline disposed.");
    }

    // Dispose current model
    disposeCurrentModel(scene.currentModel, scene.currentModelType);
    scene.currentModel = null;
    scene.currentModelType = null;
    console.log("Current model disposed.");

    // Dispose scene
    if (scene) {
        scene.dispose();
        console.log("Scene disposed.");
    }

    // Dispose engine
    if (engine) {
        engine.dispose();
        console.log("Engine disposed.");
    }
}

/**
 * Create the Scene
 */



async function createScene() {
    try {
        const { engine: eng, scene: scn, canvas } = initializeEngineAndScene();
        engine = eng;
        scene = scn;

        // Detect device using consolidated detection system
        const device = detectDevice();
        const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0); // ADD THIS LINE
        const isMobile = device.isMobile; // Keep existing

        // Determine initial pixel ratio based on device type
        const initialPixelRatio = isMobile ? CONFIG.pixelRatio.mobile : CONFIG.pixelRatio.pc;

        // Set hardware scaling level based on initial pixel ratio
        engine.setHardwareScalingLevel(1 / initialPixelRatio);
        console.log(`Initial hardware scaling level set to: ${1 / initialPixelRatio} for ${isMobile ? 'mobile' : 'PC'}`);

        // Setup camera
        camera = setupCamera(scene, canvas, CONFIG);
        
        // Initialize camera limits system
        cameraLimits = new CameraLimits(scene, camera);
        scene.cameraLimits = cameraLimits; // Make it accessible from scene
        
        // TEST CODE - Verify camera limits integration
        setTimeout(() => {
            console.log("=== CAMERA LIMITS TEST ===");
            console.log("Camera limits object:", scene.cameraLimits);
            console.log("Is enabled:", scene.cameraLimits?.isEnabled);
            console.log("Current limits:", scene.cameraLimits?.getCurrentLimits());
            console.log("========================");
        }, 2000);
        
        // Configure camera auto-rotation
        configureAutoRotation(camera);

        // Setup drag & drop functionality
        setupDragAndDrop(canvas, scene);

        // Double-click to center - only for desktop devices (conflicts with mobile touch)
        if (!device.hasTouch && !device.isTouchDevice) {
            setupDoubleClickPan(scene, camera);
            console.log("Double-click pan setup for desktop.");
        }

        // Setup touch-optimized controls if device has touch capability
        // This is additional to the default controls
        if (device.hasTouch || device.isTouchDevice) {
            try {
                console.log("Setting up touch-optimized controls");
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
        console.log("Post-processing pipeline added.");

        // UI
        setupUI(camera, scene, engine, initialPixelRatio);
        console.log("UI handlers set up.");

        // Attempt to load a model from URL param or default
        const urlParams = new URLSearchParams(window.location.search);
        const modelUrl = urlParams.get('model');

        if (modelUrl) {
            try {
                const decodedModelUrl = decodeURIComponent(modelUrl);
                console.log(`Loading model from URL parameter: ${decodedModelUrl}`);
                await loadModel(scene, decodedModelUrl, CONFIG.modelLoader.defaultFallbackModel);
            } catch (error) {
                console.error("Error loading model from URL parameter:", error);
                await loadModel(scene, CONFIG.modelLoader.defaultFallbackModel, CONFIG.modelLoader.defaultFallbackModel);
            }
        } else {
            console.log("Loading default model:", CONFIG.defaultModelUrl);
            await loadModel(scene, CONFIG.defaultModelUrl, CONFIG.modelLoader.defaultFallbackModel);
        }
        
        
        // Apply camera limits from URL if present
        if (cameraLimits && urlParams.toString()) {
            cameraLimits.applyLimitsFromUrl(urlParams);
        }

        // Start render loop
        engine.runRenderLoop(() => {
            if (scene) {
                scene.render();
            }
        });
        console.log("Render loop started.");

        // Handle window resize
        window.addEventListener("resize", () => {
            engine.resize();
            console.log("Engine resized.");
        });

        // Handle scene disposal for cleanup
        scene.onDisposeObservable.add(() => {
            cleanup(scene, engine);
            console.log("Scene disposed and resources cleaned up.");
        });

        console.log("Scene created and ready!");
    } catch (error) {
        console.error("Error during scene creation:", error);
        cleanup(scene, engine);
    }
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