/* ========================================================================
   3D VIEWER - ENHANCED MESH PICKING & INTERACTION WITH SCALE SUPPORT
   ========================================================================
   
   PURPOSE:
   Handles 3D mesh picking and interaction detection for mouse and touch
   events with specialized support for Gaussian Splatting models. Properly
   handles scaled models by accounting for transformation matrices.
   
   EXPORTS:
   - getPickResult() - Multi-strategy picking with 3DGS support
   - setupPickingHelpers() - Initialize picking helper meshes
   - disposePickingHelpers() - Clean up helper meshes
   - togglePickingHelperVisibility() - Debug visualization
   
   FEATURES:
   - Scale-aware picking for transformed models
   - Specialized Gaussian Splatting picking using bounding volumes
   - Multiple picking strategies with intelligent fallbacks
   - Proxy mesh generation for unpickable models
   - Touch and mouse interaction support
   - Debug visualization options
   
   ======================================================================== */

/**
 * Helper mesh cache for Gaussian Splatting models
 */
const pickingHelpers = new Map();

/**
 * Setup picking helpers for the scene
 * Call this after loading a new model or when model scale changes
 */
export function setupPickingHelpers(scene) {
    // Clear existing helpers
    pickingHelpers.forEach(helper => {
        if (helper && helper.dispose) {
            if (helper.material) {
                helper.material.dispose();
            }
            helper.dispose();
        }
    });
    pickingHelpers.clear();
    
    // Check if we have a Gaussian Splatting model
    if (scene.currentModel && scene.currentModelType === 'splat') {
        createPickingHelperForSplat(scene.currentModel, scene);
    }
}

/**
 * Create an invisible bounding box helper for Gaussian Splatting picking
 * This helper properly accounts for model scaling
 */
function createPickingHelperForSplat(splatMesh, scene) {
    try {
        // Get the bounding info of the splat mesh
        let boundingInfo = null;
        
        // Force refresh of bounding info to account for current scale
        splatMesh.refreshBoundingInfo();
        
        if (splatMesh.getBoundingInfo) {
            boundingInfo = splatMesh.getBoundingInfo();
        } else if (splatMesh.getHierarchyBoundingVectors) {
            const vectors = splatMesh.getHierarchyBoundingVectors();
            boundingInfo = new BABYLON.BoundingInfo(vectors.min, vectors.max);
        }
        
        if (!boundingInfo) {
            console.warn('Could not get bounding info for splat mesh');
            return null;
        }
        
        // Get the world matrix to account for scaling
        const worldMatrix = splatMesh.getWorldMatrix();
        
        // Transform bounding box to world space
        const min = BABYLON.Vector3.TransformCoordinates(boundingInfo.minimum, worldMatrix);
        const max = BABYLON.Vector3.TransformCoordinates(boundingInfo.maximum, worldMatrix);
        
        // Calculate size and center in world space
        const size = max.subtract(min);
        const center = min.add(max).scale(0.5);
        
        // Create an invisible box mesh that matches the scaled splat bounds
        const helperMesh = BABYLON.MeshBuilder.CreateBox(
            `${splatMesh.name}_pickingHelper`,
            {
                width: Math.abs(size.x),
                height: Math.abs(size.y),
                depth: Math.abs(size.z)
            },
            scene
        );
        
        // Position the helper mesh at the world center
        helperMesh.position = center;
        
        // Don't inherit the parent's scaling (we've already accounted for it)
        helperMesh.parent = null;
        
        // Make it invisible but pickable
        helperMesh.isVisible = false;
        helperMesh.isPickable = true;
        
        // Store reference to the original splat mesh
        helperMesh.metadata = {
            originalMesh: splatMesh,
            isSplatHelper: true,
            lastScale: splatMesh.scaling.clone()
        };
        
        // Store in cache
        pickingHelpers.set(splatMesh.id || splatMesh.name, helperMesh);
        
        console.log('Created scale-aware picking helper for Gaussian Splatting model');
        console.log(`Model scale: ${splatMesh.scaling.x.toFixed(2)}, Helper size: ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}`);
        
        return helperMesh;
        
    } catch (error) {
        console.error('Error creating picking helper:', error);
        return null;
    }
}

/**
 * Update picking helpers when model scale changes
 */
export function updatePickingHelpersScale(scene) {
    if (scene.currentModel && scene.currentModelType === 'splat') {
        const modelId = scene.currentModel.id || scene.currentModel.name;
        const existingHelper = pickingHelpers.get(modelId);
        
        // Check if scale has changed
        if (existingHelper && existingHelper.metadata) {
            const lastScale = existingHelper.metadata.lastScale;
            const currentScale = scene.currentModel.scaling;
            
            if (!lastScale.equals(currentScale)) {
                console.log('Model scale changed, updating picking helper');
                setupPickingHelpers(scene);
            }
        }
    }
}

/**
 * Enhanced picking function with Gaussian Splatting and scale support
 * 
 * HOW IT WORKS:
 * 1. First tries standard mesh picking with helper meshes
 * 2. Falls back to broader selection criteria
 * 3. Uses specialized ray-sphere intersection for splats
 * 4. Tries standard ray picking as fallback
 * 5. Finally uses proximity-based selection if all else fails
 */
export function getPickResult(scene, camera, pointerX, pointerY) {
    let pickResult = null;
    
    // Update helpers if scale might have changed
    if (scene.currentModel && scene.currentModelType === 'splat') {
        updatePickingHelpersScale(scene);
    }
    
    // Strategy 1: Try standard picking first (works for regular meshes and helper meshes)
    pickResult = scene.pick(
        pointerX,
        pointerY,
        (mesh) => {
            // Include picking helpers in the selection
            if (mesh.metadata && mesh.metadata.isSplatHelper) {
                return true;
            }
            return mesh.isPickable && mesh.isVisible;
        },
        false,
        camera
    );
    
    // Check if we hit a helper mesh and return the actual splat mesh
    if (pickResult && pickResult.hit && pickResult.pickedMesh) {
        if (pickResult.pickedMesh.metadata && pickResult.pickedMesh.metadata.isSplatHelper) {
            // Replace the picked mesh with the actual splat mesh
            const originalMesh = pickResult.pickedMesh.metadata.originalMesh;
            if (originalMesh) {
                // Create a modified pick result pointing to the actual splat
                pickResult = {
                    ...pickResult,
                    pickedMesh: originalMesh,
                    pickedPoint: pickResult.pickedPoint // Keep the intersection point
                };
                console.log('Picked Gaussian Splatting model via helper mesh');
            }
        }
        return pickResult;
    }
    
    // Strategy 2: If no hit, try broader selection
    if (!pickResult || !pickResult.hit) {
        pickResult = scene.pick(
            pointerX,
            pointerY,
            (mesh) => mesh.isVisible,
            true,
            camera
        );
    }
    
    // Strategy 3: For Gaussian Splatting, try ray-based approach with scale-aware bounds
    if ((!pickResult || !pickResult.hit) && scene.currentModelType === 'splat') {
        pickResult = pickGaussianSplatWithRay(scene, camera, pointerX, pointerY);
    }
    
    // Strategy 4: Fallback to standard ray picking
    if (!pickResult || !pickResult.hit) {
        const ray = scene.createPickingRay(pointerX, pointerY, BABYLON.Matrix.Identity(), camera);
        pickResult = scene.pickWithRay(ray, (mesh) => {
            return mesh.isVisible && mesh !== scene.skybox;
        });
    }
    
    // Strategy 5: If still no hit and we have a splat model, use proximity-based selection
    if ((!pickResult || !pickResult.hit) && scene.currentModel && scene.currentModelType === 'splat') {
        pickResult = createProximityPickResult(scene, camera, pointerX, pointerY);
    }
    
    return pickResult;
}

/**
 * Special ray-based picking for Gaussian Splatting with tolerance and scale support
 */
function pickGaussianSplatWithRay(scene, camera, pointerX, pointerY) {
    if (!scene.currentModel || scene.currentModelType !== 'splat') {
        return null;
    }
    
    const ray = scene.createPickingRay(pointerX, pointerY, BABYLON.Matrix.Identity(), camera);
    
    // Get the splat mesh and ensure bounding info is up to date
    const splatMesh = scene.currentModel;
    
    // Refresh bounding info to account for current transformations
    splatMesh.refreshBoundingInfo();
    
    let boundingInfo = null;
    if (splatMesh.getBoundingInfo) {
        boundingInfo = splatMesh.getBoundingInfo();
    } else if (splatMesh.getHierarchyBoundingVectors) {
        const vectors = splatMesh.getHierarchyBoundingVectors();
        boundingInfo = new BABYLON.BoundingInfo(vectors.min, vectors.max);
    }
    
    if (!boundingInfo) {
        return null;
    }
    
    // Get the world-space bounding sphere that accounts for scaling
    const worldMatrix = splatMesh.getWorldMatrix();
    const boundingSphere = boundingInfo.boundingSphere;
    
    // Transform the bounding sphere center to world space
    const worldCenter = BABYLON.Vector3.TransformCoordinates(boundingSphere.center, worldMatrix);
    
    // Scale the radius by the maximum scale factor
    const scale = splatMesh.scaling;
    const maxScale = Math.max(Math.abs(scale.x), Math.abs(scale.y), Math.abs(scale.z));
    const worldRadius = boundingSphere.radius * maxScale;
    
    // Create a world-space sphere for intersection
    const worldSphere = {
        center: worldCenter,
        radius: worldRadius
    };
    
    // Check if ray intersects with the scaled bounding sphere
    const intersection = ray.intersectsSphere(worldSphere);
    
    if (intersection) {
        // Calculate approximate intersection point
        const distance = BABYLON.Vector3.Distance(camera.position, worldSphere.center);
        const intersectionPoint = ray.origin.add(ray.direction.scale(distance));
        
        console.log(`Ray-sphere intersection successful. Scale: ${maxScale.toFixed(2)}, World radius: ${worldRadius.toFixed(2)}`);
        
        return {
            hit: true,
            pickedMesh: splatMesh,
            pickedPoint: intersectionPoint,
            distance: distance,
            ray: ray
        };
    }
    
    return null;
}

/**
 * Create a proximity-based pick result for fallback
 * This helps when exact picking fails but user clearly intended to select the model
 */
function createProximityPickResult(scene, camera, pointerX, pointerY) {
    if (!scene.currentModel) {
        return null;
    }
    
    // Create a ray from the camera
    const ray = scene.createPickingRay(pointerX, pointerY, BABYLON.Matrix.Identity(), camera);
    
    // Refresh bounding info for accurate center
    scene.currentModel.refreshBoundingInfo();
    
    // Get model center in world space
    let modelCenter = BABYLON.Vector3.Zero();
    if (scene.currentModel.getBoundingInfo) {
        const boundingInfo = scene.currentModel.getBoundingInfo();
        const worldMatrix = scene.currentModel.getWorldMatrix();
        modelCenter = BABYLON.Vector3.TransformCoordinates(
            boundingInfo.boundingSphere.center,
            worldMatrix
        );
    } else if (scene.currentModel.position) {
        modelCenter = scene.currentModel.position;
    }
    
    // Find the closest point on the ray to the model center
    const rayToModel = modelCenter.subtract(ray.origin);
    const projectionLength = BABYLON.Vector3.Dot(rayToModel, ray.direction);
    const closestPointOnRay = ray.origin.add(ray.direction.scale(Math.max(0, projectionLength)));
    
    // Check if we're reasonably close
    const distanceToModel = BABYLON.Vector3.Distance(closestPointOnRay, modelCenter);
    const screenDistance = getScreenDistance(scene, camera, modelCenter, closestPointOnRay);
    
    // Adjust threshold based on model scale
    const scale = scene.currentModel.scaling;
    const maxScale = Math.max(Math.abs(scale.x), Math.abs(scale.y), Math.abs(scale.z));
    const threshold = 50 * Math.max(1, maxScale * 0.5); // Scale-aware threshold
    
    // If within reasonable screen distance, consider it a hit
    if (screenDistance < threshold) {
        console.log(`Proximity pick successful. Screen distance: ${screenDistance.toFixed(1)}px, Threshold: ${threshold.toFixed(1)}px`);
        
        return {
            hit: true,
            pickedMesh: scene.currentModel,
            pickedPoint: closestPointOnRay,
            distance: projectionLength,
            ray: ray,
            proximity: true // Flag this as a proximity pick
        };
    }
    
    return null;
}

/**
 * Calculate screen-space distance between two 3D points
 */
function getScreenDistance(scene, camera, point1, point2) {
    const engine = scene.getEngine();
    const viewport = camera.viewport;
    const width = engine.getRenderWidth();
    const height = engine.getRenderHeight();
    
    // Project both points to screen space
    const screen1 = BABYLON.Vector3.Project(
        point1,
        BABYLON.Matrix.Identity(),
        scene.getTransformMatrix(),
        viewport
    );
    
    const screen2 = BABYLON.Vector3.Project(
        point2,
        BABYLON.Matrix.Identity(),
        scene.getTransformMatrix(),
        viewport
    );
    
    // Calculate pixel distance
    const dx = (screen1.x - screen2.x) * width;
    const dy = (screen1.y - screen2.y) * height;
    
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Debug visualization for picking helpers (optional)
 */
export function togglePickingHelperVisibility(visible = false) {
    pickingHelpers.forEach(helper => {
        if (helper && !helper.isDisposed()) {
            if (visible) {
                // Make semi-transparent for debugging
                if (!helper.material) {
                    const mat = new BABYLON.StandardMaterial("helperMat", helper.getScene());
                    mat.diffuseColor = new BABYLON.Color3(1, 0, 0);
                    mat.alpha = 0.3;
                    helper.material = mat;
                }
                helper.isVisible = true;
                helper.material.wireframe = true;
            } else {
                helper.isVisible = false;
            }
        }
    });
    
    console.log(`Picking helper visibility: ${visible ? 'ON' : 'OFF'}`);
}

/**
 * Clean up picking helpers
 */
export function disposePickingHelpers() {
    pickingHelpers.forEach(helper => {
        if (helper && helper.dispose) {
            if (helper.material) {
                helper.material.dispose();
            }
            helper.dispose();
        }
    });
    pickingHelpers.clear();
    console.log('Disposed all picking helpers');
}