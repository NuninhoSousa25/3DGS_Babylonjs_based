// js/main.js
import { setupCamera, animateCamera } from './cameraControl.js';
import { loadModel, disposeCurrentModel } from './modelLoader.js';
import { setupUI, applyCameraParametersFromUrl } from './ui.js';
import { addPostEffects } from './postProcessing.js';
import { getPickResult } from './picking.js';
import { CONFIG } from './config.js';  // Import the centralized configuration
import { setupMobileControls } from './mobileControl.js';
import { detectDevice } from './deviceDetection.js';
import { CameraLimits } from './cameraLimits.js';
import { WindowEvents, ErrorMessages } from './helpers.js';

/**
 * Global Variables
 */
let engine, scene, camera;
let pipeline = null; // For post-process reuse
let gestureController = null; // For mobile gesture control
let cameraLimits = null; // For camera movement limitations

/**
 * Setup lighting for GLB/GLTF models
 * GLB models need proper lighting to be visible, unlike splat files which are self-illuminated
 */
async function setupLighting(scene) {
    const lightConfig = CONFIG.lighting;
    
    try {
        // Add HDR environment lighting as primary light source
        const hdrTexture = new BABYLON.CubeTexture(
            lightConfig.hdr.environmentUrl,
            scene
        );
        
        // Set the environment texture for IBL (Image-Based Lighting)
        scene.environmentTexture = hdrTexture;
        scene.environmentIntensity = lightConfig.hdr.intensity;
        
        // HDR provides lighting and reflections but no visible skybox
        
        
        // Add minimal fill lighting for areas that might be too dark
        if (lightConfig.hdr.useFillLight) {
            const fillLight = new BABYLON.HemisphericLight(
                "fillLight", 
                new BABYLON.Vector3(0, 1, 0), 
                scene
            );
            fillLight.intensity = lightConfig.hdr.fillLightIntensity;
            fillLight.diffuse = new BABYLON.Color3(...lightConfig.hdr.fillLightColor);
            
        }
        
    } catch (error) {
        console.warn("Failed to load HDR environment, falling back to basic lighting:", error);
        
        // Fallback to basic lighting if HDR fails
        setupBasicLighting(scene, lightConfig);
    }
}

/**
 * Fallback basic lighting system
 */
function setupBasicLighting(scene, lightConfig) {
    // Create a hemisphere light for ambient lighting
    const hemisphereLight = new BABYLON.HemisphericLight(
        "hemisphereLight", 
        new BABYLON.Vector3(0, 1, 0), 
        scene
    );
    hemisphereLight.intensity = lightConfig.hemisphere.intensity;
    hemisphereLight.diffuse = new BABYLON.Color3(...lightConfig.hemisphere.diffuse);
    hemisphereLight.specular = new BABYLON.Color3(...lightConfig.hemisphere.specular);
    hemisphereLight.groundColor = new BABYLON.Color3(...lightConfig.hemisphere.groundColor);

    // Create a directional light for key lighting
    const directionalLight = new BABYLON.DirectionalLight(
        "directionalLight", 
        new BABYLON.Vector3(...lightConfig.directional.direction), 
        scene
    );
    directionalLight.intensity = lightConfig.directional.intensity;
    directionalLight.diffuse = new BABYLON.Color3(...lightConfig.directional.diffuse);
    directionalLight.specular = new BABYLON.Color3(...lightConfig.directional.specular);

}

/**
 * Initialize Engine and Scene
 */
async function initializeEngineAndScene() {
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

    // Setup lighting for GLB models (async for HDR loading)
    await setupLighting(scene);

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
    disposeCurrentModel(scene.currentModel, scene.currentModelType);
    scene.currentModel = null;
    scene.currentModelType = null;

    // Dispose scene
    if (scene) {
        scene.dispose();
    }

    // Dispose engine
    if (engine) {
        engine.dispose();
    }
}

/**
 * Create the Scene
 */



async function createScene() {
    try {
        const { engine: eng, scene: scn, canvas } = await initializeEngineAndScene();
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
        // TAA mode can be selected in the UI settings

        // UI
        setupUI(camera, scene, engine, initialPixelRatio);

        // Attempt to load a model from URL param or default
        const urlParams = new URLSearchParams(window.location.search);
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

        // Handle window resize using centralized handler
        WindowEvents.addResizeCallback(WindowEvents.createEngineResizeHandler(engine));

        // Handle scene disposal for cleanup
        scene.onDisposeObservable.add(() => {
            cleanup(scene, engine);
        });

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