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

    // Enable FXAA (Anti-Aliasing) from CONFIG
    pipeline.fxaaEnabled = CONFIG.postProcessing.fxaaEnabled;
    console.log(`FXAA enabled: ${pipeline.fxaaEnabled}`);

    // Store the pipeline in the scene for easy access
    scene.pipeline = pipeline;

    return pipeline;
}