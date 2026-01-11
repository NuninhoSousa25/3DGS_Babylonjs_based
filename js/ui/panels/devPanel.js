/* ========================================================================
   DEVELOPER TOOLS PANEL COMPONENT
   ======================================================================== */

import { ICONS } from '../components/icons.js';
import { createElement } from '../components/controls.js';
import { showToast } from '../components/toast.js';
import { loadModel } from '../../modelLoader.js';
import { applyModelScaleFromUrl } from '../../urlManager.js';
import { setupUIUpdates, startUIUpdates, updateFileSizeDisplay,  stopUIUpdates, restartUIUpdates, triggerVerticesUpdate, DOM, Events, ErrorMessages, LoadingSpinner } from '../../helpers.js';
import { CONFIG } from '../../config.js';
import { switchRenderer } from '../../main.js';
import { detectWebGPU } from '../../webgpu-detector.js';
import { PickingStrategies, setPickingStrategy } from '../../picking.js';

/**
 * Create developer tools section HTML
 */

/**
 * Create developer tools section HTML
 */
export function createDevSection() {
    return `
        <div id="devContent" class="content-section">
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
                    <div class="info-row">
                        <span class="info-label">File Size:</span>
                        <span id="controlPanelFileSize" class="info-value">-</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Renderer:</span>
                        <span id="controlPanelRenderer" class="info-value">-</span>
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
                    <div class="info-row">
                        <span class="info-label">WebGPU Available:</span>
                        <span id="deviceWebGPU" class="info-value">-</span>
                    </div>
                </div>
            </div>
            
            <div class="settings-separator"></div>

            <div class="dev-section">
                <div class="dev-title">Picking Strategy</div>
                <div class="scene-info">
                    <div class="info-row">
                        <select id="pickingStrategySelect" style="width: 100%; margin-top: 5px; background: #333; color: white; border: 1px solid #555; padding: 4px; border-radius: 4px;">
                            <option value="ALL">ALL (Default - Auto Fallback)</option>
                            <option value="STRATEGY_1">1. Helper Mesh</option>
                            <option value="STRATEGY_2">2. Broader Selection</option>
                            <option value="STRATEGY_3">3. Ray-Sphere (Splat)</option>
                            <option value="STRATEGY_4">4. Standard Ray</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <div class="settings-separator"></div>
            
            <div class="dev-section">
                <div class="dev-title">Load Model</div>
                <div class="model-loader file-loader">
                    <button id="loadModelFileButton" class="action-button">
                        ${ICONS.file_open}
                        <span class="button-text">Load from File</span>
                    </button>
                </div>
                
                <div class="model-loader url-loader">
                    <input type="text" id="modelUrlInput" placeholder="Enter model URL" class="url-input">
                    <button id="loadModelUrlButton" class="action-button">
                        ${ICONS.file_open}
                        <span class="button-text">Load from URL</span>
                    </button>
                </div>
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
    const fileButton = document.getElementById("loadModelFileButton");
    const urlButton = document.getElementById("loadModelUrlButton");
    
    // File loading handler
    if (fileButton) {
        fileButton.addEventListener("click", () => {
            triggerFileLoad(scene);
        });
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

    setupDevPanel(scene.getEngine());
    setupPickingStrategyControls();
}

/**
 * Setup picking strategy controls
 */
function setupPickingStrategyControls() {
    const select = document.getElementById('pickingStrategySelect');
    if (select) {
        select.addEventListener('change', (e) => {
            setPickingStrategy(e.target.value);
        });
    }
}

async function setupDevPanel(engine) {
    const webGpuAvailable = await detectWebGPU();
    const deviceWebGPU = document.getElementById('deviceWebGPU');
    if (deviceWebGPU) {
        deviceWebGPU.textContent = webGpuAvailable.available ? 'Yes' : 'No';
    }

    const controlPanelRenderer = document.getElementById('controlPanelRenderer');
    if (controlPanelRenderer) {
        controlPanelRenderer.textContent = engine.engineType;
    }
}

/**
 * Load model with loading spinner and error handling
 */
async function loadModelWithSpinner(scene, source, type) {
    try {
        LoadingSpinner.show("flex");
        
        // The call to loadModel is correct.
        await loadModel(scene, source, CONFIG.modelLoader.defaultFallbackModel);
        
        // This is still useful to apply URL params to a newly loaded model.
        applyModelScaleFromUrl(scene);
        
        // The block that set scene.currentModelUrl and scene.currentModelType has been removed.
        // loadModel from modelLoader.js already handles this correctly.
        
        // Trigger vertices update for dev panel
        triggerVerticesUpdate();
        
        const fileName = type === 'file' ? source.name : 'URL';
        showToast(`Model "${fileName}" loaded successfully`);
        
        closeAllPanels();
        
    } catch (error) {
        console.error("Error loading model:", error);
        showToast(ErrorMessages.MODEL.LOAD_FAILED(error.message), 5000);
    } finally {
        LoadingSpinner.hide();
    }
}

/**
 * Trigger file loading dialog and handle file selection
 */
function triggerFileLoad(scene) {
    // Create a hidden file input element using utility
    const fileInput = createElement('input', {
        type: 'file',
        accept: '.splat,.ply,.spz,.gltf,.glb,.obj,.sog'
    });
    fileInput.style.display = 'none';
    
    // Handle file selection
    fileInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        updateFileSizeDisplay(file.size);
        
        // Validate file extension
        const extension = file.name.split('.').pop().toLowerCase();
        if (!CONFIG.modelLoader.supportedFormats.includes(extension)) {
            showToast(`Unsupported file format: .${extension}. Supported formats: ${CONFIG.modelLoader.supportedFormats.join(', ')}`, 5000);
            return;
        }
        
        // Load the model
        try {
            LoadingSpinner.show("flex");
            const result = await loadModel(scene, file, CONFIG.modelLoader.defaultFallbackModel);
            
            // Store model URL for sharing
            if (result && result.currentModel) {
                scene.currentModelUrl = URL.createObjectURL(file);
            }
            
            // Trigger vertices update for dev panel
            triggerVerticesUpdate();
            
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
    fileInput.click();
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