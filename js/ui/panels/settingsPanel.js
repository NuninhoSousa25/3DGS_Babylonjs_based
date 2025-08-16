/* ========================================================================
   SETTINGS PANEL COMPONENT
   ======================================================================== */

import { createToggleSwitch, createRangeControl, getCameraLimitsElements, createElement } from '../components/controls.js';
import { showToast } from '../components/toast.js';
import { setupUIUpdates, startUIUpdates, stopUIUpdates, restartUIUpdates, DOM, Events, ErrorMessages, LoadingSpinner } from '../../helpers.js';
import { CONFIG } from '../../config.js';
import { detectDevice } from '../../deviceDetection.js';

/**
 * Create complete settings section HTML using smaller components
 */
export function createSettingsSection(hasTouch) {
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
                <label for="minDistanceRange">Min Distance</label>
                <div class="range-container">
                    <input type="range" id="minDistanceRange" min="0.1" max="30" value="1.0" step="0.1" class="slider-range">
                    <span id="minDistanceDisplay" class="range-value">1.0</span>
                </div>
            </div>
            
            <div class="control-group">
                <label for="maxDistanceRange">Max Distance</label>
                <div class="range-container">
                    <input type="range" id="maxDistanceRange" min="1" max="50" value="15" step="0.5" class="slider-range">
                    <span id="maxDistanceDisplay" class="range-value">15.0</span>
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
 * Setup all settings controls and their event handlers
 */
export function setupSettingsControls(camera, scene) {
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
    const modelScaleDisplay = document.getElementById('modelScaleRangeDisplay');
    if (modelScaleRange && modelScaleDisplay) {
        Events.addRangeListener(modelScaleRange, (value) => {
            if (scene.currentModel) {
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
    
    // Camera Limits Controls
    setupCameraLimitsControls(camera, scene);
    
    // Export button handler
    const exportButton = document.getElementById('exportButton');
    if (exportButton) {
        Events.addClickListener(exportButton, () => handleExport(camera, scene, scene.getEngine()));
    }
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
    // Distance ranges
    if (elements.zoomMinRange && elements.zoomMinDisplay) {
        Events.addRangeListener(elements.zoomMinRange, (value) => {
            const limits = cameraLimits.getCurrentLimits();
            cameraLimits.setDistanceLimits(limits.restrictDistance, value, limits.radiusMax);
            console.log('Min distance set to:', value);
        }, elements.zoomMinDisplay);
    }
    
    if (elements.zoomMaxRange && elements.zoomMaxDisplay) {
        Events.addRangeListener(elements.zoomMaxRange, (value) => {
            const limits = cameraLimits.getCurrentLimits();
            cameraLimits.setDistanceLimits(limits.restrictDistance, limits.radiusMin, value);
            console.log('Max distance set to:', value);
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

/**
 * Setup camera limits controls (main function)
 */
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

// Import functions that need to be available in this scope
async function handleExport(camera, scene, engine) {
    // Lazy load the exporter
    const { ViewerExporter, showExportDialog } = await import('../../export/ViewerExporter.js');
    const exporter = new ViewerExporter(scene, camera, engine);
    showExportDialog(exporter);
}

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

/**
 * Update anti-aliasing method
 */
function updateAntiAliasing(type, scene, camera) {
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