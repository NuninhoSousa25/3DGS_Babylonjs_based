// js/export/ViewerExporter.js

import { CONFIG } from '../config.js';

/**
 * ViewerExporter - Creates self-contained HTML or ZIP packages of the viewer
 * with current model, settings, and camera state
 */
export class ViewerExporter {
    constructor(scene, camera, engine) {
        this.scene = scene;
        this.camera = camera;
        this.engine = engine;
        this.currentExportId = null;
    }

    /**
     * Main export function - creates downloadable package
     * @param {string} format - 'html' for single file, 'zip' for full package
     */
    async exportViewer(format = 'html') {
        try {
            showToast('Preparing export...', 5000);
            
            // Gather all necessary data
            const exportData = await this.gatherExportData();
            
            if (format === 'html') {
                await this.exportAsSingleHTML(exportData);
            } else if (format === 'zip') {
                await this.exportAsZip(exportData);
            }
            
            showToast('Export completed successfully!');
        } catch (error) {
            console.error('Export failed:', error);
            showToast('Export failed: ' + error.message, 5000);
        }
    }

    /**
     * Gather all data needed for export
     */
    async gatherExportData() {
        return {
            // Current camera state
            cameraState: this.getCameraState(),
            
            // Current settings
            settings: this.getCurrentSettings(),
            
            // Model data
            modelData: await this.getModelData(),
            
            // Camera limits if enabled
            cameraLimits: this.getCameraLimits(),
            
            // Post-processing settings
            postProcessing: this.getPostProcessingSettings(),
            
            // Timestamp and metadata
            metadata: {
                exportDate: new Date().toISOString(),
                exportVersion: '1.0.0',
                originalUrl: window.location.href,
                babylonVersion: BABYLON.Engine.Version
            }
        };
    }

    /**
     * Get current camera state
     */
    getCameraState() {
        return {
            alpha: this.camera.alpha,
            beta: this.camera.beta,
            radius: this.camera.radius,
            target: {
                x: this.camera.target.x,
                y: this.camera.target.y,
                z: this.camera.target.z
            },
            fov: this.camera.fov,
            minZ: this.camera.minZ,
            maxZ: this.camera.maxZ
        };
    }

    /**
     * Get current settings
     */
    getCurrentSettings() {
        return {
            autoRotation: this.camera.useAutoRotationBehavior,
            quality: document.getElementById('qualitySelect')?.value || 'medium',
            hardwareScaling: this.engine.getHardwareScalingLevel(),
            pixelRatio: window.devicePixelRatio
        };
    }

    /**
     * Get model data - either as base64 or blob URL
     */
    async getModelData() {
        const currentModel = this.scene.currentModel;
        const modelType = this.scene.currentModelType;
        const modelUrl = this.scene.currentModelUrl;
        
        if (!currentModel) {
            throw new Error('No model loaded to export');
        }

        // For splat/ply models, we need to fetch the original data
        if (modelType === 'splat' && modelUrl) {
            try {
                const response = await fetch(modelUrl);
                const blob = await response.blob();
                const base64 = await this.blobToBase64(blob);
                
                return {
                    type: modelType,
                    format: this.getModelFormat(modelUrl),
                    data: base64,
                    size: blob.size,
                    url: modelUrl
                };
            } catch (error) {
                console.error('Failed to fetch model data:', error);
                return {
                    type: modelType,
                    format: 'unknown',
                    data: null,
                    fallbackUrl: modelUrl
                };
            }
        }
        
        // For mesh models (GLTF/GLB), serialize the scene
        if (modelType === 'mesh') {
            const serialized = await this.serializeMeshModel(currentModel);
            return {
                type: 'mesh',
                format: 'glb',
                data: serialized,
                size: serialized.length
            };
        }
        
        return null;
    }

    /**
     * Get camera limits configuration
     */
    getCameraLimits() {
        if (!this.scene.cameraLimits) return null;
        
        return this.scene.cameraLimits.getLimitsForUrl();
    }

    /**
     * Get post-processing settings
     */
    getPostProcessingSettings() {
        if (!this.scene.pipeline) return null;
        
        return {
            sharpenEnabled: this.scene.pipeline.sharpenEnabled,
            sharpenEdgeAmount: this.scene.pipeline.sharpen?.edgeAmount,
            fxaaEnabled: this.scene.pipeline.fxaaEnabled, // Legacy compatibility
            antiAliasing: {
                type: CONFIG.postProcessing.antiAliasing.type,
                taaSamples: CONFIG.postProcessing.antiAliasing.taaSamples
            }
        };
    }

    /**
     * Export as single self-contained HTML file
     */
    async exportAsSingleHTML(exportData) {
        const html = await this.generateSelfContainedHTML(exportData);
        
        // Create blob and download
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        this.downloadBlob(blob, `viewer-export-${Date.now()}.html`);
    }

    /**
     * Generate self-contained HTML with embedded everything
     */
    async generateSelfContainedHTML(exportData) {
        // Fetch current CSS
        const cssContent = await this.fetchAndInlineCSS();
        
        const modelData = exportData.modelData || { format: 'Unknown', size: 0 };
        const modelDataUrl = modelData.data
        ? `data:application/octet-stream;base64,${modelData.data}`
        : (modelData.fallbackUrl || '');

        return `<!DOCTYPE html>
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
        }
    </style>
</head>
<body>
    <canvas id="renderCanvas"></canvas>
    
    <!-- Export Info -->
    <div class="export-info">
        <div class="export-info-title">Exported Viewer</div>
        <div class="export-info-detail">Date: ${new Date().toLocaleDateString()}</div>
        <div class="export-info-detail">Model: ${modelData.format}</div>
        <div class="export-info-detail">Size: ${this.formatFileSize(modelData.size || 0)}</div>
    </div>
    
    <!-- Loading Overlay -->
    <div class="loading-overlay" id="loadingOverlay">
        <div class="loading-content">
            <div class="loading-spinner"></div>
            <div>Loading 3D Model...</div>
        </div>
    </div>

    <!-- Babylon.js -->
    <script src="https://cdn.babylonjs.com/babylon.js"></script>
    <script src="https://cdn.babylonjs.com/loaders/babylonjs.loaders.min.js"></script>
    <script src="https://cdn.jsdelivr.net/gh/CedricGuillemet/GaussianSplatRendering@latest/js/GaussianSplattingMesh.js"></script>

    <!-- Embedded Viewer Script -->
    <script>
        // Embedded export data
        const EXPORT_DATA = ${JSON.stringify(exportData)};
        
        // Embedded model data (if small enough, otherwise use URL)
        const MODEL_DATA_URL = "${modelDataUrl}";
        
        // Initialize viewer when DOM is ready
        document.addEventListener('DOMContentLoaded', function() {
            initializeExportedViewer();
        });
        
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
            window.addEventListener("resize", () => {
                engine.resize();
            });
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
                    // Note: TAA requires more complex setup in exported viewer
                    console.log('Exported viewer using FXAA fallback for ' + aaType);
                }
            } else {
                // Legacy compatibility
                pipeline.fxaaEnabled = settings.fxaaEnabled || false;
            }
        }
    </script>
</body>
</html>`;
    }

    /**
     * Export as ZIP package with separate files
     */
    async exportAsZip(exportData) {
        // Check if JSZip is available
        if (!window.JSZip) {
            await this.loadJSZip();
        }
        
        const zip = new JSZip();
        
        // Add HTML file
        const htmlContent = await this.generateModularHTML(exportData);
        zip.file("index.html", htmlContent);
        
        // Add CSS file
        const cssContent = await this.fetchAndInlineCSS();
        zip.file("styles.css", cssContent);
        
        // Add JavaScript files
        const jsContent = this.generateModularJS(exportData);
        zip.file("viewer.js", jsContent);
        
        // Add config file
        zip.file("config.json", JSON.stringify(exportData, null, 2));
        
        // Add model file if it exists
        if (exportData.modelData.data) {
            const modelBlob = this.base64ToBlob(exportData.modelData.data);
            const modelFileName = `model.${exportData.modelData.format}`;
            zip.file(modelFileName, modelBlob);
        }
        
        // Add README
        const readmeContent = this.generateReadme(exportData);
        zip.file("README.md", readmeContent);
        
        // Generate and download ZIP
        const zipBlob = await zip.generateAsync({ 
            type: "blob",
            compression: "DEFLATE",
            compressionOptions: { level: 6 }
        });
        
        this.downloadBlob(zipBlob, `viewer-export-${Date.now()}.zip`);
    }

    /**
     * Generate modular HTML for ZIP export
     */
    generateModularHTML(exportData) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <title>3D Viewer - Exported</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <canvas id="renderCanvas"></canvas>
    
    <div class="export-info">
        <div class="export-info-title">Exported Viewer</div>
        <div class="export-info-detail">Check README.md for details</div>
    </div>
    
    <div class="loading-overlay" id="loadingOverlay">
        <div class="loading-content">
            <div class="loading-spinner"></div>
            <div>Loading 3D Model...</div>
        </div>
    </div>

    <script src="https://cdn.babylonjs.com/babylon.js"></script>
    <script src="https://cdn.babylonjs.com/loaders/babylonjs.loaders.min.js"></script>
    <script src="https://cdn.jsdelivr.net/gh/CedricGuillemet/GaussianSplatRendering@latest/js/GaussianSplattingMesh.js"></script>
    <script src="viewer.js"></script>
</body>
</html>`;
    }

    /**
     * Generate modular JavaScript for ZIP export
     */
    generateModularJS(exportData) {
        return `// Exported Viewer Configuration
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
}`;
    }

    /**
     * Generate README file for ZIP export
     */
    generateReadme(exportData) {
        return `# Exported 3D Viewer

## Export Information
- **Date**: ${new Date().toISOString()}
- **Model Type**: ${exportData.modelData.type}
- **Model Format**: ${exportData.modelData.format}
- **File Size**: ${this.formatFileSize(exportData.modelData.size)}

## Camera Settings
- **Position**: Alpha: ${exportData.cameraState.alpha.toFixed(2)}, Beta: ${exportData.cameraState.beta.toFixed(2)}, Radius: ${exportData.cameraState.radius.toFixed(2)}
- **Target**: X: ${exportData.cameraState.target.x.toFixed(2)}, Y: ${exportData.cameraState.target.y.toFixed(2)}, Z: ${exportData.cameraState.target.z.toFixed(2)}

## Viewer Settings
- **Auto Rotation**: ${exportData.settings.autoRotation ? 'Enabled' : 'Disabled'}
- **Quality**: ${exportData.settings.quality}
- **Post-Processing**: Sharpen: ${exportData.postProcessing?.sharpenEnabled ? 'On' : 'Off'}, FXAA: ${exportData.postProcessing?.fxaaEnabled ? 'On' : 'Off'}

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
`;
    }

    /**
     * Utility: Fetch and inline CSS
     */
    async fetchAndInlineCSS() {
        // Get all stylesheets
        const styleSheets = Array.from(document.styleSheets);
        let cssText = '';
        
        for (const sheet of styleSheets) {
            try {
                const rules = Array.from(sheet.cssRules || sheet.rules);
                for (const rule of rules) {
                    cssText += rule.cssText + '\n';
                }
            } catch (e) {
                // External stylesheet, try to fetch
                if (sheet.href && sheet.href.includes(window.location.origin)) {
                    try {
                        const response = await fetch(sheet.href);
                        cssText += await response.text() + '\n';
                    } catch (fetchError) {
                        console.warn('Could not fetch stylesheet:', sheet.href);
                    }
                }
            }
        }
        
        return cssText;
    }

    /**
     * Utility: Load JSZip library dynamically
     */
    async loadJSZip() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Utility: Serialize mesh model to GLB
     */
    async serializeMeshModel(mesh) {
        // Use Babylon's GLTF2Export if available
        if (BABYLON.GLTF2Export) {
            const gltf = await BABYLON.GLTF2Export.GLBAsync(this.scene, "exportedModel");
            return await this.blobToBase64(gltf.glTFFiles["exportedModel.glb"]);
        }
        
        // Fallback: return null if GLTF2Export not available
        console.warn('GLTF2Export not available, mesh export skipped');
        return null;
    }

    /**
     * Utility: Convert blob to base64
     */
    blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    /**
     * Utility: Convert base64 to blob
     */
    base64ToBlob(base64, contentType = 'application/octet-stream') {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: contentType });
    }

    /**
     * Utility: Get model format from URL
     */
    getModelFormat(url) {
        const extension = url.split('.').pop().toLowerCase();
        return extension.split('?')[0]; // Remove query params
    }

    /**
     * Utility: Format file size
     */
    formatFileSize(bytes) {
        if (!bytes) return 'Unknown';
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * Utility: Download blob
     */
    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

// Export for use in UI
export function setupExportButton(camera, scene, engine) {
    const exporter = new ViewerExporter(scene, camera, engine);
    
    // Add export button to UI (next to share button)
    const iconBar = document.getElementById('iconBar');
    if (iconBar) {
        const exportButton = document.createElement('button');
        exportButton.id = 'exportButton';
        exportButton.className = 'icon-button';
        exportButton.title = 'Export Viewer';
        exportButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor">
                <path d="M0 0h24v24H0V0z" fill="none"/>
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
            </svg>
        `;
        
        // Insert before share button
        const shareButton = document.getElementById('shareButton');
        iconBar.insertBefore(exportButton, shareButton);
        
        // Add click handler with options
        exportButton.addEventListener('click', () => {
            showExportDialog(exporter);
        });
    }
    
    return exporter;
}

/**
 * Show export options dialog
 */
export function showExportDialog(exporter) {
    // Create dialog
    const dialog = document.createElement('div');
    dialog.className = 'export-dialog';
    dialog.innerHTML = `
        <div class="export-dialog-content">
            <h3>Export Viewer</h3>
            <p>Choose export format:</p>
            
            <div class="export-options">
                <button id="exportHTML" class="export-option">
                    <div class="export-option-icon">📄</div>
                    <div class="export-option-title">Single HTML</div>
                    <div class="export-option-desc">Self-contained file (~${estimateHTMLSize()} MB)</div>
                </button>
                
                <button id="exportZIP" class="export-option">
                    <div class="export-option-icon">📦</div>
                    <div class="export-option-title">ZIP Package</div>
                    <div class="export-option-desc">Organized files for editing</div>
                </button>
            </div>
            
            <button id="cancelExport" class="export-cancel">Cancel</button>
        </div>
    `;
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .export-dialog {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        }
        
        .export-dialog-content {
            background: #2a2a2a;
            border-radius: 12px;
            padding: 24px;
            max-width: 400px;
            width: 90%;
            color: white;
        }
        
        .export-dialog-content h3 {
            margin: 0 0 16px 0;
            color: #2196f3;
        }
        
        .export-options {
            display: flex;
            gap: 12px;
            margin: 20px 0;
        }
        
        .export-option {
            flex: 1;
            background: #3a3a3a;
            border: 2px solid transparent;
            border-radius: 8px;
            padding: 16px;
            cursor: pointer;
            transition: all 0.3s;
            color: white;
        }
        
        .export-option:hover {
            border-color: #2196f3;
            background: #4a4a4a;
        }
        
        .export-option-icon {
            font-size: 32px;
            margin-bottom: 8px;
        }
        
        .export-option-title {
            font-weight: bold;
            margin-bottom: 4px;
        }
        
        .export-option-desc {
            font-size: 12px;
            opacity: 0.7;
        }
        
        .export-cancel {
            width: 100%;
            padding: 10px;
            background: #555;
            border: none;
            border-radius: 6px;
            color: white;
            cursor: pointer;
            transition: background 0.3s;
        }
        
        .export-cancel:hover {
            background: #666;
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(dialog);
    
    // Add event listeners
    document.getElementById('exportHTML').addEventListener('click', async () => {
        document.body.removeChild(dialog);
        await exporter.exportViewer('html');
    });
    
    document.getElementById('exportZIP').addEventListener('click', async () => {
        document.body.removeChild(dialog);
        await exporter.exportViewer('zip');
    });
    
    document.getElementById('cancelExport').addEventListener('click', () => {
        document.body.removeChild(dialog);
        document.head.removeChild(style);
    });
}

/**
 * Estimate HTML file size
 */
function estimateHTMLSize() {
    const scene = window.scene;
    if (!scene || !scene.currentModel) return '?';
    
    // Estimate based on model complexity
    const vertices = scene.getTotalVertices();
    const estimatedMB = Math.round((vertices * 0.0001 + 2) * 10) / 10;
    return estimatedMB;
}

/**
 * Helper function for showing toast messages (if not already defined)
 */
function showToast(message, duration = 3000) {
    const existingToast = document.getElementById('export-toast');
    if (existingToast) {
        document.body.removeChild(existingToast);
    }
    
    const toast = document.createElement('div');
    toast.id = 'export-toast';
    toast.className = 'toast-message show';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(30, 30, 30, 0.9);
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 10000;
        transition: opacity 0.3s;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            if (toast.parentNode) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, duration);
}