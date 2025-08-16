/* ========================================================================
   3D VIEWER - VIEWER EXPORT SYSTEM
   ========================================================================
   
   PURPOSE:
   Creates exportable standalone viewers with current model, settings, and
   camera state. Generates self-contained HTML files or ZIP packages that
   can be shared and run independently.
   
   EXPORTS:
   - ViewerExporter - Class for creating exportable viewer packages
   - setupExportButton() - Add export functionality to UI
   - showExportDialog() - Display export options dialog
   
   FEATURES:
   - Self-contained HTML export with embedded assets
   - ZIP package export with organized file structure
   - Model data embedding (base64) or URL referencing
   - Camera state and settings preservation
   - Post-processing configuration export
   - Camera limits export for constrained navigation
   - Multiple format support (HTML, ZIP)
   
   DEPENDENCIES:
   - Configuration system for export settings
   - Helper utilities for DOM manipulation
   - JSZip library for ZIP generation (loaded dynamically)
   - Toast notifications for user feedback
   
   ======================================================================== */

import { CONFIG } from '../config.js';
import { WindowEvents, ErrorMessages } from '../helpers.js';
import { showToast } from '../ui/components/toast.js';
import { EXPORT_CONFIG, EXPORT_TEMPLATES, EXPORT_UTILS } from './exportConfig.js';

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
            console.error(ErrorMessages.SYSTEM.EXPORT_FAILED(), error);
            showToast(ErrorMessages.SYSTEM.EXPORT_FAILED(error.message), 5000);
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
                exportVersion: EXPORT_CONFIG.metadata.version,
                generatedBy: EXPORT_CONFIG.metadata.generatedBy,
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
            throw new Error(ErrorMessages.MODEL.NO_MODEL_TO_EXPORT);
        }

        // For splat/ply models, we need to fetch the original data
        if (modelType === 'splat' && modelUrl) {
            try {
                const response = await fetch(modelUrl);
                const blob = await response.blob();
                const base64 = await EXPORT_UTILS.blobToBase64(blob);
                
                return {
                    type: modelType,
                    format: EXPORT_UTILS.getModelFormat(modelUrl),
                    data: base64,
                    size: blob.size,
                    url: modelUrl
                };
            } catch (error) {
            console.error(ErrorMessages.MODEL.FETCH_FAILED, error);
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
        EXPORT_UTILS.downloadBlob(blob, `viewer-export-${Date.now()}.html`);
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

        return EXPORT_TEMPLATES.generateSelfContainedHTML(exportData, cssContent, modelDataUrl);
    }

    /**
     * Export as ZIP package with separate files
     */
    async exportAsZip(exportData) {
        // Check if JSZip is available
        if (!window.JSZip) {
            await EXPORT_UTILS.loadExternalLibrary(EXPORT_CONFIG.cdn.jszip);
        }
        
        const zip = new JSZip();
        
        // Add HTML file
        const htmlContent = EXPORT_TEMPLATES.generateModularHTML(exportData);
        zip.file("index.html", htmlContent);
        
        // Add CSS file
        const cssContent = await this.fetchAndInlineCSS();
        zip.file("styles.css", cssContent);
        
        // Add JavaScript files
        const jsContent = EXPORT_TEMPLATES.generateModularJS(exportData);
        zip.file("viewer.js", jsContent);
        
        // Add config file
        zip.file("config.json", JSON.stringify(exportData, null, 2));
        
        // Add model file if it exists
        if (exportData.modelData.data) {
            const modelBlob = EXPORT_UTILS.base64ToBlob(exportData.modelData.data);
            const modelFileName = `model.${exportData.modelData.format}`;
            zip.file(modelFileName, modelBlob);
        }
        
        // Add README
        const readmeContent = EXPORT_TEMPLATES.generateReadme(exportData);
        zip.file("README.md", readmeContent);
        
        // Generate and download ZIP
        const zipBlob = await zip.generateAsync({ 
            type: "blob",
            compression: EXPORT_CONFIG.compression.algorithm,
            compressionOptions: { level: EXPORT_CONFIG.compression.level }
        });
        
        EXPORT_UTILS.downloadBlob(zipBlob, `viewer-export-${Date.now()}.zip`);
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
     * Utility: Serialize mesh model to GLB
     */
    async serializeMeshModel(mesh) {
        // Use Babylon's GLTF2Export if available
        if (BABYLON.GLTF2Export) {
            const gltf = await BABYLON.GLTF2Export.GLBAsync(this.scene, "exportedModel");
            return await EXPORT_UTILS.blobToBase64(gltf.glTFFiles["exportedModel.glb"]);
        }
        
        // Fallback: return null if GLTF2Export not available
        console.warn('GLTF2Export not available, mesh export skipped');
        return null;
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
                    <div class="export-option-icon">${EXPORT_CONFIG.formats.html.icon}</div>
                    <div class="export-option-title">${EXPORT_CONFIG.formats.html.name}</div>
                    <div class="export-option-desc">${EXPORT_CONFIG.formats.html.description} (~${EXPORT_UTILS.estimateHTMLSize()} MB)</div>
                </button>
                
                <button id="exportZIP" class="export-option">
                    <div class="export-option-icon">${EXPORT_CONFIG.formats.zip.icon}</div>
                    <div class="export-option-title">${EXPORT_CONFIG.formats.zip.name}</div>
                    <div class="export-option-desc">${EXPORT_CONFIG.formats.zip.description}</div>
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


