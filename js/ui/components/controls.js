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
 * Setup enhanced range control with slider-input synchronization
 */
export function setupEnhancedRangeControl(id, callback = null) {
    const slider = document.getElementById(id);
    const input = document.getElementById(`${id}Input`);
    
    if (!slider || !input) return;
    
    const precision = parseInt(slider.dataset.precision) || 0;
    const unit = slider.dataset.unit || '';
    
    // Flag to prevent infinite loops
    let updating = false;
    
    // Update input when slider changes
    slider.addEventListener('input', (e) => {
        if (updating) return;
        updating = true;
        
        const value = parseFloat(e.target.value);
        const formattedValue = precision > 0 ? value.toFixed(precision) : value.toString();
        input.value = formattedValue;
        
        if (callback) {
            callback(value);
        }
        
        updating = false;
    });
    
    // Update slider when input changes (less aggressive)
    input.addEventListener('input', (e) => {
        if (updating) return;
        
        const rawValue = e.target.value;
        
        // Allow empty or partial input while typing
        if (rawValue === '' || rawValue === '-' || rawValue === '.') {
            return;
        }
        
        const value = parseFloat(rawValue);
        
        // Only process valid numbers
        if (isNaN(value)) return;
        
        // Validate bounds but don't auto-correct while typing
        const min = parseFloat(slider.min);
        const max = parseFloat(slider.max);
        
        if (value >= min && value <= max) {
            updating = true;
            slider.value = value;
            
            if (callback) {
                callback(value);
            }
            updating = false;
        }
    });
    
    // Handle input blur for final validation and formatting
    input.addEventListener('blur', (e) => {
        if (updating) return;
        updating = true;
        
        let value = parseFloat(e.target.value);
        
        // Handle empty or invalid input
        if (isNaN(value) || e.target.value === '') {
            value = parseFloat(slider.value);
        } else {
            // Clamp to bounds
            const min = parseFloat(slider.min);
            const max = parseFloat(slider.max);
            value = Math.max(min, Math.min(max, value));
        }
        
        // Update both inputs with properly formatted value
        const formattedValue = precision > 0 ? value.toFixed(precision) : value.toString();
        e.target.value = formattedValue;
        slider.value = value;
        
        if (callback) {
            callback(value);
        }
        
        updating = false;
    });
    
    // Handle Enter key to apply changes immediately
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.target.blur(); // Trigger blur event for validation
        }
    });
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
 * Creates a standardized range control HTML with editable input
 */
export function createRangeControl(id, label, min, max, value, step = 1, unit = '') {
    const precision = step < 1 ? (step.toString().split('.')[1] || '').length : 0;
    const formattedValue = precision > 0 ? parseFloat(value).toFixed(precision) : value;
    
    return `
        <div class="control-group">
            <label for="${id}">${label}</label>
            <div class="range-container enhanced">
                <input type="range" 
                       id="${id}" 
                       min="${min}" 
                       max="${max}" 
                       value="${value}" 
                       step="${step}" 
                       class="slider-range enhanced"
                       data-precision="${precision}"
                       data-unit="${unit}">
                <input type="number" 
                       id="${id}Input" 
                       min="${min}" 
                       max="${max}" 
                       value="${formattedValue}" 
                       step="${step}" 
                       class="range-input"
                       data-unit="${unit}">
                <span class="range-unit">${unit}</span>
            </div>
        </div>
    `;
}

/**
 * Creates a standardized color picker control HTML
 */
export function createColorControl(id, label, value = '#191919') {
    return `
        <div class="control-group">
            <label for="${id}">${label}</label>
            <div class="color-container">
                <input type="color" id="${id}" value="${value}" class="color-picker">
                <span id="${id}Display" class="color-value">${value}</span>
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