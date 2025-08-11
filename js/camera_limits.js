// js/cameraLimits.js - NEW FILE

import { CONFIG } from './config.js';

/**
 * Camera Movement Limitation System
 * Provides calculated area-based movement restrictions around 3D models
 */
export class CameraLimits {
        
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        
        // Current limits configuration
        this.limits = {
            // Horizontal movement limits (alpha angle)
            alphaMin: -Math.PI * 2,    // Full rotation by default
            alphaMax: Math.PI * 2,
            
            // Vertical movement limits (beta angle) 
            betaMin: 0.1,             // Prevent camera from going below ground
            betaMax: Math.PI - 0.1,   // Prevent camera from going above
            
            // Distance limits (radius) - use centralized config values
            radiusMin: CONFIG.cameraLimits.defaultLimits.zoom.min,
            radiusMax: CONFIG.cameraLimits.defaultLimits.zoom.max,
            
            // Restriction types
            restrictHorizontal: false,  // Limit alpha rotation
            restrictVertical: true,     // Limit beta rotation 
            restrictDistance: true,     // Limit zoom
            enablePanning: true,        // Enable/disable panning functionality
        };
        
        this.isEnabled = true;
        this.isDirty = false;  // Track when constraints need checking
        this.constraintObserver = null;  // Store observer reference for cleanup
        
        // Apply defaults from config
        this.resetToDefaults();
        
        this.setupConstraints();
    }

    /**
     * Setup camera constraint observers - optimized to only check when camera moves
     */
    setupConstraints() {
        // Use onViewMatrixChangedObservable instead of every frame checking
        // This only triggers when the camera actually moves/rotates/zooms
        this.constraintObserver = this.camera.onViewMatrixChangedObservable.add(() => {
            if (!this.isEnabled) return;
            this.enforceConstraints();
        });
        
        console.log("Camera constraints setup - will only enforce when camera moves");
    }

    /**
     * Enforce all camera constraints - optimized to only run when camera moves
     */
    enforceConstraints() {
        if (!this.isEnabled) return;
        
        let constraintApplied = false;
        const originalValues = {
            beta: this.camera.beta,
            alpha: this.camera.alpha,
            radius: this.camera.radius
        };

        // Vertical constraints (beta)
        if (this.limits.restrictVertical) {
            this.camera.beta = Math.max(this.limits.betaMin, 
                Math.min(this.limits.betaMax, this.camera.beta));
            if (this.camera.beta !== originalValues.beta) constraintApplied = true;
        }

        // Horizontal constraints (alpha) 
        if (this.limits.restrictHorizontal) {
            this.camera.alpha = Math.max(this.limits.alphaMin,
                Math.min(this.limits.alphaMax, this.camera.alpha));
            if (this.camera.alpha !== originalValues.alpha) constraintApplied = true;
        }

        // Distance constraints (radius)
        if (this.limits.restrictDistance) {
            this.camera.radius = Math.max(this.limits.radiusMin,
                Math.min(this.limits.radiusMax, this.camera.radius));
            if (this.camera.radius !== originalValues.radius) constraintApplied = true;
        }

        // Panning control - handled by camera panningSensibility setting in updateCameraConstraints()

        // Optional: Provide visual feedback when constraints are hit
        if (constraintApplied && this.onConstraintHit) {
            this.onConstraintHit();
        }
        
        // Debug logging only when constraints are actually applied
        if (constraintApplied) {
            console.log("Camera constraints applied:", {
                beta: originalValues.beta !== this.camera.beta ? `${originalValues.beta.toFixed(3)} → ${this.camera.beta.toFixed(3)}` : 'no change',
                alpha: originalValues.alpha !== this.camera.alpha ? `${originalValues.alpha.toFixed(3)} → ${this.camera.alpha.toFixed(3)}` : 'no change',
                radius: originalValues.radius !== this.camera.radius ? `${originalValues.radius.toFixed(3)} → ${this.camera.radius.toFixed(3)}` : 'no change'
            });
        }
    }

    /**
     * Update camera's built-in constraints to match our limits
     */
    updateCameraConstraints() {
        // Update Babylon.js camera constraints
        this.camera.lowerRadiusLimit = this.limits.radiusMin;
        this.camera.upperRadiusLimit = this.limits.radiusMax;
        this.camera.lowerBetaLimit = this.limits.betaMin;
        this.camera.upperBetaLimit = this.limits.betaMax;
        
        if (this.limits.restrictHorizontal) {
            this.camera.lowerAlphaLimit = this.limits.alphaMin;
            this.camera.upperAlphaLimit = this.limits.alphaMax;
        } else {
            this.camera.lowerAlphaLimit = null;
            this.camera.upperAlphaLimit = null;
        }
        
        // Control panning by setting panningSensibility
        if (this.limits.enablePanning) {
            this.camera.panningSensibility = CONFIG.camera.panningSensibility;
        } else {
            this.camera.panningSensibility = 0; // Disable panning
        }
    }

        /**
         * Enhanced manual configuration methods with validation
         */
    setHorizontalLimits(enabled, minAngle = -Math.PI, maxAngle = Math.PI) {
        this.limits.restrictHorizontal = enabled;
        
        // Ensure min is less than max
        if (minAngle > maxAngle) {
            [minAngle, maxAngle] = [maxAngle, minAngle];
        }
        
        this.limits.alphaMin = minAngle;
        this.limits.alphaMax = maxAngle;
        this.updateCameraConstraints();
        
        // Immediately check constraints after changing settings
        this.enforceConstraints();
        
        console.log(`Horizontal limits ${enabled ? 'enabled' : 'disabled'}:`, 
            `${(minAngle * 180 / Math.PI).toFixed(0)}° to ${(maxAngle * 180 / Math.PI).toFixed(0)}°`);
    }


    
    setVerticalLimits(enabled, minAngle = 0.1, maxAngle = Math.PI - 0.1) {
        this.limits.restrictVertical = enabled;
        
        // Ensure min is less than max and within valid range
        minAngle = Math.max(0.01, Math.min(minAngle, Math.PI - 0.01));
        maxAngle = Math.max(0.01, Math.min(maxAngle, Math.PI - 0.01));
        
        if (minAngle > maxAngle) {
            [minAngle, maxAngle] = [maxAngle, minAngle];
        }
        
        this.limits.betaMin = minAngle;
        this.limits.betaMax = maxAngle;
        this.updateCameraConstraints();
        
        // Immediately check constraints after changing settings
        this.enforceConstraints();
        
        console.log(`Vertical limits ${enabled ? 'enabled' : 'disabled'}:`, 
            `${(minAngle * 180 / Math.PI).toFixed(0)}° to ${(maxAngle * 180 / Math.PI).toFixed(0)}°`);
    }


    
    setDistanceLimits(enabled, minDistance = 1, maxDistance = 20) {
        this.limits.restrictDistance = enabled;
        
        // Ensure min is less than max and positive
        minDistance = Math.max(0.1, minDistance);
        maxDistance = Math.max(minDistance + 0.1, maxDistance);
        
        this.limits.radiusMin = minDistance;
        this.limits.radiusMax = maxDistance;
        this.updateCameraConstraints();
        
        // Immediately check constraints after changing settings
        this.enforceConstraints();
        
        console.log(`Distance limits ${enabled ? 'enabled' : 'disabled'}:`, 
            `${minDistance.toFixed(1)} to ${maxDistance.toFixed(1)}`);
    }

    setPanningEnabled(enabled) {
        this.limits.enablePanning = enabled;
        this.updateCameraConstraints();
        
        console.log(`Panning ${enabled ? 'enabled' : 'disabled'}`);
    }






    /**
     * Apply limits from URL parameters
     */
    applyLimitsFromUrl(urlParams) {
        const restrictions = urlParams.get('restrictions') || '';
        
        // Apply restriction flags
        this.limits.restrictHorizontal = restrictions.includes('h');
        this.limits.restrictVertical = restrictions.includes('v');
        this.limits.restrictDistance = restrictions.includes('d');
        this.limits.enablePanning = restrictions.includes('p');
        
        // Apply limit values
        if (urlParams.has('alphaMin')) this.limits.alphaMin = parseFloat(urlParams.get('alphaMin'));
        if (urlParams.has('alphaMax')) this.limits.alphaMax = parseFloat(urlParams.get('alphaMax'));
        if (urlParams.has('betaMin')) this.limits.betaMin = parseFloat(urlParams.get('betaMin'));
        if (urlParams.has('betaMax')) this.limits.betaMax = parseFloat(urlParams.get('betaMax'));
        if (urlParams.has('radiusMin')) this.limits.radiusMin = parseFloat(urlParams.get('radiusMin'));
        if (urlParams.has('radiusMax')) this.limits.radiusMax = parseFloat(urlParams.get('radiusMax'));
        
        // Panning is now just enabled/disabled via the 'p' restriction flag
        
        this.updateCameraConstraints();
        console.log("Applied camera limits from URL:", this.limits);
    }

    /**
     * Enable/disable the entire constraint system
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        
        // Immediately check constraints when re-enabling
        if (enabled) {
            this.enforceConstraints();
        }
        
        console.log(`Camera limits ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Get current limits configuration for UI display
     */
    getCurrentLimits() {
        return { ...this.limits };
    }

    /**
     * Reset to defaults using config values
     */
    
    resetToDefaults() {
        const defaultLimits = CONFIG.cameraLimits.defaultLimits;
        const defaultRestrictions = CONFIG.cameraLimits.defaultRestrictions;
        
        // Distance limits
        this.limits.radiusMin = defaultLimits.zoom.min;
        this.limits.radiusMax = defaultLimits.zoom.max;
        
        // Set vertical limits using up/down system
        this.setVerticalLimitsUpDown(
            defaultRestrictions.vertical,
            defaultLimits.vertical.upLimit || -80,
            defaultLimits.vertical.downLimit || 80
        );
        
        // Set horizontal limits using angle/offset system (defaults since horizontal is disabled by default)
        this.setHorizontalLimitsAngleOffset(
            defaultRestrictions.horizontal,
            360,  // Full 360° freedom by default
            0     // No offset by default
        );
        
        // Set panning enabled/disabled
        this.limits.enablePanning = defaultRestrictions.panning;
        
        // Restriction flags from config
        this.limits.restrictDistance = defaultRestrictions.zoom;
        this.limits.restrictVertical = defaultRestrictions.vertical;
        this.limits.restrictHorizontal = defaultRestrictions.horizontal;
        
        this.updateCameraConstraints();
        
        // Immediately check constraints after reset
        this.enforceConstraints();
        
        // Trigger UI update if callback exists
        if (this.onLimitsChanged) {
            this.onLimitsChanged();
        }
        
        console.log("Camera limits reset to config defaults");
    }

    
/**
 * Set UI update callback
 */
setUIUpdateCallback(callback) {
    this.onLimitsChanged = callback;
}

    /**
     * Cleanup
     */
    dispose() {
        // Remove constraint observer
        if (this.constraintObserver && this.camera) {
            this.camera.onViewMatrixChangedObservable.remove(this.constraintObserver);
            this.constraintObserver = null;
            console.log("Camera constraint observer removed");
        }
        
        this.scene = null;
        this.camera = null;
    }


    
    /**
     * Enhanced vertical limits with up/down degree system
     * @param {boolean} enabled - Enable vertical limits
     * @param {number} upDegrees - Up limit in degrees (-90 to 90, negative = looking up)
     * @param {number} downDegrees - Down limit in degrees (-90 to 90, positive = looking down)
     */
    setVerticalLimitsUpDown(enabled, upDegrees = -80, downDegrees = 80) {
        this.limits.restrictVertical = enabled;
        
        // Convert up/down degrees to beta radians
        // up/down: -90° = looking straight up, 0° = looking forward, +90° = looking straight down
        // beta: 0 = looking straight up, π/2 = looking forward, π = looking straight down
        const upBeta = (upDegrees * Math.PI / 180) + Math.PI/2;
        const downBeta = (downDegrees * Math.PI / 180) + Math.PI/2;
        
        // Ensure valid range
        this.limits.betaMin = Math.max(0.01, Math.min(upBeta, downBeta));
        this.limits.betaMax = Math.min(Math.PI - 0.01, Math.max(upBeta, downBeta));
        
        this.updateCameraConstraints();
        
        console.log(`Vertical limits ${enabled ? 'enabled' : 'disabled'}:`, 
            `${upDegrees}° (up) to ${downDegrees}° (down)`);
    }

    
    /**
     * Enhanced horizontal limits with angle + offset system
     * @param {boolean} enabled - Enable horizontal limits
     * @param {number} totalAngleDegrees - Total angle of freedom (30-360 degrees)
     * @param {number} offsetDegrees - Center offset (-180 to 180 degrees)
     */
    setHorizontalLimitsAngleOffset(enabled, totalAngleDegrees = 360, offsetDegrees = 0) {
        this.limits.restrictHorizontal = enabled;
        
        if (enabled) {
            // Calculate min/max from total angle and offset
            const halfAngle = totalAngleDegrees / 2;
            const minAngleDeg = offsetDegrees - halfAngle;
            const maxAngleDeg = offsetDegrees + halfAngle;
            
            // Convert to radians
            this.limits.alphaMin = minAngleDeg * Math.PI / 180;
            this.limits.alphaMax = maxAngleDeg * Math.PI / 180;
            
            console.log(`Horizontal limits enabled: ${totalAngleDegrees}° total, centered at ${offsetDegrees}°`);
            console.log(`  Actual range: ${minAngleDeg.toFixed(0)}° to ${maxAngleDeg.toFixed(0)}°`);
        } else {
            // Full freedom
            this.limits.alphaMin = -Math.PI * 2;
            this.limits.alphaMax = Math.PI * 2;
            console.log('Horizontal limits disabled: full 360° freedom');
        }
        
        this.updateCameraConstraints();
    }


    /**
     * Get limits in UI-friendly format with adjusted vertical system
     */
    getLimitsForUI() {
        // Convert beta angles back to up/down degrees
        const upDegrees = Math.round((this.limits.betaMin - Math.PI/2) * 180 / Math.PI);
        const downDegrees = Math.round((this.limits.betaMax - Math.PI/2) * 180 / Math.PI);
        
        // Calculate horizontal angle and offset
        const alphaMinDeg = this.limits.alphaMin * 180 / Math.PI;
        const alphaMaxDeg = this.limits.alphaMax * 180 / Math.PI;
        const totalAngle = alphaMaxDeg - alphaMinDeg;
        const centerOffset = (alphaMinDeg + alphaMaxDeg) / 2;
        
        return {
            // Restrictions
            enabled: this.isEnabled,
            restrictDistance: this.limits.restrictDistance,
            restrictVertical: this.limits.restrictVertical,
            restrictHorizontal: this.limits.restrictHorizontal,
            enablePanning: this.limits.enablePanning,
            
            // Values in user-friendly units
            zoom: {
                min: this.limits.radiusMin,
                max: this.limits.radiusMax
            },
            vertical: {
                up: upDegrees,    // Negative = looking up
                down: downDegrees // Positive = looking down
            },
            horizontal: {
                totalAngle: Math.min(360, Math.max(30, totalAngle)),
                offset: centerOffset
            },
            panning: {
                enabled: this.limits.enablePanning
            }
        };
    }

    /**
     * URL serialization for sharing
     */
    getLimitsForUrl() {
        if (!this.limits || !this.isEnabled) return {};
        
        return {
            // Only include active restrictions
            ...(this.limits.restrictHorizontal && {
                alphaMin: this.limits.alphaMin.toFixed(3),
                alphaMax: this.limits.alphaMax.toFixed(3)
            }),
            ...(this.limits.restrictVertical && {
                betaMin: this.limits.betaMin.toFixed(3),
                betaMax: this.limits.betaMax.toFixed(3)
            }),
            ...(this.limits.restrictDistance && {
                radiusMin: this.limits.radiusMin.toFixed(2),
                radiusMax: this.limits.radiusMax.toFixed(2)
            }),
            // Panning is just enabled/disabled, no bounds needed
            // Restriction flags
            restrictions: [
                this.limits.restrictHorizontal && 'h',
                this.limits.restrictVertical && 'v', 
                this.limits.restrictDistance && 'd',
                this.limits.enablePanning && 'p'
            ].filter(Boolean).join('')
        };
    }

}