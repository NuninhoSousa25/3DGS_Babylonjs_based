// js/helpers.js

import { detectDevice } from './deviceDetection.js';
import { CONFIG } from './config.js';

/**
 * DOM Utility Functions for efficient element access and caching
 */
export const DOM = {
    /**
     * Get a single element by ID
     * @param {string} id - Element ID
     * @returns {HTMLElement|null}
     */
    get(id) {
        return document.getElementById(id);
    },

    /**
     * Get multiple elements by IDs and return as an object
     * @param {string[]} ids - Array of element IDs
     * @returns {Object} Object with keys as IDs and values as elements
     */
    getAll(ids) {
        return ids.reduce((acc, id) => {
            acc[id] = document.getElementById(id);
            return acc;
        }, {});
    },

    /**
     * Check if element exists
     * @param {string} id - Element ID
     * @returns {boolean}
     */
    exists(id) {
        return document.getElementById(id) !== null;
    },

    /**
     * Get element with null check and warning
     * @param {string} id - Element ID
     * @param {string} context - Context for warning message
     * @returns {HTMLElement|null}
     */
    getSafe(id, context = '') {
        const element = document.getElementById(id);
        if (!element && context) {
            console.warn(`Element '${id}' not found in context: ${context}`);
        }
        return element;
    }
};

/**
 * Event Listener Utility Functions for standardized behavior
 */
export const Events = {
    /**
     * Adds a toggle event listener with standardized behavior
     * @param {HTMLElement} element - The toggle element
     * @param {Function} callback - Callback function receiving (checked, event)
     */
    addToggleListener(element, callback) {
        element.addEventListener('change', (e) => {
            callback(e.target.checked, e);
        });
    },

    /**
     * Adds a range input event listener with standardized behavior
     * @param {HTMLElement} element - The range input element
     * @param {Function} callback - Callback function receiving (value, event)
     * @param {HTMLElement} displayElement - Optional element to update with value
     */
    addRangeListener(element, callback, displayElement = null) {
        element.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            if (displayElement) displayElement.textContent = value;
            callback(value, e);
        });
    },

    /**
     * Adds a click event listener with standardized behavior
     * @param {HTMLElement} element - The element to listen to
     * @param {Function} callback - Callback function
     */
    addClickListener(element, callback) {
        element.addEventListener('click', callback);
    }
};

/**
 * Centralized Window Event Management
 */
export const WindowEvents = {
    resizeCallbacks: new Set(),

    /**
     * Initialize window event handlers (call once)
     */
    init() {
        if (this.initialized) return;
        
        window.addEventListener("resize", () => {
            this.resizeCallbacks.forEach(callback => {
                try {
                    callback();
                } catch (error) {
                    console.error(ErrorMessages.SYSTEM.RESIZE_CALLBACK_ERROR, error);
                }
            });
        });
        
        this.initialized = true;
    },

    /**
     * Add a resize callback
     * @param {Function} callback - Function to call on window resize
     */
    addResizeCallback(callback) {
        this.init(); // Ensure listener is initialized
        this.resizeCallbacks.add(callback);
    },

    /**
     * Remove a resize callback
     * @param {Function} callback - Function to remove
     */
    removeResizeCallback(callback) {
        this.resizeCallbacks.delete(callback);
    },

    /**
     * Common engine resize handler
     * @param {BABYLON.Engine} engine - Babylon.js engine to resize
     */
    createEngineResizeHandler(engine) {
        return () => engine.resize();
    }
};

/**
 * Standardized Error Messages for Consistent UX
 */
export const ErrorMessages = {
    // Model Loading Errors
    MODEL: {
        NO_MODEL_TO_EXPORT: 'No 3D model is currently loaded to export',
        UNSUPPORTED_FORMAT: (format) => `File format ".${format}" is not supported`,
        SPLAT_PLUGIN_MISSING: 'Required 3D viewer plugin is not available. Please reload the page',
        LOAD_FAILED: (reason) => `Failed to load 3D model${reason ? `: ${reason}` : ''}`,
        FETCH_FAILED: 'Unable to download the model file. Please check the URL and try again'
    },

    // System Errors
    SYSTEM: {
        RESIZE_CALLBACK_ERROR: 'Error occurred during window resize',
        TAA_SETUP_FAILED: 'Anti-aliasing setup encountered an issue',
        FULLSCREEN_FAILED: 'Fullscreen mode is not available. Check your browser settings',
        EXPORT_FAILED: (reason) => `Export failed${reason ? `: ${reason}` : ''}`
    },

    // User Input Errors
    INPUT: {
        INVALID_URL: 'Please enter a valid model URL',
        EMPTY_URL: 'Please enter a URL to load',
        NO_FILE_SELECTED: 'Please select a file to load'
    },

    // Generic Messages
    GENERIC: {
        OPERATION_FAILED: (operation) => `${operation} failed. Please try again`,
        UNKNOWN_ERROR: 'An unexpected error occurred. Please try again'
    }
};

/**
 * Sets all child meshes of a given mesh to be pickable.
 * @param {BABYLON.Mesh} mesh 
 */
export function setMeshesPickable(mesh) {
    if (mesh instanceof BABYLON.Mesh) {
        mesh.isPickable = true;
        mesh.getChildMeshes().forEach(child => {
            child.isPickable = true;
        });
    }
}

/**
 * Counts the total number of vertices in the scene.
 * @param {BABYLON.Scene} scene 
 * @returns {number}
 */
export function getTotalVertices(scene) {
    return scene.meshes.reduce((total, mesh) => {
        return total + (mesh.getTotalVertices() || 0);
    }, 0);
}

// Global UI update observer management
let uiUpdateObserver = null;
let uiUpdateElements = null;
let uiUpdateScene = null;
let uiUpdateEngine = null;
let uiVisibilityObserver = null;
let isPanelVisible = false;
let lastUIValues = {}; // Cache last values to avoid unnecessary DOM updates

/**
 * Optimized UI updates - only runs observer when panel is visible
 * @param {BABYLON.Scene} scene 
 * @param {BABYLON.Engine} engine 
 */
export function setupUIUpdates(scene, engine) {
    // Cache elements and scene/engine references using DOM utility
    uiUpdateElements = {
        ...DOM.getAll([
            "controlPanelFps",
            "controlPanelResolution", 
            "controlPanelVertices",
            "controlPanelContent",
            "deviceTouch",
            "deviceMobile",
            "deviceTouchDevice",
            "deviceType",
            "deviceMaxTouch",
            "deviceScreenSize"
        ]),
        // Cache device detection result - only run once!
        cachedDevice: detectDevice()
    };
    
    uiUpdateScene = scene;
    uiUpdateEngine = engine;

    if (!uiUpdateElements.controlPanelFps || !uiUpdateElements.controlPanelResolution || 
        !uiUpdateElements.controlPanelVertices || !uiUpdateElements.controlPanelContent) {
        console.warn("One or more UI elements are missing. UI updates will not work correctly.");
        return;
    }

    // Set up Intersection Observer for efficient visibility detection
    if ('IntersectionObserver' in window && uiUpdateElements.controlPanelContent) {
        uiVisibilityObserver = new IntersectionObserver((entries) => {
            isPanelVisible = entries[0].isIntersecting;
        }, {
            threshold: 0.1 // Trigger when 10% of panel is visible
        });
        uiVisibilityObserver.observe(uiUpdateElements.controlPanelContent);
    }

}

/**
 * Starts UI update observer - only called when panel becomes visible
 */
export function startUIUpdates() {
    if (uiUpdateObserver || !uiUpdateScene || !uiUpdateEngine || !uiUpdateElements) {
        return; // Already running or not properly initialized
    }
    
    let lastUpdateTime = 0;
    const updateFrequency = CONFIG.ui.updateFrequency;
    
    uiUpdateObserver = uiUpdateScene.onBeforeRenderObservable.add(() => {
        // Efficient visibility check - skip if panel is not visible
        if (!isPanelVisible) {
            return; // Panel not visible, skip expensive updates
        }
        
        const now = performance.now();
        if (now - lastUpdateTime > updateFrequency) {
            lastUpdateTime = now;
            
            // Perform UI updates with error handling
            try {
                const fps = uiUpdateEngine.getFps();
                const width = uiUpdateEngine.getRenderWidth();
                const height = uiUpdateEngine.getRenderHeight();
                const totalVertices = getTotalVertices(uiUpdateScene);

                // Batch DOM updates to minimize reflows - only update if values changed
                const elements = uiUpdateElements;
                const newFps = fps.toFixed(2);
                const newResolution = `${width} x ${height}`;
                const newVertices = totalVertices.toString();
                
                if (elements.controlPanelFps && lastUIValues.fps !== newFps) {
                    elements.controlPanelFps.textContent = newFps;
                    lastUIValues.fps = newFps;
                }
                if (elements.controlPanelResolution && lastUIValues.resolution !== newResolution) {
                    elements.controlPanelResolution.textContent = newResolution;
                    lastUIValues.resolution = newResolution;
                }
                if (elements.controlPanelVertices && lastUIValues.vertices !== newVertices) {
                    elements.controlPanelVertices.textContent = newVertices;
                    lastUIValues.vertices = newVertices;
                }
                
                // Update device detection info (using cached result)
                const { cachedDevice } = elements;
                if (cachedDevice) {
                    const updates = [
                        [elements.deviceTouch, cachedDevice.hasTouch ? 'YES' : 'NO'],
                        [elements.deviceMobile, cachedDevice.isMobile ? 'YES' : 'NO'],
                        [elements.deviceTouchDevice, cachedDevice.isTouchDevice ? 'YES' : 'NO'],
                        [elements.deviceType, cachedDevice.type],
                        [elements.deviceMaxTouch, navigator.maxTouchPoints || 0],
                        [elements.deviceScreenSize, `${cachedDevice.screenWidth}×${cachedDevice.screenHeight}`]
                    ];
                    
                    // Batch update device info elements
                    updates.forEach(([element, value]) => {
                        if (element) element.textContent = value;
                    });
                }
            } catch (error) {
                console.error('UI update failed:', error);
                // Don't stop the observer, just skip this update
            }
        }
    });
    
}

/**
 * Stops UI update observer - called when panel becomes hidden
 */
export function stopUIUpdates() {
    if (uiUpdateObserver && uiUpdateScene) {
        uiUpdateScene.onBeforeRenderObservable.remove(uiUpdateObserver);
        uiUpdateObserver = null;
    }
    
    // Clean up visibility observer
    if (uiVisibilityObserver) {
        uiVisibilityObserver.disconnect();
        uiVisibilityObserver = null;
        isPanelVisible = false;
    }
    
    // Reset cached values
    lastUIValues = {};
}
