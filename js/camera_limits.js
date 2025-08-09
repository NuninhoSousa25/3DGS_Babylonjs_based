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
            
            // Distance limits (radius)
            radiusMin: CONFIG.camera.lowerRadiusLimit,
            radiusMax: CONFIG.camera.upperRadiusLimit,
            
            // Target movement limits (panning)
            targetBounds: {
                xMin: -10, xMax: 10,
                yMin: -10, yMax: 10, 
                zMin: -10, zMax: 10
            },
            
            // Restriction types
            restrictHorizontal: false,  // Limit alpha rotation
            restrictVertical: true,     // Limit beta rotation 
            restrictDistance: true,     // Limit zoom
            restrictPanning: false,     // Limit target movement
            
            // Model-specific settings (not used without auto-calc)
            modelCenter: { x: 0, y: 0, z: 0 },
            modelSize: { x: 2, y: 2, z: 2 },
            autoCalculated: false // Always false now
        };
        
        this.isEnabled = true;
        
        // Apply defaults from config
        this.resetToDefaults();
        
        this.setupConstraints();
    }

 

    /**
     * Get bounding information from various model types
     */


    /**
     * Setup camera constraint observers
     */
    setupConstraints() {
        // Apply constraints on every frame
        this.scene.onBeforeRenderObservable.add(() => {
            if (!this.isEnabled) return;
            this.enforceConstraints();
        });
    }

    /**
     * Enforce all camera constraints
     */
    enforceConstraints() {
        let constraintApplied = false;

        // Vertical constraints (beta)
        if (this.limits.restrictVertical) {
            const originalBeta = this.camera.beta;
            this.camera.beta = Math.max(this.limits.betaMin, 
                Math.min(this.limits.betaMax, this.camera.beta));
            if (this.camera.beta !== originalBeta) constraintApplied = true;
        }

        // Horizontal constraints (alpha) 
        if (this.limits.restrictHorizontal) {
            const originalAlpha = this.camera.alpha;
            this.camera.alpha = Math.max(this.limits.alphaMin,
                Math.min(this.limits.alphaMax, this.camera.alpha));
            if (this.camera.alpha !== originalAlpha) constraintApplied = true;
        }

        // Distance constraints (radius)
        if (this.limits.restrictDistance) {
            const originalRadius = this.camera.radius;
            this.camera.radius = Math.max(this.limits.radiusMin,
                Math.min(this.limits.radiusMax, this.camera.radius));
            if (this.camera.radius !== originalRadius) constraintApplied = true;
        }

        // Panning constraints (target)
        if (this.limits.restrictPanning) {
            const bounds = this.limits.targetBounds;
            const originalTarget = this.camera.target.clone();
            
            this.camera.target.x = Math.max(bounds.xMin, Math.min(bounds.xMax, this.camera.target.x));
            this.camera.target.y = Math.max(bounds.yMin, Math.min(bounds.yMax, this.camera.target.y));
            this.camera.target.z = Math.max(bounds.zMin, Math.min(bounds.zMax, this.camera.target.z));
            
            if (!this.camera.target.equals(originalTarget)) constraintApplied = true;
        }

        // Optional: Provide visual feedback when constraints are hit
        if (constraintApplied && this.onConstraintHit) {
            this.onConstraintHit();
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
        
        console.log(`Distance limits ${enabled ? 'enabled' : 'disabled'}:`, 
            `${minDistance.toFixed(1)} to ${maxDistance.toFixed(1)}`);
    }

    setPanningLimits(enabled, bounds) {
        this.limits.restrictPanning = enabled;
        if (bounds) {
            this.limits.targetBounds = { ...bounds };
        }
        
        console.log(`Panning limits ${enabled ? 'enabled' : 'disabled'}`);
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
        this.limits.restrictPanning = restrictions.includes('p');
        
        // Apply limit values
        if (urlParams.has('alphaMin')) this.limits.alphaMin = parseFloat(urlParams.get('alphaMin'));
        if (urlParams.has('alphaMax')) this.limits.alphaMax = parseFloat(urlParams.get('alphaMax'));
        if (urlParams.has('betaMin')) this.limits.betaMin = parseFloat(urlParams.get('betaMin'));
        if (urlParams.has('betaMax')) this.limits.betaMax = parseFloat(urlParams.get('betaMax'));
        if (urlParams.has('radiusMin')) this.limits.radiusMin = parseFloat(urlParams.get('radiusMin'));
        if (urlParams.has('radiusMax')) this.limits.radiusMax = parseFloat(urlParams.get('radiusMax'));
        
        // Apply panning limits
        if (urlParams.has('panX')) {
            const [xMin, xMax] = urlParams.get('panX').split(',').map(parseFloat);
            this.limits.targetBounds.xMin = xMin;
            this.limits.targetBounds.xMax = xMax;
        }
        if (urlParams.has('panY')) {
            const [yMin, yMax] = urlParams.get('panY').split(',').map(parseFloat);
            this.limits.targetBounds.yMin = yMin;
            this.limits.targetBounds.yMax = yMax;
        }
        if (urlParams.has('panZ')) {
            const [zMin, zMax] = urlParams.get('panZ').split(',').map(parseFloat);
            this.limits.targetBounds.zMin = zMin;
            this.limits.targetBounds.zMax = zMax;
        }
        
        this.updateCameraConstraints();
        console.log("Applied camera limits from URL:", this.limits);
    }

    /**
     * Enable/disable the entire constraint system
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
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
        
        // Set horizontal limits using angle/offset system
        this.setHorizontalLimitsAngleOffset(
            defaultRestrictions.horizontal,
            defaultLimits.horizontal.totalAngle || 360,
            defaultLimits.horizontal.offset || 0
        );
        
        // Set panning limits (simple toggle)
        this.setPanningLimitsSimple(defaultRestrictions.panning);
        
        // Target bounds for panning
        this.limits.targetBounds = {
            xMin: -defaultLimits.panning.maxDistance,
            xMax: defaultLimits.panning.maxDistance,
            yMin: -defaultLimits.panning.maxDistance,
            yMax: defaultLimits.panning.maxDistance,
            zMin: -defaultLimits.panning.maxDistance,
            zMax: defaultLimits.panning.maxDistance
        };
        
        // Restriction flags from config
        this.limits.restrictDistance = defaultRestrictions.zoom;
        this.limits.restrictVertical = defaultRestrictions.vertical;
        this.limits.restrictHorizontal = defaultRestrictions.horizontal;
        this.limits.restrictPanning = defaultRestrictions.panning;
        
        // Model info (not used without auto-calc)
        this.limits.modelCenter = { x: 0, y: 0, z: 0 };
        this.limits.modelSize = { x: 2, y: 2, z: 2 };
        this.limits.autoCalculated = false; // Always false now
        
        this.updateCameraConstraints();
        
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
 * Get limits in UI-friendly format (degrees instead of radians)
 */
    getLimitsForUI() {
        return {
            // Restrictions
            enabled: this.isEnabled,
            restrictDistance: this.limits.restrictDistance,
            restrictVertical: this.limits.restrictVertical,
            restrictHorizontal: this.limits.restrictHorizontal,
            restrictPanning: this.limits.restrictPanning,
            
            // Values in user-friendly units
            zoom: {
                min: this.limits.radiusMin,
                max: this.limits.radiusMax
            },
            vertical: {
                min: Math.round(this.limits.betaMin * 180 / Math.PI),
                max: Math.round(this.limits.betaMax * 180 / Math.PI)
            },
            horizontal: {
                min: Math.round(this.limits.alphaMin * 180 / Math.PI),
                max: Math.round(this.limits.alphaMax * 180 / Math.PI)
            },
            panning: {
                max: Math.max(
                    Math.abs(this.limits.targetBounds.xMin),
                    Math.abs(this.limits.targetBounds.xMax),
                    Math.abs(this.limits.targetBounds.yMin),
                    Math.abs(this.limits.targetBounds.yMax),
                    Math.abs(this.limits.targetBounds.zMin),
                    Math.abs(this.limits.targetBounds.zMax)
                )
            }
        }
    };

    /**
     * Cleanup
     */
    dispose() {
        // Remove observers if needed
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
     * Enhanced panning limits - simple on/off toggle
     * @param {boolean} enabled - Enable panning limits
     */
    setPanningLimitsSimple(enabled) {
        this.limits.restrictPanning = enabled;
        
        if (enabled) {
            // Use existing target bounds or create reasonable defaults
            if (!this.limits.targetBounds || 
                (this.limits.targetBounds.xMin === this.limits.targetBounds.xMax)) {
                // Create default bounds based on model or reasonable defaults
                const defaultDistance = this.limits.modelSize ? 
                    Math.max(this.limits.modelSize.x, this.limits.modelSize.y, this.limits.modelSize.z) + 5 : 10;
                
                this.limits.targetBounds = {
                    xMin: this.limits.modelCenter.x - defaultDistance,
                    xMax: this.limits.modelCenter.x + defaultDistance,
                    yMin: this.limits.modelCenter.y - defaultDistance,
                    yMax: this.limits.modelCenter.y + defaultDistance,
                    zMin: this.limits.modelCenter.z - defaultDistance,
                    zMax: this.limits.modelCenter.z + defaultDistance
                };
            }
            console.log('Panning limits enabled: camera target restricted to area around model');
        } else {
            console.log('Panning limits disabled: camera target can move freely');
        }
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
            restrictPanning: this.limits.restrictPanning,
            
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
                enabled: this.limits.restrictPanning
            }
        };
    }

        
    /**
     * Enhanced distance limits with validation
     * @param {boolean} enabled - Enable distance limits
     * @param {number} minDistance - Minimum distance
     * @param {number} maxDistance - Maximum distance
     */
    setDistanceLimits(enabled, minDistance = 1, maxDistance = 20) {
        this.limits.restrictDistance = enabled;
        
        // Ensure min is less than max and positive
        minDistance = Math.max(0.1, minDistance);
        maxDistance = Math.max(minDistance + 0.1, maxDistance);
        
        this.limits.radiusMin = minDistance;
        this.limits.radiusMax = maxDistance;
        this.updateCameraConstraints();
        
        console.log(`Distance limits ${enabled ? 'enabled' : 'disabled'}:`, 
            `${minDistance.toFixed(1)} to ${maxDistance.toFixed(1)}`);
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
            ...(this.limits.restrictPanning && {
                panX: `${this.limits.targetBounds.xMin.toFixed(2)},${this.limits.targetBounds.xMax.toFixed(2)}`,
                panY: `${this.limits.targetBounds.yMin.toFixed(2)},${this.limits.targetBounds.yMax.toFixed(2)}`,
                panZ: `${this.limits.targetBounds.zMin.toFixed(2)},${this.limits.targetBounds.zMax.toFixed(2)}`
            }),
            // Restriction flags
            restrictions: [
                this.limits.restrictHorizontal && 'h',
                this.limits.restrictVertical && 'v', 
                this.limits.restrictDistance && 'd',
                this.limits.restrictPanning && 'p'
            ].filter(Boolean).join('')
        };
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
        this.limits.restrictPanning = restrictions.includes('p');
        
        // Apply limit values
        if (urlParams.has('alphaMin')) this.limits.alphaMin = parseFloat(urlParams.get('alphaMin'));
        if (urlParams.has('alphaMax')) this.limits.alphaMax = parseFloat(urlParams.get('alphaMax'));
        if (urlParams.has('betaMin')) this.limits.betaMin = parseFloat(urlParams.get('betaMin'));
        if (urlParams.has('betaMax')) this.limits.betaMax = parseFloat(urlParams.get('betaMax'));
        if (urlParams.has('radiusMin')) this.limits.radiusMin = parseFloat(urlParams.get('radiusMin'));
        if (urlParams.has('radiusMax')) this.limits.radiusMax = parseFloat(urlParams.get('radiusMax'));
        
        // Apply panning limits
        if (urlParams.has('panX')) {
            const [xMin, xMax] = urlParams.get('panX').split(',').map(parseFloat);
            this.limits.targetBounds.xMin = xMin;
            this.limits.targetBounds.xMax = xMax;
        }
        if (urlParams.has('panY')) {
            const [yMin, yMax] = urlParams.get('panY').split(',').map(parseFloat);
            this.limits.targetBounds.yMin = yMin;
            this.limits.targetBounds.yMax = yMax;
        }
        if (urlParams.has('panZ')) {
            const [zMin, zMax] = urlParams.get('panZ').split(',').map(parseFloat);
            this.limits.targetBounds.zMin = zMin;
            this.limits.targetBounds.zMax = zMax;
        }
        
        this.updateCameraConstraints();
        console.log("Applied camera limits from URL:", this.limits);
    }
}