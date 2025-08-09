// js/modelLoader.js - FIXED VERSION
import { setMeshesPickable } from './helpers.js';
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
        throw new Error("GaussianSplattingMesh is not defined. Ensure the necessary plugin or script is loaded.");
    }

    const splatMesh = new BABYLON.GaussianSplattingMesh("mySplatMesh", null, scene);
    console.log("GaussianSplattingMesh instance created:", splatMesh);

    await splatMesh.loadFileAsync(url);
    console.log("Model file loaded successfully.");

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
            console.log("Model doesn't have bounding info");
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
        
        console.log("Model centered and fitted to view");
    } catch (error) {
        console.warn("Could not auto-center model:", error);
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
                console.log("Loading as .spz using SceneLoader.ImportMeshAsync");
                const result = await BABYLON.SceneLoader.ImportMeshAsync(null, "", url, scene);
                currentModel = result.meshes[0];
                currentModel.position.y = 0;
                currentModelType = 'mesh';
                console.log("Successfully loaded .spz model:", currentModel);
                
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
                
                console.log("Successfully loaded GLTF/GLB model:", currentModel);
                
            } else if (extension === 'splat' || extension === 'ply') {
                console.log(`Loading as .${extension} using GaussianSplattingMesh`);
                currentModel = await loadSplatModel(scene, url);
                currentModelType = 'splat';
                console.log("Successfully loaded .splat/.ply model:", currentModel);
            }
        } else {
            throw new Error(`Unsupported file format: .${extension}`);
        }

        // Ensure all meshes are pickable
        setMeshesPickable(currentModel);

        // Apply fixed default scale from config
        applyDefaultScale(currentModel);
        
        // Center and fit the model to view
        const camera = scene.activeCamera;
        if (camera) {
            centerAndFitModel(currentModel, camera, scene);
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
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
        
        // Clear progress callback
        BABYLON.SceneLoader.OnProgress = null;
    }

    // Hide loading spinner
    if (spinner) spinner.style.display = "none";

    // Update scene properties
    scene.currentModel = currentModel;
    scene.currentModelType = currentModelType;

    return { currentModel, currentModelType };
}

/**
 * Applies the default scale from config to the model.
 */
function applyDefaultScale(model) {
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
}