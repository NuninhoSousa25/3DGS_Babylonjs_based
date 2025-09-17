/* ========================================================================
   3D VIEWER - URL PARAMETER MANAGEMENT SYSTEM
   ========================================================================
   
   PURPOSE:
   Centralized system for managing URL parameters, compression, and state sharing.
   Handles all URL-based state persistence for the 3D viewer application.
   
   EXPORTS:
   - URL_PARAM_MAP - Parameter name to short code mapping
   - REVERSE_URL_PARAM_MAP - Short code to parameter name mapping  
   - compressUrlParameters() - Compress parameters for shorter URLs
   - decompressUrlParameters() - Decompress and restore parameters
   - createShareUrl() - Generate complete shareable URLs
   - addSettingsPanelToUrl() - Collect settings for URL generation
   - applyCameraParametersFromUrl() - Restore camera state from URL
   - applyModelScaleFromUrl() - Restore model scale from URL  
   - applySettingsPanelFromUrl() - Restore settings panel state from URL
   
   FEATURES:
   - Parameter name compression (model → m, alpha → a, etc.)
   - Base64 compression for very long URLs
   - Backwards compatibility with uncompressed URLs
   - Precision control for numeric values
   - Special handling for model URLs and coordinates
   - Complete state preservation and restoration
   
   DEPENDENCIES:
   - Browser URLSearchParams API
   - Base64 encoding/decoding (atob/btoa)
   - UI panel functions for settings restoration
   
   ======================================================================== */

// Import necessary UI functions for state restoration
import { updateQualitySettings } from './ui/panels/settingsPanel.js';
import { showToast } from './ui/components/toast.js';
import { debugLog } from './helpers.js';

/**
 * Maps full parameter names to short codes for more compact URLs
 * @type {Object<string, string>}
 */
export const URL_PARAM_MAP = {
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
    'fxaa': 'fx',
    'touchSensitivity': 'ts',
    'backgroundColor': 'bg',
    
    // Camera limits toggles
    'cameraLimits': 'cl',
    'limitZoom': 'lz',
    'limitVertical': 'lv', 
    'limitHorizontal': 'lh',
    'enablePanning': 'ep',
    
    // Camera limits values (shorter codes)
    'restrictions': 'rest',
    'alphaMin': 'an',
    'alphaMax': 'ax',
    'betaMin': 'bn',
    'betaMax': 'bx',
    'radiusMin': 'rn',
    'radiusMax': 'rx',
    
    // Horizontal angle/offset system
    'horizontalAngle': 'ha',
    'horizontalOffset': 'ho',
    
    // Zoom distance limits
    'zoomMinDistance': 'zmin',
    'zoomMaxDistance': 'zmax',
    
    // Vertical angle limits (up/down system)
    'verticalUpAngle': 'vu',
    'verticalDownAngle': 'vd'
};

/**
 * Reverse mapping for converting short codes back to full parameter names
 * @type {Object<string, string>}
 */
export const REVERSE_URL_PARAM_MAP = Object.fromEntries(
    Object.entries(URL_PARAM_MAP).map(([k, v]) => [v, k])
);

/**
 * Compresses URL parameters using short codes and base64 encoding when beneficial
 * @param {URLSearchParams} params - Parameters to compress
 * @returns {string} Compressed parameter string ready for URL
 * @description Applies multiple compression strategies:
 *              - Short parameter names (model → m, alpha → a)
 *              - Numeric precision rounding
 *              - Base64 compression for long parameter strings
 *              - Automatic fallback to uncompressed if longer
 * @example
 * const params = new URLSearchParams();
 * params.set('model', 'https://example.com/model.splat');
 * params.set('alpha', '1.234567');
 * const compressed = compressUrlParameters(params); // "c=bT1odHRwczovL2V4YW1wbGU..."
 */
function compressUrlParameters(params) {
    const compressed = new URLSearchParams();
    
    for (const [key, value] of params.entries()) {
        const shortKey = URL_PARAM_MAP[key] || key;
        
        // For numeric values, round to reasonable precision
        if (shortKey === 'a' || shortKey === 'b' || shortKey === 'r') { // alpha, beta, radius
            compressed.set(shortKey, parseFloat(value).toFixed(2));
        } else if (shortKey === 'f') { // fov
            compressed.set(shortKey, parseFloat(value).toFixed(1));
        } else if (shortKey === 'x' || shortKey === 'y' || shortKey === 'z') { // target coordinates
            compressed.set(shortKey, parseFloat(value).toFixed(1));
        } else if (shortKey === 's') { // scale
            compressed.set(shortKey, parseFloat(value).toFixed(2));
        } else {
            compressed.set(shortKey, value);
        }
    }
    
    const compressedString = compressed.toString();
    
    // Only use base64 compression if the string is long enough to benefit
    if (compressedString.length > 50) {
        try {
            const base64Compressed = btoa(compressedString);
            // Only use base64 if it actually makes the URL shorter
            if (base64Compressed.length < compressedString.length) {
                return `c=${base64Compressed}`;
            }
        } catch (e) {
            console.warn('Base64 compression failed, using uncompressed:', e);
        }
    }
    
    return compressedString;
}

/**
 * Decompresses and parses URL parameters from shared viewer URLs
 * @returns {URLSearchParams} Decompressed URL parameters with full parameter names
 * @description Handles both compressed (base64 with 'c' parameter) and uncompressed URL formats.
 *              Converts shortened parameter names back to full names for compatibility.
 *              Used by sharing system to restore complete viewer state from URLs.
 * @example
 * // From compressed URL: ?c=bT1odHRwczovL2V4YW1wbGUuY29tJmE9MS4yJmI9MC44
 * const params = decompressUrlParameters();
 * console.log(params.get('model')); // 'https://example.com'
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
                fullParams.set(fullKey, value);
            }
            
            return fullParams;
        } catch (e) {
            console.warn('Failed to decode base64 URL parameters, falling back to regular parsing:', e);
            // Fall through to regular parameter processing
        }
    }
    
    // Handle uncompressed URLs (short keys)
    if (urlParams.size > 0) {
        const fullParams = new URLSearchParams();
        for (const [shortKey, value] of urlParams.entries()) {
            const fullKey = REVERSE_URL_PARAM_MAP[shortKey] || shortKey;
            
            // Decompress specific values
            fullParams.set(fullKey, value);
        }
        
        return fullParams;
    }
    
    // Return empty parameters if no URL params found
    return new URLSearchParams();
}

/**
 * Creates a complete shareable URL with compressed parameters for the current viewer state
 * @param {URLSearchParams} params - Parameters to include in the share URL
 * @returns {string} Complete shareable URL ready for copying or sharing
 * @description Combines the current page URL with compressed parameters to create
 *              a shareable link that preserves the complete viewer state.
 * @example
 * const params = new URLSearchParams();
 * params.set('model', 'https://example.com/model.splat');
 * params.set('alpha', '1.2');
 * const shareUrl = createShareUrl(params);
 * // Returns: "https://yoursite.com/viewer/?c=bT1odHRwczovL2V4YW1wbGU..."
 */
export function createShareUrl(params) {
    const compressedParams = compressUrlParameters(params);
    const baseUrl = window.location.href.split('?')[0];
    return `${baseUrl}?${compressedParams}`;
}

// Export the internal compression function for advanced use cases
export { compressUrlParameters };

/* ========================================================================
   URL STATE MANAGEMENT FUNCTIONS
   ========================================================================
   
   Functions for collecting viewer state into URL parameters and applying 
   URL parameters back to viewer state. These handle the complete round-trip
   of state preservation for sharing functionality.
   ======================================================================== */

/**
 * Collects all settings panel parameters and adds them to URLSearchParams
 * @param {URLSearchParams} params - URLSearchParams object to add parameters to
 * @param {BABYLON.ArcRotateCamera} camera - Camera for auto-rotation settings
 * @param {BABYLON.Scene} scene - Scene for post-processing and model settings
 * @description Captures complete viewer state including camera limits, 
 *              post-processing effects, touch sensitivity, background color.
 *              Only includes non-default values to keep URLs compact.
 * @returns {void}
 * @example
 * const params = new URLSearchParams();
 * addSettingsPanelToUrl(params, camera, scene);
 * const shareUrl = createShareUrl(params);
 */
export function addSettingsPanelToUrl(params, camera, scene) {
    // Access CONFIG from window if available, or use defaults
    const CONFIG = window.CONFIG || {
        camera: { useAutoRotationBehavior: false },
        postProcessing: { 
            sharpenEnabled: false,
            sharpenEdgeAmount: 1.0,
            fxaaEnabled: false
        }
    };
    
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
        
        // FXAA
        const fxaaToggle = document.getElementById('fxaaToggle');
        if (fxaaToggle && fxaaToggle.checked !== CONFIG.postProcessing.fxaaEnabled) {
            params.set('fxaa', fxaaToggle.checked ? '1' : '0');
        }
    }
    
    // Touch sensitivity (if different from default)
    const touchSensitivityRange = document.getElementById('touchSensitivityRange');
    if (touchSensitivityRange && touchSensitivityRange.value !== '5') {
        params.set('touchSensitivity', touchSensitivityRange.value);
    }
    
    // Background color (if different from default)
    const backgroundColorPicker = document.getElementById('backgroundColorPicker');
    if (backgroundColorPicker && backgroundColorPicker.value !== '#191919') {
        params.set('backgroundColor', backgroundColorPicker.value);
    }
    
    // Camera limits settings
    const cameraLimitsToggle = document.getElementById('cameraLimitsToggle');
    if (cameraLimitsToggle) {
        params.set('cameraLimits', cameraLimitsToggle.checked ? '1' : '0');
    }
    
    const limitZoomToggle = document.getElementById('limitZoomToggle');
    if (limitZoomToggle) {
        params.set('limitZoom', limitZoomToggle.checked ? '1' : '0');
    }
    
    const limitVerticalToggle = document.getElementById('limitVerticalToggle');
    if (limitVerticalToggle) {
        params.set('limitVertical', limitVerticalToggle.checked ? '1' : '0');
    }
    
    const limitHorizontalToggle = document.getElementById('limitHorizontalToggle');
    if (limitHorizontalToggle) {
        params.set('limitHorizontal', limitHorizontalToggle.checked ? '1' : '0');
    }
    
    const limitPanToggle = document.getElementById('limitPanToggle');
    if (limitPanToggle) {
        params.set('enablePanning', limitPanToggle.checked ? '1' : '0');
    }
    
    // Horizontal angle/offset parameters
    const horizontalAngleRange = document.getElementById('horizontalAngleRange');
    if (horizontalAngleRange && parseInt(horizontalAngleRange.value) !== 360) {
        params.set('horizontalAngle', horizontalAngleRange.value);
    }
    
    const horizontalOffsetRange = document.getElementById('horizontalOffsetRange');
    if (horizontalOffsetRange && parseInt(horizontalOffsetRange.value) !== 0) {
        params.set('horizontalOffset', horizontalOffsetRange.value);
    }
    
    // Zoom distance limits
    const minDistanceRange = document.getElementById('minDistanceRange');
    if (minDistanceRange && parseFloat(minDistanceRange.value) !== 1.0) {
        params.set('zoomMinDistance', parseFloat(minDistanceRange.value).toFixed(1));
    }
    
    const maxDistanceRange = document.getElementById('maxDistanceRange');
    if (maxDistanceRange && parseFloat(maxDistanceRange.value) !== 15.0) {
        params.set('zoomMaxDistance', parseFloat(maxDistanceRange.value).toFixed(1));
    }
    
    // Vertical angle limits (up/down system)
    const verticalUpRange = document.getElementById('verticalUpRange');
    if (verticalUpRange && parseInt(verticalUpRange.value) !== -80) {
        params.set('verticalUpAngle', verticalUpRange.value);
    }
    
    const verticalDownRange = document.getElementById('verticalDownRange');
    if (verticalDownRange && parseInt(verticalDownRange.value) !== 5) {
        params.set('verticalDownAngle', verticalDownRange.value);
    }
}

/**
 * Apply camera parameters from URL (for sharing feature)
 * @param {BABYLON.ArcRotateCamera} camera - Camera to apply parameters to
 * @description Restores camera position (alpha, beta, radius), FOV, and target
 *              coordinates from URL parameters. Used when loading shared URLs.
 * @returns {void}
 * @example
 * applyCameraParametersFromUrl(camera);
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
                // Import BABYLON dynamically to avoid circular dependency
                const BABYLON = window.BABYLON;
                camera.target = new BABYLON.Vector3(tx, ty, tz);
            }
        }
        
        debugLog("Applied camera parameters from URL");
    }
}

/**
 * Apply model scale from URL parameters (for sharing feature)
 * @param {BABYLON.Scene} scene - Scene containing the current model
 * @description Restores model scale from URL and updates UI slider.
 *              Should be called after the model is loaded.
 * @returns {void}
 * @example
 * // After model loading
 * applyModelScaleFromUrl(scene);
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
            const modelScaleDisplay = document.getElementById('modelScaleRangeDisplay');
            if (modelScaleRange && modelScaleDisplay) {
                modelScaleRange.value = scale;
                modelScaleDisplay.textContent = scale.toFixed(1);
            }
            
            debugLog(`Applied model scale from URL: ${scale}`);
        }
    }
}

/**
 * Restores complete settings panel state from URL parameters for shared viewer links
 * @param {BABYLON.ArcRotateCamera} camera - Camera to apply auto-rotation and sensitivity settings
 * @param {BABYLON.Scene} scene - Scene containing post-processing pipeline and models
 * @description Comprehensive state restoration including:
 *              - Auto-rotation settings and behavior
 *              - Quality presets (low/medium/high)
 *              - Post-processing effects (sharpening, anti-aliasing)
 *              - Touch sensitivity for mobile devices
 *              - Background color customization
 *              - Complete camera limits system (toggles + values)
 *              Must be called after UI initialization to ensure DOM elements exist.
 * @returns {void}
 * @example
 * // Restore settings after UI setup
 * setupUI(camera, scene, engine);
 * applySettingsPanelFromUrl(camera, scene);
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
            // Apply quality settings using imported function
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
                // Update CONFIG if available
                if (window.CONFIG) {
                    window.CONFIG.postProcessing.sharpenEdgeAmount = intensity;
                }
                
                const sharpenIntensityRange = document.getElementById('sharpenIntensityRange');
                const sharpenIntensityDisplay = document.getElementById('sharpenIntensityDisplay');
                if (sharpenIntensityRange && sharpenIntensityDisplay) {
                    sharpenIntensityRange.value = intensity;
                    sharpenIntensityDisplay.textContent = intensity.toFixed(1);
                }
            }
        }
        
        // FXAA
        if (urlParams.has('fxaa')) {
            const fxaa = urlParams.get('fxaa') === '1';
            if (window.CONFIG) {
                window.CONFIG.postProcessing.fxaaEnabled = fxaa;
            }
            
            if (scene.pipeline) {
                scene.pipeline.fxaaEnabled = fxaa;
            }
            
            const fxaaToggle = document.getElementById('fxaaToggle');
            if (fxaaToggle) {
                fxaaToggle.checked = fxaa;
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
                // Apply touch sensitivity directly
                const normalizedSensitivity = sensitivity / 5.0;
                camera.angularSensibilityX = 1000 / normalizedSensitivity;
                camera.angularSensibilityY = 1000 / normalizedSensitivity;
                camera.panningSensibility = 1000 / normalizedSensitivity;
            }
        }
    }
    
    // Background color
    if (urlParams.has('backgroundColor')) {
        const bgColor = urlParams.get('backgroundColor');
        // Validate hex color format
        if (/^#[0-9A-F]{6}$/i.test(bgColor)) {
            const backgroundColorPicker = document.getElementById('backgroundColorPicker');
            const backgroundColorDisplay = document.getElementById('backgroundColorPickerDisplay');
            
            if (backgroundColorPicker && backgroundColorDisplay) {
                backgroundColorPicker.value = bgColor;
                backgroundColorDisplay.textContent = bgColor.toUpperCase();
                
                // Convert hex to RGB values (0-1 range for Babylon.js)
                const r = parseInt(bgColor.substr(1, 2), 16) / 255;
                const g = parseInt(bgColor.substr(3, 2), 16) / 255;
                const b = parseInt(bgColor.substr(5, 2), 16) / 255;
                
                // Access BABYLON from window
                const BABYLON = window.BABYLON;
                if (BABYLON) {
                    scene.clearColor = new BABYLON.Color3(r, g, b);
                }
            }
        }
    }
    
    // Camera limits settings
    if (urlParams.has('cameraLimits')) {
        const cameraLimits = urlParams.get('cameraLimits') === '1';
        const cameraLimitsToggle = document.getElementById('cameraLimitsToggle');
        if (cameraLimitsToggle) {
            cameraLimitsToggle.checked = cameraLimits;
            // Trigger the toggle event to show/hide camera limits panel
            cameraLimitsToggle.dispatchEvent(new Event('change'));
        }
    }
    
    if (urlParams.has('limitZoom')) {
        const limitZoom = urlParams.get('limitZoom') === '1';
        const limitZoomToggle = document.getElementById('limitZoomToggle');
        if (limitZoomToggle) {
            limitZoomToggle.checked = limitZoom;
            limitZoomToggle.dispatchEvent(new Event('change'));
        }
    }
    
    if (urlParams.has('limitVertical')) {
        const limitVertical = urlParams.get('limitVertical') === '1';
        const limitVerticalToggle = document.getElementById('limitVerticalToggle');
        if (limitVerticalToggle) {
            limitVerticalToggle.checked = limitVertical;
            limitVerticalToggle.dispatchEvent(new Event('change'));
        }
    }
    
    if (urlParams.has('limitHorizontal')) {
        const limitHorizontal = urlParams.get('limitHorizontal') === '1';
        const limitHorizontalToggle = document.getElementById('limitHorizontalToggle');
        if (limitHorizontalToggle) {
            limitHorizontalToggle.checked = limitHorizontal;
            limitHorizontalToggle.dispatchEvent(new Event('change'));
        }
    }
    
    if (urlParams.has('enablePanning')) {
        const enablePanning = urlParams.get('enablePanning') === '1';
        const limitPanToggle = document.getElementById('limitPanToggle');
        if (limitPanToggle) {
            limitPanToggle.checked = enablePanning;
            limitPanToggle.dispatchEvent(new Event('change'));
        }
    }
    
    // Horizontal angle and offset parameters
    if (urlParams.has('horizontalAngle')) {
        const horizontalAngle = parseInt(urlParams.get('horizontalAngle'));
        if (!isNaN(horizontalAngle) && horizontalAngle >= 30 && horizontalAngle <= 360) {
            const horizontalAngleRange = document.getElementById('horizontalAngleRange');
            const horizontalAngleDisplay = document.getElementById('horizontalAngleDisplay');
            if (horizontalAngleRange && horizontalAngleDisplay) {
                horizontalAngleRange.value = horizontalAngle;
                horizontalAngleDisplay.textContent = horizontalAngle + '°';
                horizontalAngleRange.dispatchEvent(new Event('input'));
            }
        }
    }
    
    if (urlParams.has('horizontalOffset')) {
        const horizontalOffset = parseInt(urlParams.get('horizontalOffset'));
        if (!isNaN(horizontalOffset) && horizontalOffset >= -180 && horizontalOffset <= 180) {
            const horizontalOffsetRange = document.getElementById('horizontalOffsetRange');
            const horizontalOffsetDisplay = document.getElementById('horizontalOffsetDisplay');
            if (horizontalOffsetRange && horizontalOffsetDisplay) {
                horizontalOffsetRange.value = horizontalOffset;
                horizontalOffsetDisplay.textContent = horizontalOffset + '°';
                horizontalOffsetRange.dispatchEvent(new Event('input'));
            }
        }
    }
    
    // Zoom distance limits
    if (urlParams.has('zoomMinDistance')) {
        const zoomMin = parseFloat(urlParams.get('zoomMinDistance'));
        if (!isNaN(zoomMin) && zoomMin >= 0.1 && zoomMin <= 30) {
            const minDistanceRange = document.getElementById('minDistanceRange');
            const minDistanceDisplay = document.getElementById('minDistanceDisplay');
            if (minDistanceRange && minDistanceDisplay) {
                minDistanceRange.value = zoomMin;
                minDistanceDisplay.textContent = zoomMin.toFixed(1);
                minDistanceRange.dispatchEvent(new Event('input'));
            }
        }
    }
    
    if (urlParams.has('zoomMaxDistance')) {
        const zoomMax = parseFloat(urlParams.get('zoomMaxDistance'));
        if (!isNaN(zoomMax) && zoomMax >= 1 && zoomMax <= 50) {
            const maxDistanceRange = document.getElementById('maxDistanceRange');
            const maxDistanceDisplay = document.getElementById('maxDistanceDisplay');
            if (maxDistanceRange && maxDistanceDisplay) {
                maxDistanceRange.value = zoomMax;
                maxDistanceDisplay.textContent = zoomMax.toFixed(1);
                maxDistanceRange.dispatchEvent(new Event('input'));
            }
        }
    }
    
    // Vertical angle limits (up/down system)
    if (urlParams.has('verticalUpAngle')) {
        const verticalUp = parseInt(urlParams.get('verticalUpAngle'));
        if (!isNaN(verticalUp) && verticalUp >= -90 && verticalUp <= 90) {
            const verticalUpRange = document.getElementById('verticalUpRange');
            const verticalUpDisplay = document.getElementById('verticalUpDisplay');
            if (verticalUpRange && verticalUpDisplay) {
                verticalUpRange.value = verticalUp;
                verticalUpDisplay.textContent = verticalUp + '°';
                verticalUpRange.dispatchEvent(new Event('input'));
            }
        }
    }
    
    if (urlParams.has('verticalDownAngle')) {
        const verticalDown = parseInt(urlParams.get('verticalDownAngle'));
        if (!isNaN(verticalDown) && verticalDown >= -90 && verticalDown <= 90) {
            const verticalDownRange = document.getElementById('verticalDownRange');
            const verticalDownDisplay = document.getElementById('verticalDownDisplay');
            if (verticalDownRange && verticalDownDisplay) {
                verticalDownRange.value = verticalDown;
                verticalDownDisplay.textContent = verticalDown + '°';
                verticalDownRange.dispatchEvent(new Event('input'));
            }
        }
    }
    
    debugLog("Applied settings panel state from URL");
}

/**
 * Creates and copies complete viewer state URL to clipboard
 * @param {BABYLON.ArcRotateCamera} camera - Camera for position and settings
 * @param {BABYLON.Scene} scene - Scene containing model and pipeline settings
 * @description Comprehensive share function that collects complete viewer state
 *              including camera position, model scale, all settings, and camera limits.
 *              Copies the generated URL to clipboard with user feedback.
 * @returns {void}
 * @example
 * // Share complete viewer state
 * shareCompleteViewerState(camera, scene);
 */
export function shareCompleteViewerState(camera, scene) {
    if (!camera) return;
    
    // Import CONFIG dynamically to avoid circular dependencies
    const CONFIG = window.CONFIG || { defaultModelUrl: '' };
    
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
    
    const shareUrl = createShareUrl(params);
    
    debugLog(`URL compression active. Final URL: ${shareUrl}`);
    
    // Copy to clipboard with fallback support
    navigator.clipboard.writeText(shareUrl).then(() => {
        showToast('URL with complete settings copied to clipboard!');
    }).catch(() => {
        // Fallback clipboard method
        const tempInput = document.createElement('input');
        tempInput.type = 'text';
        tempInput.value = shareUrl;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        showToast('URL with complete settings copied to clipboard!');
    });
}