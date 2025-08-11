// js/helpers.js

import { detectDevice } from './deviceDetection.js';
import { CONFIG } from './config.js';

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

/**
 * Optimized UI updates - only runs observer when panel is visible
 * @param {BABYLON.Scene} scene 
 * @param {BABYLON.Engine} engine 
 */
export function setupUIUpdates(scene, engine) {
    // Cache elements and scene/engine references
    uiUpdateElements = {
        fpsCounter: document.getElementById("controlPanelFps"),
        resolutionCounter: document.getElementById("controlPanelResolution"),
        verticesCounter: document.getElementById("controlPanelVertices"),
        controlPanelContent: document.getElementById("controlPanelContent"),
        // Device detection elements
        deviceTouch: document.getElementById("deviceTouch"),
        deviceMobile: document.getElementById("deviceMobile"),
        deviceTouchDevice: document.getElementById("deviceTouchDevice"),
        deviceType: document.getElementById("deviceType"),
        deviceMaxTouch: document.getElementById("deviceMaxTouch"),
        deviceScreenSize: document.getElementById("deviceScreenSize"),
        // Cache device detection result - only run once!
        cachedDevice: detectDevice()
    };
    
    uiUpdateScene = scene;
    uiUpdateEngine = engine;

    if (!uiUpdateElements.fpsCounter || !uiUpdateElements.resolutionCounter || 
        !uiUpdateElements.verticesCounter || !uiUpdateElements.controlPanelContent) {
        console.warn("One or more UI elements are missing. UI updates will not work correctly.");
        return;
    }

    console.log("UI updates setup complete - observer will start when panel becomes visible");
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
        const now = performance.now();
        if (now - lastUpdateTime > updateFrequency) {
            lastUpdateTime = now;
            
            // Perform UI updates
            const fps = uiUpdateEngine.getFps();
            const width = uiUpdateEngine.getRenderWidth();
            const height = uiUpdateEngine.getRenderHeight();
            const totalVertices = getTotalVertices(uiUpdateScene);

            uiUpdateElements.fpsCounter.textContent = fps.toFixed(2);
            uiUpdateElements.resolutionCounter.textContent = `${width} x ${height}`;
            uiUpdateElements.verticesCounter.textContent = totalVertices;
            
            // Update device detection info (using cached result)
            const { cachedDevice } = uiUpdateElements;
            if (uiUpdateElements.deviceTouch && cachedDevice) {
                uiUpdateElements.deviceTouch.textContent = cachedDevice.hasTouch ? 'YES' : 'NO';
                uiUpdateElements.deviceMobile.textContent = cachedDevice.isMobile ? 'YES' : 'NO';
                uiUpdateElements.deviceTouchDevice.textContent = cachedDevice.isTouchDevice ? 'YES' : 'NO';
                uiUpdateElements.deviceType.textContent = cachedDevice.type;
                uiUpdateElements.deviceMaxTouch.textContent = navigator.maxTouchPoints || 0;
                uiUpdateElements.deviceScreenSize.textContent = `${cachedDevice.screenWidth}×${cachedDevice.screenHeight}`;
            }
        }
    });
    
    console.log("UI update observer started");
}

/**
 * Stops UI update observer - called when panel becomes hidden
 */
export function stopUIUpdates() {
    if (uiUpdateObserver && uiUpdateScene) {
        uiUpdateScene.onBeforeRenderObservable.remove(uiUpdateObserver);
        uiUpdateObserver = null;
        console.log("UI update observer stopped");
    }
}
