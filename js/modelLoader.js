/* ========================================================================
   3D VIEWER - MODEL LOADING & MANAGEMENT
   ========================================================================
   
   PURPOSE:
   Handles loading, processing, and management of 3D models in various formats.
   Supports GLTF/GLB, OBJ, STL, FBX, SPZ, and Gaussian Splatting (.splat/.ply).
   Includes model centering, scaling, and material assignment.
   
   EXPORTS:
   - loadModel() - Main model loading function for all supported formats
   - disposeCurrentModel() - Clean up and dispose current model
   - loadSplatModel() - Load Gaussian Splatting models
   - centerAndFitModel() - Center model and fit camera view
   - normalizeModelScale() - Normalize model to consistent size
   
   SUPPORTED FORMATS:
   - .gltf/.glb - PBR models with materials and textures
   - .obj - Mesh models with optional .mtl materials  
   - .stl - STL models with auto-applied PBR materials
   - .fbx - FBX models with animations
   - .spz - Compressed models
   - .splat/.ply - Gaussian Splatting point clouds
   
   DEPENDENCIES:
   - Babylon.js scene loader and mesh utilities
   - Configuration constants for model settings
   - Error handling and progress reporting
   
   ======================================================================== */

import { setMeshesPickable, ErrorMessages, LoadingSpinner, updateFileSizeDisplay } from './helpers.js';
import { CONFIG } from './config.js';
import { detectDevice } from './deviceDetection.js';
import { setupPickingHelpers } from './picking.js';


/**
 * Gets file size from URL using HEAD request
 * @param {string} url - The URL to get file size for
 * @returns {Promise<number>} File size in bytes, or 0 if unavailable
 */
async function getFileSizeFromUrl(url) {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        const contentLength = response.headers.get('Content-Length');
        return contentLength ? parseInt(contentLength, 10) : 0;
    } catch (error) {
        console.warn('Could not get file size from URL:', error);
        return 0;
    }
}

/**
 * Safely disposes of the current 3D model and cleans up resources
 * @param {BABYLON.AbstractMesh|BABYLON.GaussianSplattingMesh|null} currentModel - The current model to dispose
 * @param {string|null} currentModelType - Type of the current model ('mesh', 'splat', etc.)
 * @returns {Object} Object containing null values for currentModel and currentModelType
 * @description Handles cleanup of different model types, resets UI display elements, and prevents memory leaks
 */
export function disposeCurrentModel(currentModel, currentModelType) {
    if (!currentModel) return { currentModel, currentModelType };

    if (currentModelType === 'splat' || currentModelType === 'mesh') {
        currentModel.dispose();
        console.log(`Disposed model of type: ${currentModelType}`);
    }
    
    // Reset file size display when disposing model
    updateFileSizeDisplay(0);
    
    return { currentModel: null, currentModelType: null };
}

/**
 * Loads 3D Gaussian Splatting models (.splat/.ply files) using Babylon.js GaussianSplattingMesh
 * @param {BABYLON.Scene} scene - The Babylon.js scene to load the model into
 * @param {string} url - URL or path to the .splat or .ply file
 * @returns {Promise<BABYLON.GaussianSplattingMesh>} The loaded Gaussian Splatting mesh
 * @throws {Error} Throws error if GaussianSplattingMesh plugin is not available
 * @description Specialized loader for 3D Gaussian Splatting point cloud models with validation
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
 * Centers a 3D model in the scene and adjusts camera to fit the entire model in view
 * @param {BABYLON.AbstractMesh|BABYLON.GaussianSplattingMesh} model - The 3D model to center and fit
 * @param {BABYLON.ArcRotateCamera} camera - The camera to adjust for optimal viewing
 * @param {BABYLON.Scene} scene - The Babylon.js scene containing the model
 * @description Calculates model bounds, centers it at origin, and positions camera for optimal viewing.
 *              Handles both traditional meshes and Gaussian Splatting models with different bounding methods.
 * @returns {void}
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
 * Parses model source to determine URL, extension, and file type
 * @param {string|File} modelSource - Model source input (File object or URL string)
 * @param {string} defaultModelUrl - Fallback URL if parsing fails
 * @returns {{url: string, extension: string, isFile: boolean}} Parsed model source information
 * @throws {Error} Throws error for invalid input types or missing extensions
 */
function parseModelSource(modelSource, defaultModelUrl) {
    let url = '';
    let extension = '';
    let isFile = false;

    if (modelSource instanceof File) {
        isFile = true;
        extension = modelSource.name.split('.').pop()?.toLowerCase() || '';
        
        if (!extension) {
            throw new Error('File has no extension');
        }
        
        // Create object URL for splat/ply files
        if (extension === 'splat' || extension === 'ply') {
            url = URL.createObjectURL(modelSource);
        }
    } else if (typeof modelSource === 'string') {
        if (!modelSource.trim()) {
            throw new Error('URL cannot be empty');
        }
        
        url = modelSource.trim();
        try {
            const urlObj = new URL(url);
            const path = urlObj.pathname;
            extension = path.split('.').pop()?.toLowerCase() || '';
            
            if (!extension) {
                throw new Error('URL does not contain a file extension');
            }
        } catch (e) {
            console.error("Invalid URL:", url);
            throw new Error(`Invalid URL format: ${url}`);
        }
    } else {
        throw new Error("Model source must be a File object or URL string");
    }

    return { url, extension, isFile };
}

/**
 * Validates model for mobile device performance constraints
 * @param {number} fileSize - File size in bytes
 * @param {string} extension - File extension
 * @param {boolean} isMobile - Whether device is mobile
 * @returns {{canLoad: boolean, warnings: string[]}} Validation result
 */
function validateMobileModel(fileSize, extension, isMobile) {
    const warnings = [];
    let canLoad = true;
    
    if (!isMobile) {
        return { canLoad: true, warnings: [] };
    }
    
    const mobileConfig = CONFIG.modelLoader.mobile;
    
    // Check file size limits
    if (fileSize > mobileConfig.maxFileSize) {
        canLoad = false;
        warnings.push(`File too large for mobile (${Math.round(fileSize / 1024 / 1024)}MB > ${Math.round(mobileConfig.maxFileSize / 1024 / 1024)}MB limit)`);
    } else if (fileSize > mobileConfig.preloadWarningSize) {
        warnings.push(`Large file detected (${Math.round(fileSize / 1024 / 1024)}MB). Loading may be slow on mobile.`);
    }
    
    // Check preferred formats
    if (!mobileConfig.preferredFormats.includes(extension)) {
        warnings.push(`Format .${extension} may not be optimized for mobile. Consider using: ${mobileConfig.preferredFormats.join(', ')}`);
    }
    
    return { canLoad, warnings };
}

/**
 * Applies mobile-specific optimizations to loaded model
 * @param {Object} result - Babylon.js loader result
 * @param {BABYLON.Scene} scene - The scene
 * @param {boolean} isMobile - Whether device is mobile
 */
function applyMobileOptimizations(result, scene, isMobile) {
    if (!isMobile || !result.meshes) return;
    
    const mobileConfig = CONFIG.modelLoader.mobile;
    
    // Optimize meshes for mobile
    result.meshes.forEach((mesh, index) => {
        if (mesh.geometry && mobileConfig.simplifyMeshes) {
            // Check triangle count
            const vertices = mesh.getTotalVertices();
            if (vertices > mobileConfig.targetTriangleCount * 3) {
                console.log(`Mesh ${index} has high vertex count (${vertices}), consider simplifying`);
                
                // Enable LOD if available
                if (mobileConfig.enableLOD && mesh.setLOD) {
                    try {
                        const simplifiedMesh = mesh.clone(`${mesh.name}_LOD`);
                        simplifiedMesh.scaling.setAll(0.8);
                        mesh.setLOD(10, simplifiedMesh);
                        console.log(`Applied LOD to mesh ${index}`);
                    } catch (error) {
                        console.warn(`Failed to apply LOD to mesh ${index}:`, error);
                    }
                }
            }
        }
        
        // Optimize materials for mobile
        if (mesh.material && mobileConfig.compressionEnabled) {
            optimizeMaterialForMobile(mesh.material, scene);
        }
    });
}

/**
 * Optimizes material textures for mobile performance
 * @param {BABYLON.Material} material - Material to optimize
 * @param {BABYLON.Scene} scene - The scene
 */
function optimizeMaterialForMobile(material, scene) {
    const mobileConfig = CONFIG.modelLoader.mobile;
    
    // Handle different material types
    if (material.diffuseTexture) {
        optimizeTexture(material.diffuseTexture, mobileConfig.textureMaxSize);
    }
    
    if (material.albedoTexture) {
        optimizeTexture(material.albedoTexture, mobileConfig.textureMaxSize);
    }
    
    if (material.normalTexture) {
        optimizeTexture(material.normalTexture, Math.min(mobileConfig.textureMaxSize, 512)); // Normals can be smaller
    }
    
    // Reduce material complexity
    if (material.metallicTexture && material.roughnessTexture) {
        console.log('Mobile: Using separate metallic/roughness textures may impact performance');
    }
}

/**
 * Optimizes texture for mobile constraints
 * @param {BABYLON.Texture} texture - Texture to optimize
 * @param {number} maxSize - Maximum texture size
 */
function optimizeTexture(texture, maxSize) {
    if (!texture || !texture.getSize) return;
    
    try {
        const size = texture.getSize();
        if (size.width > maxSize || size.height > maxSize) {
            console.log(`Texture ${texture.name} is large (${size.width}x${size.height}), consider reducing to ${maxSize}x${maxSize} for mobile`);
            // Note: Actual texture compression would require external tools or server-side processing
        }
    } catch (error) {
        console.warn('Failed to check texture size:', error);
    }
}

/**
 * Generic mesh loader that handles file vs URL loading with validation
 * @param {BABYLON.Scene} scene - The Babylon.js scene to load into
 * @param {File|string} modelSource - File object or URL string
 * @param {string} url - The URL (may be object URL for files)
 * @param {boolean} isFile - Whether source is a file or URL
 * @param {Object} [loaderParams={}] - Loading parameters for special cases
 * @param {boolean} [loaderParams.useBaseUrl] - Use base URL parsing for OBJ files
 * @param {boolean} [loaderParams.useNullMeshName] - Use null mesh name for SPZ files
 * @returns {Promise<Object>} Babylon.js loader result with meshes, materials, etc.
 * @throws {Error} Throws error for missing required parameters
 */
async function loadMeshFromSource(scene, modelSource, url, isFile, loaderParams = {}) {
    if (!scene) {
        throw new Error('Scene is required for loading models');
    }
    
    if (isFile) {
        if (!modelSource) {
            throw new Error('File is required when isFile is true');
        }
        return await BABYLON.SceneLoader.ImportMeshAsync("", "", modelSource, scene);
    }
    
    if (!url) {
        throw new Error('URL is required when loading from URL');
    }
    
    // Handle special URL cases
    if (loaderParams.useBaseUrl) {
        const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
        const filename = url.substring(url.lastIndexOf('/') + 1);
        return await BABYLON.SceneLoader.ImportMeshAsync("", baseUrl, filename, scene);
    }
    
    // Handle SPZ special case
    if (loaderParams.useNullMeshName) {
        return await BABYLON.SceneLoader.ImportMeshAsync(null, "", url, scene);
    }
    
    // Standard URL loading
    return await BABYLON.SceneLoader.ImportMeshAsync("", url, "", scene);
}

/**
 * Creates a default PBR material with specified properties
 * @param {string} name - Material name
 * @param {BABYLON.Scene} scene - The Babylon.js scene
 * @param {BABYLON.Color3} [color] - Albedo color (default: gray)
 * @param {number} [metallic=0.0] - Metallic value (0.0-1.0)
 * @param {number} [roughness=0.6] - Roughness value (0.0-1.0)
 * @returns {BABYLON.PBRMaterial} Configured PBR material
 */
function createDefaultPBRMaterial(name, scene, color = new BABYLON.Color3(0.6, 0.6, 0.6), metallic = 0.0, roughness = 0.6) {
    const material = new BABYLON.PBRMaterial(name, scene);
    material.albedoColor = color;
    material.metallic = metallic;
    material.roughness = roughness;
    material.backFaceCulling = false;
    return material;
}

/**
 * Makes all meshes in a loader result pickable for user interaction
 * @param {Object} result - Babylon.js loader result containing meshes array
 */
function makeResultMeshesPickable(result) {
    result.meshes.forEach(mesh => {
        mesh.isPickable = true;
    });
}

/**
 * Loads SPZ format models using Babylon.js SceneLoader
 * @param {BABYLON.Scene} scene - The scene to load into
 * @param {Object} loadContext - Loading context with modelSource, url, isFile
 * @returns {Promise<{model: BABYLON.AbstractMesh, type: string}>} Loaded model info
 */
async function loadSpzModel(scene, { modelSource, url, isFile }) {
    console.log(`Loading SPZ model`);
    const result = await loadMeshFromSource(scene, modelSource, url, isFile, { useNullMeshName: true });
    const model = result.meshes[0];
    if (model) model.position.y = 0;
    return { model, type: 'mesh', result };
}

/**
 * Loads GLTF/GLB format models with automatic material handling
 * @param {BABYLON.Scene} scene - The scene to load into
 * @param {Object} loadContext - Loading context with modelSource, url, isFile
 * @returns {Promise<{model: BABYLON.AbstractMesh, type: string}>} Loaded model info
 */
async function loadGltfModel(scene, { modelSource, url, isFile }) {
    console.log(`Loading GLTF/GLB model`);
    const result = await loadMeshFromSource(scene, modelSource, url, isFile);
    const model = result.meshes[0];
    makeResultMeshesPickable(result);
    return { model, type: 'mesh', result };
}

/**
 * Loads OBJ format models with automatic MTL material loading
 * @param {BABYLON.Scene} scene - The scene to load into
 * @param {Object} loadContext - Loading context with modelSource, url, isFile
 * @returns {Promise<{model: BABYLON.AbstractMesh, type: string}>} Loaded model info
 * @description Automatically applies default materials if none are found
 */
async function loadObjModel(scene, { modelSource, url, isFile }) {
    console.log(`Loading OBJ model`);
    const result = await loadMeshFromSource(scene, modelSource, url, isFile, { useBaseUrl: !isFile });
    const model = result.meshes.length > 0 ? result.meshes[0] : null;
    makeResultMeshesPickable(result);
    
    // Apply materials if none exist
    if (!result.materials || result.materials.length === 0) {
        console.log("Applying default materials to OBJ model");
        result.meshes.forEach((mesh, index) => {
            mesh.material = createDefaultPBRMaterial(`objPBRMaterial_${index}`, scene);
        });
    } else {
        console.log(`OBJ model loaded with ${result.materials.length} materials`);
    }
    
    return { model, type: 'mesh', result };
}

/**
 * Loads STL format models and applies default PBR materials
 * @param {BABYLON.Scene} scene - The scene to load into
 * @param {Object} loadContext - Loading context with modelSource, url, isFile
 * @returns {Promise<{model: BABYLON.AbstractMesh, type: string}>} Loaded model info
 * @description STL files have no materials, so gray PBR materials are applied
 */
async function loadStlModel(scene, { modelSource, url, isFile }) {
    console.log(`Loading STL model`);
    const result = await loadMeshFromSource(scene, modelSource, url, isFile);
    const model = result.meshes[0];
    
    result.meshes.forEach((mesh, index) => {
        mesh.isPickable = true;
        mesh.material = createDefaultPBRMaterial(
            `stlPBRMaterial_${index}`, 
            scene, 
            new BABYLON.Color3(0.8, 0.8, 0.8), 
            0.2, 
            0.6
        );
    });
    
    console.log("STL model loaded with materials");
    return { model, type: 'mesh', result };
}

/**
 * Loads FBX format models with animation support
 * @param {BABYLON.Scene} scene - The scene to load into
 * @param {Object} loadContext - Loading context with modelSource, url, isFile
 * @returns {Promise<{model: BABYLON.AbstractMesh, type: string}>} Loaded model info
 * @description Logs animation groups if present in the FBX file
 */
async function loadFbxModel(scene, { modelSource, url, isFile }) {
    console.log(`Loading FBX model`);
    const result = await loadMeshFromSource(scene, modelSource, url, isFile);
    const model = result.meshes[0];
    makeResultMeshesPickable(result);
    
    if (result.animationGroups && result.animationGroups.length > 0) {
        console.log(`Loaded with ${result.animationGroups.length} animations`);
    }
    
    return { model, type: 'mesh', result };
}

/**
 * Routes model loading to appropriate format-specific loader
 * @param {BABYLON.Scene} scene - The scene to load into
 * @param {Object} loadContext - Loading context information
 * @param {string} loadContext.extension - File extension (without dot)
 * @param {File|string} loadContext.modelSource - File object or URL string
 * @param {string} loadContext.url - The URL (may be object URL for files)
 * @param {boolean} loadContext.isFile - Whether source is a file
 * @returns {Promise<{model: BABYLON.AbstractMesh|BABYLON.GaussianSplattingMesh, type: string}>} Loaded model
 * @throws {Error} Throws error for unsupported file formats
 */
async function loadModelByFormat(scene, loadContext) {
    const { extension, modelSource, url, isFile } = loadContext;
    
    switch (extension) {
        case 'spz':
            return await loadSpzModel(scene, loadContext);
        case 'gltf':
        case 'glb':
            return await loadGltfModel(scene, loadContext);
        case 'obj':
            return await loadObjModel(scene, loadContext);
        case 'stl':
            return await loadStlModel(scene, loadContext);
        case 'fbx':
            return await loadFbxModel(scene, loadContext);
        case 'splat':
        case 'ply':
            console.log(`Loading .${extension} using GaussianSplattingMesh`);
            const model = await loadSplatModel(scene, url);
            return { model, type: 'splat' };
        default:
            throw new Error(ErrorMessages.MODEL.UNSUPPORTED_FORMAT(extension));
    }
}

/**
 * Applies post-processing to loaded models (scaling, centering, UI updates)
 * @param {BABYLON.AbstractMesh|BABYLON.GaussianSplattingMesh} currentModel - The loaded model
 * @param {BABYLON.Scene} scene - The Babylon.js scene containing the model
 * @description Ensures meshes are pickable, normalizes scale, centers model, updates UI
 */
function postProcessModel(currentModel, scene) {
    // Ensure all meshes are pickable
    setMeshesPickable(currentModel);

    // Normalize the model scale to a consistent size
    normalizeModelScale(currentModel, CONFIG.modelLoader.defaultNormalizedSize);

    // Center and fit the model to view
    const camera = scene.activeCamera;
    if (camera) {
        centerAndFitModel(currentModel, camera, scene);
    }

    // Update the UI scale slider to reflect the actual normalized scale
    const modelScaleRange = document.getElementById('modelScaleRange');
    const modelScaleDisplay = document.getElementById('modelScaleRangeDisplay');
    if (modelScaleRange && modelScaleDisplay && currentModel) {
        const actualScale = currentModel.scaling.x; // All axes should be the same due to setAll()
        modelScaleRange.value = actualScale;
        modelScaleDisplay.textContent = actualScale.toFixed(1);
        console.log(`Scale slider updated to: ${actualScale.toFixed(4)}`);
    }
}

/**
 * Creates a simple fallback box model when primary loading fails
 * @param {BABYLON.Scene} scene - The scene to create the fallback model in
 * @returns {{currentModel: BABYLON.Mesh, currentModelType: string}} Fallback model info
 * @description Creates a 2x2x2 box with default scaling as emergency fallback
 */
function createFallbackModel(scene) {
    const currentModel = BABYLON.MeshBuilder.CreateBox("fallbackBox", { size: 2 }, scene);
    const currentModelType = 'mesh';
    
    // Reset file size display for fallback model
    updateFileSizeDisplay(0);
    
    applyDefaultScale(currentModel);
    
    return { currentModel, currentModelType };
}

/**
 * Applies the default scale from config to the model
 * @param {BABYLON.AbstractMesh} model - The model to scale
 * @description Uses CONFIG.modelLoader.defaultModelScale for consistent sizing
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

/**
 * Universal 3D model loader supporting multiple formats with automatic format detection
 * @param {BABYLON.Scene} scene - The Babylon.js scene to load the model into
 * @param {string|File|URL} modelSource - Model source: URL string, File object, or URL object
 * @param {string} [defaultModelUrl] - Fallback model URL if loading fails
 * @returns {Promise<{currentModel: BABYLON.AbstractMesh|BABYLON.GaussianSplattingMesh, currentModelType: string}>} 
 *          Object containing the loaded model and its type
 * @description Comprehensive model loader that:
 *              - Supports SPLAT, PLY, SPZ, GLTF, GLB, OBJ, STL, FBX formats
 *              - Handles both file uploads and URL-based loading
 *              - Automatically normalizes model scale and centers in view
 *              - Tracks file sizes for performance monitoring
 *              - Provides fallback error handling with default models
 *              - Updates UI elements and progress indicators
 * @throws {Error} Throws error for unsupported formats or loading failures
 * @example
 * // Load from URL
 * const result = await loadModel(scene, 'https://example.com/model.splat');
 * 
 * // Load from file
 * const result = await loadModel(scene, fileObject);
 */
export async function loadModel(scene, modelSource, defaultModelUrl = CONFIG.modelLoader.defaultFallbackModel) {
    if (!scene) {
        throw new Error('Scene is required for loading models');
    }

    let { currentModel, currentModelType } = disposeCurrentModel(scene.currentModel, scene.currentModelType);

    // Show loading spinner
    LoadingSpinner.show("block");

    // Setup progress callback
    BABYLON.SceneLoader.OnProgress = (event) => {
        const percentage = event.loaded && event.total 
            ? Math.floor((event.loaded / event.total) * 100) 
            : 0;
        
        LoadingSpinner.updateProgress(percentage);
    };

    let url = '';
    let extension = '';
    let isFile = false;

    try {
        // Parse model source to get URL, extension, and file type
        ({ url, extension, isFile } = parseModelSource(modelSource, defaultModelUrl));
        console.log(`Loading .${extension} model`);

        // Detect device for mobile optimizations
        const device = detectDevice();
        const isMobile = device.isMobile;

        // Get and display file size for URL-loaded models
        let fileSize = 0;
        if (!isFile && url) {
            fileSize = await getFileSizeFromUrl(url);
            updateFileSizeDisplay(fileSize);
        } else if (isFile && modelSource.size) {
            fileSize = modelSource.size;
            updateFileSizeDisplay(fileSize);
        }

        // Mobile-specific validation
        if (fileSize > 0) {
            const validation = validateMobileModel(fileSize, extension, isMobile);
            
            // Show warnings if any
            if (validation.warnings.length > 0) {
                console.warn('Mobile Performance Warnings:', validation.warnings);
                validation.warnings.forEach(warning => console.warn(`⚠️ ${warning}`));
            }
            
            // Block loading if model is too large for mobile
            if (!validation.canLoad) {
                throw new Error(validation.warnings[0] || 'Model cannot be loaded on this device');
            }
        }

        // Validate format is supported
        if (!CONFIG.modelLoader.supportedFormats.includes(extension)) {
            throw new Error(ErrorMessages.MODEL.UNSUPPORTED_FORMAT(extension));
        }

        // Load model using appropriate format loader
        const loadContext = { extension, modelSource, url, isFile, isMobile };
        const { model, type, result } = await loadModelByFormat(scene, loadContext);
        
        if (!model) {
            throw new Error('Model loading returned null or undefined model');
        }

        // Apply mobile-specific optimizations if loading succeeded
        if (result && isMobile) {
            console.log('Applying mobile optimizations...');
            applyMobileOptimizations(result, scene, isMobile);
        }

        currentModel = model;
        currentModelType = type;

        // Post-process the loaded model
        postProcessModel(currentModel, scene);
        
    } catch (err) {
        console.error("Model loading failed:", err.message);
        
        // Try fallback to default model if not already using it
        if (modelSource !== defaultModelUrl && defaultModelUrl) {
            console.log("Attempting to load fallback model");
            try {
                ({ url, extension, isFile } = parseModelSource(defaultModelUrl, defaultModelUrl));
                const fallbackContext = { extension, modelSource: defaultModelUrl, url, isFile: false };
                const { model, type } = await loadModelByFormat(scene, fallbackContext);
                currentModel = model;
                currentModelType = type;
                postProcessModel(currentModel, scene);
            } catch (fallbackErr) {
                console.error("Fallback model failed:", fallbackErr.message);
                ({ currentModel, currentModelType } = createFallbackModel(scene));
            }
        } else {
            ({ currentModel, currentModelType } = createFallbackModel(scene));
        }
    } finally {
        // Clean up object URL if created
        if (isFile && url && (extension === 'splat' || extension === 'ply')) {
            setTimeout(() => URL.revokeObjectURL(url), CONFIG.modelLoader.urlCleanupDelay);
        }
        
        // Clear progress callback
        BABYLON.SceneLoader.OnProgress = null;
    }

    // Hide loading spinner
    LoadingSpinner.hide();

    // Update scene properties
    scene.currentModel = currentModel;
    scene.currentModelType = currentModelType;
    scene.currentModelUrl = url;
    setupPickingHelpers(scene);

    return { currentModel, currentModelType };
}

