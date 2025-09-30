/* ========================================================================
   DEVICE MANAGER UTILITY
   ========================================================================

   PURPOSE:
   Cached device detection utility to avoid redundant device detection calls.
   Provides a singleton pattern to ensure device detection is only performed once
   per session, improving performance across the application.

   EXPORTS:
   - DeviceManager class - Singleton for cached device detection
   - getDeviceInfo() - Convenience function to get cached device info

   ======================================================================== */

import { detectDevice } from '../deviceDetection.js';

/**
 * Singleton class for managing cached device detection
 */
class DeviceManager {
    constructor() {
        this._deviceInfo = null;
        this._initialized = false;
    }

    /**
     * Get cached device information, detecting on first call
     * @returns {Object} Device information object
     */
    getDeviceInfo() {
        if (!this._initialized) {
            this._deviceInfo = detectDevice();
            this._initialized = true;
        }
        return this._deviceInfo;
    }

    /**
     * Force refresh of device information (useful for responsive design changes)
     */
    refresh() {
        this._deviceInfo = detectDevice();
        this._initialized = true;
        return this._deviceInfo;
    }

    /**
     * Check if device info has been cached
     * @returns {boolean} True if device info is cached
     */
    isInitialized() {
        return this._initialized;
    }
}

// Create singleton instance
const deviceManager = new DeviceManager();

/**
 * Convenience function to get cached device information
 * @returns {Object} Device information object
 */
export function getDeviceInfo() {
    return deviceManager.getDeviceInfo();
}

/**
 * Force refresh device detection (useful for testing or window resize)
 * @returns {Object} Updated device information object
 */
export function refreshDeviceInfo() {
    return deviceManager.refresh();
}

/**
 * Export the singleton instance for advanced use cases
 */
export { deviceManager as DeviceManager };