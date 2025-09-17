/* ========================================================================
   3D VIEWER - UTILITY HELPERS & DOM MANAGEMENT
   ========================================================================
   
   PURPOSE:
   Provides utility functions for DOM manipulation, event handling, error 
   management, and UI update coordination. Contains reusable helpers used
   throughout the application.
   
   EXPORTS:
   - DOM - Utility functions for element access and caching
   - Events - Standardized event listener management 
   - WindowEvents - Centralized window event management with debouncing
   - ErrorMessages - Consistent error message constants
   - LoadingSpinner - Centralized loading spinner management
   - setMeshesPickable() - Make Babylon.js meshes pickable
   - getTotalVertices() - Count scene vertices
   - setupUIUpdates() - Initialize UI update system
   - startUIUpdates() - Start UI update observer
   - stopUIUpdates() - Stop UI update observer  
   - restartUIUpdates() - Restart UI updates when content changes
   
   DEPENDENCIES:
   - Device detection for responsive behavior
   - Configuration constants
   
   ======================================================================== */

import { detectDevice } from './deviceDetection.js';
import { CONFIG } from './config.js';

/**
 * Debug logging utility - only logs when debug is enabled
 * Enable with: localStorage.setItem('debug', 'true') in browser console
 * Disable with: localStorage.removeItem('debug') in browser console
 */
export const DEBUG = localStorage.getItem('debug') === 'true';
export const debugLog = (...args) => DEBUG && console.log('[DEBUG]', ...args);
export const debugWarn = (...args) => DEBUG && console.warn('[DEBUG]', ...args);
export const debugError = (...args) => DEBUG && console.error('[DEBUG]', ...args);

/**
 * DOM Utility Functions for efficient element access and caching
 */
export const DOM = {
    // Cache for expensive queries
    _cache: new Map(),

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
    },

    /**
     * Cache and return result of expensive DOM queries
     * @param {string} key - Cache key
     * @param {Function} queryFn - Function that performs the DOM query
     * @returns {HTMLElement[]|NodeList}
     */
    cached(key, queryFn) {
        if (!this._cache.has(key)) {
            this._cache.set(key, queryFn());
        }
        return this._cache.get(key);
    },

    /**
     * Clear specific cache entry or entire cache
     * @param {string} key - Cache key to clear (optional)
     */
    clearCache(key = null) {
        if (key) {
            this._cache.delete(key);
        } else {
            this._cache.clear();
        }
    },

    /**
     * Get all content sections (cached)
     * @returns {NodeList}
     */
    getAllContentSections() {
        return this.cached('content-sections', () => 
            document.querySelectorAll('.content-section')
        );
    },

    /**
     * Get all icon buttons (cached)
     * @returns {NodeList}
     */
    getAllIconButtons() {
        return this.cached('icon-buttons', () => 
            document.querySelectorAll('.icon-button')
        );
    },

    /**
     * Get buttons within a specific container (cached per container)
     * @param {HTMLElement} container - Container element
     * @returns {NodeList}
     */
    getButtonsInContainer(container) {
        const containerId = container.id || container.className || 'unknown';
        const cacheKey = `buttons-${containerId}`;
        return this.cached(cacheKey, () => 
            container.querySelectorAll('button')
        );
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
    resizeDebounceTimer: null,
    resizeDebounceDelay: 16, // ~60fps, good balance between responsiveness and performance

    /**
     * Initialize window event handlers (call once)
     */
    init() {
        if (this.initialized) return;
        
        window.addEventListener("resize", () => {
            // Clear existing timer
            if (this.resizeDebounceTimer) {
                clearTimeout(this.resizeDebounceTimer);
            }
            
            // Debounce resize callbacks to avoid excessive firing
            this.resizeDebounceTimer = setTimeout(() => {
                this.resizeCallbacks.forEach(callback => {
                    try {
                        callback();
                    } catch (error) {
                        console.error(ErrorMessages.SYSTEM.RESIZE_CALLBACK_ERROR, error);
                    }
                });
                this.resizeDebounceTimer = null;
            }, this.resizeDebounceDelay);
        });
        
        this.initialized = true;
    },

    /**
     * Add a resize callback
     * @param {Function} callback - Function to call on window resize
     */
    addResizeCallback(callback) {
        this.init(); // Ensure listener is initialized
        
        // Check if callback already exists (for debugging)
        if (this.resizeCallbacks.has(callback)) {
            debugLog('Duplicate resize callback prevented:', callback.name || 'anonymous');
            return;
        }
        
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
    },

    /**
     * Configure resize debounce delay
     * @param {number} delay - Delay in milliseconds (default: 16ms for ~60fps)
     */
    setDebounceDelay(delay) {
        this.resizeDebounceDelay = Math.max(0, delay);
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
 * Recursively enables picking/interaction for a mesh and all its child meshes
 * @param {BABYLON.Mesh|BABYLON.AbstractMesh} mesh - Root mesh to make pickable
 * @description Enables mouse/touch interaction for mesh hierarchy, allowing click detection,
 *              camera focusing, and model inspection. Essential for proper 3D interaction.
 * @returns {void}
 * @example
 * // Enable picking for loaded model
 * const loadedModel = result.meshes[0];
 * setMeshesPickable(loadedModel);
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
    // Clean up any existing observers first
    stopUIUpdates();
    
    // Store element IDs and device info - we'll query elements fresh each time
    uiUpdateElements = {
        elementIds: [
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
        ],
        // Cache device detection result - only run once!
        cachedDevice: detectDevice(),
        // Track what has been initialized
        deviceInfoInitialized: false,
        verticesUpdatePending: false
    };
    
    uiUpdateScene = scene;
    uiUpdateEngine = engine;

    // Set up Intersection Observer for efficient visibility detection
    // Use a small delay to ensure DOM elements are ready
    setTimeout(() => {
        const controlPanelElement = DOM.get("controlPanelContent");
        if ('IntersectionObserver' in window && controlPanelElement) {
            uiVisibilityObserver = new IntersectionObserver((entries) => {
                isPanelVisible = entries[0].isIntersecting;
                // Start updates when panel becomes visible
                if (isPanelVisible && !uiUpdateObserver) {
                    startUIUpdates();
                }
            }, {
                threshold: 0.1 // Trigger when 10% of panel is visible
            });
            uiVisibilityObserver.observe(controlPanelElement);
        }
        
        // Start updates immediately if panel is visible
        const panelElement = DOM.get("controlPanelContent");
        if (panelElement && panelElement.offsetParent !== null) {
            isPanelVisible = true;
            startUIUpdates();
        }
    }, 100); // Small delay to ensure DOM is ready

}

/**
 * Starts UI update observer - only called when panel becomes visible
 */
export function startUIUpdates() {
    if (uiUpdateObserver || !uiUpdateScene || !uiUpdateEngine || !uiUpdateElements) {
        return; // Already running or not properly initialized
    }
    
    let lastFpsUpdateTime = 0;
    const fpsUpdateFrequency = 1000; // 1Hz for FPS updates
    
    // Initialize device info once when panel opens
    if (!uiUpdateElements.deviceInfoInitialized) {
        updateDeviceInfo();
        uiUpdateElements.deviceInfoInitialized = true;
    }
    
    // Initialize resolution and vertices immediately
    updateResolutionDisplay();
    updateVerticesDisplay();
    
    uiUpdateObserver = uiUpdateScene.onBeforeRenderObservable.add(() => {
        // Efficient visibility check - skip if panel is not visible
        if (!isPanelVisible) {
            return; // Panel not visible, skip expensive updates
        }
        
        const now = performance.now();
        
        // Update FPS only at 1Hz when panel is visible
        if (now - lastFpsUpdateTime > fpsUpdateFrequency) {
            lastFpsUpdateTime = now;
            
            // Perform FPS update with error handling
            try {
                const fps = uiUpdateEngine.getFps();
                const newFps = fps.toFixed(2);
                
                const fpsElement = DOM.get("controlPanelFps");
                if (fpsElement && lastUIValues.fps !== newFps) {
                    fpsElement.textContent = newFps;
                    lastUIValues.fps = newFps;
                }
            } catch (error) {
                console.error('FPS update failed:', error);
            }
        }
        
        // Handle pending vertices update (triggered by model load events)
        if (uiUpdateElements.verticesUpdatePending) {
            updateVerticesDisplay();
            uiUpdateElements.verticesUpdatePending = false;
        }
    });
}

/**
 * Stops UI update observer - called when panel becomes hidden
 */
/**
 * Update device info once when panel opens
 */
function updateDeviceInfo() {
    const { cachedDevice } = uiUpdateElements;
    if (!cachedDevice) return;
    
    try {
        const deviceUpdates = [
            [DOM.get("deviceTouch"), cachedDevice.hasTouch ? 'YES' : 'NO'],
            [DOM.get("deviceMobile"), cachedDevice.isMobile ? 'YES' : 'NO'],
            [DOM.get("deviceTouchDevice"), cachedDevice.isTouchDevice ? 'YES' : 'NO'],
            [DOM.get("deviceType"), cachedDevice.type],
            [DOM.get("deviceMaxTouch"), navigator.maxTouchPoints || 0],
            [DOM.get("deviceScreenSize"), `${cachedDevice.screenWidth}×${cachedDevice.screenHeight}`]
        ];
        
        // Batch update device info elements
        deviceUpdates.forEach(([element, value]) => {
            if (element) element.textContent = value;
        });
    } catch (error) {
        console.error('Device info update failed:', error);
    }
}

/**
 * Update resolution display (called on window resize)
 */
function updateResolutionDisplay() {
    if (!uiUpdateEngine) return;
    
    try {
        const width = uiUpdateEngine.getRenderWidth();
        const height = uiUpdateEngine.getRenderHeight();
        const newResolution = `${width} x ${height}`;
        
        const resolutionElement = DOM.get("controlPanelResolution");
        if (resolutionElement && lastUIValues.resolution !== newResolution) {
            resolutionElement.textContent = newResolution;
            lastUIValues.resolution = newResolution;
        }
    } catch (error) {
        console.error('Resolution update failed:', error);
    }
}

/**
 * Update vertices display (called on model load)
 */
function updateVerticesDisplay() {
    if (!uiUpdateScene) return;
    
    try {
        const totalVertices = getTotalVertices(uiUpdateScene);
        const newVertices = totalVertices.toString();
        
        const verticesElement = DOM.get("controlPanelVertices");
        if (verticesElement && lastUIValues.vertices !== newVertices) {
            verticesElement.textContent = newVertices;
            lastUIValues.vertices = newVertices;
        }
    } catch (error) {
        console.error('Vertices update failed:', error);
    }
}

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
    
    // Reset cached values and initialization flags
    lastUIValues = {};
    if (uiUpdateElements) {
        uiUpdateElements.deviceInfoInitialized = false;
        uiUpdateElements.verticesUpdatePending = false;
    }
}

/**
 * Public function to trigger vertices update (called when model loads)
 */
export function triggerVerticesUpdate() {
    if (uiUpdateElements && isPanelVisible) {
        if (uiUpdateObserver) {
            // If updates are running, mark for next frame
            uiUpdateElements.verticesUpdatePending = true;
        } else {
            // If updates not running, update immediately
            updateVerticesDisplay();
        }
    }
}

/**
 * Public function to trigger resolution update (called on window resize)
 */
export function triggerResolutionUpdate() {
    if (isPanelVisible) {
        updateResolutionDisplay();
    }
}

/**
 * Restart UI updates - call this when UI content changes or becomes visible
 */
export function restartUIUpdates() {
    if (!uiUpdateScene || !uiUpdateEngine) return;
    
    // Stop current updates
    if (uiUpdateObserver) {
        stopUIUpdates();
    }
    
    // Check if elements are now visible and restart
    const panelElement = DOM.get("controlPanelContent");
    if (panelElement && panelElement.offsetParent !== null) {
        isPanelVisible = true;
        startUIUpdates();
    }
}

// In helpers.js, add a new function

/**
 * Updates the file size display in the developer panel with formatted size information
 * @param {number} bytes - The size of the model file in bytes (0 for unavailable/unknown sizes)
 * @description Formats file sizes into human-readable units (KB/MB) and updates the UI.
 *              Handles edge cases like unavailable sizes for URL-loaded models.
 *              Integrates with the performance monitoring system in the dev panel.
 * @returns {void}
 * @example
 * // Update with actual file size
 * updateFileSizeDisplay(1024000); // Shows "1000.00 KB"
 * 
 * // Handle unknown size
 * updateFileSizeDisplay(0); // Shows "N/A"
 */
export function updateFileSizeDisplay(bytes) {
    const fileSizeElement = DOM.get("controlPanelFileSize");
    if (!fileSizeElement) return;

    if (bytes === 0) {
        fileSizeElement.textContent = 'N/A'; // For URL-loaded models for now
        return;
    }

    const kb = bytes / 1024;
    const mb = kb / 1024;

    if (mb >= 1) {
        fileSizeElement.textContent = `${mb.toFixed(2)} MB`;
    } else {
        fileSizeElement.textContent = `${kb.toFixed(2)} KB`;
    }
}

/**
 * Centralized Loading Spinner Management
 */
export const LoadingSpinner = {
    // Cache spinner element reference
    _spinnerElement: null,
    _spinnerTextElement: null,
    
    /**
     * Get spinner element with caching
     * @returns {HTMLElement|null}
     */
    _getSpinnerElement() {
        if (!this._spinnerElement) {
            this._spinnerElement = DOM.get("loadingSpinner");
        }
        return this._spinnerElement;
    },
    
    /**
     * Get spinner text element with caching
     * @returns {HTMLElement|null}
     */
    _getSpinnerTextElement() {
        if (!this._spinnerTextElement) {
            this._spinnerTextElement = document.querySelector('.spinner-text');
        }
        return this._spinnerTextElement;
    },
    
    /**
     * Show the loading spinner
     * @param {string} displayStyle - CSS display style ('block', 'flex', etc.)
     * @param {string} text - Optional text to display
     */
    show(displayStyle = 'block', text = null) {
        const spinner = this._getSpinnerElement();
        if (spinner) {
            spinner.style.display = displayStyle;
            
            // Update text if provided
            if (text) {
                this.updateText(text);
            }
        }
    },
    
    /**
     * Hide the loading spinner
     */
    hide() {
        const spinner = this._getSpinnerElement();
        if (spinner) {
            spinner.style.display = "none";
        }
    },
    
    /**
     * Update spinner text
     * @param {string} text - Text to display
     */
    updateText(text) {
        const spinnerText = this._getSpinnerTextElement();
        if (spinnerText) {
            spinnerText.textContent = text;
        }
    },
    
    /**
     * Update progress text with percentage
     * @param {number} percentage - Progress percentage (0-100)
     * @param {string} baseText - Base text (default: "Loading Model...")
     */
    updateProgress(percentage, baseText = "Loading Model...") {
        if (percentage > 0) {
            this.updateText(`${baseText} ${percentage}%`);
        } else {
            this.updateText(baseText);
        }
    },
    
    /**
     * Reset cached elements (call when DOM changes)
     */
    resetCache() {
        this._spinnerElement = null;
        this._spinnerTextElement = null;
    },
    
    /**
     * Check if spinner is currently visible
     * @returns {boolean}
     */
    isVisible() {
        const spinner = this._getSpinnerElement();
        return spinner && spinner.style.display !== "none";
    }
};
