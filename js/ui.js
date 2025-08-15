/* ========================================================================
   3D VIEWER UI CONTROLLER - CLEAN & ORGANIZED
   ======================================================================== */

import { setupUIUpdates, startUIUpdates, stopUIUpdates, DOM, Events, ErrorMessages } from './helpers.js';
import { loadModel } from './modelLoader.js';
import { CONFIG } from './config.js';
import { detectDevice } from './deviceDetection.js';

/* ========================================================================
   SVG ICONS DEFINITIONS
   ======================================================================== */
const ICONS = {
    settings: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z"/></svg>`,
    info: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>`,
    dev: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg>`,
    fullscreen: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>`,
    fullscreen_exit: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>`,
    reset_view: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>`,
    share: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92zM18 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM6 13c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm12 7.02c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/></svg>`,
    file_open: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M20 6h-2.18l.45-1.35c.1-.31.04-.65-.14-.92C18.03 3.47 17.74 3.35 17.44 3.35H6.56c-.3 0-.59.12-.69.38-.18.27-.24.61-.14.92L6.18 6H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM6.5 5h11l-.5 1.5h-10L6.5 5zM20 18H4V8h16v10z"/></svg>`,
    export: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>`,
};

/* ========================================================================
   DOM UTILITY FUNCTIONS
   ======================================================================== */

/**
 * Creates a DOM element with optional class, innerHTML, and attributes
 */
function createElement(tag, options = {}) {
    const element = document.createElement(tag);
    if (options.className) element.className = options.className;
    if (options.innerHTML) element.innerHTML = options.innerHTML;
    if (options.id) element.id = options.id;
    if (options.value !== undefined) element.value = options.value;
    
    // Handle common input properties
    if (options.type) element.type = options.type;
    if (options.accept) element.accept = options.accept;
    if (options.placeholder) element.placeholder = options.placeholder;
    
    // Handle custom attributes
    if (options.attributes) {
        Object.entries(options.attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
    }
    
    return element;
}


/**
 * Creates a standardized toggle switch HTML
 */
function createToggleSwitch(id, label, checked = false) {
    return `
        <div class="control-group">
            <label for="${id}">${label}</label>
            <label class="switch">
                <input type="checkbox" id="${id}"${checked ? ' checked' : ''}>
                <span class="slider round"></span>
            </label>
        </div>
    `;
}

/**
 * Creates a standardized range control HTML
 */
function createRangeControl(id, label, min, max, value, step = 1, unit = '') {
    return `
        <div class="control-group">
            <label for="${id}">${label}</label>
            <div class="range-container">
                <input type="range" id="${id}" min="${min}" max="${max}" value="${value}" step="${step}">
                <span id="${id}Display" class="range-value">${value}${unit}</span>
            </div>
        </div>
    `;
}

/**
 * Gets all camera limits control elements
 */
function getCameraLimitsElements() {
    return {
        // Toggle controls
        masterToggle: document.getElementById('cameraLimitsToggle'),
        limitZoomToggle: document.getElementById('limitZoomToggle'),
        limitVerticalToggle: document.getElementById('limitVerticalToggle'),
        limitHorizontalToggle: document.getElementById('limitHorizontalToggle'),
        limitPanToggle: document.getElementById('limitPanToggle'),
        
        // Range controls
        zoomMinRange: document.getElementById('zoomMinRange'),
        zoomMaxRange: document.getElementById('zoomMaxRange'),
        verticalUpRange: document.getElementById('verticalUpRange'),
        verticalDownRange: document.getElementById('verticalDownRange'),
        horizontalAngleRange: document.getElementById('horizontalAngleRange'),
        horizontalOffsetRange: document.getElementById('horizontalOffsetRange'),
        
        // Display elements
        zoomMinDisplay: document.getElementById('zoomMinDisplay'),
        zoomMaxDisplay: document.getElementById('zoomMaxDisplay'),
        verticalUpDisplay: document.getElementById('verticalUpDisplay'),
        verticalDownDisplay: document.getElementById('verticalDownDisplay'),
        horizontalAngleDisplay: document.getElementById('horizontalAngleDisplay'),
        horizontalOffsetDisplay: document.getElementById('horizontalOffsetDisplay'),
        
        // Action buttons
        resetButton: document.getElementById('resetLimitsButton')
    };
}

/**
 * Sets up camera limits toggle event handlers
 */
function setupCameraLimitsToggles(elements, cameraLimits) {
    const { masterToggle, limitZoomToggle, limitVerticalToggle, limitHorizontalToggle, limitPanToggle,
            verticalUpRange, verticalDownRange, horizontalAngleRange, horizontalOffsetRange } = elements;
    
    // Master toggle
    if (masterToggle) {
        Events.addToggleListener(masterToggle, (checked) => {
            cameraLimits.setEnabled(checked);
            console.log('Camera limits enabled:', checked);
        });
    }
    
    // Individual limit toggles
    if (limitZoomToggle) {
        Events.addToggleListener(limitZoomToggle, (checked) => {
            const limits = cameraLimits.getCurrentLimits();
            cameraLimits.setDistanceLimits(checked, limits.radiusMin, limits.radiusMax);
            console.log('Zoom limits enabled:', checked);
        });
    }
    
    if (limitVerticalToggle) {
        Events.addToggleListener(limitVerticalToggle, (checked) => {
            const upValue = parseFloat(verticalUpRange.value);
            const downValue = parseFloat(verticalDownRange.value);
            cameraLimits.setVerticalLimitsUpDown(checked, upValue, downValue);
            console.log('Vertical limits enabled:', checked);
        });
    }
    
    if (limitHorizontalToggle) {
        Events.addToggleListener(limitHorizontalToggle, (checked) => {
            const totalAngle = parseFloat(horizontalAngleRange.value);
            const offset = parseFloat(horizontalOffsetRange.value);
            cameraLimits.setHorizontalLimitsAngleOffset(checked, totalAngle, offset);
            console.log('Horizontal limits enabled:', checked);
        });
    }
    
    if (limitPanToggle) {
        Events.addToggleListener(limitPanToggle, (checked) => {
            cameraLimits.setPanningEnabled(checked);
            console.log('Panning enabled:', checked);
        });
    }
}

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



/**
 * Create info section HTML
 */
function createInfoSection(hasTouch) {
    return `
        <div id="infoContent" class="content-section" style="display: none;">
            <h4>Controls</h4>
            
            <div class="info-group">
                <div class="info-title">Navigation</div>
                <ul class="info-list">
                    <li><span class="info-action">Left Click + Drag</span>: Orbit Camera</li>
                    <li><span class="info-action">Right Click + Drag</span>: Pan Camera</li>
                    <li><span class="info-action">Scroll</span>: Zoom In/Out</li>
                    <li><span class="info-action">Double Click</span>: Focus Point</li>
                </ul>
            </div>
            
            ${hasTouch ? `
            <div class="info-group">
                <div class="info-title">Touch Controls</div>
                <ul class="info-list">
                    <li><span class="info-action">One Finger Drag</span>: Orbit Camera</li>
                    <li><span class="info-action">Two Finger Drag</span>: Pan Camera</li>
                    <li><span class="info-action">Pinch</span>: Zoom In/Out</li>
                    <li><span class="info-action">Double Tap</span>: Focus Point</li>
                </ul>
            </div>` : ''}
            
            <div class="info-group">
                <div class="info-title">General</div>
                <ul class="info-list">
                    <li><span class="info-action">Auto Rotation</span>: Camera rotates after period of inactivity</li>
                    <li><span class="info-action">Reset View</span>: Returns to initial camera position</li>
                </ul>
            </div>
        </div>
    `;
}

/**
 * Create developer tools section HTML
 */
function createDevSection() {
    return `
        <div id="devContent" class="content-section" style="display: none;">
            <h4>Developer Tools</h4>
            
            <div class="dev-section">
                <div class="dev-title">Performance</div>
                <div class="scene-info">
                    <div class="info-row">
                        <span class="info-label">FPS:</span>
                        <span id="controlPanelFps" class="info-value">0</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Resolution:</span>
                        <span id="controlPanelResolution" class="info-value">0 x 0</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Vertices:</span>
                        <span id="controlPanelVertices" class="info-value">0</span>
                    </div>
                </div>
            </div>
            
            <div class="settings-separator"></div>
            
            <div class="dev-section">
                <div class="dev-title">Device Detection</div>
                <div class="scene-info">
                    <div class="info-row">
                        <span class="info-label">Touch Support:</span>
                        <span id="deviceTouch" class="info-value">-</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Mobile UA:</span>
                        <span id="deviceMobile" class="info-value">-</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Touch Device:</span>
                        <span id="deviceTouchDevice" class="info-value">-</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Device Type:</span>
                        <span id="deviceType" class="info-value">-</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Max Touch Points:</span>
                        <span id="deviceMaxTouch" class="info-value">-</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Screen Size:</span>
                        <span id="deviceScreenSize" class="info-value">-</span>
                    </div>
                </div>
            </div>
            
            <div class="settings-separator"></div>
            
            <div class="dev-section">
                <div class="dev-title">Load Model</div>
                <div class="model-loader file-loader">
                    <button id="loadModelFileButton" class="action-button">
                        <span class="button-text">Load from File</span>
                    </button>
                </div>
                
                <div class="model-loader url-loader">
                    <input type="text" id="modelUrlInput" placeholder="Enter model URL" class="url-input">
                    <button id="loadModelUrlButton" class="action-button">
                        <span class="button-text">Load from URL</span>
                    </button>
                </div>
            </div>
            
            <div id="loadingSpinner" class="loading-spinner">
                <div class="spinner-animation"></div>
                <div class="spinner-text">Loading Model...</div>
            </div>
            
            <div class="settings-separator"></div>
            
            <div class="dev-section">
                <div class="dev-title">Export</div>
                <button id="exportButton" class="action-button">
                    ${ICONS.export}
                    <span class="button-text">Export Viewer</span>
                </button>
            </div>
        </div>
    `;
}

/* ========================================================================
   EVENT HANDLERS
   ======================================================================== */
/**
 * Setup all icon button event handlers
 */
function setupIconButtonHandlers(camera, scene, engine) {
    // Get button references
    const settingsButton = document.getElementById("settingsButton");
    const infoButton = document.getElementById("infoButton");
    const devButton = document.getElementById("devButton");
    const resetViewButton = document.getElementById("resetViewButton");
    const fullscreenButton = document.getElementById("fullscreenButton");
    const shareButton = document.getElementById("shareButton");
    const closePanelButton = document.getElementById("closePanelButton");

    // Get content sections
    const settingsContent = document.getElementById("settingsContent");
    const infoContent = document.getElementById("infoContent");
    const devContent = document.getElementById("devContent");
    const allContentSections = [settingsContent, infoContent, devContent];
    
    let currentlyOpenSection = null;
    
    // Content section toggle function
   function toggleContentSection(sectionToShow) {
        const isAlreadyOpen = currentlyOpenSection === sectionToShow;
        const wasDevSectionOpen = currentlyOpenSection === devContent;
        
        // Close all sections first
        allContentSections.forEach(section => section.style.display = "none");
        document.getElementById("controlPanelContent").style.display = "none";
        
        // Reset all button states
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
                startUIUpdates();
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
    
    // Export button handler will be set up in setupSettingsControls


    // Update fullscreen icon on ESC key
    document.addEventListener('fullscreenchange', () => {
        updateFullscreenButton(fullscreenButton);
    });
}

/* ========================================================================
   SETTINGS CONTROLS
   ======================================================================== */
/**
 * Setup all settings controls and their event handlers
 */
function setupSettingsControls(camera, scene) {
    // Auto Rotation toggle
    const autoRotateToggle = document.getElementById('autoRotateToggle');
    if (autoRotateToggle && camera.autoRotationBehavior) {
        autoRotateToggle.addEventListener('change', (e) => {
            camera.useAutoRotationBehavior = e.target.checked;
            if (!e.target.checked) {
                camera.stopAutoRotation();
            }
        });
    }

    // Sharpening toggle
    const sharpenToggle = document.getElementById('sharpenToggle');
    if (sharpenToggle && scene.pipeline) {
        Events.addToggleListener(sharpenToggle, (checked) => {
            scene.pipeline.sharpenEnabled = checked;
        });
    }

    // Sharpening intensity slider
    const sharpenIntensityRange = document.getElementById('sharpenIntensityRange');
    const sharpenIntensityDisplay = document.getElementById('sharpenIntensityDisplay');
    if (sharpenIntensityRange && sharpenIntensityDisplay && scene.pipeline) {
        Events.addRangeListener(sharpenIntensityRange, (value) => {
            scene.pipeline.sharpen.edgeAmount = value;
            CONFIG.postProcessing.sharpenEdgeAmount = value;
            console.log('Sharpening intensity updated to:', value);
        }, sharpenIntensityDisplay);
    }

    // Anti-aliasing selector
    const antiAliasingSelect = document.getElementById('antiAliasingSelect');
    
    // Load saved anti-aliasing setting from localStorage
    const savedAAType = localStorage.getItem('babylonjs_antialiasing_type');
    
    if (savedAAType && antiAliasingSelect) {
        antiAliasingSelect.value = savedAAType;
        CONFIG.postProcessing.antiAliasing.type = savedAAType;
        
        // Apply the saved setting
        updateAntiAliasing(savedAAType, scene, camera);
    }
    
    if (antiAliasingSelect) {
        antiAliasingSelect.addEventListener('change', (e) => {
            const aaType = e.target.value;
            updateAntiAliasing(aaType, scene, camera);
        });
    }
    
    // Quality selector
    const qualitySelect = document.getElementById('qualitySelect');
    if (qualitySelect) {
        qualitySelect.addEventListener('change', (e) => {
            updateQualitySettings(e.target.value, scene);
        });
    }
    
    // FOV range control
    const fovRange = document.getElementById('fovRange');
    const fovDisplay = document.getElementById('fovDisplay');
    if (fovRange && fovDisplay) {
        // Initialize display with current FOV
        const currentFovDegrees = Math.round(camera.fov * 180 / Math.PI);
        fovDisplay.textContent = currentFovDegrees + '°';
        fovRange.value = camera.fov;
        
        Events.addRangeListener(fovRange, (value) => {
            camera.fov = value;
            const degrees = Math.round(value * 180 / Math.PI);
            fovDisplay.textContent = degrees + '°';
            console.log('FOV updated to:', degrees + '° (' + value.toFixed(2) + ' radians)');
        }, fovDisplay);
    }

    const modelScaleRange = document.getElementById('modelScaleRange');
    const modelScaleDisplay = document.getElementById('modelScaleRangeDisplay'); // <--- CORRECTED ID
    if (modelScaleRange && modelScaleDisplay) {
        Events.addRangeListener(modelScaleRange, (value) => {
            if (scene.currentModel) {
                // This sets a uniform scale based on the slider's value.
                // Since the model was normalized to a base size, this slider
                // acts as a multiplier.
                scene.currentModel.scaling.setAll(value);
            }
        }, modelScaleDisplay);
    }

    
    // Touch sensitivity (if available)
    const touchSensitivityRange = document.getElementById('touchSensitivityRange');
    if (touchSensitivityRange) {
        Events.addRangeListener(touchSensitivityRange, (value) => {
            const sensitivity = value / 5.0;
            updateTouchSensitivity(sensitivity, camera);
        });
    }
    
    // NEW: Improved Camera Limits Controls
    setupCameraLimitsControls(camera, scene);
    
    // Export button handler
    const exportButton = document.getElementById('exportButton');
    if (exportButton) {
        Events.addClickListener(exportButton, () => handleExport(camera, scene, scene.getEngine()));
    }
}



/**
 * Create visualization settings section HTML
 */
function createVisualizationSection() {
    const device = detectDevice();
    const defaultQuality = device.isDesktop ? 'high' : 'medium';
    
    return `
        <div class="settings-category">
            <div class="settings-title">Visualization</div>
            <div class="control-group">
                <label for="autoRotateToggle">Auto Rotation</label>
                <label class="switch">
                    <input type="checkbox" id="autoRotateToggle" ${CONFIG.camera.useAutoRotationBehavior ? 'checked' : ''}>
                    <span class="slider round"></span>
                </label>
            </div>
            
            <div class="control-group">
                 <label for="qualitySelect">Quality</label>
                <select id="qualitySelect" class="settings-select">
                    <option value="low">Low (Better Performance)</option>
                    <option value="medium" ${defaultQuality === 'medium' ? 'selected' : ''}>Medium</option>
                    <option value="high" ${defaultQuality === 'high' ? 'selected' : ''}>High (Better Quality)</option>
                </select>
            </div>
            
            <div class="control-group">
                <label for="fovRange">Field of View</label>
                <div class="range-container">
                    <input type="range" id="fovRange" min="0.4" max="2.0" value="0.8" step="0.05" class="slider-range">
                    <span id="fovDisplay" class="range-value">46°</span>
                </div>
            </div>
            ${createRangeControl('modelScaleRange', 'Model Scale', 0.1, 5, 1, 0.1)}

               

        </div>
    `;
}

/**
 * Create camera limits settings section HTML
 */
function createCameraLimitsSection() {
    return `
        <div class="settings-category">
            <div class="settings-title">Camera Limits</div>
            
            <div class="control-group">
                <label for="cameraLimitsToggle">Enable Camera Limits</label>
                <label class="switch">
                    <input type="checkbox" id="cameraLimitsToggle" checked>
                    <span class="slider round"></span>
                </label>
            </div>
            
            <div class="control-group">
                <label for="limitZoomToggle">Limit Zoom</label>
                <label class="switch">
                    <input type="checkbox" id="limitZoomToggle" checked>
                    <span class="slider round"></span>
                </label>
            </div>
            
            <div class="control-group">
                <label for="zoomMinRange">Zoom Min</label>
                <div class="range-container">
                    <input type="range" id="zoomMinRange" min="0.1" max="30" value="2.5" step="0.1" class="slider-range">
                    <span id="zoomMinDisplay" class="range-value">2.5</span>
                </div>
            </div>
            
            <div class="control-group">
                <label for="zoomMaxRange">Zoom Max</label>
                <div class="range-container">
                    <input type="range" id="zoomMaxRange" min="1" max="50" value="15" step="0.5" class="slider-range">
                    <span id="zoomMaxDisplay" class="range-value">15.0</span>
                </div>
            </div>
            
            <div class="control-group">
                <label for="limitVerticalToggle">Limit Vertical Rotation</label>
                <label class="switch">
                    <input type="checkbox" id="limitVerticalToggle" checked>
                    <span class="slider round"></span>
                </label>
            </div>
            
            <div class="control-group">
                <label for="verticalUpRange">Up Angle Limit</label>
                <div class="range-container">
                    <input type="range" id="verticalUpRange" min="-90" max="90" value="-80" step="5" class="slider-range">
                    <span id="verticalUpDisplay" class="range-value">-80°</span>
                </div>
            </div>
            
            <div class="control-group">
                <label for="verticalDownRange">Down Angle Limit</label>
                <div class="range-container">
                    <input type="range" id="verticalDownRange" min="-90" max="90" value="5" step="5" class="slider-range">
                    <span id="verticalDownDisplay" class="range-value">5°</span>
                </div>
            </div>
            
            <div class="control-group">
                <label for="limitHorizontalToggle">Limit Horizontal Rotation</label>
                <label class="switch">
                    <input type="checkbox" id="limitHorizontalToggle">
                    <span class="slider round"></span>
                </label>
            </div>
            
            <div class="control-group">
                <label for="horizontalAngleRange">Horizontal Total Angle</label>
                <div class="range-container">
                    <input type="range" id="horizontalAngleRange" min="30" max="360" value="360" step="15" class="slider-range">
                    <span id="horizontalAngleDisplay" class="range-value">360°</span>
                </div>
            </div>
            
            <div class="control-group">
                <label for="horizontalOffsetRange">Horizontal Offset</label>
                <div class="range-container">
                    <input type="range" id="horizontalOffsetRange" min="-180" max="180" value="0" step="15" class="slider-range">
                    <span id="horizontalOffsetDisplay" class="range-value">0°</span>
                </div>
            </div>
            
            <div class="control-group">
                <label for="limitPanToggle">Enable Panning</label>
                <label class="switch">
                    <input type="checkbox" id="limitPanToggle" checked>
                    <span class="slider round"></span>
                </label>
            </div>
            
            <div class="control-group">
                <button id="resetLimitsButton" class="action-button" style="width: 100%; margin-top: 8px;">
                    Reset to Defaults
                </button>
            </div>
        </div>
    `;
}

/**
 * Create post-processing settings section HTML
 */
function createPostProcessingSection() {
    return `
        <div class="settings-category">
            <div class="settings-title">Post Processing</div>
            <div class="control-group">
                <label for="sharpenToggle">Sharpening</label>
                <label class="switch">
                    <input type="checkbox" id="sharpenToggle" ${CONFIG.postProcessing.sharpenEnabled ? 'checked' : ''}>
                    <span class="slider round"></span>
                </label>
            </div>
            <div class="control-group">
                <label for="sharpenIntensityRange">Sharpening Intensity</label>
                <div class="range-container">
                    <input type="range" id="sharpenIntensityRange" min="0.0" max="2.0" value="${CONFIG.postProcessing.sharpenEdgeAmount}" step="0.1" class="slider-range">
                    <span id="sharpenIntensityDisplay" class="range-value">${CONFIG.postProcessing.sharpenEdgeAmount}</span>
                </div>
            </div>
            <div class="control-group">
                <label for="antiAliasingSelect">Anti-Aliasing</label>
                <select id="antiAliasingSelect" class="settings-select">
                    <option value="none">None</option>
                    <option value="fxaa" ${CONFIG.postProcessing.antiAliasing.type === 'fxaa' ? 'selected' : ''}>FXAA (Fast)</option>
                    <option value="taa" ${CONFIG.postProcessing.antiAliasing.type === 'taa' ? 'selected' : ''}>TAA (Temporal)</option>
                </select>
            </div>
        </div>
    `;
}

/**
 * Create touch controls settings section HTML
 */
function createTouchControlsSection() {
    return `
        <div class="settings-category">
            <div class="settings-title">Touch Controls</div>
            <div class="control-group">
                <label for="touchSensitivityRange">Touch Sensitivity</label>
                <input type="range" id="touchSensitivityRange" min="1" max="10" value="5" class="slider-range">
            </div>
        </div>
    `;
}

/**
 * Create complete settings section HTML using smaller components
 */
function createSettingsSection(hasTouch) {
    return `
        <div id="settingsContent" class="content-section" style="display: none;">
            <h4>Settings</h4>
            
            ${createVisualizationSection()}
            ${createCameraLimitsSection()}
            ${createPostProcessingSection()}
            ${hasTouch ? createTouchControlsSection() : ''}
        </div>
    `;
}

/**
 * Helper to convert beta angle to up/down degrees
 */
function betaToUpDown(betaRadians) {
    return (betaRadians - Math.PI/2) * 180 / Math.PI;
}

/**
 * Update UI elements with current camera limits
 */
function updateUIFromLimits(elements, cameraLimits) {
    const limits = cameraLimits.getCurrentLimits();
    
    // Update toggles
    if (elements.masterToggle) {
        elements.masterToggle.checked = cameraLimits.isEnabled;
    }
    if (elements.limitZoomToggle) {
        elements.limitZoomToggle.checked = limits.restrictDistance;
    }
    if (elements.limitVerticalToggle) {
        elements.limitVerticalToggle.checked = limits.restrictVertical;
    }
    if (elements.limitHorizontalToggle) {
        elements.limitHorizontalToggle.checked = limits.restrictHorizontal;
    }
    if (elements.limitPanToggle) {
        elements.limitPanToggle.checked = limits.enablePanning;
    }
    
    // Update zoom ranges
    if (elements.zoomMinRange && elements.zoomMinDisplay) {
        elements.zoomMinRange.value = limits.radiusMin;
        elements.zoomMinDisplay.textContent = limits.radiusMin.toFixed(1);
    }
    if (elements.zoomMaxRange && elements.zoomMaxDisplay) {
        elements.zoomMaxRange.value = limits.radiusMax;
        elements.zoomMaxDisplay.textContent = limits.radiusMax.toFixed(1);
    }
    
    // Update vertical ranges (convert beta to up/down)
    if (elements.verticalUpRange && elements.verticalUpDisplay) {
        const upLimit = betaToUpDown(limits.betaMin);
        elements.verticalUpRange.value = Math.round(upLimit);
        elements.verticalUpDisplay.textContent = Math.round(upLimit) + '°';
    }
    if (elements.verticalDownRange && elements.verticalDownDisplay) {
        const downLimit = betaToUpDown(limits.betaMax);
        elements.verticalDownRange.value = Math.round(downLimit);
        elements.verticalDownDisplay.textContent = Math.round(downLimit) + '°';
    }
    
    // Update horizontal ranges (calculate angle and offset from min/max)
    if (elements.horizontalAngleRange && elements.horizontalAngleDisplay) {
        const alphaMinDeg = limits.alphaMin * 180 / Math.PI;
        const alphaMaxDeg = limits.alphaMax * 180 / Math.PI;
        const totalAngle = alphaMaxDeg - alphaMinDeg;
        const centerOffset = (alphaMinDeg + alphaMaxDeg) / 2;
        
        elements.horizontalAngleRange.value = Math.round(Math.min(360, Math.max(30, totalAngle)));
        elements.horizontalAngleDisplay.textContent = Math.round(totalAngle) + '°';
    }
    if (elements.horizontalOffsetRange && elements.horizontalOffsetDisplay) {
        const alphaMinDeg = limits.alphaMin * 180 / Math.PI;
        const alphaMaxDeg = limits.alphaMax * 180 / Math.PI;
        const centerOffset = (alphaMinDeg + alphaMaxDeg) / 2;
        
        elements.horizontalOffsetRange.value = Math.round(centerOffset);
        elements.horizontalOffsetDisplay.textContent = Math.round(centerOffset) + '°';
    }
}

/**
 * Setup all range control event handlers for camera limits
 */
function setupCameraLimitsRanges(elements, cameraLimits) {
    // Zoom ranges
    if (elements.zoomMinRange && elements.zoomMinDisplay) {
        Events.addRangeListener(elements.zoomMinRange, (value) => {
            const limits = cameraLimits.getCurrentLimits();
            cameraLimits.setDistanceLimits(limits.restrictDistance, value, limits.radiusMax);
            console.log('Min zoom set to:', value);
        }, elements.zoomMinDisplay);
    }
    
    if (elements.zoomMaxRange && elements.zoomMaxDisplay) {
        Events.addRangeListener(elements.zoomMaxRange, (value) => {
            const limits = cameraLimits.getCurrentLimits();
            cameraLimits.setDistanceLimits(limits.restrictDistance, limits.radiusMin, value);
            console.log('Max zoom set to:', value);
        }, elements.zoomMaxDisplay);
    }
    
    // Vertical ranges (up/down)
    if (elements.verticalUpRange && elements.verticalUpDisplay) {
        Events.addRangeListener(elements.verticalUpRange, (value) => {
            const downValue = parseFloat(elements.verticalDownRange.value);
            cameraLimits.setVerticalLimitsUpDown(true, value, downValue);
            console.log('Up limit set to:', value + '°');
        }, elements.verticalUpDisplay);
    }
    
    if (elements.verticalDownRange && elements.verticalDownDisplay) {
        Events.addRangeListener(elements.verticalDownRange, (value) => {
            const upValue = parseFloat(elements.verticalUpRange.value);
            cameraLimits.setVerticalLimitsUpDown(true, upValue, value);
            console.log('Down limit set to:', value + '°');
        }, elements.verticalDownDisplay);
    }
    
    // Horizontal ranges (angle + offset system)
    function updateHorizontalLimits() {
        const totalAngle = parseFloat(elements.horizontalAngleRange.value);
        const offset = parseFloat(elements.horizontalOffsetRange.value);
        
        cameraLimits.setHorizontalLimitsAngleOffset(true, totalAngle, offset);
        
        console.log(`Horizontal limits: ${totalAngle}° total, centered at ${offset}°`);
    }
    
    if (elements.horizontalAngleRange && elements.horizontalAngleDisplay) {
        Events.addRangeListener(elements.horizontalAngleRange, (value) => {
            updateHorizontalLimits();
        }, elements.horizontalAngleDisplay);
    }
    
    if (elements.horizontalOffsetRange && elements.horizontalOffsetDisplay) {
        Events.addRangeListener(elements.horizontalOffsetRange, (value) => {
            updateHorizontalLimits();
        }, elements.horizontalOffsetDisplay);
    }
}


// Add this new function at the end of ui.js:
async function handleExport(camera, scene, engine) {
    // Lazy load the exporter
    const { ViewerExporter, showExportDialog } = await import('./export/ViewerExporter.js');
    const exporter = new ViewerExporter(scene, camera, engine);
    showExportDialog(exporter);
}

/**
 * Setup reset functionality for camera limits
 */
function setupCameraLimitsReset(elements, cameraLimits, updateUICallback) {
    if (elements.resetButton) {
        elements.resetButton.addEventListener('click', () => {
            cameraLimits.resetToDefaults();
            updateUICallback(); // Refresh UI with default values
            showToast('Camera limits reset to defaults');
            console.log('Camera limits reset to defaults');
        });
    }
}

// UPDATED: setupCameraLimitsControls function - now much smaller and focused
function setupCameraLimitsControls(camera, scene) {
    const cameraLimits = scene.cameraLimits;
    if (!cameraLimits) return;
    
    // Get all control elements
    const elements = getCameraLimitsElements();
    
    // Create local update function that can be passed to reset handler
    const updateUI = () => updateUIFromLimits(elements, cameraLimits);
    
    // Setup all control handlers using new helpers
    setupCameraLimitsToggles(elements, cameraLimits);
    setupCameraLimitsRanges(elements, cameraLimits);
    setupCameraLimitsReset(elements, cameraLimits, updateUI);
    
    // Initialize the UI
    updateUI();
    
    console.log('Camera limits controls initialized (auto-calculate removed)');
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
   QUALITY AND PERFORMANCE FUNCTIONS
   ======================================================================== */
/**
 * Update rendering quality settings
 */
function updateQualitySettings(quality, scene) {
    const engine = scene.getEngine();
    
    const qualitySettings = {
        low: { scaling: 1.5, fxaa: false, sharpen: false },
        medium: { scaling: 1.0, fxaa: false, sharpen: true },
        high: { scaling: 0.70, fxaa: false, sharpen: true }
    };
    
    const settings = qualitySettings[quality];
    if (!settings) return;
    
    // Apply settings
    engine.setHardwareScalingLevel(settings.scaling);
    
    if (scene.pipeline) {
        scene.pipeline.fxaaEnabled = settings.fxaa;
        scene.pipeline.sharpenEnabled = settings.sharpen;
        
        // Update UI toggles to match
        const sharpenToggle = document.getElementById('sharpenToggle');
        const sharpenIntensityRange = document.getElementById('sharpenIntensityRange');
        const sharpenIntensityDisplay = document.getElementById('sharpenIntensityDisplay');
        const antiAliasingSelect = document.getElementById('antiAliasingSelect');
        
        if (sharpenToggle) sharpenToggle.checked = settings.sharpen;
        if (sharpenIntensityRange && settings.sharpen) {
            sharpenIntensityRange.value = scene.pipeline.sharpen.edgeAmount;
            if (sharpenIntensityDisplay) {
                sharpenIntensityDisplay.textContent = scene.pipeline.sharpen.edgeAmount;
            }
        }
        if (antiAliasingSelect) {
            antiAliasingSelect.value = settings.fxaa ? 'fxaa' : 'none';
        }
    }
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

/* ========================================================================
   MODEL LOADING FUNCTIONS
   ======================================================================== */
/**
 * Setup model loading functionality
 */
function setupModelLoading(scene) {
    console.log("setupModelLoading called");
    const fileButton = document.getElementById("loadModelFileButton");
    const urlButton = document.getElementById("loadModelUrlButton");
    const spinner = document.getElementById("loadingSpinner");
    
    console.log("Elements found:");
    console.log("- fileButton:", fileButton);
    console.log("- urlButton:", urlButton);
    console.log("- spinner:", spinner);
    
    // File loading handler
    if (fileButton) {
        console.log("Setting up file loading button");
        fileButton.addEventListener("click", () => {
            console.log("File loading button clicked");
            triggerFileLoad(scene);
        });
        console.log("File loading button event listener attached");
    } else {
        console.error("File loading button not found!");
    }
    
    // URL loading handler
    if (urlButton) {
        urlButton.addEventListener("click", async () => {
            const urlInput = document.getElementById("modelUrlInput");
            if (!urlInput || !urlInput.value.trim()) {
                showToast(ErrorMessages.INPUT.EMPTY_URL, CONFIG.ui.toast.displayDuration);
                return;
            }
            
            await loadModelWithSpinner(scene, urlInput.value.trim(), spinner, "url");
        });
    }
}

/**
 * Load model with loading spinner and error handling
 */
async function loadModelWithSpinner(scene, source, spinner, type) {
    try {
        // Show loading spinner
        if (spinner) spinner.style.display = "flex";
        
        console.log(`Loading model from ${type}: ${type === 'file' ? source.name : source}`);
        console.log("Source object:", source);
        
        if (type === 'file') {
            console.log("File details - Name:", source.name, "Size:", source.size, "Type:", source.type);
            const extension = source.name.split('.').pop().toLowerCase();
            console.log("File extension:", extension);
            console.log("Supported formats:", CONFIG.modelLoader.supportedFormats);
            console.log("Extension supported:", CONFIG.modelLoader.supportedFormats.includes(extension));
        }
        
        const result = await loadModel(scene, source, CONFIG.modelLoader.defaultFallbackModel);
        console.log("Load model result:", result);
        
        // Store model URL for sharing
        // Store model URL for sharing
        // In ui.js, inside the loadModelWithSpinner function

        // Find this existing line:
        if (result && result.currentModel) {
            // And replace the contents of the 'if' block with the following:

            // 1. Set the model URL for the exporter and sharing feature
            scene.currentModelUrl = (type === 'file') ? URL.createObjectURL(source) : source;

            // 2. Determine and set the model type for the exporter
            const fileName = (type === 'file') ? source.name : source;
            const extension = fileName.split('?')[0].split('.').pop().toLowerCase();

            if (['splat', 'ply'].includes(extension)) {
                scene.currentModelType = 'splat';
            } else if (['gltf', 'glb', 'obj'].includes(extension)) {
                scene.currentModelType = 'mesh';
            } else {
                scene.currentModelType = 'unknown'; // Handle other cases
            }

            // This property is also used by the exporter
            scene.currentModel = result.currentModel;

            console.log(`Model info set on scene: type='${scene.currentModelType}', url='${scene.currentModelUrl}'`);
        }
        
        // Show success message
        const fileName = type === 'file' ? source.name : 'URL';
        showToast(`Model "${fileName}" loaded successfully`);
        
        // Close panel
        closeAllPanels();
        
    } catch (error) {
        console.error("Error loading model:", error);
        showToast(ErrorMessages.MODEL.LOAD_FAILED(error.message), 5000);
    } finally {
        // Hide loading spinner
        if (spinner) spinner.style.display = "none";
    }
}

/* ========================================================================
   FILE LOADING FUNCTIONS
   ======================================================================== */
/**
 * Trigger file loading dialog and handle file selection
 */
function triggerFileLoad(scene) {
    console.log("File open button clicked");
    
    // Create a hidden file input element using utility
    const fileInput = createElement('input', {
        type: 'file',
        accept: '.splat,.ply,.spz,.gltf,.glb,.obj'
    });
    fileInput.style.display = 'none';
    
    // Handle file selection
    fileInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) {
            console.log("No file selected");
            return;
        }
        
        console.log("File selected:", file.name, "Size:", file.size);
        
        // Validate file extension
        const extension = file.name.split('.').pop().toLowerCase();
        if (!CONFIG.modelLoader.supportedFormats.includes(extension)) {
            showToast(`Unsupported file format: .${extension}. Supported formats: ${CONFIG.modelLoader.supportedFormats.join(', ')}`, 5000);
            return;
        }
        
        // Load the model
        try {
            const spinner = document.getElementById("loadingSpinner");
            if (spinner) spinner.style.display = "flex";
            
            console.log("Starting model loading...");
            const result = await loadModel(scene, file, CONFIG.modelLoader.defaultFallbackModel);
            console.log("Model loaded successfully:", result);
            
            // Store model URL for sharing
            if (result && result.currentModel) {
                scene.currentModelUrl = URL.createObjectURL(file);
            }
            
            showToast(`Model "${file.name}" loaded successfully`);
            
        } catch (error) {
            console.error("Error loading model:", error);
            showToast(ErrorMessages.MODEL.LOAD_FAILED(error.message), 5000);
        } finally {
            // Hide loading spinner
            const spinner = document.getElementById("loadingSpinner");
            if (spinner) spinner.style.display = "none";
        }
        
        // Clean up the input element
        document.body.removeChild(fileInput);
    });
    
    // Trigger the file dialog
    document.body.appendChild(fileInput);
    console.log("File input created and added to DOM, triggering click...");
    fileInput.click();
    console.log("File dialog should now be open");
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
    
    // Add visual feedback for touch buttons
    const buttons = controlPanel.querySelectorAll('button');
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
    const allContentSections = document.querySelectorAll(".content-section");
    const controlPanelContent = document.getElementById("controlPanelContent");
    const controlPanel = document.getElementById("controlPanel");
    const buttons = document.querySelectorAll(".icon-button");
    
    allContentSections.forEach(section => section.style.display = "none");
    if (controlPanelContent) controlPanelContent.style.display = "none";
    if (controlPanel) controlPanel.classList.remove("expanded");
    buttons.forEach(btn => btn.classList.remove('active'));
    
    // Stop UI updates when closing all panels
    stopUIUpdates();
}

/**
 * Show a temporary toast message
 */
function showToast(message, duration = CONFIG.ui.toast.displayDuration) {
    // Remove existing toast
    const existingToast = document.getElementById('toast-message');
    if (existingToast) {
        document.body.removeChild(existingToast);
    }
    
    // Create new toast using utility
    const toast = createElement('div', {
        id: 'toast-message',
        className: 'toast-message'
    });
    toast.textContent = message;
    
    // Add to document and show
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), CONFIG.ui.toast.showDelay);
    
    // Hide after duration
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                document.body.removeChild(toast);
            }
        }, CONFIG.ui.toast.hideDelay);
    }, duration);
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

/* ========================================================================
   ANTI-ALIASING FUNCTIONS
   ======================================================================== */

/**
 * Update anti-aliasing method
 */
export function updateAntiAliasing(type, scene, camera) {
    console.log('Switching anti-aliasing to:', type);
    
    // Store settings
    CONFIG.postProcessing.antiAliasing.type = type;
    localStorage.setItem('babylonjs_antialiasing_type', type);
    
    // Clean up any existing effects
    if (scene._customAAPostProcess) {
        scene._customAAPostProcess.dispose();
        scene._customAAPostProcess = null;
    }
    
    if (!scene.pipeline) {
        console.warn('No rendering pipeline available');
        return;
    }
    
    switch (type) {
        case 'none':
            scene.pipeline.fxaaEnabled = false;
            scene.pipeline.samples = 1;
            console.log('Anti-aliasing disabled');
            break;
            
        case 'fxaa':
            scene.pipeline.fxaaEnabled = true;
            scene.pipeline.samples = 1;
            console.log('FXAA enabled');
            break;
            
        case 'msaa':
            // Use pipeline's built-in multisampling
            scene.pipeline.fxaaEnabled = false;
            scene.pipeline.samples = 4; // 4x MSAA
            console.log('MSAA 4x enabled');
            break;
            
        case 'taa':
            // Use FXAA + subtle image enhancement for "TAA-like" effect
            scene.pipeline.fxaaEnabled = true;
            scene.pipeline.samples = 1;
            
            // Add subtle image enhancement
            if (scene.pipeline.imageProcessing) {
                scene.pipeline.imageProcessing.contrast = 1.1;
                scene.pipeline.imageProcessing.exposure = 1.05;
                scene.pipeline.imageProcessingEnabled = true;
            }
            
            console.log('Enhanced anti-aliasing enabled (FXAA + Image Processing)');
            break;
            
        default:
            console.warn('Unknown anti-aliasing type:', type);
            scene.pipeline.fxaaEnabled = false;
            scene.pipeline.samples = 1;
    }
}

/**
 * Disable all anti-aliasing
 */
function disableAllAntiAliasing(scene) {
    // Disable custom TAA render observer if active
    if (scene._taaRenderObserver) {
        scene.onBeforeRenderObservable.remove(scene._taaRenderObserver);
        scene._taaRenderObserver = null;
        console.log('Custom TAA render observer removed');
    }
    if (scene._haltonSequence) {
        scene._haltonSequence = null;
        console.log('Halton sequence cleared');
    }
    
    // Disable built-in TAA if active
    if (scene._taaRenderingPipeline) {
        scene._taaRenderingPipeline.dispose();
        scene._taaRenderingPipeline = null;
        console.log('Built-in TAA pipeline disposed');
    }
    
    if (scene.pipeline) {
        scene.pipeline.fxaaEnabled = false;
    }
    
    console.log('All anti-aliasing disabled');
}

/**
 * Enable FXAA
 */
function enableFXAA(scene) {
    disableAllAntiAliasing(scene);
    
    if (scene.pipeline) {
        scene.pipeline.fxaaEnabled = true;
        console.log('FXAA enabled');
    }
}


/**
 * Enable TAA (Temporal Anti-Aliasing)
 */
function enableTAA(scene, camera) {
    disableAllAntiAliasing(scene);
    
    try {
        // Check if TAA rendering pipeline is available
        console.log('TAA availability check:', typeof BABYLON.TAARenderingPipeline);
        console.log('Babylon version:', BABYLON.Engine.Version);
        
        if (typeof BABYLON.TAARenderingPipeline === 'undefined') {
            console.warn('TAA rendering pipeline not available in Babylon.js version', BABYLON.Engine.Version);
            enableFXAA(scene);
        } else {
            setupTAA(scene, camera);
        }
    } catch (error) {
        console.error('TAA initialization failed:', error);
        enableFXAA(scene);
    }
}

/**
 * Load TAA pipeline if not already available
 */
async function loadTAAPipeline() {
    if (typeof BABYLON.TAARenderingPipeline !== 'undefined') {
        return;
    }
    
    // TAA pipeline should be available in newer Babylon.js versions
    // If not available, we can implement a basic version or load it separately
    return new Promise((resolve, reject) => {
        if (typeof BABYLON.TAARenderingPipeline !== 'undefined') {
            resolve();
        } else {
            reject(new Error('TAA pipeline not available in this Babylon.js version'));
        }
    });
}

/**
 * Halton Sequence Generator for TAA jittering
 */
class HaltonSequence {
    constructor(base1 = 2, base2 = 3) {
        this.base1 = base1;
        this.base2 = base2;
        this.index = 0;
    }
    
    next() {
        const x = this.halton(this.index, this.base1);
        const y = this.halton(this.index, this.base2);
        this.index = (this.index + 1) % CONFIG.postProcessing.antiAliasing.taaSamples;
        // Apply (-0.5, -0.5) translation as per documentation
        return [x - 0.5, y - 0.5];
    }
    
    halton(index, base) {
        let result = 0;
        let f = 1 / base;
        let i = index;
        while (i > 0) {
            result += f * (i % base);
            i = Math.floor(i / base);
            f /= base;
        }
        return result;
    }
}

/**
 * Setup custom TAA implementation using post-process
 */
function setupCustomTAA(scene, camera) {
    try {
        const engine = scene.getEngine();
        const haltonSequence = new HaltonSequence(2, 3);
        
        // For now, just implement the Halton sequence jittering without post-process
        // The jittering will be applied via camera projection matrix modification
        console.log('Setting up Halton sequence-based TAA jittering');
        
        // Set up render loop observer for jittering
        let frameCount = 0;
        const renderObserver = scene.onBeforeRenderObservable.add(() => {
            // Get next Halton sequence values
            const [dx, dy] = haltonSequence.next();
            
            // Get canvas dimensions
            const canvas = engine.getRenderingCanvas();
            const width = canvas ? canvas.width : 800;
            const height = canvas ? canvas.height : 600;
            
            // Apply jitter as per documentation formula
            const jitterX = dx * 2 / width;
            const jitterY = dy * 2 / height;
            
            // Log jitter values periodically
            if (frameCount % 60 === 0) { // Log every 60 frames to avoid spam
                console.log(`TAA Frame ${frameCount}: Halton sequence [${dx.toFixed(4)}, ${dy.toFixed(4)}] -> Jitter [${jitterX.toFixed(6)}, ${jitterY.toFixed(6)}]`);
            }
            frameCount++;
        });
        
        return {
            renderObserver: renderObserver,
            haltonSequence: haltonSequence
        };
        
    } catch (error) {
        console.error('Custom TAA setup failed:', error);
        return null;
    }
}

/**
 * Setup TAA pipeline
 */
function setupTAA(scene, camera) {
    try {
        // Dispose existing TAA components if any
        if (scene._taaRenderObserver) {
            scene.onBeforeRenderObservable.remove(scene._taaRenderObserver);
            scene._taaRenderObserver = null;
        }
        if (scene._haltonSequence) {
            scene._haltonSequence = null;
        }
        
        // Create custom TAA implementation
        const customTAA = setupCustomTAA(scene, camera);
        
        if (customTAA) {
            scene._taaRenderObserver = customTAA.renderObserver;
            scene._haltonSequence = customTAA.haltonSequence;
            console.log('Custom TAA enabled with Halton sequence jittering');
        } else {
            throw new Error(ErrorMessages.SYSTEM.TAA_SETUP_FAILED);
        }
        
    } catch (error) {
        console.error('TAA setup failed:', error);
        console.warn('Falling back to FXAA');
        enableFXAA(scene);
    }
}