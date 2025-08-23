/* ========================================================================
   3D VIEWER UI CONTROLLER
   ======================================================================== */

// Import components
import { ICONS } from './ui/components/icons.js';
import { createElement } from './ui/components/controls.js';
import { showToast } from './ui/components/toast.js';

// Import panels
import { createSettingsSection, setupSettingsControls, updateQualitySettings, updateAntiAliasing } from './ui/panels/settingsPanel.js';
import { createDevSection, setupModelLoading } from './ui/panels/devPanel.js';
import { createInfoSection } from './ui/panels/infoPanel.js';

// Import dependencies
import { setupUIUpdates, stopUIUpdates, restartUIUpdates, DOM, Events, ErrorMessages, LoadingSpinner } from './helpers.js';
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
    console.log("🎨 [UI Setup] Starting UI setup...");
    
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
    
    // Initially hide all content sections
    const sections = contentArea.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.style.display = 'none';
    });
    
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
    
    console.log("🎨 [UI Setup] UI setup complete!");
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
}

/**
 * Initialize post-processing settings
 */
function initializePostProcessingSettings(scene) {
    if (scene.pipeline) {
        scene.pipeline.sharpen.edgeAmount = CONFIG.postProcessing.sharpenEdgeAmount;
        scene.pipeline.sharpenEnabled = CONFIG.postProcessing.sharpenEnabled;
        scene.pipeline.fxaaEnabled = CONFIG.postProcessing.fxaaEnabled;
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
    
    // Get the HTML for each section
    const settingsHTML = createSettingsSection(hasTouch);
    const infoHTML = createInfoSection(hasTouch);
    const devHTML = createDevSection();
    
    contentArea.innerHTML = `
        <button id="closePanelButton" class="close-panel-button" title="Close Panel">×</button>
        
        ${settingsHTML}
        ${infoHTML}
        ${devHTML}
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

    // Track currently open section
    let currentlyOpenSection = null;
    
    // Content section toggle function
    function toggleContentSection(sectionToShow) {
        const allContentSections = DOM.getAllContentSections();
        const isAlreadyOpen = currentlyOpenSection === sectionToShow;
        const wasDevSectionOpen = currentlyOpenSection && currentlyOpenSection.id === 'devContent';
        
        // Close all sections first
        allContentSections.forEach(section => {
            if (section) section.style.display = "none";
        });
        
        const controlPanelContent = DOM.get("controlPanelContent");

        // Reset all button states
        [settingsButton, infoButton, devButton].forEach(btn => {
            if (btn) btn.classList.remove('active');
        });

        // If a new section is to be opened
        if (!isAlreadyOpen && sectionToShow) {
            // Ensure the container is visible, then show the specific section
            if (controlPanelContent) controlPanelContent.style.display = "block";
            sectionToShow.style.display = "block";
            currentlyOpenSection = sectionToShow;

            // Set active button state
            if (sectionToShow.id === 'settingsContent' && settingsButton) {
                settingsButton.classList.add('active');
            } else if (sectionToShow.id === 'infoContent' && infoButton) {
                infoButton.classList.add('active');
            } else if (sectionToShow.id === 'devContent' && devButton) {
                devButton.classList.add('active');
            }

            // Show close button and expand panel
            if (closePanelButton) closePanelButton.style.display = 'block';
            const controlPanel = DOM.get("controlPanel");
            if (controlPanel) controlPanel.classList.add("expanded");

            // Start UI updates only for the developer tools panel
            if (sectionToShow.id === 'devContent') {
                restartUIUpdates();
            }
        } else {
            // This block handles closing the currently open panel
            currentlyOpenSection = null;
            if (closePanelButton) closePanelButton.style.display = 'none';
            
            const controlPanel = DOM.get("controlPanel");
            if (controlPanel) controlPanel.classList.remove("expanded");
            
            if (controlPanelContent) {
                controlPanelContent.style.display = "none";
            }
        }

        // Stop UI updates if the developer tools panel was just closed
        if (wasDevSectionOpen && (!sectionToShow || sectionToShow.id !== 'devContent')) {
            stopUIUpdates();
        }
    }
    
    // Setup button event listeners
    if (settingsButton) {
        Events.addClickListener(settingsButton, () => toggleContentSection(DOM.get("settingsContent")));
    }
    if (infoButton) {
        Events.addClickListener(infoButton, () => toggleContentSection(DOM.get("infoContent")));
    }
    if (devButton) {
        Events.addClickListener(devButton, () => toggleContentSection(DOM.get("devContent")));
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
    
    const animationGroup = new BABYLON.AnimationGroup("resetViewAnimation", scene);
    
    // Create animations for each camera property
    const animations = [
        { property: "target", endValue: new BABYLON.Vector3(0, 0, 0), type: BABYLON.Animation.ANIMATIONTYPE_VECTOR3 },
        { property: "alpha", endValue: CONFIG.camera.alpha, type: BABYLON.Animation.ANIMATIONTYPE_FLOAT },
        { property: "beta", endValue: CONFIG.camera.beta, type: BABYLON.Animation.ANIMATIONTYPE_FLOAT },
        { property: "radius", endValue: targetRadius, type: BABYLON.Animation.ANIMATIONTYPE_FLOAT }
    ];
    
    animations.forEach(({ property, endValue, type }) => {
        const animation = new BABYLON.Animation(
            `reset${property.charAt(0).toUpperCase() + property.slice(1)}`, property, 60, type,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        animation.setKeys([ { frame: 0, value: camera[property] }, { frame: 60, value: endValue } ]);
        const easingFunction = new BABYLON.CubicEase();
        easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
        animation.setEasingFunction(easingFunction);
        animationGroup.addTargetedAnimation(animation, camera);
    });
    
    animationGroup.onAnimationGroupEndObservable.add(() => {
        if (wasAutoRotating && camera.autoRotationBehavior && CONFIG.camera.autoRotation) {
            camera.autoRotationBehavior.idleRotationSpeed = CONFIG.camera.autoRotation.idleRotationSpeed;
        }
        animationGroup.dispose();
    });
    
    animationGroup.play(false);
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
    } else if (document.exitFullscreen) {
        document.exitFullscreen();
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
    
    const currentModelUrl = scene.currentModelUrl || CONFIG.defaultModelUrl;
    
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
    
    if (scene.currentModel && scene.currentModel.scaling) {
        params.set('scale', scene.currentModel.scaling.x.toFixed(2));
    }
    
    addSettingsPanelToUrl(params, camera, scene);
    
    if (scene.cameraLimits) {
        const limitsParams = scene.cameraLimits.getLimitsForUrl();
        Object.entries(limitsParams).forEach(([key, value]) => {
            if (value !== undefined && value !== '') {
                params.set(key, value);
            }
        });
    }
    
    const compressedParams = compressUrlParameters(params);
    const shareUrl = `${window.location.href.split('?')[0]}?${compressedParams}`;
    
    console.log(`URL compression active. Final length: ${compressedParams.length} characters.`);
    
    navigator.clipboard.writeText(shareUrl).then(() => {
        showToast('URL with complete settings copied to clipboard!');
    }).catch(() => {
        const tempInput = createElement('input', { type: 'text', value: shareUrl });
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        showToast('URL with complete settings copied to clipboard!');
    });
}

/* ========================================================================
   TOUCH UI FUNCTIONS
   ======================================================================== */
/**
 * Setup touch-specific UI features
 */
function setupTouchUI(controlPanel, camera) {
    let touchStartY = 0;
    
    const handleTouchStart = (e) => {
        if (controlPanel.classList.contains('expanded')) {
            touchStartY = e.touches[0].clientY;
        }
    };
    
    const handleTouchMove = (e) => {
        if (controlPanel.classList.contains('expanded') && touchStartY > 0) {
            const diff = e.touches[0].clientY - touchStartY;
            if (diff > 50) { // Swipe down by 50px to close
                closeAllPanels();
                touchStartY = 0;
                e.preventDefault();
            }
        }
    };
    
    controlPanel.addEventListener('touchstart', handleTouchStart, { passive: true });
    controlPanel.addEventListener('touchmove', handleTouchMove, { passive: false });
    controlPanel.addEventListener('touchend', () => touchStartY = 0, { passive: true });
    
    // Add visual feedback for touch buttons
    const buttons = DOM.getButtonsInContainer(controlPanel);
    buttons.forEach(button => {
        button.addEventListener('touchstart', () => button.classList.add('touch-active'), { passive: true });
        button.addEventListener('touchend', () => button.classList.remove('touch-active'), { passive: true });
        button.addEventListener('touchcancel', () => button.classList.remove('touch-active'), { passive: true });
    });
    
    updateTouchSensitivity(1.0, camera);
}

/* ========================================================================
   UTILITY FUNCTIONS
   ======================================================================== */
/**
 * Close all open panels and reset UI state
 */
function closeAllPanels() {
    const allContentSections = DOM.getAllContentSections();
    const controlPanelContent = DOM.get("controlPanelContent");
    const controlPanel = DOM.get("controlPanel");
    const buttons = DOM.getAllIconButtons();
    
    allContentSections.forEach(section => section.style.display = "none");
    if (controlPanelContent) controlPanelContent.style.display = "none";
    if (controlPanel) controlPanel.classList.remove("expanded");
    buttons.forEach(btn => btn.classList.remove('active'));
    
    stopUIUpdates();
}

/**
 * Update touch sensitivity for camera controls
 */
function updateTouchSensitivity(sensitivity, camera) {
    if (!camera) return;
    
    camera.angularSensibilityX = CONFIG.ui.sensitivity.baseAngular / sensitivity;
    camera.angularSensibilityY = CONFIG.ui.sensitivity.baseAngular / sensitivity;
    camera.panningSensibility = CONFIG.ui.sensitivity.basePanning / sensitivity;
    
    if (window.gestureController && window.gestureController.thresholds) {
        const thresholds = window.gestureController.thresholds;
        thresholds.pinchSensitivity = CONFIG.gesture.pinchSensitivity * sensitivity;
        thresholds.panSensitivity = (CONFIG.mobile.panningSensibility / 1000) * sensitivity;
    }
}

// [Include all URL parameter functions and remaining code unchanged...]

/**
 * URL Parameter Compression System
 * Maps full parameter names to short codes for more compact URLs
 */
const URL_PARAM_MAP = {
    // Camera parameters
    'model': 'm',
    'alpha': 'a',
    'beta': 'b', 
    'radius': 'r',
    'fov': 'f',
    'tx': 'x',
    'ty': 'y',
    'tz': 'z',
    'scale': 's',
    
    // Settings panel
    'autoRotate': 'ar',
    'quality': 'q',
    'sharpen': 'sh',
    'sharpenIntensity': 'si',
    'antiAliasing': 'aa',
    'touchSensitivity': 'ts',
    
    // Camera limits (shorter codes)
    'restrictions': 'rest',
    'alphaMin': 'an',
    'alphaMax': 'ax',
    'betaMin': 'bn',
    'betaMax': 'bx',
    'radiusMin': 'rn',
    'radiusMax': 'rx'
};

const REVERSE_URL_PARAM_MAP = Object.fromEntries(
    Object.entries(URL_PARAM_MAP).map(([k, v]) => [v, k])
);

/**
 * Compress URL parameters by using short codes and base64 encoding when beneficial
 */
function compressUrlParameters(params) {
    const compressed = new URLSearchParams();
    
    for (const [key, value] of params.entries()) {
        const shortKey = URL_PARAM_MAP[key] || key;
        
        // For numeric values, round to reasonable precision
        if (!isNaN(parseFloat(value)) && isFinite(value)) {
            const numValue = parseFloat(value);
            compressed.set(shortKey, numValue.toFixed(2));
        } else {
            // For string values, apply compression
            if (key === 'model') {
                // Keep model URLs as-is since they need to be valid
                compressed.set(shortKey, value);
            } else if (key === 'quality') {
                // Compress quality values: low=l, medium=m, high=h
                const qualityMap = { 'low': 'l', 'medium': 'm', 'high': 'h' };
                compressed.set(shortKey, qualityMap[value] || value);
            } else if (key === 'antiAliasing') {
                // Compress AA values: none=n, fxaa=f
                const aaMap = { 'none': 'n', 'fxaa': 'f' };
                compressed.set(shortKey, aaMap[value] || value);
            } else if (key === 'restrictions') {
                // Keep restrictions as-is since they're already compressed
                compressed.set(shortKey, value);
            } else {
                compressed.set(shortKey, value);
            }
        }
    }
    
    // If still very long, encode the entire parameter string in base64
    const compressedString = compressed.toString();
    if (compressedString.length > 2000) {
        // Use base64 encoding as last resort for extremely long URLs
        const encoded = btoa(compressedString);
        return `c=${encoded}`;
    }
    
    return compressedString;
}

/**
 * Decompress URL parameters by reversing the compression process
 */
export function decompressUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Check if URL is base64 compressed
    if (urlParams.has('c')) {
        try {
            const decoded = atob(urlParams.get('c'));
            const decodedParams = new URLSearchParams(decoded);
            
            // Convert short keys back to full keys
            const fullParams = new URLSearchParams();
            for (const [shortKey, value] of decodedParams.entries()) {
                const fullKey = REVERSE_URL_PARAM_MAP[shortKey] || shortKey;
                
                // Decompress specific values
                let decompressedValue = value;
                if (fullKey === 'quality') {
                    const qualityMap = { 'l': 'low', 'm': 'medium', 'h': 'high' };
                    decompressedValue = qualityMap[value] || value;
                } else if (fullKey === 'antiAliasing') {
                    const aaMap = { 'n': 'none', 'f': 'fxaa' };
                    decompressedValue = aaMap[value] || value;
                }
                
                fullParams.set(fullKey, decompressedValue);
            }
            
            return fullParams;
        } catch (error) {
            console.warn('Failed to decompress URL parameters:', error);
            return urlParams;
        }
    }
    
    // Convert short keys back to full keys for uncompressed URLs
    const fullParams = new URLSearchParams();
    for (const [shortKey, value] of urlParams.entries()) {
        const fullKey = REVERSE_URL_PARAM_MAP[shortKey] || shortKey;
        
        // Decompress specific values
        let decompressedValue = value;
        if (fullKey === 'quality') {
            const qualityMap = { 'l': 'low', 'm': 'medium', 'h': 'high' };
            decompressedValue = qualityMap[value] || value;
        } else if (fullKey === 'antiAliasing') {
            const aaMap = { 'n': 'none', 'f': 'fxaa' };
            decompressedValue = aaMap[value] || value;
        }
        
        fullParams.set(fullKey, decompressedValue);
    }
    
    return fullParams;
}

/**
 * Add settings panel state to URL parameters
 */
function addSettingsPanelToUrl(params, camera, scene) {
    // Auto rotation setting
    if (camera.useAutoRotationBehavior !== CONFIG.camera.useAutoRotationBehavior) {
        params.set('autoRotate', camera.useAutoRotationBehavior ? '1' : '0');
    }
    
    // Quality setting
    const qualitySelect = document.getElementById('qualitySelect');
    if (qualitySelect && qualitySelect.value !== 'medium') {
        params.set('quality', qualitySelect.value);
    }
    
    // Post-processing settings
    if (scene.pipeline) {
        // Sharpening
        if (scene.pipeline.sharpenEnabled !== CONFIG.postProcessing.sharpenEnabled) {
            params.set('sharpen', scene.pipeline.sharpenEnabled ? '1' : '0');
        }
        if (scene.pipeline.sharpen && Math.abs(scene.pipeline.sharpen.edgeAmount - CONFIG.postProcessing.sharpenEdgeAmount) > 0.01) {
            params.set('sharpenIntensity', scene.pipeline.sharpen.edgeAmount.toFixed(1));
        }
        
        // Anti-aliasing
        const antiAliasingSelect = document.getElementById('antiAliasingSelect');
        if (antiAliasingSelect && antiAliasingSelect.value !== CONFIG.postProcessing.antiAliasing.type) {
            params.set('antiAliasing', antiAliasingSelect.value);
        }
    }
    
    // Touch sensitivity (if different from default)
    const touchSensitivityRange = document.getElementById('touchSensitivityRange');
    if (touchSensitivityRange && touchSensitivityRange.value !== '5') {
        params.set('touchSensitivity', touchSensitivityRange.value);
    }
}

/**
 * Apply camera parameters from URL (for sharing feature)
 */
export function applyCameraParametersFromUrl(camera) {
    const urlParams = decompressUrlParameters();
    
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
    const urlParams = decompressUrlParameters();
    
    if (urlParams.has('scale') && scene.currentModel) {
        const scale = parseFloat(urlParams.get('scale'));
        
        if (!isNaN(scale) && scale > 0) {
            // Apply the scale to the model
            scene.currentModel.scaling.setAll(scale);
            
            // Update the UI slider to reflect the loaded scale
            const modelScaleRange = document.getElementById('modelScaleRange');
            const modelScaleDisplay = document.getElementById('modelScaleDisplay');
            if (modelScaleRange && modelScaleDisplay) {
                modelScaleRange.value = scale;
                modelScaleDisplay.textContent = scale.toFixed(1);
            }
            
            console.log(`Applied model scale from URL: ${scale}`);
        }
    }
}

/**
 * Apply settings panel state from URL parameters (for sharing feature)
 * Should be called after UI is set up
 */
export function applySettingsPanelFromUrl(camera, scene) {
    const urlParams = decompressUrlParameters();
    
    // Auto rotation setting
    if (urlParams.has('autoRotate')) {
        const autoRotate = urlParams.get('autoRotate') === '1';
        camera.useAutoRotationBehavior = autoRotate;
        
        const autoRotateToggle = document.getElementById('autoRotateToggle');
        if (autoRotateToggle) {
            autoRotateToggle.checked = autoRotate;
        }
        
        if (!autoRotate && camera.autoRotationBehavior) {
            camera.stopAutoRotation();
        }
    }
    
    // Quality setting
    if (urlParams.has('quality')) {
        const quality = urlParams.get('quality');
        const qualitySelect = document.getElementById('qualitySelect');
        if (qualitySelect && ['low', 'medium', 'high'].includes(quality)) {
            qualitySelect.value = quality;
            updateQualitySettings(quality, scene);
        }
    }
    
    // Post-processing settings
    if (scene.pipeline) {
        // Sharpening
        if (urlParams.has('sharpen')) {
            const sharpen = urlParams.get('sharpen') === '1';
            scene.pipeline.sharpenEnabled = sharpen;
            
            const sharpenToggle = document.getElementById('sharpenToggle');
            if (sharpenToggle) {
                sharpenToggle.checked = sharpen;
            }
        }
        
        if (urlParams.has('sharpenIntensity')) {
            const intensity = parseFloat(urlParams.get('sharpenIntensity'));
            if (!isNaN(intensity) && intensity >= 0 && intensity <= 2) {
                scene.pipeline.sharpen.edgeAmount = intensity;
                CONFIG.postProcessing.sharpenEdgeAmount = intensity;
                
                const sharpenIntensityRange = document.getElementById('sharpenIntensityRange');
                const sharpenIntensityDisplay = document.getElementById('sharpenIntensityDisplay');
                if (sharpenIntensityRange && sharpenIntensityDisplay) {
                    sharpenIntensityRange.value = intensity;
                    sharpenIntensityDisplay.textContent = intensity.toFixed(1);
                }
            }
        }
        
        // Anti-aliasing
        if (urlParams.has('antiAliasing')) {
            const aaType = urlParams.get('antiAliasing');
            if (['none', 'fxaa'].includes(aaType)) {
                updateAntiAliasing(aaType, scene, camera);
                
                const antiAliasingSelect = document.getElementById('antiAliasingSelect');
                if (antiAliasingSelect) {
                    antiAliasingSelect.value = aaType;
                }
            }
        }
    }
    
    // Touch sensitivity
    if (urlParams.has('touchSensitivity')) {
        const sensitivity = parseInt(urlParams.get('touchSensitivity'));
        if (!isNaN(sensitivity) && sensitivity >= 1 && sensitivity <= 10) {
            const touchSensitivityRange = document.getElementById('touchSensitivityRange');
            if (touchSensitivityRange) {
                touchSensitivityRange.value = sensitivity;
                updateTouchSensitivity(sensitivity / 5.0, camera);
            }
        }
    }
    
    console.log("Applied settings panel state from URL");
}