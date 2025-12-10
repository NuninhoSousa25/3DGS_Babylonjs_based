/* ========================================================================
   3D VIEWER - WEBGPU DETECTION
   ========================================================================

   PURPOSE:
   Detects WebGPU availability and capabilities for performance optimization.
   Provides detailed information about GPU adapter and device limits.

   EXPORTS:
   - detectWebGPU() - Check if WebGPU is available and get capabilities
   - isWebGPUSupported() - Quick boolean check for WebGPU support

   FEATURES:
   - Browser WebGPU API detection
   - GPU adapter enumeration
   - Device limits and capabilities reporting
   - Graceful error handling

   ======================================================================== */

/**
 * Detects WebGPU availability and returns detailed capability information
 * @returns {Promise<Object>} Object containing availability status, adapter info, and limits
 * @description Checks if navigator.gpu exists, requests adapter, and gathers device information.
 *              Returns comprehensive data for making renderer selection decisions.
 * @example
 * const gpuInfo = await detectWebGPU();
 * if (gpuInfo.available) {
 *     console.log('WebGPU adapter:', gpuInfo.adapterInfo);
 *     console.log('Device limits:', gpuInfo.limits);
 * }
 */
export async function detectWebGPU() {
    // Check for Secure Context first
    if (!window.isSecureContext) {
        return {
            available: false,
            reason: 'Secure Context required (HTTPS or localhost)',
            browser: getBrowserInfo(),
            recommendation: 'WebGPU only works over HTTPS or localhost. If testing locally via IP, switch to localhost.'
        };
    }

    // Check if WebGPU API exists
    if (!navigator.gpu) {
        return {
            available: false,
            reason: 'WebGPU API not found (navigator.gpu is undefined)',
            browser: getBrowserInfo(),
            recommendation: 'Use Chrome 113+, Edge 113+, or enable WebGPU flag in Firefox'
        };
    }

    try {
        // Request GPU adapter
        const adapter = await navigator.gpu.requestAdapter();

        if (!adapter) {
            return {
                available: false,
                reason: 'No WebGPU adapter found (GPU may not support WebGPU)',
                browser: getBrowserInfo(),
                recommendation: 'Check GPU drivers are up to date'
            };
        }

        // Request device from adapter
        const device = await adapter.requestDevice();

        // Get adapter info (may require feature flag in some browsers)
        let adapterInfo = null;
        try {
            adapterInfo = await adapter.requestAdapterInfo();
        } catch (e) {
            // AdapterInfo may not be available in all browsers yet
            adapterInfo = {
                vendor: 'Unknown',
                architecture: 'Unknown',
                device: 'Unknown',
                description: 'Adapter info not available'
            };
        }

        // Clean up device (we only needed it for testing)
        device.destroy();

        return {
            available: true,
            adapter: adapter.isFallbackAdapter ? 'Software (Fallback)' : 'Hardware',
            adapterInfo: {
                vendor: adapterInfo.vendor || 'Unknown',
                architecture: adapterInfo.architecture || 'Unknown',
                device: adapterInfo.device || 'Unknown',
                description: adapterInfo.description || 'N/A'
            },
            features: Array.from(adapter.features || []),
            limits: {
                maxTextureDimension2D: device.limits.maxTextureDimension2D,
                maxBufferSize: device.limits.maxBufferSize,
                maxBindGroups: device.limits.maxBindGroups,
                maxComputeWorkgroupSizeX: device.limits.maxComputeWorkgroupSizeX,
                maxStorageBufferBindingSize: device.limits.maxStorageBufferBindingSize
            },
            browser: getBrowserInfo()
        };

    } catch (error) {
        return {
            available: false,
            reason: `WebGPU initialization failed: ${error.message}`,
            error: error.toString(),
            browser: getBrowserInfo(),
            recommendation: 'WebGL will be used as fallback'
        };
    }
}

/**
 * Quick boolean check for WebGPU support
 * @returns {Promise<boolean>} True if WebGPU is available, false otherwise
 * @description Simplified version of detectWebGPU() for quick availability checks
 * @example
 * if (await isWebGPUSupported()) {
 *     // Use WebGPU renderer
 * } else {
 *     // Use WebGL fallback
 * }
 */
export async function isWebGPUSupported() {
    const result = await detectWebGPU();
    return result.available;
}

/**
 * Gets browser information for debugging and compatibility tracking
 * @returns {Object} Browser name and version information
 * @private
 */
function getBrowserInfo() {
    const ua = navigator.userAgent;
    let browserName = 'Unknown';
    let browserVersion = 'Unknown';

    // Detect browser
    if (ua.includes('Chrome') && !ua.includes('Edg')) {
        browserName = 'Chrome';
        const match = ua.match(/Chrome\/(\d+)/);
        browserVersion = match ? match[1] : 'Unknown';
    } else if (ua.includes('Edg')) {
        browserName = 'Edge';
        const match = ua.match(/Edg\/(\d+)/);
        browserVersion = match ? match[1] : 'Unknown';
    } else if (ua.includes('Firefox')) {
        browserName = 'Firefox';
        const match = ua.match(/Firefox\/(\d+)/);
        browserVersion = match ? match[1] : 'Unknown';
    } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
        browserName = 'Safari';
        const match = ua.match(/Version\/(\d+)/);
        browserVersion = match ? match[1] : 'Unknown';
    }

    return {
        name: browserName,
        version: browserVersion,
        userAgent: ua
    };
}

/**
 * Logs detailed WebGPU detection results to console
 * @param {Object} gpuInfo - Result from detectWebGPU()
 * @description Pretty-prints WebGPU capabilities for debugging
 */
export function logWebGPUInfo(gpuInfo) {
    console.group('🎮 WebGPU Detection Results');

    console.log(`Browser: ${gpuInfo.browser.name} ${gpuInfo.browser.version}`);
    console.log(`WebGPU Available: ${gpuInfo.available ? '✅ YES' : '❌ NO'}`);

    if (gpuInfo.available) {
        console.log(`Adapter Type: ${gpuInfo.adapter}`);
        console.log(`GPU Vendor: ${gpuInfo.adapterInfo.vendor}`);
        console.log(`GPU Device: ${gpuInfo.adapterInfo.device}`);
        console.log(`Architecture: ${gpuInfo.adapterInfo.architecture}`);

        if (gpuInfo.features && gpuInfo.features.length > 0) {
            console.log(`Features: ${gpuInfo.features.join(', ')}`);
        }

        console.group('Device Limits:');
        console.log(`Max Texture 2D: ${gpuInfo.limits.maxTextureDimension2D}px`);
        console.log(`Max Buffer Size: ${(gpuInfo.limits.maxBufferSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`Max Bind Groups: ${gpuInfo.limits.maxBindGroups}`);
        console.groupEnd();
    } else {
        console.warn(`Reason: ${gpuInfo.reason}`);
        console.log(`Recommendation: ${gpuInfo.recommendation}`);
    }

    console.groupEnd();
}
