// js/helpers.js

import { detectDevice } from './deviceDetection.js';

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

/**
 * Sets up UI updates for FPS, resolution, and vertices count.
 * @param {BABYLON.Scene} scene 
 * @param {BABYLON.Engine} engine 
 */
export function setupUIUpdates(scene, engine) {
    const fpsCounter        = document.getElementById("controlPanelFps");
    const resolutionCounter = document.getElementById("controlPanelResolution");
    const verticesCounter   = document.getElementById("controlPanelVertices");
    const controlPanelContent = document.getElementById("controlPanelContent");
    
    // Device detection elements
    const deviceTouch       = document.getElementById("deviceTouch");
    const deviceMobile      = document.getElementById("deviceMobile");
    const deviceTouchDevice = document.getElementById("deviceTouchDevice");
    const deviceType        = document.getElementById("deviceType");
    const deviceMaxTouch    = document.getElementById("deviceMaxTouch");
    const deviceScreenSize  = document.getElementById("deviceScreenSize");
    
    // Cache device detection result - only run once!
    const cachedDevice = detectDevice();

    if (!fpsCounter || !resolutionCounter || !verticesCounter || !controlPanelContent) {
        console.warn("One or more UI elements are missing. UI updates will not work correctly.");
        return;
    }

    let lastUpdateTime = 0;
    scene.onBeforeRenderObservable.add(() => {
        // Throttle updates to approximately every 450ms
        const now = performance.now();
        const isControlPanelVisible = controlPanelContent.style.display === "block";
        if (now - lastUpdateTime > 450 && isControlPanelVisible) {
            lastUpdateTime = now;
            const fps = engine.getFps();
            const width = engine.getRenderWidth();
            const height = engine.getRenderHeight();
            const totalVertices = getTotalVertices(scene);

            fpsCounter.textContent = fps.toFixed(2);
            resolutionCounter.textContent = `${width} x ${height}`;
            verticesCounter.textContent = totalVertices;
            
            // Update device detection info (using cached result)
            if (deviceTouch && deviceMobile && deviceTouchDevice && deviceType && deviceMaxTouch && deviceScreenSize) {
                deviceTouch.textContent = cachedDevice.hasTouch ? 'YES' : 'NO';
                deviceMobile.textContent = cachedDevice.isMobile ? 'YES' : 'NO';
                deviceTouchDevice.textContent = cachedDevice.isTouchDevice ? 'YES' : 'NO';
                deviceType.textContent = cachedDevice.type;
                deviceMaxTouch.textContent = navigator.maxTouchPoints || 0;
                deviceScreenSize.textContent = `${cachedDevice.screenWidth}×${cachedDevice.screenHeight}`;
            }
        }
    });
}
