/* ========================================================================
   3D VIEWER - EXPORT CONFIGURATION & UTILITIES
   ========================================================================
   
   PURPOSE:
   Centralized configuration and utility functions for the export system.
   Contains export templates, size estimation, format handling, and
   generation utilities used by ViewerExporter.
   
   EXPORTS:
   - EXPORT_CONFIG - Export system configuration constants
   - EXPORT_TEMPLATES - HTML/CSS/JS templates for exported viewers
   - EXPORT_UTILS - Utility functions for export operations
   
   FEATURES:
   - Export format configuration and size limits
   - HTML/CSS/JS template generation for standalone viewers
   - File size estimation and format detection
   - CDN URLs and library dependencies
   - Compression and optimization settings
   
   ======================================================================== */

/**
 * Export system configuration constants
 */
export const EXPORT_CONFIG = {
    // File size limits (in bytes)
    maxFileSizes: {
        html: 50 * 1024 * 1024,    // 50MB for single HTML file
        zip: 100 * 1024 * 1024,    // 100MB for ZIP package
        model: 25 * 1024 * 1024     // 25MB for individual model files
    },

    // Supported export formats
    formats: {
        html: {
            name: 'Single HTML',
            description: 'Self-contained file',
            icon: '📄',
            extension: '.html'
        },
        zip: {
            name: 'ZIP Package',
            description: 'Organized files for editing',
            icon: '📦',
            extension: '.zip'
        }
    },

    // CDN URLs for external libraries
    cdn: {
        babylon: 'https://cdn.babylonjs.com/babylon.js',
        babylonLoaders: 'https://cdn.babylonjs.com/loaders/babylonjs.loaders.min.js',
        gaussianSplatting: 'https://cdn.jsdelivr.net/gh/CedricGuillemet/GaussianSplatRendering@latest/js/GaussianSplattingMesh.js',
        jszip: 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'
    },

    // Compression settings for ZIP export
    compression: {
        level: 6,
        algorithm: 'DEFLATE'
    },

    // Export metadata
    metadata: {
        version: '1.0.0',
        generatedBy: '3D Viewer Export System'
    }
};

/**
 * HTML templates for exported viewers
 */
export const EXPORT_TEMPLATES = {
    /**
     * Generate self-contained HTML template
     */
    generateSelfContainedHTML: (exportData, cssContent, modelDataUrl) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <title>3D Viewer - Exported ${new Date().toLocaleDateString()}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        /* Reset and Base Styles */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { width: 100%; height: 100%; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        #renderCanvas { width: 100%; height: 100%; touch-action: none; outline: none; }
        
        /* Embedded CSS */
        ${cssContent}
        
        /* Export-specific styles */
        ${EXPORT_TEMPLATES.getExportSpecificCSS()}
    </style>
</head>
<body>
    <canvas id="renderCanvas"></canvas>
    
    <!-- Export Info -->
    ${EXPORT_TEMPLATES.generateExportInfo(exportData)}
    
    <!-- Loading Overlay -->
    ${EXPORT_TEMPLATES.generateLoadingOverlay()}

    <!-- External Libraries -->
    <script src="${EXPORT_CONFIG.cdn.babylon}"></script>
    <script src="${EXPORT_CONFIG.cdn.babylonLoaders}"></script>
    <script src="${EXPORT_CONFIG.cdn.gaussianSplatting}"></script>

    <!-- Embedded Viewer Script -->
    <script>
        // Embedded export data
        const EXPORT_DATA = ${JSON.stringify(exportData)};
        
        // Embedded model data URL
        const MODEL_DATA_URL = "${modelDataUrl}";
        
        // Initialize viewer when DOM is ready
        document.addEventListener('DOMContentLoaded', function() {
            initializeExportedViewer();
        });
        
        ${EXPORT_TEMPLATES.generateViewerScript()}
    </script>
</body>
</html>`,

    /**
     * Generate modular HTML for ZIP export
     */
    generateModularHTML: (exportData) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <title>3D Viewer - Exported</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <canvas id="renderCanvas"></canvas>
    
    ${EXPORT_TEMPLATES.generateExportInfo(exportData, true)}
    ${EXPORT_TEMPLATES.generateLoadingOverlay()}

    <script src="${EXPORT_CONFIG.cdn.babylon}"></script>
    <script src="${EXPORT_CONFIG.cdn.babylonLoaders}"></script>
    <script src="${EXPORT_CONFIG.cdn.gaussianSplatting}"></script>
    <script src="viewer.js"></script>
</body>
</html>`,

    /**
     * Generate modular JavaScript for ZIP export
     */
    generateModularJS: (exportData) => `// Exported Viewer Configuration
const CONFIG = ${JSON.stringify(exportData, null, 2)};

// Initialize viewer when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initializeViewer();
});

async function initializeViewer() {
    const canvas = document.getElementById("renderCanvas");
    const engine = new BABYLON.Engine(canvas, true);
    const scene = new BABYLON.Scene(engine);
    
    // Setup camera
    const camera = new BABYLON.ArcRotateCamera(
        "Camera",
        CONFIG.cameraState.alpha,
        CONFIG.cameraState.beta,
        CONFIG.cameraState.radius,
        new BABYLON.Vector3(
            CONFIG.cameraState.target.x,
            CONFIG.cameraState.target.y,
            CONFIG.cameraState.target.z
        ),
        scene
    );
    camera.attachControl(canvas, true);
    
    // Load model
    const modelPath = './model.' + CONFIG.modelData.format;
    
    if (CONFIG.modelData.type === 'splat') {
        const splatMesh = new BABYLON.GaussianSplattingMesh("model", null, scene);
        await splatMesh.loadFileAsync(modelPath);
    } else {
        await BABYLON.SceneLoader.ImportMeshAsync("", "./", modelPath, scene);
    }
    
    // Hide loading overlay
    document.getElementById('loadingOverlay').style.display = 'none';
    
    // Start render loop
    engine.runRenderLoop(() => scene.render());
    
    // Handle resize
    window.addEventListener("resize", () => engine.resize());
}`,

    /**
     * Generate export-specific CSS styles
     */
    getExportSpecificCSS: () => `
        /* Export Info Banner */
        .export-info {
            position: fixed;
            top: 10px;
            left: 10px;
            background: rgba(30, 30, 30, 0.9);
            color: white;
            padding: 10px 15px;
            border-radius: 8px;
            font-size: 12px;
            z-index: 1000;
            backdrop-filter: blur(10px);
        }
        
        .export-info-title {
            font-weight: bold;
            margin-bottom: 5px;
            color: #2196f3;
        }
        
        .export-info-detail {
            opacity: 0.8;
            margin: 2px 0;
        }
        
        /* Loading Overlay */
        .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        }
        
        .loading-content {
            text-align: center;
            color: white;
        }
        
        .loading-spinner {
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-top: 3px solid white;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }`,

    /**
     * Generate export info banner
     */
    generateExportInfo: (exportData, isModular = false) => {
        const modelData = exportData.modelData || { format: 'Unknown', size: 0 };
        return `<div class="export-info">
        <div class="export-info-title">Exported Viewer</div>
        <div class="export-info-detail">Date: ${new Date().toLocaleDateString()}</div>
        <div class="export-info-detail">Model: ${modelData.format}</div>
        <div class="export-info-detail">Size: ${EXPORT_UTILS.formatFileSize(modelData.size || 0)}</div>
        ${isModular ? '<div class="export-info-detail">Check README.md for details</div>' : ''}
    </div>`;
    },

    /**
     * Generate loading overlay
     */
    generateLoadingOverlay: () => `<div class="loading-overlay" id="loadingOverlay">
        <div class="loading-content">
            <div class="loading-spinner"></div>
            <div>Loading 3D Model...</div>
        </div>
    </div>`,

    /**
     * Generate main viewer script
     */
    generateViewerScript: () => `
        async function initializeExportedViewer() {
            const canvas = document.getElementById("renderCanvas");
            const engine = new BABYLON.Engine(canvas, true, {
                preserveDrawingBuffer: true,
                stencil: true,
                antialias: false
            });
            
            const scene = new BABYLON.Scene(engine);
            scene.clearColor = new BABYLON.Color3(0.1, 0.1, 0.1);
            
            // Setup camera with exported state
            const camera = new BABYLON.ArcRotateCamera(
                "Camera",
                EXPORT_DATA.cameraState.alpha,
                EXPORT_DATA.cameraState.beta,
                EXPORT_DATA.cameraState.radius,
                new BABYLON.Vector3(
                    EXPORT_DATA.cameraState.target.x,
                    EXPORT_DATA.cameraState.target.y,
                    EXPORT_DATA.cameraState.target.z
                ),
                scene
            );
            camera.attachControl(canvas, true);
            camera.minZ = EXPORT_DATA.cameraState.minZ;
            camera.maxZ = EXPORT_DATA.cameraState.maxZ;
            
            // Apply camera limits if they exist
            if (EXPORT_DATA.cameraLimits) {
                applyCameraLimits(camera, EXPORT_DATA.cameraLimits);
            }
            
            // Setup lighting
            const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
            light.intensity = 0.7;
            
            // Load model
            try {
                await loadExportedModel(scene, EXPORT_DATA.modelData);
                
                // Apply post-processing if enabled
                if (EXPORT_DATA.postProcessing) {
                    applyPostProcessing(scene, camera, EXPORT_DATA.postProcessing);
                }
                
                // Hide loading overlay
                document.getElementById('loadingOverlay').style.display = 'none';
                
            } catch (error) {
                console.error('Failed to load model:', error);
                document.getElementById('loadingOverlay').innerHTML = 
                    '<div style="color: red;">Failed to load model: ' + error.message + '</div>';
            }
            
            // Setup auto-rotation if enabled
            if (EXPORT_DATA.settings.autoRotation) {
                camera.useAutoRotationBehavior = true;
                camera.autoRotationBehavior.idleRotationWaitTime = 5000;
                camera.autoRotationBehavior.idleRotationSpeed = 0.01;
            }
            
            // Apply quality settings
            engine.setHardwareScalingLevel(EXPORT_DATA.settings.hardwareScaling);
            
            // Start render loop
            engine.runRenderLoop(() => {
                scene.render();
            });
            
            // Handle resize
            window.addEventListener("resize", () => engine.resize());
        }
        
        async function loadExportedModel(scene, modelData) {
            if (modelData.type === 'splat') {
                // Load Gaussian Splatting model
                const splatMesh = new BABYLON.GaussianSplattingMesh("exportedModel", null, scene);
                
                if (modelData.data) {
                    // Convert base64 to blob
                    const response = await fetch(MODEL_DATA_URL);
                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);
                    await splatMesh.loadFileAsync(url);
                } else if (modelData.fallbackUrl) {
                    await splatMesh.loadFileAsync(modelData.fallbackUrl);
                }
                
                return splatMesh;
                
            } else if (modelData.type === 'mesh') {
                // Load GLTF/GLB model
                const result = await BABYLON.SceneLoader.ImportMeshAsync(
                    "", 
                    "", 
                    MODEL_DATA_URL, 
                    scene
                );
                return result.meshes[0];
            }
        }
        
        function applyCameraLimits(camera, limits) {
            // Apply exported camera limits
            if (limits.radiusMin) camera.lowerRadiusLimit = parseFloat(limits.radiusMin);
            if (limits.radiusMax) camera.upperRadiusLimit = parseFloat(limits.radiusMax);
            if (limits.betaMin) camera.lowerBetaLimit = parseFloat(limits.betaMin);
            if (limits.betaMax) camera.upperBetaLimit = parseFloat(limits.betaMax);
            if (limits.alphaMin) camera.lowerAlphaLimit = parseFloat(limits.alphaMin);
            if (limits.alphaMax) camera.upperAlphaLimit = parseFloat(limits.alphaMax);
        }
        
        function applyPostProcessing(scene, camera, settings) {
            const pipeline = new BABYLON.DefaultRenderingPipeline(
                "exportedPipeline",
                false,
                scene,
                [camera]
            );
            
            pipeline.sharpenEnabled = settings.sharpenEnabled;
            if (settings.sharpenEdgeAmount) {
                pipeline.sharpen.edgeAmount = settings.sharpenEdgeAmount;
            }
            
            // Apply anti-aliasing based on exported settings
            if (settings.antiAliasing && settings.antiAliasing.type) {
                const aaType = settings.antiAliasing.type;
                if (aaType === 'fxaa') {
                    pipeline.fxaaEnabled = true;
                } else if (aaType === 'none') {
                    pipeline.fxaaEnabled = false;
                } else {
                    pipeline.fxaaEnabled = false;
                    console.log('Exported viewer using FXAA fallback for ' + aaType);
                }
            } else {
                // Legacy compatibility
                pipeline.fxaaEnabled = settings.fxaaEnabled || false;
            }
        }`,

    /**
     * Generate README content for ZIP export
     */
    generateReadme: (exportData) => `# Exported 3D Viewer

## Export Information
- **Date**: ${new Date().toISOString()}
- **Model Type**: ${exportData.modelData.type}
- **Model Format**: ${exportData.modelData.format}
- **File Size**: ${EXPORT_UTILS.formatFileSize(exportData.modelData.size)}

## Camera Settings
- **Position**: Alpha: ${exportData.cameraState.alpha.toFixed(2)}, Beta: ${exportData.cameraState.beta.toFixed(2)}, Radius: ${exportData.cameraState.radius.toFixed(2)}
- **Target**: X: ${exportData.cameraState.target.x.toFixed(2)}, Y: ${exportData.cameraState.target.y.toFixed(2)}, Z: ${exportData.cameraState.target.z.toFixed(2)}

## Viewer Settings
- **Auto Rotation**: ${exportData.settings.autoRotation ? 'Enabled' : 'Disabled'}
- **Quality**: ${exportData.settings.quality}
- **Post-Processing**: Sharpen: ${exportData.postProcessing?.sharpenEnabled ? 'On' : 'Off'}, Anti-Aliasing: ${exportData.postProcessing?.antiAliasing?.type || 'none'}

## How to Use
1. Open index.html in a modern web browser
2. The model will load automatically with all saved settings
3. Use mouse/touch to navigate:
   - Left click + drag: Orbit
   - Right click + drag: Pan
   - Scroll: Zoom

## Requirements
- Modern web browser with WebGL support
- Internet connection (for loading Babylon.js from CDN)

## Original Source
${exportData.metadata.originalUrl}

## Technical Details
- **Babylon.js Version**: ${exportData.metadata.babylonVersion}
- **Export Version**: ${EXPORT_CONFIG.metadata.version}
- **Generated By**: ${EXPORT_CONFIG.metadata.generatedBy}
`
};

/**
 * Export utility functions
 */
export const EXPORT_UTILS = {
    /**
     * Format file size in human-readable format
     */
    formatFileSize: (bytes) => {
        if (!bytes) return 'Unknown';
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    },

    /**
     * Get model format from URL
     */
    getModelFormat: (url) => {
        const extension = url.split('.').pop().toLowerCase();
        return extension.split('?')[0]; // Remove query params
    },

    /**
     * Estimate export size based on model and settings
     */
    estimateExportSize: (modelData, format) => {
        const baseSize = 2; // Base HTML/CSS/JS size in MB
        const modelSize = modelData?.size ? modelData.size / (1024 * 1024) : 0;
        
        if (format === 'html') {
            return Math.round((baseSize + modelSize) * 10) / 10;
        } else {
            return Math.round((baseSize * 0.5 + modelSize) * 10) / 10;
        }
    },

    /**
     * Check if file size is within limits
     */
    isWithinSizeLimit: (size, format) => {
        const limit = EXPORT_CONFIG.maxFileSizes[format];
        return size <= limit;
    },

    /**
     * Convert blob to base64
     */
    blobToBase64: (blob) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    },

    /**
     * Convert base64 to blob
     */
    base64ToBlob: (base64, contentType = 'application/octet-stream') => {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: contentType });
    },

    /**
     * Download blob as file
     */
    downloadBlob: (blob, filename) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    /**
     * Load external library dynamically
     */
    loadExternalLibrary: (url) => {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },

    /**
     * Estimate HTML export size for UI display
     */
    estimateHTMLSize: () => {
        const scene = window.scene;
        if (!scene || !scene.currentModel) return '?';
        
        // Estimate based on model complexity
        const vertices = scene.getTotalVertices();
        const estimatedMB = Math.round((vertices * 0.0001 + 2) * 10) / 10;
        return estimatedMB;
    }
};