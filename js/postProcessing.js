/* ========================================================================
   3D VIEWER - POST-PROCESSING EFFECTS
   ========================================================================
   
   PURPOSE:
   Manages visual post-processing effects including anti-aliasing, sharpening,
   and image enhancement. Provides configurable rendering pipeline with
   FXAA anti-aliasing and quality settings.
   
   EXPORTS:
   - addPostEffects() - Setup and configure rendering pipeline with effects
   
   FEATURES:
   - Anti-aliasing (FXAA)
   - Image sharpening with edge detection
   - Configurable quality presets
   - Performance-aware effect management
   - Mobile-optimized settings
   
   DEPENDENCIES:
   - Babylon.js DefaultRenderingPipeline
   - Configuration constants for effect settings
   
   ======================================================================== */

import { CONFIG } from './config.js';
import { detectDevice } from './deviceDetection.js';

/**
 * Adds and manages post-processing effects with mobile optimizations.
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

    // Detect device for mobile optimizations
    const device = detectDevice();
    const isMobile = device.isMobile;

    const pipeline = new BABYLON.DefaultRenderingPipeline(
        "defaultPipeline",
        false,
        scene,
        [camera]
    );

    // Apply mobile-optimized settings
    if (isMobile) {
        console.log('Applying mobile-optimized post-processing');
        
        // Disable expensive effects for mobile performance
        pipeline.sharpenEnabled = false;       // Disable sharpening on mobile
        pipeline.fxaaEnabled = false;          // Disable FXAA to save performance
        pipeline.bloomEnabled = false;         // Disable bloom - multiple render passes
        pipeline.depthOfFieldEnabled = false;  // Disable DOF - very expensive
        pipeline.chromaticAberrationEnabled = false; // Disable CA - unnecessary complexity
        
        // Optimize image processing for mobile GPUs
        if (pipeline.imageProcessingEnabled) {
            pipeline.imageProcessing.vignetteEnabled = false;     // Save processing power
            pipeline.imageProcessing.colorGradingEnabled = false; // Reduce shader complexity
        }
        
        console.log('Mobile post-processing: Minimal effects for optimal performance');
    } else {
        // Desktop - use full CONFIG settings
        pipeline.sharpenEnabled = CONFIG.postProcessing.sharpenEnabled;
        if (pipeline.sharpenEnabled) {
            pipeline.sharpen.edgeAmount = CONFIG.postProcessing.sharpenEdgeAmount;
        }

        // Apply FXAA from CONFIG
        pipeline.fxaaEnabled = CONFIG.postProcessing.fxaaEnabled;

        // Note: Disabling individual effects after pipeline creation can sometimes cause
        // performance overhead due to shader checks and allocated resources.
        // For best performance, use quality presets (Low/Medium/High) instead of
        // manually toggling effects on/off.
        console.log(`Desktop post-processing: Sharpen enabled: ${pipeline.sharpenEnabled}, Edge amount: ${pipeline.sharpen?.edgeAmount || 'N/A'}`);
    }

    // Store the pipeline in the scene for easy access
    scene.pipeline = pipeline;

    return pipeline;
}

/**
 * Performance monitoring and adaptive quality system
 */
export class PerformanceMonitor {
    constructor(scene, engine) {
        this.scene = scene;
        this.engine = engine;
        this.device = detectDevice();
        this.isActive = false;
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fpsHistory = [];
        this.currentPixelRatio = this.device.isMobile ? CONFIG.performance.mobile.maxPixelRatio : CONFIG.performance.desktop.maxPixelRatio;
        
        // Only enable on mobile
        if (this.device.isMobile) {
            this.config = CONFIG.performance.mobile;
            this.startMonitoring();
        }
    }
    
    startMonitoring() {
        if (this.isActive || !this.device.isMobile) return;
        
        this.isActive = true;
        console.log('Starting mobile performance monitoring');
        
        this.monitorInterval = setInterval(() => {
            this.checkPerformance();
        }, this.config.fpsCheckInterval);
    }
    
    stopMonitoring() {
        if (!this.isActive) return;
        
        this.isActive = false;
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
        }
        console.log('Performance monitoring stopped');
    }
    
    checkPerformance() {
        const fps = this.engine.getFps();
        this.fpsHistory.push(fps);
        
        // Keep only last 5 readings
        if (this.fpsHistory.length > 5) {
            this.fpsHistory.shift();
        }
        
        // Calculate average FPS
        const avgFPS = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
        
        // Adjust quality based on performance
        if (avgFPS < this.config.scalingThresholds.decrease && this.currentPixelRatio > this.config.minPixelRatio) {
            this.decreaseQuality();
        } else if (avgFPS > this.config.scalingThresholds.increase && this.currentPixelRatio < this.config.maxPixelRatio) {
            this.increaseQuality();
        }
    }
    
    decreaseQuality() {
        const newRatio = Math.max(this.currentPixelRatio - 0.1, this.config.minPixelRatio);
        if (newRatio !== this.currentPixelRatio) {
            this.currentPixelRatio = newRatio;
            this.engine.setHardwareScalingLevel(1 / newRatio);
            console.log(`Performance: Decreased quality to ${newRatio.toFixed(1)}x (${Math.round(this.engine.getFps())}fps)`);
        }
    }
    
    increaseQuality() {
        const newRatio = Math.min(this.currentPixelRatio + 0.1, this.config.maxPixelRatio);
        if (newRatio !== this.currentPixelRatio) {
            this.currentPixelRatio = newRatio;
            this.engine.setHardwareScalingLevel(1 / newRatio);
            console.log(`Performance: Increased quality to ${newRatio.toFixed(1)}x (${Math.round(this.engine.getFps())}fps)`);
        }
    }
    
    dispose() {
        this.stopMonitoring();
    }
}

/**
 * Memory management system for mobile devices
 */
export class MobileMemoryManager {
    constructor(scene, engine) {
        this.scene = scene;
        this.engine = engine;
        this.device = detectDevice();
        
        if (this.device.isMobile) {
            this.config = CONFIG.performance.mobile.memoryManagement;
            this.startMemoryManagement();
        }
    }
    
    startMemoryManagement() {
        console.log('Starting mobile memory management');
        
        // Periodic garbage collection
        this.gcInterval = setInterval(() => {
            this.performGarbageCollection();
        }, this.config.garbageCollectInterval);
        
        // Track memory usage
        if ('memory' in performance) {
            this.memoryInterval = setInterval(() => {
                this.checkMemoryUsage();
            }, 5000); // Check every 5 seconds
        }
        
        // Listen for memory pressure events (if supported)
        if ('webkitMemoryInfo' in performance) {
            this.startMemoryPressureMonitoring();
        }
    }
    
    performGarbageCollection() {
        try {
            // Force dispose of unused meshes
            const meshes = this.scene.meshes.slice(); // Copy array to avoid modification during iteration
            meshes.forEach(mesh => {
                if (mesh.isDisposed() || (mesh.material && mesh.material.isDisposed())) {
                    mesh.dispose();
                }
            });
            
            // Clean up unused materials
            const materials = this.scene.materials.slice();
            materials.forEach(material => {
                if (material.getActiveTextures().length === 0 && !material.isUsed) {
                    material.dispose();
                }
            });
            
            // Clean up unused textures
            const textures = this.scene.textures.slice();
            textures.forEach(texture => {
                if (texture.isReady() && texture.references === 0) {
                    texture.dispose();
                }
            });
            
            // Force JavaScript garbage collection if available
            if (window.gc && typeof window.gc === 'function') {
                window.gc();
            }
            
        } catch (error) {
            console.warn('Error during garbage collection:', error);
        }
    }
    
    checkMemoryUsage() {
        if (!('memory' in performance)) return;
        
        const memory = performance.memory;
        const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
        const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024);
        const limitMB = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);
        
        // Warn if memory usage is high
        const usagePercent = (usedMB / limitMB) * 100;
        
        if (usagePercent > 80) {
            console.warn(`High memory usage: ${usedMB}MB/${limitMB}MB (${usagePercent.toFixed(1)}%)`);
            // this.performEmergencyCleanup(); // Disabled per user request
        } else if (usagePercent > 60) {
            console.log(`Memory usage: ${usedMB}MB/${limitMB}MB (${usagePercent.toFixed(1)}%)`);
        }
    }
    
    performEmergencyCleanup() {
        console.log('Performing emergency memory cleanup');
        
        // Aggressively reduce quality
        const currentLevel = this.engine.getHardwareScalingLevel();
        this.engine.setHardwareScalingLevel(Math.max(currentLevel * 0.7, 1 / CONFIG.performance.mobile.minPixelRatio));
        
        // Dispose of non-essential resources
        this.performGarbageCollection();
        
        // Disable expensive effects
        if (this.scene.pipeline) {
            this.scene.pipeline.sharpenEnabled = false;
            this.scene.pipeline.fxaaEnabled = false;
            this.scene.pipeline.bloomEnabled = false;
        }
        
        console.log('Emergency cleanup completed');
    }
    
    startMemoryPressureMonitoring() {
        // Note: webkitMemoryInfo is deprecated but still available in some browsers
        const checkMemoryPressure = () => {
            const info = performance.webkitMemoryInfo;
            if (info) {
                const pressure = (info.usedJSHeapSize / info.jsHeapSizeLimit);
                if (pressure > 0.8) {
                    // this.performEmergencyCleanup(); // Disabled per user request
                    console.warn(`High memory pressure: ${(pressure * 100).toFixed(1)}%`);
                }
            }
        };
        
        setInterval(checkMemoryPressure, 3000);
    }
    
    dispose() {
        if (this.gcInterval) {
            clearInterval(this.gcInterval);
        }
        
        if (this.memoryInterval) {
            clearInterval(this.memoryInterval);
        }
        
        console.log('Memory manager disposed');
    }
}

/**
 * Create and initialize mobile performance systems
 * @param {BABYLON.Scene} scene 
 * @param {BABYLON.Engine} engine 
 * @returns {Object} Performance monitoring systems
 */
export function initializeMobilePerformance(scene, engine) {
    const device = detectDevice();
    
    if (!device.isMobile) {
        return null;
    }
    
    console.log('Initializing mobile performance systems');
    
    const performanceMonitor = new PerformanceMonitor(scene, engine);
    const memoryManager = new MobileMemoryManager(scene, engine);
    
    return {
        performanceMonitor,
        memoryManager,
        dispose: () => {
            performanceMonitor.dispose();
            memoryManager.dispose();
        }
    };
}

