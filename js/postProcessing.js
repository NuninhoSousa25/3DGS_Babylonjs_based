// js/postProcessing.js
import { CONFIG } from './config.js'; // Import CONFIG for post-processing configurations

/**
 * Adds and manages post-processing effects.
 * @param {BABYLON.Scene} scene 
 * @param {BABYLON.Camera} camera 
 * @returns {BABYLON.DefaultRenderingPipeline}
 */
export function addPostEffects(scene, camera) {
    // If pipeline already exists, dispose
    if (scene.pipeline) {
        scene.pipeline.dispose();
        scene.pipeline = null;
    }

    const pipeline = new BABYLON.DefaultRenderingPipeline(
        "defaultPipeline",
        false,
        scene,
        [camera]
    );

    // Apply Sharpen Settings from CONFIG
    pipeline.sharpenEnabled = CONFIG.postProcessing.sharpenEnabled;
    pipeline.sharpen.edgeAmount = CONFIG.postProcessing.sharpenEdgeAmount;
    console.log(`Sharpen enabled: ${pipeline.sharpenEnabled}, Edge amount: ${pipeline.sharpen.edgeAmount}`);

    // Apply anti-aliasing settings from CONFIG
    const aaType = CONFIG.postProcessing.antiAliasing.type;
    
    if (aaType === 'fxaa') {
        pipeline.fxaaEnabled = true;
        console.log(`FXAA enabled`);
    } else if (aaType === 'none') {
        pipeline.fxaaEnabled = false;
        console.log(`Anti-aliasing disabled`);
    } else {
        // For TAA, disable FXAA here - it will be handled separately
        pipeline.fxaaEnabled = false;
        console.log(`FXAA disabled for ${aaType.toUpperCase()} mode`);
    }

    // Store the pipeline in the scene for easy access
    scene.pipeline = pipeline;

    return pipeline;
}