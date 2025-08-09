// js/deviceDetection.js

/**
 * Unified device detection system with consistent breakpoints
 */

export const DEVICE_BREAKPOINTS = {
    MOBILE: 768,      // Align with CSS media queries
    TABLET: 1024,
    DESKTOP: 1200
};

/**
 * Simple mobile device detection function
 * @returns {boolean} True if mobile device detected
 */
export function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           ('ontouchstart' in window) || 
           (navigator.maxTouchPoints > 0);
}

/**
 * Simple and reliable device detection - user-agent only
 * @returns {Object} Device information object
 */
export function detectDevice() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const userAgent = navigator.userAgent;
    const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    
    // Debug: Log the actual user-agent string
    console.log('=== DEVICE DETECTION DEBUG ===');
    console.log('Full User Agent:', userAgent);
    console.log('Width x Height:', width, 'x', height);
    console.log('Has Touch:', hasTouch);
    
    // Simple, reliable user-agent detection
    const isMobileDevice = /Android.*Mobile|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Windows Phone/i.test(userAgent);
    const isTabletDevice = /iPad|Android(?!.*Mobile)|Tablet/i.test(userAgent);
    const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroidDevice = /Android/i.test(userAgent);
    
    console.log('Mobile UA Match:', isMobileDevice);
    console.log('Tablet UA Match:', isTabletDevice);
    console.log('iOS UA Match:', isIOSDevice);
    console.log('Android UA Match:', isAndroidDevice);
    console.log('===============================');
    
    // Simple device categorization based on user-agent only
    let deviceCategory = 'desktop';
    if (isMobileDevice) {
        deviceCategory = 'mobile';
    } else if (isTabletDevice) {
        deviceCategory = 'tablet';
    }
    
    // Touch device classification (for UI behavior, not sizing)
    const isTouchDevice = isMobileDevice || isTabletDevice || hasTouch;
    
    return {
        // Simple flags
        isMobile: isMobileDevice,
        isTablet: isTabletDevice,
        isDesktop: !isMobileDevice && !isTabletDevice,
        isTouchDevice,
        
        // Platform detection
        isIOS: isIOSDevice,
        isAndroid: isAndroidDevice,
        hasTouch,
        
        // Screen information (for CSS responsive design)
        screenWidth: width,
        screenHeight: height,
        isPortrait: height > width,
        isLandscape: width > height,
        
        // Device category string
        type: deviceCategory,
        
        // Pixel ratio information
        pixelRatio: window.devicePixelRatio || 1,
        
        // Debug information
        userAgent: userAgent.substring(0, 50) + (userAgent.length > 50 ? '...' : ''),
        
        // Simple breakpoint flags (for CSS responsiveness)
        isSmallScreen: width <= 480,
        isMediumScreen: width > 480 && width <= 1024,
        isLargeScreen: width > 1024
    };
}

/**
 * Setup device change listeners for responsive behavior
 * @param {Function} callback - Function to call when device properties change
 * @returns {Function} Cleanup function to remove listeners
 */
export function setupDeviceChangeListener(callback) {
    let currentDevice = detectDevice();
    
    const handleResize = () => {
        const newDevice = detectDevice();
        
        // Always update on any change - be more aggressive
        if (newDevice.type !== currentDevice.type || 
            newDevice.isPortrait !== currentDevice.isPortrait ||
            newDevice.screenWidth !== currentDevice.screenWidth ||
            newDevice.screenHeight !== currentDevice.screenHeight) {
            console.log('Device change detected:', currentDevice.type, '->', newDevice.type);
            currentDevice = newDevice;
            callback(newDevice);
        }
    };
    
    const handleOrientationChange = () => {
        setTimeout(() => {
            handleResize();
        }, 100); // Small delay to allow browser to complete orientation change
    };
    
    // Add listeners - also listen to more events
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Force an immediate callback to ensure initial state
    setTimeout(() => callback(currentDevice), 100);
    
    // Return cleanup function
    return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleOrientationChange);
    };
}

/**
 * Create and manage debug info display
 */
export function createDebugInfoBox() {
    // Remove existing debug box if present
    const existingDebug = document.getElementById('device-debug-info');
    if (existingDebug) {
        existingDebug.remove();
    }
    
    // Create debug container
    const debugBox = document.createElement('div');
    debugBox.id = 'device-debug-info';
    debugBox.className = 'device-debug-info';
    
    // Initial update
    updateDebugInfo(debugBox);
    
    // Add to page
    document.body.appendChild(debugBox);
    
    // Setup auto-update on resize
    const cleanup = setupDeviceChangeListener(() => {
        updateDebugInfo(debugBox);
    });
    
    // Return cleanup function
    return cleanup;
}

/**
 * Update debug info display
 * @param {HTMLElement} debugBox 
 * @param {BABYLON.Engine} [engine] - Optional Babylon.js engine
 */
function updateDebugInfo(debugBox) {
    const device = detectDevice();
    
    debugBox.innerHTML = `
        <div class="debug-line"><strong>Type:</strong> ${device.type.toUpperCase()}</div>
        <div class="debug-line"><strong>Size:</strong> ${device.screenWidth}×${device.screenHeight}</div>
        <div class="debug-line"><strong>Screen:</strong> ${device.isSmallScreen ? 'Small' : device.isMediumScreen ? 'Medium' : 'Large'}</div>
        <div class="debug-line"><strong>Touch:</strong> ${device.hasTouch ? 'Yes' : 'No'}</div>
        <div class="debug-line"><strong>Platform:</strong> ${device.isIOS ? 'iOS' : device.isAndroid ? 'Android' : 'Other'}</div>
        <div class="debug-line"><strong>Mobile UA:</strong> ${device.isMobile ? 'Yes' : 'No'}</div>
        <div class="debug-line" style="cursor: pointer; color: #42a5f5; font-size: 10px;" onclick="location.reload()">🔄 Click to refresh</div>
    `;
}