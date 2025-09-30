/* ========================================================================
   3D VIEWER UI CONTROLLER
   ======================================================================== */

// Import components
import { ICONS } from './ui/components/icons.js';
import { createElement } from './ui/components/controls.js';
import { showToast } from './ui/components/toast.js';

// Import panels
import { createSettingsSection, setupSettingsControls, updateQualitySettings } from './ui/panels/settingsPanel.js';
import { createDevSection, setupModelLoading } from './ui/panels/devPanel.js';
import { createInfoSection } from './ui/panels/infoPanel.js';

// Import dependencies
import { setupUIUpdates, stopUIUpdates, restartUIUpdates, DOM, Events, ErrorMessages, LoadingSpinner } from './helpers.js';
import { loadModel } from './modelLoader.js';
import { CONFIG } from './config.js';
import { getDeviceInfo } from './utils/deviceManager.js';
import { decompressUrlParameters, compressUrlParameters, createShareUrl, addSettingsPanelToUrl, shareCompleteViewerState } from './urlManager.js';
import { isSharedURL } from './utils/urlUtils.js';


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
    
    // Setup settings controls (only for non-shared)
    if (!isSharedURL()) {
        setupSettingsControls(camera, scene);
    }
    
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
 * Create the unified icon bar (hamburger menu for shared URLs)
 */
function createIconBar() {
    const isShared = isSharedURL();
    
    if (isShared) {
        // Hamburger menu for shared links with quality toggle
        const device = getDeviceInfo();
        const defaultQuality = device.isDesktop ? 'High' : 'Medium';
        
        return createElement("div", {
            id: "iconBar",
            className: "icon-bar shared-mode hamburger-style",
            innerHTML: `
                <button id="hamburgerButton" class="hamburger-button" title="Menu">
                    <div class="hamburger-icon">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </button>
                <div id="hamburgerMenu" class="hamburger-menu hidden">
                    <button id="resetViewButton" class="menu-item" title="Reset View">
                        ${ICONS.reset_view}
                        <span>Reset</span>
                    </button>
                    <button id="fullscreenButton" class="menu-item" title="Toggle Fullscreen">
                        ${ICONS.fullscreen}
                        <span>Fullscreen</span>
                    </button>
                    <button id="qualityToggle" class="menu-item quality-menu-item" title="Click to change quality">
                        ${ICONS.settings}
                        <span>Quality: <span id="qualityDisplay">${defaultQuality}</span></span>
                    </button>
                </div>
            `
        });
    } else {
        // Full UI for non-shared usage
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
}

/**
 * Create the content area with all sections (simplified for shared URLs)
 */
function createContentArea(hasTouch) {
    const contentArea = createElement("div", {
        id: "controlPanelContent",
        className: "control-panel-content"
    });
    contentArea.style.display = "none";
    
    const isShared = isSharedURL();
    
    if (isShared) {
        // No content panels needed for shared URLs - using direct quality toggle
        contentArea.innerHTML = ``;
        contentArea.style.display = "none"; // Always hidden for shared mode
    } else {
        // Full content for regular usage
        const settingsHTML = createSettingsSection(hasTouch);
        const infoHTML = createInfoSection(hasTouch);
        const devHTML = createDevSection();
        
        contentArea.innerHTML = `
            <button id="closePanelButton" class="close-panel-button" title="Close Panel">×</button>
            
            ${settingsHTML}
            ${infoHTML}
            ${devHTML}
        `;
    }
    
    return contentArea;
}

/**
 * Create simplified quality section for shared URLs
 */
function createSimplifiedQualitySection() {
    const device = detectDevice();
    const defaultQuality = device.isDesktop ? 'high' : 'medium';
    
    return `
        <div id="qualityContent" class="content-section">
            <h4>Quality Settings</h4>
            <div class="control-group">
                <label for="qualitySelect">Rendering Quality</label>
                <select id="qualitySelect" class="settings-select">
                    <option value="low">Low (Better Performance)</option>
                    <option value="medium" ${defaultQuality === 'medium' ? 'selected' : ''}>Medium (Balanced)</option>
                    <option value="high" ${defaultQuality === 'high' ? 'selected' : ''}>High (Better Quality)</option>
                </select>
            </div>
            <div class="quality-description">
                <small>Adjust rendering quality based on your device performance. Lower settings improve frame rate on slower devices.</small>
            </div>
        </div>
    `;
}

/* ========================================================================
   EVENT HANDLERS
   ======================================================================== */
/**
 * Setup all icon button event handlers (adapted for simplified shared URL UI)
 */
function setupIconButtonHandlers(camera, scene, engine) {
    const isShared = isSharedURL();
    
    // Get button references - different buttons for shared vs full UI
    let buttons;
    if (isShared) {
        buttons = DOM.getAll([
            "hamburgerButton", "resetViewButton", "fullscreenButton", "qualityToggle"
        ]);
    } else {
        buttons = DOM.getAll([
            "settingsButton", "infoButton", "devButton",
            "resetViewButton", "fullscreenButton", "shareButton", "closePanelButton"
        ]);
    }
    
    const { settingsButton, infoButton, devButton, resetViewButton,
            fullscreenButton, shareButton, closePanelButton, hamburgerButton, qualityToggle } = buttons;

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

        // Reset all button states (different for shared vs full UI)
        if (isShared) {
            [infoButton, qualityButton].forEach(btn => {
                if (btn) btn.classList.remove('active');
            });
        } else {
            [settingsButton, infoButton, devButton].forEach(btn => {
                if (btn) btn.classList.remove('active');
            });
        }

        // If a new section is to be opened
        if (!isAlreadyOpen && sectionToShow) {
            // Ensure the container is visible, then show the specific section
            if (controlPanelContent) controlPanelContent.style.display = "block";
            sectionToShow.style.display = "block";
            currentlyOpenSection = sectionToShow;

            // Set active button state (different for shared vs full UI)
            if (isShared) {
                if (sectionToShow.id === 'infoContent' && infoButton) {
                    infoButton.classList.add('active');
                } else if (sectionToShow.id === 'qualityContent' && qualityButton) {
                    qualityButton.classList.add('active');
                }
            } else {
                if (sectionToShow.id === 'settingsContent' && settingsButton) {
                    settingsButton.classList.add('active');
                } else if (sectionToShow.id === 'infoContent' && infoButton) {
                    infoButton.classList.add('active');
                } else if (sectionToShow.id === 'devContent' && devButton) {
                    devButton.classList.add('active');
                }
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
    
    // Setup button event listeners (different for shared vs full UI)
    if (isShared) {
        // Hamburger menu toggle for shared URLs
        if (hamburgerButton) {
            Events.addClickListener(hamburgerButton, () => toggleHamburgerMenu());
        }
        
        // Menu items for shared URLs - simplified to just reset and fullscreen
        if (resetViewButton) {
            Events.addClickListener(resetViewButton, () => {
                resetCameraView(camera, scene);
                toggleHamburgerMenu(false); // Close menu after action
            });
        }
        if (fullscreenButton) {
            Events.addClickListener(fullscreenButton, () => {
                toggleFullscreen(fullscreenButton);
                toggleHamburgerMenu(false); // Close menu after action
            });
        }
        
        // Quality toggle button - cycles through High -> Medium -> Low -> High
        if (qualityToggle) {
            Events.addClickListener(qualityToggle, () => {
                cycleQuality(scene);
                toggleHamburgerMenu(false); // Close menu after quality change
            });
        }
    } else {
        // Full UI for regular usage
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
            Events.addClickListener(shareButton, () => shareCompleteViewerState(camera, scene));
        }
        if (closePanelButton) {
            Events.addClickListener(closePanelButton, () => toggleContentSection(null));
        }
    }

    // Update fullscreen icon on ESC key
    document.addEventListener('fullscreenchange', () => {
        updateFullscreenButton(fullscreenButton);
    });
    
    // Close hamburger menu when clicking outside (for shared UI)
    if (isShared) {
        document.addEventListener('click', (e) => {
            const hamburgerMenu = DOM.get("hamburgerMenu");
            const hamburgerButton = DOM.get("hamburgerButton");
            
            if (hamburgerMenu && hamburgerButton && 
                !hamburgerMenu.contains(e.target) && 
                !hamburgerButton.contains(e.target)) {
                toggleHamburgerMenu(true); // Force close
            }
        });
    }
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

/**
 * Toggle hamburger menu visibility for shared URLs
 */
function toggleHamburgerMenu(forceClose = null) {
    const hamburgerMenu = DOM.get("hamburgerMenu");
    const hamburgerButton = DOM.get("hamburgerButton");
    
    if (!hamburgerMenu || !hamburgerButton) return;
    
    const isOpen = !hamburgerMenu.classList.contains('hidden');
    const shouldClose = forceClose === true || (forceClose === null && isOpen);
    
    if (shouldClose) {
        hamburgerMenu.classList.add('hidden');
        hamburgerButton.classList.remove('active');
    } else {
        hamburgerMenu.classList.remove('hidden');
        hamburgerButton.classList.add('active');
    }
}

/**
 * Cycle through quality settings: High -> Medium -> Low -> High
 */
function cycleQuality(scene) {
    const qualityDisplay = DOM.get("qualityDisplay");
    if (!qualityDisplay) return;
    
    const currentQuality = qualityDisplay.textContent;
    let nextQuality;
    
    switch (currentQuality) {
        case 'High':
            nextQuality = 'Medium';
            break;
        case 'Medium':
            nextQuality = 'Low';
            break;
        case 'Low':
            nextQuality = 'High';
            break;
        default:
            nextQuality = 'Medium';
    }
    
    // Update display
    qualityDisplay.textContent = nextQuality;
    
    // Apply quality settings
    updateQualitySettings(nextQuality.toLowerCase(), scene);
    
    // Show feedback
    showToast(`Quality: ${nextQuality}`);
}

/**
 * Add settings panel state to URL parameters
 */



