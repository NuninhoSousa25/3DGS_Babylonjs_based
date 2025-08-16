/* ========================================================================
   DEVELOPER TOOLS PANEL COMPONENT
   ======================================================================== */

import { ICONS } from '../components/icons.js';
import { createElement } from '../components/controls.js';
import { showToast } from '../components/toast.js';
import { loadModel } from '../../modelLoader.js';
import { setupUIUpdates, startUIUpdates, stopUIUpdates, restartUIUpdates, DOM, Events, ErrorMessages, LoadingSpinner } from '../../helpers.js';
import { CONFIG } from '../../config.js';

/**
 * Create developer tools section HTML
 */
export function createDevSection() {
    return `
        <div id="devContent" class="content-section" style="display: none;">
            <h4>Developer Tools</h4>
            
            <div class="dev-section">
                <div class="dev-title">Performance</div>
                <div class="scene-info">
                    <div class="info-row">
                        <span class="info-label">FPS:</span>
                        <span id="controlPanelFps" class="info-value">0</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Resolution:</span>
                        <span id="controlPanelResolution" class="info-value">0 x 0</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Vertices:</span>
                        <span id="controlPanelVertices" class="info-value">0</span>
                    </div>
                </div>
            </div>
            
            <div class="settings-separator"></div>
            
            <div class="dev-section">
                <div class="dev-title">Device Detection</div>
                <div class="scene-info">
                    <div class="info-row">
                        <span class="info-label">Touch Support:</span>
                        <span id="deviceTouch" class="info-value">-</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Mobile UA:</span>
                        <span id="deviceMobile" class="info-value">-</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Touch Device:</span>
                        <span id="deviceTouchDevice" class="info-value">-</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Device Type:</span>
                        <span id="deviceType" class="info-value">-</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Max Touch Points:</span>
                        <span id="deviceMaxTouch" class="info-value">-</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Screen Size:</span>
                        <span id="deviceScreenSize" class="info-value">-</span>
                    </div>
                </div>
            </div>
            
            <div class="settings-separator"></div>
            
            <div class="dev-section">
                <div class="dev-title">Load Model</div>
                <div class="model-loader file-loader">
                    <button id="loadModelFileButton" class="action-button">
                        <span class="button-text">Load from File</span>
                    </button>
                </div>
                
                <div class="model-loader url-loader">
                    <input type="text" id="modelUrlInput" placeholder="Enter model URL" class="url-input">
                    <button id="loadModelUrlButton" class="action-button">
                        <span class="button-text">Load from URL</span>
                    </button>
                </div>
            </div>
            
            <div id="loadingSpinner" class="loading-spinner">
                <div class="spinner-animation"></div>
                <div class="spinner-text">Loading Model...</div>
            </div>
            
            <div class="settings-separator"></div>
            
            <div class="dev-section">
                <div class="dev-title">Export</div>
                <button id="exportButton" class="action-button">
                    ${ICONS.export}
                    <span class="button-text">Export Viewer</span>
                </button>
            </div>
        </div>
    `;
}

/**
 * Setup model loading functionality
 */
export function setupModelLoading(scene) {
    console.log("setupModelLoading called");
    const fileButton = document.getElementById("loadModelFileButton");
    const urlButton = document.getElementById("loadModelUrlButton");
    
    console.log("Elements found:");
    console.log("- fileButton:", fileButton);
    console.log("- urlButton:", urlButton);
    
    // File loading handler
    if (fileButton) {
        console.log("Setting up file loading button");
        fileButton.addEventListener("click", () => {
            console.log("File loading button clicked");
            triggerFileLoad(scene);
        });
        console.log("File loading button event listener attached");
    } else {
        console.error("File loading button not found!");
    }
    
    // URL loading handler
    if (urlButton) {
        urlButton.addEventListener("click", async () => {
            const urlInput = document.getElementById("modelUrlInput");
            if (!urlInput || !urlInput.value.trim()) {
                showToast(ErrorMessages.INPUT.EMPTY_URL, CONFIG.ui.toast.displayDuration);
                return;
            }
            
            await loadModelWithSpinner(scene, urlInput.value.trim(), "url");
        });
    }
}

/**
 * Load model with loading spinner and error handling
 */
async function loadModelWithSpinner(scene, source, type) {
    try {
        // Show loading spinner
        LoadingSpinner.show("flex");
        
        console.log(`Loading model from ${type}: ${type === 'file' ? source.name : source}`);
        console.log("Source object:", source);
        
        if (type === 'file') {
            console.log("File details - Name:", source.name, "Size:", source.size, "Type:", source.type);
            const extension = source.name.split('.').pop().toLowerCase();
            console.log("File extension:", extension);
            console.log("Supported formats:", CONFIG.modelLoader.supportedFormats);
            console.log("Extension supported:", CONFIG.modelLoader.supportedFormats.includes(extension));
        }
        
        const result = await loadModel(scene, source, CONFIG.modelLoader.defaultFallbackModel);
        console.log("Load model result:", result);
        
        // Apply model scale from URL if present (for shared URLs)
        applyModelScaleFromUrl(scene);
        
        // Store model URL for sharing
        if (result && result.currentModel) {
            // Set the model URL for the exporter and sharing feature
            scene.currentModelUrl = (type === 'file') ? URL.createObjectURL(source) : source;

            // Determine and set the model type for the exporter
            const fileName = (type === 'file') ? source.name : source;
            const extension = fileName.split('?')[0].split('.').pop().toLowerCase();

            if (['splat', 'ply'].includes(extension)) {
                scene.currentModelType = 'splat';
            } else if (['gltf', 'glb', 'obj'].includes(extension)) {
                scene.currentModelType = 'mesh';
            } else {
                scene.currentModelType = 'unknown'; // Handle other cases
            }

            // This property is also used by the exporter
            scene.currentModel = result.currentModel;

            console.log(`Model info set on scene: type='${scene.currentModelType}', url='${scene.currentModelUrl}'`);
        }
        
        // Show success message
        const fileName = type === 'file' ? source.name : 'URL';
        showToast(`Model "${fileName}" loaded successfully`);
        
        // Close panel
        closeAllPanels();
        
    } catch (error) {
        console.error("Error loading model:", error);
        showToast(ErrorMessages.MODEL.LOAD_FAILED(error.message), 5000);
    } finally {
        // Hide loading spinner
        LoadingSpinner.hide();
    }
}

/**
 * Trigger file loading dialog and handle file selection
 */
function triggerFileLoad(scene) {
    console.log("File open button clicked");
    
    // Create a hidden file input element using utility
    const fileInput = createElement('input', {
        type: 'file',
        accept: '.splat,.ply,.spz,.gltf,.glb,.obj'
    });
    fileInput.style.display = 'none';
    
    // Handle file selection
    fileInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) {
            console.log("No file selected");
            return;
        }
        
        console.log("File selected:", file.name, "Size:", file.size);
        
        // Validate file extension
        const extension = file.name.split('.').pop().toLowerCase();
        if (!CONFIG.modelLoader.supportedFormats.includes(extension)) {
            showToast(`Unsupported file format: .${extension}. Supported formats: ${CONFIG.modelLoader.supportedFormats.join(', ')}`, 5000);
            return;
        }
        
        // Load the model
        try {
            LoadingSpinner.show("flex");
            
            console.log("Starting model loading...");
            const result = await loadModel(scene, file, CONFIG.modelLoader.defaultFallbackModel);
            console.log("Model loaded successfully:", result);
            
            // Store model URL for sharing
            if (result && result.currentModel) {
                scene.currentModelUrl = URL.createObjectURL(file);
            }
            
            showToast(`Model "${file.name}" loaded successfully`);
            
        } catch (error) {
            console.error("Error loading model:", error);
            showToast(ErrorMessages.MODEL.LOAD_FAILED(error.message), 5000);
        } finally {
            // Hide loading spinner
            LoadingSpinner.hide();
        }
        
        // Clean up the input element
        document.body.removeChild(fileInput);
    });
    
    // Trigger the file dialog
    document.body.appendChild(fileInput);
    console.log("File input created and added to DOM, triggering click...");
    fileInput.click();
    console.log("File dialog should now be open");
}

// Helper functions that need to be imported or defined locally
function applyModelScaleFromUrl(scene) {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.has('scale') && scene.currentModel) {
        const scale = parseFloat(urlParams.get('scale'));
        
        if (!isNaN(scale) && scale > 0) {
            // Apply the scale to the model
            scene.currentModel.scaling.setAll(scale);
            
            // Update the UI slider to reflect the loaded scale
            const modelScaleRange = document.getElementById('modelScaleRange');
            const modelScaleDisplay = document.getElementById('modelScaleRangeDisplay');
            if (modelScaleRange && modelScaleDisplay) {
                modelScaleRange.value = scale;
                modelScaleDisplay.textContent = scale.toFixed(1);
            }
            
            console.log(`Applied model scale from URL: ${scale}`);
        }
    }
}

function closeAllPanels() {
    // Use cached DOM queries for better performance
    const allContentSections = DOM.getAllContentSections();
    const controlPanelContent = DOM.get("controlPanelContent");
    const controlPanel = DOM.get("controlPanel");
    const buttons = DOM.getAllIconButtons();
    
    allContentSections.forEach(section => section.style.display = "none");
    if (controlPanelContent) controlPanelContent.style.display = "none";
    if (controlPanel) controlPanel.classList.remove("expanded");
    buttons.forEach(btn => btn.classList.remove('active'));
    
    // Stop UI updates when closing all panels
    stopUIUpdates();
}