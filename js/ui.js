/* ========================================================================
   3D VIEWER UI CONTROLLER - REFACTORED & MODULAR
   ======================================================================== */

// Import components
import { ICONS } from './ui/components/icons.js';
import { createElement, createToggleSwitch, createRangeControl } from './ui/components/controls.js';
import { showToast } from './ui/components/toast.js';

// Import panels
import { createSettingsSection, setupSettingsControls } from './ui/panels/settingsPanel.js';
import { createDevSection, setupModelLoading } from './ui/panels/devPanel.js';
import { createInfoSection } from './ui/panels/infoPanel.js';

// Import dependencies
import { setupUIUpdates, startUIUpdates, stopUIUpdates, restartUIUpdates, DOM, Events, ErrorMessages, LoadingSpinner } from './helpers.js';
import { loadModel } from './modelLoader.js';
import { CONFIG } from './config.js';
import { detectDevice } from './deviceDetection.js';

/* ========================================================================
   MAIN UI SETUP FUNCTION
   ======================================================================== */
/**
 * Sets up the unified user interface for all devices
 * @param {BABYLON.ArcRotateCamera} camera - The main camera
 * @param {BABYLON.Scene} scene - The 3D scene
 * @param {BABYLON.Engine} engine - The Babylon.js engine
 * @param {number} initialPixelRatio - Initial device pixel ratio
 */
export function setupUI(camera, scene, engine, initialPixelRatio) {
    // Initialize camera and engine settings
    initializeCameraSettings(camera);
    initializeEngineSettings(engine, initialPixelRatio);
    initializePostProcessingSettings(scene);
    
    // Detect if device has touch capabilities
    const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    
    // Remove existing UI and create new one
    removeExistingUI();
    const controlPanel = createControlPanel();
    const iconBar = createIconBar();
    const contentArea = createContentArea(hasTouch);
    
    // Assemble UI
    controlPanel.appendChild(iconBar);
    controlPanel.appendChild(contentArea);
    document.body.appendChild(controlPanel);
    
    // Clear DOM cache after UI creation to ensure fresh queries
    DOM.clearCache();
    
    // Setup event handlers
    setupIconButtonHandlers(camera, scene, engine);
    setupSettingsControls(camera, scene);
    
    // Delay model loading setup to ensure DOM is ready
    setTimeout(() => {
        setupModelLoading(scene);
    }, CONFIG.ui.domReadyDelay);
    
    // Setup responsive features
    if (hasTouch) {
        setupTouchUI(controlPanel, camera);
    }
    
    // Start UI update loop
    setupUIUpdates(scene, engine);
}

/* ========================================================================
   INITIALIZATION FUNCTIONS
   ======================================================================== */
/**
 * Initialize camera settings from configuration
 */
function initializeCameraSettings(camera) {
    camera.useAutoRotationBehavior = CONFIG.camera.useAutoRotationBehavior;
    
    if (camera.useAutoRotationBehavior && camera.autoRotationBehavior) {
        const autoConfig = CONFIG.camera.autoRotation;
        camera.autoRotationBehavior.idleRotationWaitTime = autoConfig.idleRotationWaitTime;
        camera.autoRotationBehavior.idleRotationSpeed = autoConfig.idleRotationSpeed;
        camera.autoRotationBehavior.idleRotationSpinUpTime = autoConfig.idleRotationSpinUpTime;
    }
}

/**
 * Initialize engine settings
 */
function initializeEngineSettings(engine, initialPixelRatio) {
    engine.setHardwareScalingLevel(1 / initialPixelRatio);
    console.log(`Hardware scaling level set to: ${1 / initialPixelRatio}`);
}

/**
 * Initialize post-processing settings
 */
function initializePostProcessingSettings(scene) {
    if (scene.pipeline) {
        scene.pipeline.sharpen.edgeAmount = CONFIG.postProcessing.sharpenEdgeAmount;
        scene.pipeline.sharpenEnabled = CONFIG.postProcessing.sharpenEnabled;
        scene.pipeline.fxaaEnabled = CONFIG.postProcessing.fxaaEnabled;
        console.log(`Post-processing settings applied from config`);
    }
}

/* ========================================================================
   UI CREATION FUNCTIONS
   ======================================================================== */
/**
 * Remove any existing control panel
 */
function removeExistingUI() {
    const existingPanel = document.getElementById("controlPanel");
    if (existingPanel) {
        existingPanel.remove();
    }
}

/**
 * Create the main control panel container
 */
function createControlPanel() {
    return createElement("div", {
        id: "controlPanel",
        className: "control-panel"
    });
}

/**
 * Create the unified 6-icon bar
 */
function createIconBar() {
    return createElement("div", {
        id: "iconBar",
        className: "icon-bar",
        innerHTML: `
            <button id="settingsButton" class="icon-button" title="Settings">${ICONS.settings}</button>
            <button id="infoButton" class="icon-button" title="Controls Info">${ICONS.info}</button>
            <button id="resetViewButton" class="icon-button" title="Reset View">${ICONS.reset_view}</button>
            <button id="fullscreenButton" class="icon-button" title="Toggle Fullscreen">${ICONS.fullscreen}</button>
            <button id="devButton" class="icon-button" title="Developer Tools">${ICONS.dev}</button>
            <button id="shareButton" class="icon-button" title="Share View">${ICONS.share}</button>
        `
    });
}

/**
 * Create the content area with all sections
 */
function createContentArea(hasTouch) {
    const contentArea = createElement("div", {
        id: "controlPanelContent",
        className: "control-panel-content"
    });
    contentArea.style.display = "none";
    
    contentArea.innerHTML = `
        <button id="closePanelButton" class="close-panel-button" title="Close Panel">×</button>
        
        ${createSettingsSection(hasTouch)}
        ${createInfoSection(hasTouch)}
        ${createDevSection()}
    `;
    
    return contentArea;
}

/* ========================================================================
   EVENT HANDLERS
   ======================================================================== */
/**
 * Setup all icon button event handlers
 */
function setupIconButtonHandlers(camera, scene, engine) {
    // Get button references using DOM utility
    const buttons = DOM.getAll([
        "settingsButton", "infoButton", "devButton", 
        "resetViewButton", "fullscreenButton", "shareButton", "closePanelButton"
    ]);
    const { settingsButton, infoButton, devButton, resetViewButton, 
            fullscreenButton, shareButton, closePanelButton } = buttons;

    // Get content sections using DOM utility
    const content = DOM.getAll(["settingsContent", "infoContent", "devContent"]);
    const { settingsContent, infoContent, devContent } = content;
    const allContentSections = [settingsContent, infoContent, devContent];
    
    let currentlyOpenSection = null;
    
    // Content section toggle function
   function toggleContentSection(sectionToShow) {
        const isAlreadyOpen = currentlyOpenSection === sectionToShow;
        const wasDevSectionOpen = currentlyOpenSection === devContent;
        
        // Close all sections first
        allContentSections.forEach(section => section.style.display = "none");
        DOM.get("controlPanelContent").style.display = "none";
        
        // Reset all button states (use cached reference)
        [settingsButton, infoButton, devButton].forEach(btn => btn.classList.remove('active'));
        
        if (!isAlreadyOpen) {
            // Open requested section
            sectionToShow.style.display = "block";
            document.getElementById("controlPanelContent").style.display = "block";
            currentlyOpenSection = sectionToShow;
            
            // Set active button state
            if (sectionToShow === settingsContent) settingsButton.classList.add('active');
            else if (sectionToShow === infoContent) infoButton.classList.add('active');
            else if (sectionToShow === devContent) devButton.classList.add('active');
            
            // Show close button and expand panel
            closePanelButton.style.display = 'block';
            document.getElementById("controlPanel").classList.add("expanded");
            
            // Start UI updates only for developer tools section
            if (sectionToShow === devContent) {
                restartUIUpdates();
            }
        } else {
            currentlyOpenSection = null;
            closePanelButton.style.display = 'none';
            document.getElementById("controlPanel").classList.remove("expanded");
        }
        
        // Stop UI updates if we're closing developer tools or switching away from it
        if (wasDevSectionOpen && sectionToShow !== devContent) {
            stopUIUpdates();
        }
    }
    
   // Setup button event listeners
    if (settingsButton) {
        Events.addClickListener(settingsButton, () => toggleContentSection(settingsContent));
    }
    if (infoButton) {
        Events.addClickListener(infoButton, () => toggleContentSection(infoContent));
    }
    if (devButton) {
        Events.addClickListener(devButton, () => toggleContentSection(devContent));
    }
    if (resetViewButton) {
        Events.addClickListener(resetViewButton, () => resetCameraView(camera, scene));
    }
    if (fullscreenButton) {
        Events.addClickListener(fullscreenButton, () => toggleFullscreen(fullscreenButton));
    }
    if (shareButton) {
        Events.addClickListener(shareButton, () => shareCameraView(camera, scene));
    }
    if (closePanelButton) {
        Events.addClickListener(closePanelButton, () => toggleContentSection(null));
    }

    // Update fullscreen icon on ESC key
    document.addEventListener('fullscreenchange', () => {
        updateFullscreenButton(fullscreenButton);
    });
}

/* ========================================================================
   CAMERA AND VIEW FUNCTIONS
   ======================================================================== */
/**
 * Reset camera to initial view with smooth animation
 */
function resetCameraView(camera, scene) {
    if (!camera) return;
    
    console.log("Resetting camera view to default position");
    
    // Stop any existing auto-rotation temporarily
    let wasAutoRotating = false;
    if (camera.autoRotationBehavior) {
        wasAutoRotating = camera.autoRotationBehavior.idleRotationSpeed > 0;
        if (wasAutoRotating) {
            camera.autoRotationBehavior.idleRotationSpeed = 0;
        }
    }
    
    // Respect camera radius limits when resetting
    const targetRadius = Math.max(
        Math.min(CONFIG.camera.radius, CONFIG.cameraLimits.defaultLimits.zoom.max),
        CONFIG.cameraLimits.defaultLimits.zoom.min
    );
    
    console.log(`Resetting to: alpha=${CONFIG.camera.alpha}, beta=${CONFIG.camera.beta}, radius=${targetRadius}`);
    
    // Create animation group
    const animationGroup = new BABYLON.AnimationGroup("resetViewAnimation", scene);
    
    // Create animations for each camera property
    const animations = [
        { 
            property: "target", 
            startValue: camera.target.clone(), 
            endValue: new BABYLON.Vector3(0, 0, 0),
            type: BABYLON.Animation.ANIMATIONTYPE_VECTOR3
        },
        { 
            property: "alpha", 
            startValue: camera.alpha, 
            endValue: CONFIG.camera.alpha,
            type: BABYLON.Animation.ANIMATIONTYPE_FLOAT
        },
        { 
            property: "beta", 
            startValue: camera.beta, 
            endValue: CONFIG.camera.beta,
            type: BABYLON.Animation.ANIMATIONTYPE_FLOAT
        },
        { 
            property: "radius", 
            startValue: camera.radius, 
            endValue: targetRadius,
            type: BABYLON.Animation.ANIMATIONTYPE_FLOAT
        }
    ];
    
    // Add animations to the group
    animations.forEach(({ property, startValue, endValue, type }) => {
        const animation = new BABYLON.Animation(
            `reset${property.charAt(0).toUpperCase() + property.slice(1)}`,
            property,
            60, // 60 FPS for smoother animation
            type,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        
        animation.setKeys([
            { frame: 0, value: startValue },
            { frame: 60, value: endValue } // 1 second animation
        ]);
        
        // Add easing for smoother animation
        animation.setEasingFunction(new BABYLON.CubicEase());
        animation.getEasingFunction().setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
        
        animationGroup.addTargetedAnimation(animation, camera);
    });
    
    // Add completion callback
    animationGroup.onAnimationGroupEndObservable.add(() => {
        console.log("Reset animation completed");
        
        // Ensure camera constraints are properly applied after animation
        camera.radius = Math.max(
            Math.min(camera.radius, CONFIG.cameraLimits.defaultLimits.zoom.max),
            CONFIG.cameraLimits.defaultLimits.zoom.min
        );
        
        // Re-enable auto-rotation if it was previously active
        if (wasAutoRotating && camera.autoRotationBehavior && CONFIG.camera.autoRotation) {
            camera.autoRotationBehavior.idleRotationSpeed = CONFIG.camera.autoRotation.idleRotationSpeed;
        }
        
        // Clean up the animation group
        animationGroup.dispose();
    });
    
    // Start the animation
    animationGroup.play(false); // false = don't loop
    
    console.log("Reset animation started");
}

/**
 * Toggle fullscreen mode
 */
function toggleFullscreen(fullscreenButton) {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            showToast(ErrorMessages.SYSTEM.FULLSCREEN_FAILED);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
    
    updateFullscreenButton(fullscreenButton);
}

/**
 * Update fullscreen button icon based on current state
 */
function updateFullscreenButton(fullscreenButton) {
    if (!fullscreenButton) return;
    
    if (document.fullscreenElement) {
        fullscreenButton.innerHTML = ICONS.fullscreen_exit;
        fullscreenButton.title = "Exit Fullscreen";
    } else {
        fullscreenButton.innerHTML = ICONS.fullscreen;
        fullscreenButton.title = "Enter Fullscreen";
    }
}

/**
 * Share current camera view via URL
 */
function shareCameraView(camera, scene) {
    if (!camera) return;
    
    // Get current model URL
    const currentModelUrl = scene.currentModelUrl || CONFIG.defaultModelUrl;
    
    // Build base parameters
    const params = new URLSearchParams({
        model: currentModelUrl,
        alpha: camera.alpha.toFixed(2),
        beta: camera.beta.toFixed(2),
        radius: camera.radius.toFixed(2),
        fov: camera.fov.toFixed(2),
        tx: camera.target.x.toFixed(2),
        ty: camera.target.y.toFixed(2),
        tz: camera.target.z.toFixed(2)
    });
    
    // Add model scale if available
    if (scene.currentModel && scene.currentModel.scaling) {
        // Model scaling is uniform, so we can use any component (x, y, or z)
        const modelScale = scene.currentModel.scaling.x;
        params.set('scale', modelScale.toFixed(2));
    }
    
    // Add camera limits to shared URL
    if (scene.cameraLimits) {
        const limitsParams = scene.cameraLimits.getLimitsForUrl();
        Object.entries(limitsParams).forEach(([key, value]) => {
            if (value !== undefined && value !== '') {
                params.set(key, value);
            }
        });
    }
    
    const shareUrl = `${window.location.href.split('?')[0]}?${params.toString()}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(shareUrl).then(() => {
        showToast('URL with camera limits copied to clipboard!');
    }).catch(() => {
        // Fallback for older browsers
        const tempInput = createElement('input', { 
            type: 'text',
            value: shareUrl 
        });
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        showToast('URL with camera limits copied to clipboard!');
    });
}

/* ========================================================================
   TOUCH UI FUNCTIONS
   ======================================================================== */
/**
 * Setup touch-specific UI features
 */
function setupTouchUI(controlPanel, camera) {
    // Add swipe-to-close gesture for expanded panel
    let touchStartY = 0;
    
    const handleTouchStart = (e) => {
        if (controlPanel.classList.contains('expanded')) {
            touchStartY = e.touches[0].clientY;
        }
    };
    
    const handleTouchMove = (e) => {
        if (controlPanel.classList.contains('expanded') && touchStartY > 0) {
            const touchY = e.touches[0].clientY;
            const diff = touchY - touchStartY;
            
            // Swipe down by 50px to close
            if (diff > 50) {
                closeAllPanels();
                touchStartY = 0;
                e.preventDefault();
            }
        }
    };
    
    const handleTouchEnd = () => {
        touchStartY = 0;
    };
    
    // Add touch event listeners
    controlPanel.addEventListener('touchstart', handleTouchStart, { passive: true });
    controlPanel.addEventListener('touchmove', handleTouchMove, { passive: false });
    controlPanel.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    // Add visual feedback for touch buttons (using cached query)
    const buttons = DOM.getButtonsInContainer(controlPanel);
    buttons.forEach(button => {
        button.addEventListener('touchstart', () => button.classList.add('touch-active'), { passive: true });
        button.addEventListener('touchend', () => button.classList.remove('touch-active'), { passive: true });
        button.addEventListener('touchcancel', () => button.classList.remove('touch-active'), { passive: true });
    });
    
    // Apply default touch settings
    updateTouchSensitivity(1.0, camera);
}

/* ========================================================================
   UTILITY FUNCTIONS
   ======================================================================== */
/**
 * Close all open panels and reset UI state
 */
function closeAllPanels() {
    // Use cached DOM queries for better performance
    const allContentSections = DOM.getAllContentSections();
    const controlPanelContent = DOM.get("controlPanelContent");
    const controlPanel = DOM.get("controlPanel");
    const buttons = DOM.getAllIconButtons();
    
    allContentSections.forEach(section => section.style.display = "none");
    if (controlPanelContent) controlPanelContent.style.display = "none";
    if (controlPanel) controlPanel.classList.remove("expanded");
    buttons.forEach(btn => btn.classList.remove('active'));
    
    // Stop UI updates when closing all panels
    stopUIUpdates();
}

/**
 * Update touch sensitivity for camera controls
 */
function updateTouchSensitivity(sensitivity, camera) {
    if (!camera) return;
    
    // Adjust camera sensitivity parameters using CONFIG constants
    camera.angularSensibilityX = CONFIG.ui.sensitivity.baseAngular / sensitivity;
    camera.angularSensibilityY = CONFIG.ui.sensitivity.baseAngular / sensitivity;
    camera.panningSensibility = CONFIG.ui.sensitivity.basePanning / sensitivity;
    
    // Update gesture controller if available
    if (window.gestureController && window.gestureController.thresholds) {
        const thresholds = window.gestureController.thresholds;
        thresholds.pinchSensitivity = CONFIG.gesture.pinchSensitivity * sensitivity;
        thresholds.panSensitivity = (CONFIG.mobile.panningSensibility / 1000) * sensitivity;
    }
}

/**
 * Apply camera parameters from URL (for sharing feature)
 */
export function applyCameraParametersFromUrl(camera) {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.has('alpha') && urlParams.has('beta') && urlParams.has('radius')) {
        const alpha = parseFloat(urlParams.get('alpha'));
        const beta = parseFloat(urlParams.get('beta'));
        const radius = parseFloat(urlParams.get('radius'));
        
        if (!isNaN(alpha) && !isNaN(beta) && !isNaN(radius)) {
            camera.alpha = alpha;
            camera.beta = beta;
            camera.radius = radius;
        }
        
        // Apply FOV if available
        if (urlParams.has('fov')) {
            const fov = parseFloat(urlParams.get('fov'));
            if (!isNaN(fov)) {
                camera.fov = fov;
            }
        }
        
        // Apply target position if available
        if (urlParams.has('tx') && urlParams.has('ty') && urlParams.has('tz')) {
            const tx = parseFloat(urlParams.get('tx'));
            const ty = parseFloat(urlParams.get('ty'));
            const tz = parseFloat(urlParams.get('tz'));
            
            if (!isNaN(tx) && !isNaN(ty) && !isNaN(tz)) {
                camera.target = new BABYLON.Vector3(tx, ty, tz);
            }
        }
        
        console.log("Applied camera parameters from URL");
    }
}

/**
 * Apply model scale from URL parameters (for sharing feature)
 * Should be called after the model is loaded
 */
export function applyModelScaleFromUrl(scene) {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.has('scale') && scene.currentModel) {
        const scale = parseFloat(urlParams.get('scale'));
        
        if (!isNaN(scale) && scale > 0) {
            // Apply the scale to the model
            scene.currentModel.scaling.setAll(scale);
            
            // Update the UI slider to reflect the loaded scale
            const modelScaleRange = document.getElementById('modelScaleRange');
            const modelScaleDisplay = document.getElementById('modelScaleRangeDisplay');
            if (modelScaleRange && modelScaleDisplay) {
                modelScaleRange.value = scale;
                modelScaleDisplay.textContent = scale.toFixed(1);
            }
            
            console.log(`Applied model scale from URL: ${scale}`);
        }
    }
}