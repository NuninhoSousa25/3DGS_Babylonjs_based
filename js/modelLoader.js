// js/modelLoader.js - FIXED VERSION
import { setMeshesPickable, ErrorMessages } from './helpers.js';
import { CONFIG } from './config.js';
import { animateCamera } from './cameraControl.js';

/**
 * Disposes the current model if any.
 */
export function disposeCurrentModel(currentModel, currentModelType) {
    if (!currentModel) return { currentModel, currentModelType };

    if (currentModelType === 'splat' || currentModelType === 'mesh') {
        currentModel.dispose();
        console.log(`Disposed model of type: ${currentModelType}`);
    }
    return { currentModel: null, currentModelType: null };
}

/**
 * Loads a .splat or .ply model using GaussianSplattingMesh.
 */
export async function loadSplatModel(scene, url) {
    console.log(`Loading .splat/.ply model from URL: ${url}`);

    if (!BABYLON.GaussianSplattingMesh) {
        throw new Error(ErrorMessages.MODEL.SPLAT_PLUGIN_MISSING);
    }

    const splatMesh = new BABYLON.GaussianSplattingMesh("mySplatMesh", null, scene);

    await splatMesh.loadFileAsync(url);

    return splatMesh;
}

/**
 * Centers and fits model to view
 */
export function centerAndFitModel(model, camera, scene) {
    if (!model) return;
    
    try {
        // Get bounding info
        let boundingInfo;
        if (model.getHierarchyBoundingVectors) {
            boundingInfo = model.getHierarchyBoundingVectors();
        } else if (model.getBoundingInfo) {
            const info = model.getBoundingInfo();
            boundingInfo = {
                min: info.minimum,
                max: info.maximum
            };
        } else {
            return;
        }
        
        const size = boundingInfo.max.subtract(boundingInfo.min);
        const center = boundingInfo.max.add(boundingInfo.min).scale(0.5);
        
        // Center the model
        model.position = center.negate();
        
        // Calculate appropriate camera radius
        const maxDimension = Math.max(size.x, size.y, size.z);
        const targetRadius = maxDimension * 2;
        
        // Set camera to fit model
        camera.radius = Math.min(targetRadius, CONFIG.cameraLimits.defaultLimits.zoom.max);
        camera.target = BABYLON.Vector3.Zero();
        
    } catch (error) {
        console.warn("Could not auto-center model:", error);
    }
}

export function normalizeModelScale(model, targetSize = 2.0) {
    if (!model) return;

    try {
        // Use getHierarchyBoundingVectors for an accurate size of the model and its children.
        const boundingInfo = model.getHierarchyBoundingVectors();
        const size = boundingInfo.max.subtract(boundingInfo.min);

        // If the size is zero, do nothing to avoid division by zero errors.
        if (size.x === 0 && size.y === 0 && size.z === 0) {
            return;
        }

        // Find the largest dimension of the model's bounding box.
        const maxDimension = Math.max(size.x, size.y, size.z);

        // Calculate the scaling factor needed to make the largest dimension equal to targetSize.
        const scaleFactor = targetSize / maxDimension;

        // Apply the scaling factor to the model.
        // setAll is used to ensure the scale is uniform.
        model.scaling.setAll(scaleFactor);

        console.log(`Model normalized with a scale factor of: ${scaleFactor.toFixed(4)}`);

    } catch (error) {
        console.warn("Could not normalize model scale:", error);
    }
}


/**
 * Loads a model based on the source type.
 */
export async function loadModel(scene, modelSource, defaultModelUrl = CONFIG.modelLoader.defaultFallbackModel) {
    let { currentModel, currentModelType } = disposeCurrentModel(scene.currentModel, scene.currentModelType);

    // Show loading spinner
    const spinner = document.getElementById("loadingSpinner");
    if (spinner) spinner.style.display = "block";

    // Setup progress callback
    BABYLON.SceneLoader.OnProgress = (event) => {
        const percentage = event.loaded && event.total 
            ? Math.floor((event.loaded / event.total) * 100) 
            : 0;
        
        const spinnerText = document.querySelector('.spinner-text');
        if (spinnerText && percentage > 0) {
            spinnerText.textContent = `Loading Model... ${percentage}%`;
        }
    };

    let url = '';
    let extension = '';
    let isFile = false;

    // Determine source type and extension
    if (modelSource instanceof File) {
        isFile = true;
        extension = modelSource.name.split('.').pop().toLowerCase();
        
        // Create object URL for splat/ply files
        if (extension === 'splat' || extension === 'ply') {
            url = URL.createObjectURL(modelSource);
        }
    } else if (typeof modelSource === 'string') {
        url = modelSource;
        try {
            const urlObj = new URL(url);
            const path = urlObj.pathname;
            extension = path.split('.').pop().toLowerCase();
        } catch (e) {
            console.error("Invalid URL:", url);
            alert("Invalid URL format. Loading default model.");
            url = defaultModelUrl;
            extension = defaultModelUrl.split('.').pop().toLowerCase();
        }
    } else {
        alert("Unsupported model source type. Loading default model.");
        url = defaultModelUrl;
        extension = defaultModelUrl.split('.').pop().toLowerCase();
    }

    console.log(`Attempting to load model with extension .${extension}`);

    try {
        if (CONFIG.modelLoader.supportedFormats.includes(extension)) {
            if (extension === 'spz') {
                const result = await BABYLON.SceneLoader.ImportMeshAsync(null, "", url, scene);
                currentModel = result.meshes[0];
                currentModel.position.y = 0;
                currentModelType = 'mesh';
                
            } else if (extension === 'gltf' || extension === 'glb') {
                console.log(`Loading as .${extension} using SceneLoader.ImportMeshAsync`);
                
                let result;
                if (isFile) {
                    // For File objects, pass the file directly
                    result = await BABYLON.SceneLoader.ImportMeshAsync(
                        "", 
                        "", 
                        modelSource, 
                        scene
                    );
                } else {
                    // For URLs, load normally
                    result = await BABYLON.SceneLoader.ImportMeshAsync(
                        "", 
                        url, 
                        "", 
                        scene
                    );
                }
                
                // Get the root mesh
                currentModel = result.meshes[0];
                currentModelType = 'mesh';
                
                // Make all meshes pickable
                result.meshes.forEach(mesh => {
                    mesh.isPickable = true;
                });
                
                
            } else if (extension === 'obj') {
                console.log(`Loading as .${extension} using SceneLoader.ImportMeshAsync`);
                
                let result;
                if (isFile) {
                    // For File objects, pass the file directly
                    // Note: For local OBJ files with MTL, both files should be in the same directory
                    result = await BABYLON.SceneLoader.ImportMeshAsync(
                        "", 
                        "", 
                        modelSource, 
                        scene
                    );
                } else {
                    // For URLs, load normally - OBJ loader will automatically look for MTL file
                    // The MTL file should be in the same directory and have the same name as OBJ
                    const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
                    const filename = url.substring(url.lastIndexOf('/') + 1);
                    result = await BABYLON.SceneLoader.ImportMeshAsync(
                        "", 
                        baseUrl, 
                        filename, 
                        scene
                    );
                }
                
                // Get the root mesh (OBJ can have multiple meshes)
                currentModel = result.meshes.length > 0 ? result.meshes[0] : null;
                currentModelType = 'mesh';
                
                // Make all meshes pickable
                result.meshes.forEach(mesh => {
                    mesh.isPickable = true;
                });
                
                // Log materials info for debugging
                if (result.materials && result.materials.length > 0) {
                    console.log(`Successfully loaded OBJ model with ${result.materials.length} materials:`, currentModel);
                } else {
                }
                
            } else if (extension === 'splat' || extension === 'ply') {
                console.log(`Loading as .${extension} using GaussianSplattingMesh`);
                currentModel = await loadSplatModel(scene, url);
                currentModelType = 'splat';
                console.log("Successfully loaded .splat/.ply model:", currentModel);
            }

           else if (extension === 'stl') {
                console.log(`Loading as .${extension} using SceneLoader.ImportMeshAsync`);
                let result;
                if (isFile) {
                    result = await BABYLON.SceneLoader.ImportMeshAsync(
                        "", 
                        "", 
                        modelSource, 
                        scene
                    );
                } else {
                    result = await BABYLON.SceneLoader.ImportMeshAsync(
                        "", 
                        url, 
                        "", 
                        scene
                    );
                }
                
                currentModel = result.meshes[0];
                currentModelType = 'mesh';
                
                // Apply material to all meshes
                result.meshes.forEach((mesh, index) => {
                    mesh.isPickable = true;
                    
                    // In modelLoader.js, inside the 'stl' loading block:
                    const pbrMaterial = new BABYLON.PBRMaterial(`stlPBRMaterial_${index}`, scene);
                    pbrMaterial.albedoColor = new BABYLON.Color3(0.8, 0.8, 0.8); // Base color
                    pbrMaterial.metallic = 0.2;  // Not very metallic
                    pbrMaterial.roughness = 0.6; // A bit rough
                    pbrMaterial.backFaceCulling = false;
                    mesh.material = pbrMaterial;        
                });
                
                console.log("Successfully loaded STL model with applied material");
            }
            else if (extension === 'fbx') {
                console.log(`Loading as .${extension} using SceneLoader.ImportMeshAsync`);
                let result;
                if (isFile) {
                    result = await BABYLON.SceneLoader.ImportMeshAsync(
                        "", 
                        "", 
                        modelSource, 
                        scene
                    );
                } else {
                    // For URLs, load normally
                    result = await BABYLON.SceneLoader.ImportMeshAsync(
                        "", 
                        url, 
                        "", 
                        scene
                    );
                }
                
                currentModel = result.meshes[0];
                currentModelType = 'mesh';
                result.meshes.forEach(mesh => {
                    mesh.isPickable = true;
                });
                
                // Log animations if present
                if (result.animationGroups && result.animationGroups.length > 0) {
                    console.log(`FBX model loaded with ${result.animationGroups.length} animation groups`);
                }
                console.log("Successfully loaded FBX model:", currentModel);
            }
            

        } else {
            throw new Error(ErrorMessages.MODEL.UNSUPPORTED_FORMAT(extension));
        }

        // Ensure all meshes are pickable
        setMeshesPickable(currentModel);

        // **NEW:** Normalize the model scale to a consistent size
        normalizeModelScale(currentModel, CONFIG.modelLoader.defaultNormalizedSize);

        // Center and fit the model to view
        const camera = scene.activeCamera;
        if (camera) {
            centerAndFitModel(currentModel, camera, scene);
        }

        // Reset the UI scale slider to its default value for the new model
        const modelScaleRange = document.getElementById('modelScaleRange');
        const modelScaleDisplay = document.getElementById('modelScaleDisplay');
        if (modelScaleRange && modelScaleDisplay) {
            modelScaleRange.value = 1;
            modelScaleDisplay.textContent = '1.0';
        }

        
        
        
    } catch (err) {
        console.error("Failed to load model:", err);
        alert(`Failed to load model: ${err.message}\nCreating fallback box.`);

        currentModel = BABYLON.MeshBuilder.CreateBox("fallbackBox", { size: 2 }, scene);
        currentModelType = 'mesh';
        
        applyDefaultScale(currentModel);
    } finally {
        // Clean up object URL if created
        if (isFile && url && (extension === 'splat' || extension === 'ply')) {
            // Delay cleanup to ensure model is fully loaded
            setTimeout(() => URL.revokeObjectURL(url), CONFIG.modelLoader.urlCleanupDelay);
        }
        
        // Clear progress callback
        BABYLON.SceneLoader.OnProgress = null;
    }

    // Hide loading spinner
    if (spinner) spinner.style.display = "none";

    // Update scene properties
    scene.currentModel = currentModel;
    scene.currentModelType = currentModelType;
    scene.currentModelUrl = url; // <-- ADD THIS

    return { currentModel, currentModelType };
}

/**
 * Applies the default scale from config to the model.
 */
/*function applyDefaultScale(model) {
    if (!model) return;
    
    const defaultScale = CONFIG.modelLoader.defaultModelScale;
    try {
        if (model.scaling) {
            model.scaling.set(defaultScale, defaultScale, defaultScale);
            console.log(`Model scaled to fixed default scale: ${defaultScale}`);
        }
    } catch (error) {
        console.error("Error applying default scale to model:", error);
    }
}*/
