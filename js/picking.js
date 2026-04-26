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
        
        // CRITICAL: Compute world matrix to ensure scaling is up to date
        splatMesh.computeWorldMatrix(true);
        
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

        // Transform all 8 corners of the local AABB to world space, then derive
        // the world-space AABB. Transforming only min/max gives inverted axes when
        // the world matrix contains an odd-axis rotation (e.g. rotation.x = Math.PI).
        const lo = boundingInfo.minimum;
        const hi = boundingInfo.maximum;
        const corners = [
            new BABYLON.Vector3(lo.x, lo.y, lo.z),
            new BABYLON.Vector3(hi.x, lo.y, lo.z),
            new BABYLON.Vector3(lo.x, hi.y, lo.z),
            new BABYLON.Vector3(hi.x, hi.y, lo.z),
            new BABYLON.Vector3(lo.x, lo.y, hi.z),
            new BABYLON.Vector3(hi.x, lo.y, hi.z),
            new BABYLON.Vector3(lo.x, hi.y, hi.z),
            new BABYLON.Vector3(hi.x, hi.y, hi.z),
        ].map(c => BABYLON.Vector3.TransformCoordinates(c, worldMatrix));

        const min = corners.reduce((acc, c) => BABYLON.Vector3.Minimize(acc, c), corners[0].clone());
        const max = corners.reduce((acc, c) => BABYLON.Vector3.Maximize(acc, c), corners[0].clone());

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
        helperMesh.isVisible = true;
        helperMesh.visibility = 0;
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
        console.log(`Bounds Min: ${min.toString()}`);
        console.log(`Bounds Max: ${max.toString()}`);
        console.log(`Model scale: ${splatMesh.scaling.x.toFixed(6)}, Helper size: ${Math.abs(size.x).toFixed(2)} x ${Math.abs(size.y).toFixed(2)} x ${Math.abs(size.z).toFixed(2)}`);
        
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
 * Picking strategies for debugging
 */
export const PickingStrategies = {
    ALL: 'ALL',
    STRATEGY_1: 'STRATEGY_1', // Standard picking (helpers)
    STRATEGY_2: 'STRATEGY_2', // Broader selection
    STRATEGY_3: 'STRATEGY_3', // Ray-Sphere (Splat)
    STRATEGY_4: 'STRATEGY_4'  // Standard Ray
};

let currentPickingStrategy = PickingStrategies.ALL;

/**
 * Set the active picking strategy
 * @param {string} strategy - The strategy to use (from PickingStrategies)
 */
export function setPickingStrategy(strategy) {
    if (PickingStrategies[strategy]) {
        currentPickingStrategy = PickingStrategies[strategy];
        console.log(`Picking strategy set to: ${strategy}`);
    } else if (strategy === 'ALL') {
        currentPickingStrategy = PickingStrategies.ALL;
        console.log('Picking strategy set to: ALL (Default)');
    } else {
        console.warn(`Invalid picking strategy: ${strategy}`);
    }
}

/**
 * Enhanced picking function with Gaussian Splatting and scale support
 * 
 * HOW IT WORKS:
 * 1. If Splat & ALL: Tries Ray-Sphere intersection first (Strategy 3 Priority)
 * 2. Strategy 1: Standard mesh picking with helper meshes
 * 3. Strategy 2: Broader selection criteria
 * 4. Strategy 3: Explicit selection only (covered by step 1 for ALL)
 * 5. Strategy 4: Standard ray picking as fallback
 */
export function getPickResult(scene, camera, pointerX, pointerY) {
    let pickResult = null;
    
    // Update helpers if scale might have changed
    if (scene.currentModel && scene.currentModelType === 'splat') {
        updatePickingHelpersScale(scene);
    }
    
    const useAll = currentPickingStrategy === PickingStrategies.ALL;
    const isSplat = scene.currentModel && scene.currentModelType === 'splat';
    
    // -------------------------------------------------------------------------
    // PRIORITY FOR SPLATS: Strategy 3 (Ray-Sphere)
    // The user requested that for splats, we start with method 3.
    // -------------------------------------------------------------------------
    if (useAll && isSplat) {
        pickResult = pickGaussianSplatWithRay(scene, camera, pointerX, pointerY);
        if (pickResult && pickResult.hit) {
            console.log('Picked via ray-sphere (Strategy 3 - Priority for Splats)');
            return pickResult;
        }
    }
    
    // Strategy 1: Try standard picking (works for regular meshes and helper meshes)
    if (useAll || currentPickingStrategy === PickingStrategies.STRATEGY_1) {
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
                    console.log('Picked Gaussian Splatting model via helper mesh (Strategy 1)');
                }
            }
            // If we are enforcing Strategy 1, return result even if no hit (unless we want to fail hard, but typical pick returns result with hit=false)
            if (currentPickingStrategy === PickingStrategies.STRATEGY_1) return pickResult;
            // For ALL, if we got a hit, return it.
            if (useAll && pickResult.hit) return pickResult;
        } else if (currentPickingStrategy === PickingStrategies.STRATEGY_1) {
             console.log('Strategy 1 failed (no hit)');
             return pickResult; // Return the miss from Strategy 1
        }
    }
    
    // Strategy 2: If no hit, try broader selection
    if ((useAll && (!pickResult || !pickResult.hit)) || currentPickingStrategy === PickingStrategies.STRATEGY_2) {
        pickResult = scene.pick(
            pointerX,
            pointerY,
            (mesh) => mesh.isVisible,
            true,
            camera
        );
        if (pickResult && pickResult.hit) {
            console.log('Picked via broader selection (Strategy 2)');
            return pickResult;
        } else if (currentPickingStrategy === PickingStrategies.STRATEGY_2) {
            console.log('Strategy 2 failed (no hit)');
            return pickResult;
        }
    }
    
    // Strategy 3: Explicit Call (Ray-Sphere)
    // Note: If useAll=true and isSplat=true, we ran this at the top.
    // If useAll=true and isSplat=false, this returns null anyway.
    if (currentPickingStrategy === PickingStrategies.STRATEGY_3) {
        pickResult = pickGaussianSplatWithRay(scene, camera, pointerX, pointerY);
        if (pickResult && pickResult.hit) console.log('Picked via ray-sphere (Strategy 3)');
        else console.log('Strategy 3 failed (no hit or not splat)');
        return pickResult;
    }
    
    // Strategy 4: Fallback to standard ray picking
    if ((useAll && (!pickResult || !pickResult.hit)) || currentPickingStrategy === PickingStrategies.STRATEGY_4) {
        const ray = scene.createPickingRay(pointerX, pointerY, BABYLON.Matrix.Identity(), camera);
        pickResult = scene.pickWithRay(ray, (mesh) => {
            return mesh.isVisible && mesh !== scene.skybox;
        });
        if (pickResult && pickResult.hit) {
            console.log('Picked via standard ray (Strategy 4)');
            return pickResult;
        } else if (currentPickingStrategy === PickingStrategies.STRATEGY_4) {
            console.log('Strategy 4 failed (no hit)');
            return pickResult;
        }
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
    
    // Ensure world matrix is updated for accurate scale/position
    splatMesh.computeWorldMatrix(true);
    
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