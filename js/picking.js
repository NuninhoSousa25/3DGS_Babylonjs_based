/* ========================================================================
   3D VIEWER - MESH PICKING & INTERACTION
   ========================================================================
   
   PURPOSE:
   Handles 3D mesh picking and interaction detection for mouse and touch
   events. Provides multiple picking strategies for reliable hit detection
   across different model types and scenarios.
   
   EXPORTS:
   - getPickResult() - Multi-strategy picking with fallback methods
   
   FEATURES:
   - Multiple picking strategies (direct, ray-based, frustum)
   - Reliable hit detection for various model types
   - Touch and mouse interaction support
   - Fallback mechanisms for edge cases
   
   DEPENDENCIES:
   - Babylon.js picking system
   - Scene and camera references
   
   ======================================================================== */

/**
 * Streamlines the picking logic by attempting multiple picking strategies.
 * @param {BABYLON.Scene} scene 
 * @param {BABYLON.Camera} camera 
 * @param {number} pointerX 
 * @param {number} pointerY 
 * @returns {BABYLON.PickingInfo}
 */
export function getPickResult(scene, camera, pointerX, pointerY) {
    // 1) Direct pick with isPickable
    let pickResult = scene.pick(
        pointerX,
        pointerY,
        (mesh) => mesh.isPickable,
        false,
        camera
    );

    // 2) If no hit, try isVisible
    if (!pickResult || !pickResult.hit) {
        pickResult = scene.pick(
            pointerX,
            pointerY,
            (mesh) => mesh.isVisible,
            true,
            camera
        );
    }

    // 3) If still no hit, pick with ray
    if (!pickResult || !pickResult.hit) {
        const ray = scene.createPickingRay(pointerX, pointerY, BABYLON.Matrix.Identity(), camera);
        const raycastResult = scene.pickWithRay(ray);
        if (raycastResult && raycastResult.hit) {
            pickResult = raycastResult;
        }
    }

    return pickResult;
}
