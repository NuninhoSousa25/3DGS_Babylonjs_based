// js/ui.js
import { setupUIUpdates } from './helpers.js';
import { loadModel } from './modelLoader.js';
import { CONFIG } from './config.js'; // Import CONFIG for UI configurations

// --- SVG Icons (Inline) ---
const ICONS = {
    settings: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z"/></svg>`, // Material Icons Tune
    info: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>`, // Material Icons Info
    dev: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg>`, // Material Icons Developer Board
    fullscreen: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>`, // Material Icons Fullscreen
    fullscreen_exit: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>`, // Material Icons Fullscreen Exit
    reset_view: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>`, // Material Icons Refresh
    share: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92zM18 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM6 13c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm12 7.02c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/></svg>`, // Material Icons Share
    help: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/></svg>` // Material Icons Help
};

/**
 * Sets up the user interface with an improved icon bar.
 * @param {BABYLON.ArcRotateCamera} camera 
 * @param {BABYLON.Scene} scene 
 * @param {BABYLON.WebXRDefaultExperience} xrHelper 
 * @param {BABYLON.Engine} engine
 * @param {number} initialPixelRatio - The initial pixel ratio based on device type
 */
export function setupUI(camera, scene, xrHelper, engine, initialPixelRatio) {
    // Apply camera/engine settings from CONFIG
    camera.useAutoRotationBehavior = CONFIG.camera.useAutoRotationBehavior;
    if (camera.useAutoRotationBehavior && camera.autoRotationBehavior) {
        const autoConfig = CONFIG.camera.autoRotation;
        camera.autoRotationBehavior.idleRotationWaitTime = autoConfig.idleRotationWaitTime;
        camera.autoRotationBehavior.idleRotationSpeed = autoConfig.idleRotationSpeed;
        camera.autoRotationBehavior.idleRotationSpinUpTime = autoConfig.idleRotationSpinUpTime;
    }
    
    // Apply hardware scaling for performance
    engine.setHardwareScalingLevel(1 / initialPixelRatio);
    console.log(`Hardware scaling level set to: ${1 / initialPixelRatio}`);
    
    // Apply post-processing settings
    if (scene.pipeline) {
        scene.pipeline.sharpen.edgeAmount = CONFIG.postProcessing.sharpenEdgeAmount;
        scene.pipeline.sharpenEnabled = CONFIG.postProcessing.sharpenEnabled;
        scene.pipeline.fxaaEnabled = CONFIG.postProcessing.fxaaEnabled;
        console.log(`Post-processing settings applied from config`);
    }

    // Remove existing panel if it exists
    const existingPanel = document.getElementById("controlPanel");
    if (existingPanel) {
        existingPanel.remove();
    }

    // Check if this is a mobile device
    const isMobile = _isMobileDevice();

    // Create UI container with mobile detection
    const controlPanel = document.createElement("div");
    controlPanel.id = "controlPanel";
    controlPanel.className = isMobile ? "control-panel control-panel-mobile" : "control-panel";

    // Create Icon Bar - Now with better organization
    const iconBar = document.createElement("div");
    iconBar.id = "iconBar";
    iconBar.className = "icon-bar";
    
    // Create floating action button for mobile
    if (isMobile) {
        const fabContainer = document.createElement("div");
        fabContainer.className = "fab-container";
        const mainFab = document.createElement("button");
        mainFab.className = "main-fab";
        mainFab.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>`;
        fabContainer.appendChild(mainFab);
        document.body.appendChild(fabContainer);
        
        // Show/hide the panel when FAB is clicked
        mainFab.addEventListener("click", () => {
            controlPanel.classList.toggle("show-panel");
            mainFab.classList.toggle("active");
        });
        
        // Close panel when clicking outside
        document.addEventListener("click", (e) => {
            if (!controlPanel.contains(e.target) && !fabContainer.contains(e.target) && controlPanel.classList.contains("show-panel")) {
                controlPanel.classList.remove("show-panel");
                mainFab.classList.remove("active");
            }
        });
    }

    // Organized icon bar with grouped functions
    iconBar.innerHTML = `
        <div class="icon-group">
            <button id="settingsButton" class="icon-button" title="Settings">${ICONS.settings}</button>
            <button id="infoButton" class="icon-button" title="Controls Info">${ICONS.info}</button>
        </div>
        <div class="icon-group">
            <button id="resetViewButton" class="icon-button" title="Reset View">${ICONS.reset_view}</button>
            <button id="fullscreenButton" class="icon-button" title="Toggle Fullscreen">${ICONS.fullscreen}</button>
        </div>
        <div class="icon-group">
            <button id="devButton" class="icon-button" title="Developer Tools">${ICONS.dev}</button>
            ${isMobile ? '' : `<button id="shareButton" class="icon-button" title="Share View">${ICONS.share}</button>`}
        </div>
    `;
    controlPanel.appendChild(iconBar);

    // Create Content Area with improved organization
    const contentArea = document.createElement("div");
    contentArea.id = "controlPanelContent";
    contentArea.className = "control-panel-content"; 
    contentArea.style.display = "none"; // Hide initially
    contentArea.innerHTML = `
        <button id="closePanelButton" class="close-panel-button" title="Close Panel">×</button>

        <!-- Settings Section -->
        <div id="settingsContent" class="content-section" style="display: none;">
            <h4>Settings</h4>
            
            <div class="settings-category">
                <div class="settings-title">Visualization</div>
                <div class="control-group">
                    <label for="autoRotateToggle">Auto Rotation</label>
                    <label class="switch">
                        <input type="checkbox" id="autoRotateToggle" ${camera.useAutoRotationBehavior ? 'checked' : ''}>
                        <span class="slider round"></span>
                    </label>
                </div>
            
                <div class="control-group">
                    <label for="qualitySelect">Quality</label>
                    <select id="qualitySelect" class="settings-select">
                        <option value="low">Low (Better Performance)</option>
                        <option value="medium" selected>Medium</option>
                        <option value="high">High (Better Quality)</option>
                    </select>
                </div>
            </div>
            
            <div class="settings-category">
                <div class="settings-title">Post Processing</div>
                <div class="control-group">
                    <label for="sharpenToggle">Sharpening</label>
                    <label class="switch">
                        <input type="checkbox" id="sharpenToggle" ${scene.pipeline?.sharpenEnabled ? 'checked' : ''}>
                        <span class="slider round"></span>
                    </label>
                </div>
                <div class="control-group">
                    <label for="fxaaToggle">Anti-Aliasing</label>
                    <label class="switch">
                        <input type="checkbox" id="fxaaToggle" ${scene.pipeline?.fxaaEnabled ? 'checked' : ''}>
                        <span class="slider round"></span>
                    </label>
                </div>
            </div>
            
            ${isMobile ? `
            <div class="settings-category">
                <div class="settings-title">Touch Controls</div>
                <div class="control-group">
                    <label for="touchSensitivityRange">Touch Sensitivity</label>
                    <input type="range" id="touchSensitivityRange" min="1" max="10" value="5" class="slider-range">
                </div>
            </div>` : ''}
        </div>

        <!-- Info Section -->
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
            
            ${isMobile ? `
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

        <!-- Dev Panel Section -->
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
                <div class="dev-title">Load Model</div>
                <div class="model-loader file-loader">
                    <label for="modelLoader" class="file-label">Select File</label>
                    <input type="file" id="modelLoader" accept="${CONFIG.modelLoader.supportedFormats.map(ext => `.${ext}`).join(', ')}">
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
            
            <!-- Loading Spinner -->
            <div id="loadingSpinner" class="loading-spinner">
                <div class="spinner-animation"></div>
                <div class="spinner-text">Loading Model...</div>
            </div>
        </div>
    `;
    controlPanel.appendChild(contentArea);
    document.body.appendChild(controlPanel);

    // --- Get references to elements ---
    const settingsButton = document.getElementById("settingsButton");
    const infoButton = document.getElementById("infoButton");
    const devButton = document.getElementById("devButton");
    const resetViewButton = document.getElementById("resetViewButton");
    const fullscreenButton = document.getElementById("fullscreenButton");
    const shareButton = document.getElementById("shareButton");
    const closePanelButton = document.getElementById("closePanelButton");

    const settingsContent = document.getElementById("settingsContent");
    const infoContent = document.getElementById("infoContent");
    const devContent = document.getElementById("devContent");
    const allContentSections = [settingsContent, infoContent, devContent];

    let currentlyOpenSection = null; // Track which section is open

    // --- Helper Function to Toggle Content ---
    function toggleContentSection(sectionToShow) {
        const isAlreadyOpen = currentlyOpenSection === sectionToShow;
        
        // Close all sections first
        allContentSections.forEach(section => section.style.display = "none");
        contentArea.style.display = "none";
        
        // Reset all active button states
        [settingsButton, infoButton, devButton].forEach(btn => btn.classList.remove('active'));
        
        if (!isAlreadyOpen) {
            // Open the requested section
            sectionToShow.style.display = "block";
            contentArea.style.display = "block";
            currentlyOpenSection = sectionToShow;
            
            // Set active button state
            if (sectionToShow === settingsContent) settingsButton.classList.add('active');
            else if (sectionToShow === infoContent) infoButton.classList.add('active');
            else if (sectionToShow === devContent) devButton.classList.add('active');
            
            // If mobile, ensure the close button is visible
            if (isMobile) {
                closePanelButton.style.display = 'block';
                controlPanel.classList.add("expanded");
            }
        } else {
            currentlyOpenSection = null;
            if (isMobile) {
                controlPanel.classList.remove("expanded");
            }
        }
    }

    // --- Event Listeners for Icons ---
    settingsButton.addEventListener("click", () => toggleContentSection(settingsContent));
    infoButton.addEventListener("click", () => toggleContentSection(infoContent));
    devButton.addEventListener("click", () => toggleContentSection(devContent));

    // Reset View Button
    resetViewButton.addEventListener("click", () => {
        resetCameraView(camera, scene);
    });

    // Close Button Listener
    closePanelButton.addEventListener("click", () => {
        toggleContentSection(null); // Pass null to just close everything
    });

    // Fullscreen Button Listener
    fullscreenButton.addEventListener("click", () => {
        toggleFullscreen(fullscreenButton);
    });
    
    // Share Button (desktop only)
    if (shareButton) {
        shareButton.addEventListener("click", () => {
            shareCameraView(camera, scene);
        });
    }

    // Update fullscreen icon if exited via Esc key
    document.addEventListener('fullscreenchange', () => {
        updateFullscreenButton(fullscreenButton);
    });

    // --- Settings Toggles ---
    setupSettingsControls(camera, scene);
    
    // Set up UI update loop
    setupUIUpdates(scene, engine);

    // Handle Model Loading Buttons
    setupModelLoading(scene);
    
    // Mobile-specific adjustments
    if (isMobile) {
        setupMobileSpecificUI(controlPanel, camera);
    }
}

/**
 * Helper function to detect mobile devices
 */
function _isMobileDevice() {
    const userAgentCheck = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const touchCheck = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const smallScreen = window.innerWidth <= 1024;
    
    return (userAgentCheck || (touchCheck && smallScreen));
}

/**
 * Sets up all settings controls
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

    // Sharpen toggle
    const sharpenToggle = document.getElementById('sharpenToggle');
    if (sharpenToggle && scene.pipeline) {
        sharpenToggle.addEventListener('change', (e) => {
            scene.pipeline.sharpenEnabled = e.target.checked;
        });
    }

    // FXAA toggle
    const fxaaToggle = document.getElementById('fxaaToggle');
    if (fxaaToggle && scene.pipeline) {
        fxaaToggle.addEventListener('change', (e) => {
            scene.pipeline.fxaaEnabled = e.target.checked;
        });
    }
    
    // Quality select
    const qualitySelect = document.getElementById('qualitySelect');
    if (qualitySelect) {
        qualitySelect.addEventListener('change', (e) => {
            const quality = e.target.value;
            updateQualitySettings(quality, scene);
        });
    }
    
    // Touch sensitivity on mobile
    const touchSensitivityRange = document.getElementById('touchSensitivityRange');
    if (touchSensitivityRange) {
        touchSensitivityRange.addEventListener('input', (e) => {
            const sensitivity = parseFloat(e.target.value) / 5.0; // normalize to 0.2-2.0 range
            updateTouchSensitivity(sensitivity, camera);
        });
    }
}

/**
 * Updates quality settings based on selection
 */
function updateQualitySettings(quality, scene) {
    const engine = scene.getEngine();
    
    switch(quality) {
        case 'low':
            engine.setHardwareScalingLevel(1.5);
            if (scene.pipeline) {
                scene.pipeline.fxaaEnabled = false;
                scene.pipeline.sharpenEnabled = false;
            }
            break;
        case 'medium':
            engine.setHardwareScalingLevel(1.0);
            if (scene.pipeline) {
                scene.pipeline.fxaaEnabled = true;
                scene.pipeline.sharpenEnabled = false;
            }
            break;
        case 'high':
            engine.setHardwareScalingLevel(0.75);
            if (scene.pipeline) {
                scene.pipeline.fxaaEnabled = true;
                scene.pipeline.sharpenEnabled = true;
            }
            break;
    }
    
    // Update toggle states to match quality setting
    if (scene.pipeline) {
        const sharpenToggle = document.getElementById('sharpenToggle');
        const fxaaToggle = document.getElementById('fxaaToggle');
        
        if (sharpenToggle) sharpenToggle.checked = scene.pipeline.sharpenEnabled;
        if (fxaaToggle) fxaaToggle.checked = scene.pipeline.fxaaEnabled;
    }
}

/**
 * Updates touch sensitivity
 */
function updateTouchSensitivity(sensitivity, camera) {
    if (!camera) return;
    
    // Adjust camera sensitivity parameters for touch
    camera.angularSensibilityX = 2500 / sensitivity;
    camera.angularSensibilityY = 2500 / sensitivity;
    camera.panningSensibility = 1000 / sensitivity;
    
    // If we have a gesture controller, update it too
    if (window.gestureController) {
        const thresholds = window.gestureController.thresholds;
        if (thresholds) {
            thresholds.pinchSensitivity = CONFIG.gesture.pinchSensitivity * sensitivity;
            thresholds.panSensitivity = (CONFIG.mobile.panningSensibility / 1000) * sensitivity;
        }
    }
}

/**
 * Resets camera to initial view
 */
function resetCameraView(camera, scene) {
    if (!camera) return;
    
    // Create animation to reset camera
    const animationGroup = new BABYLON.AnimationGroup("resetViewAnimation");
    
    // Target animation
    const targetAnimation = new BABYLON.Animation(
        "resetTarget",
        "target",
        30,
        BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    
    // Alpha (horizontal rotation) animation
    const alphaAnimation = new BABYLON.Animation(
        "resetAlpha",
        "alpha",
        30,
        BABYLON.Animation.ANIMATIONTYPE_FLOAT,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    
    // Beta (vertical rotation) animation
    const betaAnimation = new BABYLON.Animation(
        "resetBeta",
        "beta",
        30,
        BABYLON.Animation.ANIMATIONTYPE_FLOAT,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    
    // Radius animation
    const radiusAnimation = new BABYLON.Animation(
        "resetRadius",
        "radius",
        30,
        BABYLON.Animation.ANIMATIONTYPE_FLOAT,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    
    // Set keyframes
    targetAnimation.setKeys([
        { frame: 0, value: camera.target.clone() },
        { frame: 30, value: new BABYLON.Vector3(0, 0, 0) }
    ]);
    
    alphaAnimation.setKeys([
        { frame: 0, value: camera.alpha },
        { frame: 30, value: CONFIG.camera.alpha }
    ]);
    
    betaAnimation.setKeys([
        { frame: 0, value: camera.beta },
        { frame: 30, value: CONFIG.camera.beta }
    ]);
    
    radiusAnimation.setKeys([
        { frame: 0, value: camera.radius },
        { frame: 30, value: CONFIG.camera.radius }
    ]);
    
    // Add animations to group
    animationGroup.addTargetedAnimation(targetAnimation, camera);
    animationGroup.addTargetedAnimation(alphaAnimation, camera);
    animationGroup.addTargetedAnimation(betaAnimation, camera);
    animationGroup.addTargetedAnimation(radiusAnimation, camera);
    
    // Play animation
    animationGroup.play(true);
}

/**
 * Toggles fullscreen mode
 */
function toggleFullscreen(fullscreenButton) {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            alert('Fullscreen mode failed. It might be disabled in your browser settings.');
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
    
    updateFullscreenButton(fullscreenButton);
}

/**
 * Updates fullscreen button icon
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
 * Share current camera view (via URL)
 */
function shareCameraView(camera, scene) {
    if (!camera) return;
    
    // Get current model URL
    const currentModelUrl = scene.currentModelUrl || CONFIG.defaultModelUrl;
    
    // Get camera position parameters
    const alpha = camera.alpha.toFixed(2);
    const beta = camera.beta.toFixed(2);
    const radius = camera.radius.toFixed(2);
    const targetX = camera.target.x.toFixed(2);
    const targetY = camera.target.y.toFixed(2);
    const targetZ = camera.target.z.toFixed(2);
    
    // Build URL with camera parameters
    const baseUrl = window.location.href.split('?')[0];
    const shareUrl = `${baseUrl}?model=${encodeURIComponent(currentModelUrl)}&alpha=${alpha}&beta=${beta}&radius=${radius}&tx=${targetX}&ty=${targetY}&tz=${targetZ}`;
    
    // Create temporary input to copy URL
    const tempInput = document.createElement('input');
    tempInput.value = shareUrl;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    
    // Show success toast
    showToast('URL copied to clipboard!');
}

/**
 * Shows a temporary toast message
 */
function showToast(message, duration = 3000) {
    // Remove any existing toast
    const existingToast = document.getElementById('toast-message');
    if (existingToast) {
        document.body.removeChild(existingToast);
    }
    
    // Create new toast
    const toast = document.createElement('div');
    toast.id = 'toast-message';
    toast.className = 'toast-message';
    toast.textContent = message;
    
    // Add to document
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Hide toast after duration
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, duration);
}

/**
 * Mobile-specific UI adjustments
 */
function setupMobileSpecificUI(controlPanel, camera) {
    // Add swipe down to close gesture for expanded panel
    let touchStartY = 0;
    
    controlPanel.addEventListener('touchstart', (e) => {
        if (controlPanel.classList.contains('expanded')) {
            touchStartY = e.touches[0].clientY;
        }
    }, { passive: true });
    
    controlPanel.addEventListener('touchmove', (e) => {
        if (controlPanel.classList.contains('expanded') && touchStartY > 0) {
            const touchY = e.touches[0].clientY;
            const diff = touchY - touchStartY;
            
            // If swiped down by at least 50 pixels
            if (diff > 50) {
                // Close the panel
                const allContentSections = document.querySelectorAll(".content-section");
                allContentSections.forEach(section => section.style.display = "none");
                document.getElementById("controlPanelContent").style.display = "none";
                controlPanel.classList.remove("expanded");
                
                // Reset active state on buttons
                const buttons = document.querySelectorAll(".icon-button");
                buttons.forEach(btn => btn.classList.remove('active'));
                
                // Reset touch state
                touchStartY = 0;
                
                // Prevent default behavior
                e.preventDefault();
            }
        }
    }, { passive: false });
    
    controlPanel.addEventListener('touchend', () => {
        touchStartY = 0;
    }, { passive: true });
    
    // Add visual feedback for touch
    const buttons = controlPanel.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('touchstart', () => {
            button.classList.add('touch-active');
        }, { passive: true });
        
        button.addEventListener('touchend', () => {
            button.classList.remove('touch-active');
        }, { passive: true });
        
        button.addEventListener('touchcancel', () => {
            button.classList.remove('touch-active');
        }, { passive: true });
    });
    
    // Apply mobile-specific settings
    updateTouchSensitivity(1.0, camera);
}

/**
 * Handle camera parameters from URL (for sharing feature)
 */
function applyCameraParametersFromUrl(camera) {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Check if camera parameters are in URL
    if (urlParams.has('alpha') && urlParams.has('beta') && urlParams.has('radius')) {
        const alpha = parseFloat(urlParams.get('alpha'));
        const beta = parseFloat(urlParams.get('beta'));
        const radius = parseFloat(urlParams.get('radius'));
        
        // Apply camera rotation and zoom if valid
        if (!isNaN(alpha) && !isNaN(beta) && !isNaN(radius)) {
            camera.alpha = alpha;
            camera.beta = beta;
            camera.radius = radius;
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
 * Set up model loading functionality
 */
function setupModelLoading(scene) {
    const fileButton = document.getElementById("loadModelFileButton");
    const urlButton = document.getElementById("loadModelUrlButton");
    const spinner = document.getElementById("loadingSpinner");
    
    if (fileButton) {
        fileButton.addEventListener("click", async () => {
            const fileInput = document.getElementById("modelLoader");
            if (fileInput && fileInput.files.length > 0) {
                const file = fileInput.files[0];
                
                try {
                    // Show loading spinner
                    if (spinner) spinner.style.display = "flex";
                    
                    // Load model
                    console.log(`Loading model from file: ${file.name}`);
                    const result = await loadModel(scene, file, CONFIG.modelLoader.defaultFallbackModel);
                    
                    // Store model URL for sharing
                    if (result && result.currentModel) {
                        scene.currentModelUrl = URL.createObjectURL(file);
                    }
                    
                    // Show success message
                    showToast(`Model "${file.name}" loaded successfully`);
                } catch (error) {
                    console.error("Error loading model:", error);
                    showToast(`Error loading model: ${error.message}`, 5000);
                } finally {
                    // Hide loading spinner
                    if (spinner) spinner.style.display = "none";
                    
                    // Close panel
                    const allContentSections = document.querySelectorAll(".content-section");
                    allContentSections.forEach(section => section.style.display = "none");
                    document.getElementById("controlPanelContent").style.display = "none";
                }
            } else {
                showToast("Please select a file to load", 3000);
            }
        });
    }
    
    if (urlButton) {
        urlButton.addEventListener("click", async () => {
            const urlInput = document.getElementById("modelUrlInput");
            if (urlInput && urlInput.value) {
                const url = urlInput.value.trim();
                
                try {
                    // Show loading spinner
                    if (spinner) spinner.style.display = "flex";
                    
                    // Load model
                    console.log(`Loading model from URL: ${url}`);
                    const result = await loadModel(scene, url, CONFIG.modelLoader.defaultFallbackModel);
                    
                    // Store model URL for sharing
                    if (result && result.currentModel) {
                        scene.currentModelUrl = url;
                    }
                    
                    // Show success message
                    showToast("Model loaded successfully");
                } catch (error) {
                    console.error("Error loading model:", error);
                    showToast(`Error loading model: ${error.message}`, 5000);
                } finally {
                    // Hide loading spinner
                    if (spinner) spinner.style.display = "none";
                    
                    // Close panel
                    const allContentSections = document.querySelectorAll(".content-section");
                    allContentSections.forEach(section => section.style.display = "none");
                    document.getElementById("controlPanelContent").style.display = "none";
                }
            } else {
                showToast("Please enter a URL to load", 3000);
            }
        });
    }
}