/* ========================================================================
   URL UTILITIES
   ========================================================================

   PURPOSE:
   Shared utilities for URL parameter handling and detection.
   Provides common functions used across the application for URL processing.

   EXPORTS:
   - isSharedURL() - Check if current URL contains shared scene parameters

   ======================================================================== */

/**
 * Check if URL contains parameters indicating a shared scene
 * @returns {boolean} True if URL contains shared scene parameters
 */
export function isSharedURL() {
    const urlParams = getCurrentUrlParams();

    // Check for compressed URL (shared URLs are usually compressed)
    if (urlParams.has('c')) {
        return true;
    }

    // Check for common shared URL parameters
    const sharedParams = ['model', 'm', 'alpha', 'a', 'beta', 'b', 'radius', 'r'];
    return sharedParams.some(param => urlParams.has(param));
}

/**
 * Get current URL parameters as URLSearchParams object
 * @returns {URLSearchParams} Current URL parameters
 */
export function getCurrentUrlParams() {
    return new URLSearchParams(window.location.search);
}

/**
 * Get the base URL without query parameters
 * @returns {string} Base URL without query string
 */
export function getBaseUrl() {
    return window.location.href.split('?')[0];
}

/**
 * Check if a specific parameter exists in the current URL
 * @param {string} paramName - Parameter name to check
 * @returns {boolean} True if parameter exists
 */
export function hasUrlParam(paramName) {
    return getCurrentUrlParams().has(paramName);
}

/**
 * Get a specific parameter value from the current URL
 * @param {string} paramName - Parameter name to get
 * @param {string} [defaultValue] - Default value if parameter doesn't exist
 * @returns {string|null} Parameter value or default
 */
export function getUrlParam(paramName, defaultValue = null) {
    return getCurrentUrlParams().get(paramName) || defaultValue;
}