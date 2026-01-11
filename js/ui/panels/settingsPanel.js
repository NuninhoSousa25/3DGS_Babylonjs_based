/* ========================================================================
   SETTINGS PANEL COMPONENT
   ======================================================================== */

import { createToggleSwitch, createRangeControl, createColorControl, getCameraLimitsElements, createElement, setupEnhancedRangeControl } from '../components/controls.js';
import { showToast } from '../components/toast.js';
import { setupUIUpdates, startUIUpdates, stopUIUpdates, restartUIUpdates, DOM, Events, ErrorMessages, LoadingSpinner } from '../../helpers.js';
import { CONFIG } from '../../config.js';
import { getDeviceInfo } from '../../utils/deviceManager.js';
import { ICONS } from '../components/icons.js';
import { switchRenderer } from '../../main.js';

/**
 * Create complete settings section HTML using smaller components
 */

/**
 * Create complete settings section HTML using smaller components
 */
export function createSettingsSection(hasTouch) {
    return `
        <div id="settingsContent" class="content-section">
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
    const device = getDeviceInfo();
    const defaultQuality = device.isDesktop ? 'high' : 'medium';
    
    return `
        <div class="settings-category" id="visualizationCategory">
            <div class="settings-title" data-target="visualizationContent">Visualization</div>
            <div class="settings-category-content" id="visualizationContent">
                <div class="control-group">
                <label for="autoRotateToggle">Auto Rotation</label>
                <label class="switch">
                    <input type="checkbox" id="autoRotateToggle" ${CONFIG.camera.useAutoRotationBehavior ? 'checked' : ''}>
                    <span class="slider round"></span>
                </label>
            </div>
            
            <div class="control-group">
                 <label for="qualitySelect">Quality Preset</label>
                <select id="qualitySelect" class="settings-select">
                    <option value="low">Low</option>
                    <option value="medium" ${defaultQuality === 'medium' ? 'selected' : ''}>Medium</option>
                    <option value="high" ${defaultQuality === 'high' ? 'selected' : ''}>High</option>
                </select>
            </div>

            <div class="control-group">
                <label for="rendererSelect">Renderer</label>
                <select id="rendererSelect" class="settings-select">
                    <option value="auto">Auto (WebGPU preferred)</option>
                    <option value="webgpu">WebGPU only</option>
                    <option value="webgl">WebGL only</option>
                </select>
            </div>
            
            ${createRangeControl('fovRange', 'Field of View', 0.4, 2.0, 0.8, 0.05, ' rad')}
                ${createRangeControl('modelScaleRange', 'Model Scale', 0.001, 5, 1, 0.1, '', 3)}
                ${createColorControl('backgroundColorPicker', 'Background Color', '#191919')}
            </div>
        </div>
    `;
}

/**
 * Create camera limits settings section HTML
 */
function createCameraLimitsSection() {
    return `
        <div class="settings-category" id="cameraLimitsCategory">
            <div class="settings-title" data-target="cameraLimitsSettingsContent">Camera Limits</div>
            
            <div class="settings-category-content" id="cameraLimitsSettingsContent">
               
                <div class="control-group">
                <label for="cameraLimitsToggle">Enable Camera Limits</label>
                <label class="switch">
                    <input type="checkbox" id="cameraLimitsToggle" ${CONFIG.cameraLimits.enabled ? 'checked' : ''}>
                    <span class="slider round"></span>
                </label>
            </div>
            
            <div class="control-group">
                <label for="limitZoomToggle">Limit Zoom</label>
                <label class="switch">
                    <input type="checkbox" id="limitZoomToggle" ${CONFIG.cameraLimits.defaultRestrictions.zoom ? 'checked' : ''}>
                    <span class="slider round"></span>
                </label>
            </div>
            
            ${createRangeControl('minDistanceRange', 'Min Distance', 0.01, 30, 1.0, 0.1, '', 2)}
            ${createRangeControl('maxDistanceRange', 'Max Distance', 0.1, 50, 15, 0.5)}
            
            <div class="control-group">
                <label for="limitVerticalToggle">Limit Vertical Rotation</label>
                <label class="switch">
                    <input type="checkbox" id="limitVerticalToggle" ${CONFIG.cameraLimits.defaultRestrictions.vertical ? 'checked' : ''}>
                    <span class="slider round"></span>
                </label>
            </div>
            
            ${createRangeControl('verticalUpRange', 'Up Angle Limit', -90, 90, -80, 5, '°')}
            ${createRangeControl('verticalDownRange', 'Down Angle Limit', -90, 90, 5, 5, '°')}
            
            <div class="control-group">
                <label for="limitHorizontalToggle">Limit Horizontal Rotation</label>
                <label class="switch">
                    <input type="checkbox" id="limitHorizontalToggle" ${CONFIG.cameraLimits.defaultRestrictions.horizontal ? 'checked' : ''}>
                    <span class="slider round"></span>
                </label>
            </div>
            
            ${createRangeControl('horizontalAngleRange', 'Horizontal Total Angle', 30, 360, 360, 15, '°')}
            ${createRangeControl('horizontalOffsetRange', 'Horizontal Offset', -180, 180, 0, 15, '°')}
            
            <div class="control-group">
                <label for="limitPanToggle">Enable Panning</label>
                <label class="switch">
                    <input type="checkbox" id="limitPanToggle" ${CONFIG.cameraLimits.defaultRestrictions.panning ? 'checked' : ''}>
                    <span class="slider round"></span>
                </label>
            </div>
            
            <div class="control-group">
                <button id="resetLimitsButton" class="action-button" style="width: 100%; margin-top: 8px;">
                    ${ICONS.reset_view}
                    <span class="button-text">Reset to Defaults</span>
                </button>
            </div>
        </div>
        </div>
    `;
}

/**
 * Create post-processing settings section HTML
 */
function createPostProcessingSection() {
    return `
        <div class="settings-category" id="postProcessingCategory">
            <div class="settings-title" data-target="postProcessingContent">Post Processing</div>
            <div class="settings-category-content" id="postProcessingContent">
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
                <label for="fxaaToggle">Anti-Aliasing (FXAA)</label>
                <label class="switch">
                    <input type="checkbox" id="fxaaToggle" ${CONFIG.postProcessing.fxaaEnabled ? 'checked' : ''}>
                    <span class="slider round"></span>
                </label>
            </div>
        </div>
        </div>

        
       


    `;
}

/**
 * Create touch controls settings section HTML
 */
function createTouchControlsSection() {
    return `
        <div class="settings-category" id="touchControlsCategory">
            <div class="settings-title" data-target="touchControlsContent">Touch Controls</div>
            <div class="settings-category-content" id="touchControlsContent">
                <div class="control-group">
                <label for="touchSensitivityRange">Touch Sensitivity</label>
                <input type="range" id="touchSensitivityRange" min="1" max="10" value="5" class="slider-range">
                </div>
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

            // Provide performance hint when disabling
            if (!checked) {
                console.log('💡 Performance Tip: If experiencing lag with sharpening OFF, try using the "Low" quality preset for better optimization.');
            }
        });
    }

    // Sharpening intensity slider
    const sharpenIntensityRange = document.getElementById('sharpenIntensityRange');
    const sharpenIntensityDisplay = document.getElementById('sharpenIntensityDisplay');
    if (sharpenIntensityRange && sharpenIntensityDisplay && scene.pipeline) {
        Events.addRangeListener(sharpenIntensityRange, (value) => {
            scene.pipeline.sharpen.edgeAmount = value;
            CONFIG.postProcessing.sharpenEdgeAmount = value;
        }, sharpenIntensityDisplay);
    }

    
    // Load saved FXAA setting from localStorage
    const fxaaToggle = document.getElementById('fxaaToggle');
    const savedFXAA = localStorage.getItem('babylonjs_fxaa_enabled');
    
    if (savedFXAA && fxaaToggle) {
        fxaaToggle.checked = savedFXAA === 'true';
        CONFIG.postProcessing.fxaaEnabled = fxaaToggle.checked;
        
        // Apply the saved setting
        if (scene.pipeline) {
            scene.pipeline.fxaaEnabled = fxaaToggle.checked;
        }
    }
    
    if (fxaaToggle) {
        fxaaToggle.addEventListener('change', (e) => {
            const enabled = e.target.checked;
            CONFIG.postProcessing.fxaaEnabled = enabled;
            localStorage.setItem('babylonjs_fxaa_enabled', enabled);
            
            if (scene.pipeline) {
                scene.pipeline.fxaaEnabled = enabled;
            }
        });
    }
    
    // Quality selector
    const qualitySelect = document.getElementById('qualitySelect');
    if (qualitySelect) {
        qualitySelect.addEventListener('change', (e) => {
            updateQualitySettings(e.target.value, scene);
        });
    }
    
    // Renderer selector
    const rendererSelect = document.getElementById('rendererSelect');
    if (rendererSelect) {
        rendererSelect.addEventListener('change', (e) => {
            localStorage.setItem('rendererPreference', e.target.value);
            switchRenderer(e.target.value);
        });
    }

    // FOV range control - Enhanced
    setupEnhancedRangeControl('fovRange', (value) => {
        camera.fov = value;
    });

    // Model scale range control - Enhanced
    setupEnhancedRangeControl('modelScaleRange', (value) => {
        if (scene.currentModel) {
            if (scene.currentModelType === 'splat') {
                scene.currentModel.scaling.set(value, value, -value);
            } else {
                scene.currentModel.scaling.setAll(value);
            }
        }
    });

    // Background color picker
    const backgroundColorPicker = document.getElementById('backgroundColorPicker');
    const backgroundColorDisplay = document.getElementById('backgroundColorPickerDisplay');
    if (backgroundColorPicker && backgroundColorDisplay) {
        backgroundColorPicker.addEventListener('input', (event) => {
            const color = event.target.value;
            backgroundColorDisplay.textContent = color.toUpperCase();
            
            // Convert hex to RGB values (0-1 range for Babylon.js)
            const r = parseInt(color.substr(1, 2), 16) / 255;
            const g = parseInt(color.substr(3, 2), 16) / 255;
            const b = parseInt(color.substr(5, 2), 16) / 255;
            
            scene.clearColor = new BABYLON.Color3(r, g, b);
        });
    }

    // Touch sensitivity (if available)
    const touchSensitivityRange = document.getElementById('touchSensitivityRange');
    if (touchSensitivityRange) {
        Events.addRangeListener(touchSensitivityRange, (value) => {
            const sensitivity = value / 5.0;
            updateTouchSensitivity(sensitivity, camera);
        });
    }
    
    // Enhanced camera limits range controls
    setupEnhancedRangeControl('minDistanceRange', (value) => {
        if (scene.cameraLimits) {
            scene.cameraLimits.setDistanceLimits(true, value, scene.cameraLimits.getCurrentLimits().radiusMax);
        }
    });
    
    setupEnhancedRangeControl('maxDistanceRange', (value) => {
        if (scene.cameraLimits) {
            scene.cameraLimits.setDistanceLimits(true, scene.cameraLimits.getCurrentLimits().radiusMin, value);
        }
    });
    
    setupEnhancedRangeControl('verticalUpRange', (value) => {
        if (scene.cameraLimits) {
            const downValue = document.getElementById('verticalDownRangeInput').value;
            scene.cameraLimits.setVerticalLimitsUpDown(true, value, parseFloat(downValue));
        }
    });
    
    setupEnhancedRangeControl('verticalDownRange', (value) => {
        if (scene.cameraLimits) {
            const upValue = document.getElementById('verticalUpRangeInput').value;
            scene.cameraLimits.setVerticalLimitsUpDown(true, parseFloat(upValue), value);
        }
    });
    
    setupEnhancedRangeControl('horizontalAngleRange', (value) => {
        if (scene.cameraLimits) {
            const offsetValue = document.getElementById('horizontalOffsetRangeInput').value;
            scene.cameraLimits.setHorizontalLimitsAngleOffset(true, value, parseFloat(offsetValue));
        }
    });
    
    setupEnhancedRangeControl('horizontalOffsetRange', (value) => {
        if (scene.cameraLimits) {
            const angleValue = document.getElementById('horizontalAngleRangeInput').value;
            scene.cameraLimits.setHorizontalLimitsAngleOffset(true, parseFloat(angleValue), value);
        }
    });
    
    // Camera Limits Controls
    setupCameraLimitsControls(camera, scene);
    
    // Export button handler
    const exportButton = document.getElementById('exportButton');
    if (exportButton) {
        Events.addClickListener(exportButton, () => handleExport(camera, scene, scene.getEngine()));
    }
    
    // Setup mobile collapsible sections
    setupMobileCollapsibleSections();
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

/**
 * Setup mobile collapsible sections for better touch experience
 */
function setupMobileCollapsibleSections() {
    // Only enable collapsible sections on touch devices
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (!isTouchDevice) return;
    
    // Get all settings titles
    const settingsTitles = document.querySelectorAll('.settings-title[data-target]');
    
    settingsTitles.forEach(title => {
        const targetId = title.getAttribute('data-target');
        const targetContent = document.getElementById(targetId);
        const category = title.closest('.settings-category');
        
        if (!targetContent || !category) return;
        
        // Start with camera limits collapsed to save space
        if (targetId === 'cameraLimitsContent') {
            category.classList.add('collapsed');
        }
        
        // Add click handler
        title.addEventListener('click', () => {
            const isCollapsed = category.classList.contains('collapsed');
            
            if (isCollapsed) {
                // Expand this section
                category.classList.remove('collapsed');
                title.classList.remove('collapsed');
                
                // Optionally collapse other sections to save space on small screens
                if (window.innerWidth < 480) {
                    settingsTitles.forEach(otherTitle => {
                        if (otherTitle !== title) {
                            const otherTargetId = otherTitle.getAttribute('data-target');
                            const otherCategory = otherTitle.closest('.settings-category');
                            if (otherCategory && otherTargetId !== 'visualizationContent') {
                                // Keep visualization always expanded, collapse others
                                otherCategory.classList.add('collapsed');
                                otherTitle.classList.add('collapsed');
                            }
                        }
                    });
                }
            } else {
                // Collapse this section
                category.classList.add('collapsed');
                title.classList.add('collapsed');
            }
        });
        
        // Add touch-friendly hover effects
        title.addEventListener('touchstart', () => {
            title.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        }, { passive: true });
        
        title.addEventListener('touchend', () => {
            setTimeout(() => {
                title.style.backgroundColor = '';
            }, 150);
        }, { passive: true });
    });
    
    console.log('Mobile collapsible sections initialized');
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
export function updateQualitySettings(quality, scene) {
    const engine = scene.getEngine();

    const qualitySettings = {
        low: { scaling: 1.5, fxaa: false, sharpen: false },      // Low: Disable sharpen for better performance
        medium: { scaling: 1.0, fxaa: false, sharpen: true },    // Medium: Enable sharpen, no FXAA
        high: { scaling: 0.70, fxaa: true, sharpen: true }       // High: Enable both sharpen and FXAA
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
        const fxaaToggle = document.getElementById('fxaaToggle');
        
        if (sharpenToggle) sharpenToggle.checked = settings.sharpen;
        if (sharpenIntensityRange && settings.sharpen) {
            sharpenIntensityRange.value = scene.pipeline.sharpen.edgeAmount;
            if (sharpenIntensityDisplay) {
                sharpenIntensityDisplay.textContent = scene.pipeline.sharpen.edgeAmount;
            }
        }
        if (fxaaToggle) {
            fxaaToggle.checked = settings.fxaa;
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

