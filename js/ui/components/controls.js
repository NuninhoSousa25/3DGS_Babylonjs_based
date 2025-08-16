/* ========================================================================
   REUSABLE UI CONTROLS
   ======================================================================== */

/**
 * Creates a DOM element with optional class, innerHTML, and attributes
 */
export function createElement(tag, options = {}) {
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
export function createToggleSwitch(id, label, checked = false) {
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
export function createRangeControl(id, label, min, max, value, step = 1, unit = '') {
    return `
        <div class="control-group">
            <label for="${id}">${label}</label>
            <div class="range-container">
                <input type="range" id="${id}" min="${min}" max="${max}" value="${value}" step="${step}" class="slider-range">
                <span id="${id}Display" class="range-value">${value}${unit}</span>
            </div>
        </div>
    `;
}

/**
 * Gets all camera limits control elements
 */
export function getCameraLimitsElements() {
    return {
        // Toggle controls
        masterToggle: document.getElementById('cameraLimitsToggle'),
        limitZoomToggle: document.getElementById('limitZoomToggle'),
        limitVerticalToggle: document.getElementById('limitVerticalToggle'),
        limitHorizontalToggle: document.getElementById('limitHorizontalToggle'),
        limitPanToggle: document.getElementById('limitPanToggle'),
        
        // Range controls
        zoomMinRange: document.getElementById('minDistanceRange'),
        zoomMaxRange: document.getElementById('maxDistanceRange'),
        verticalUpRange: document.getElementById('verticalUpRange'),
        verticalDownRange: document.getElementById('verticalDownRange'),
        horizontalAngleRange: document.getElementById('horizontalAngleRange'),
        horizontalOffsetRange: document.getElementById('horizontalOffsetRange'),
        
        // Display elements
        zoomMinDisplay: document.getElementById('minDistanceDisplay'),
        zoomMaxDisplay: document.getElementById('maxDistanceDisplay'),
        verticalUpDisplay: document.getElementById('verticalUpDisplay'),
        verticalDownDisplay: document.getElementById('verticalDownDisplay'),
        horizontalAngleDisplay: document.getElementById('horizontalAngleDisplay'),
        horizontalOffsetDisplay: document.getElementById('horizontalOffsetDisplay'),
        
        // Action buttons
        resetButton: document.getElementById('resetLimitsButton')
    };
}