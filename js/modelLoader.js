// js/modelLoader.js
import { setMeshesPickable } from './helpers.js';
import { CONFIG } from './config.js'; // Import CONFIG for modelLoader configurations

/**
 * Disposes the current model if any.
 * @param {BABYLON.Mesh | BABYLON.GaussianSplattingMesh} currentModel 
 * @param {string} currentModelType 
 * @returns {object} Updated currentModel and currentModelType
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
 * @param {BABYLON.Scene} scene 
 * @param {string} url 
 * @returns {Promise<BABYLON.GaussianSplattingMesh>}
 */
export async function loadSplatModel(scene, url) {
    console.log(`Loading .splat/.ply model from URL: ${url}`);

    // Ensure GaussianSplattingMesh is available
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
 * Loads a model based on the source type.
 * @param {BABYLON.Scene} scene 
 * @param {string | File} modelSource 
 * @param {string} defaultModelUrl 
 * @returns {Promise<{ currentModel: BABYLON.AbstractMesh, currentModelType: string }>}
 */
export async function loadModel(scene, modelSource, defaultModelUrl = CONFIG.modelLoader.defaultFallbackModel) {
    let { currentModel, currentModelType } = disposeCurrentModel(scene.currentModel, scene.currentModelType);

    // Show loading spinner
    const spinner = document.getElementById("loadingSpinner");
    if (spinner) spinner.style.display = "block";  // Show spinner

    let url = '';
    let extension = '';

    if (modelSource instanceof File) {
        url = URL.createObjectURL(modelSource);
        extension = modelSource.name.split('.').pop().toLowerCase();
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

    console.log(`Attempting to load model from ${url} with extension .${extension}`);

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
                const result = await BABYLON.SceneLoader.ImportMeshAsync(null, "", url, scene);
                currentModel = result.meshes[0];
                currentModelType = 'mesh';
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
    } catch (err) {
        console.error("Failed to load model:", err);
        alert("Failed to load model. Creating fallback box.");

        currentModel = BABYLON.MeshBuilder.CreateBox("fallbackBox", {}, scene);
        currentModelType = 'mesh';
        
        // Apply fixed default scale to fallback box too
        applyDefaultScale(currentModel);
    }

    // Hide loading spinner
    if (spinner) spinner.style.display = "none"; // Hide spinner

    // Update scene properties
    scene.currentModel = currentModel;
    scene.currentModelType = currentModelType;

    return { currentModel, currentModelType };
}

/**
 * Applies the default scale from config to the model.
 * @param {BABYLON.Mesh | BABYLON.GaussianSplattingMesh} model 
 */
function applyDefaultScale(model) {
    if (!model) return;
    
    const defaultScale = CONFIG.modelLoader.defaultModelScale;
    try {
        model.scaling.set(defaultScale, defaultScale, defaultScale);
        console.log(`Model scaled to fixed default scale: ${defaultScale}`);
    } catch (error) {
        console.error("Error applying default scale to model:", error);
    }
}