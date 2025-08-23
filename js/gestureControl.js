/* ========================================================================
   3D VIEWER - ADVANCED GESTURE CONTROL
   ========================================================================
   
   PURPOSE:
   Provides advanced gesture recognition and handling for touch interactions.
   Implements sophisticated multi-touch gestures including pinch-to-zoom,
   rotation, and smooth camera manipulation beyond basic Babylon.js controls.
   
   EXPORTS:
   - GestureControl - Class for advanced touch gesture handling
   
   FEATURES:
   - Multi-touch gesture recognition (pinch, rotate, pan)
   - Smooth interpolation for natural touch feedback
   - Velocity-based momentum and inertia
   - Touch state management and gesture disambiguation
   - Integration with camera animation system
   - Mobile-optimized performance
   
   DEPENDENCIES:
   - Babylon.js scene and camera system
   - Camera animation utilities
   - Configuration constants for gesture sensitivity
   
   ======================================================================== */

import { CONFIG } from './config.js';
import { animateCamera } from './cameraControl.js';

export class GestureControl {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        
        this.touchStates = {
            isDoubleTapping: false,
            lastTapTime: 0,
            activeTouches: new Map(),
            
            // Gesture state tracking
            activeGesture: null, // 'rotate', 'pinch', 'pan', or null
            gestureStartTime: 0,
            
            // Rotation state (single finger)
            rotationStart: null,
            lastRotation: null,
            
            // Pinch specific state
            pinchStartDistance: null,
            lastPinchDistance: null,
            initialCameraRadius: null,
            
            // Pan specific state (two finger)
            panStartCenter: null,
            lastPanCenter: null,
            initialCameraTarget: null,
            
            // Animation state
            isAnimating: false
        };

        this.thresholds = {
            doubleTap: CONFIG.gesture.doubleTapThreshold || 500,
            pinchSensitivity: CONFIG.gesture.pinchSensitivity || 0.01,
            panSensitivity: 0.0008, // Reduced pan sensitivity by 10x for smoother mobile controls
            rotationSensitivity: 0.006, // Reduced single finger rotation sensitivity for smoother orbit
            minimumPinchDistance: CONFIG.mobile.minimumPinchDistance || 20,
            minimumPanDistance: 5,
            tapMaxDistance: 10
        };

        this._disableDefaultCameraControls();
        this._init();
    }

    _disableDefaultCameraControls() {
        // CRITICAL: Completely disable default touch controls
        if (this.camera.inputs.attached.pointers) {
            // Remove pointer input entirely for touch devices
            this.camera.inputs.remove(this.camera.inputs.attached.pointers);
            console.log("Removed default pointer controls for touch");
        }
        
        // Also disable mouse wheel on touch devices
        if (this.camera.inputs.attached.mousewheel) {
            this.camera.inputs.remove(this.camera.inputs.attached.mousewheel);
        }
        
        // Disable all inertia for more direct control
        this.camera.inertia = 0;
        this.camera.panningInertia = 0;
        this.camera.angularInertia = 0;
    }

    _init() {
        // Use a more direct approach - capture all touch events on the canvas
        const canvas = this.scene.getEngine().getRenderingCanvas();
        
        // Touch event handlers
        canvas.addEventListener('touchstart', (e) => this._onTouchStart(e), { passive: false });
        canvas.addEventListener('touchmove', (e) => this._onTouchMove(e), { passive: false });
        canvas.addEventListener('touchend', (e) => this._onTouchEnd(e), { passive: false });
        canvas.addEventListener('touchcancel', (e) => this._onTouchCancel(e), { passive: false });
        
        // Prevent default touch behaviors
        canvas.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false });
        canvas.addEventListener('gesturechange', (e) => e.preventDefault(), { passive: false });
        canvas.addEventListener('gestureend', (e) => e.preventDefault(), { passive: false });
    }

    _onTouchStart(event) {
        event.preventDefault();
        event.stopPropagation();
        
        const now = Date.now();
        
        // Store all active touches
        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            this.touchStates.activeTouches.set(touch.identifier, {
                x: touch.clientX,
                y: touch.clientY,
                startX: touch.clientX,
                startY: touch.clientY,
                timestamp: now,
                moved: false
            });
        }
        
        const touchCount = this.touchStates.activeTouches.size;
        
        // Check for double tap (single touch only)
        if (touchCount === 1) {
            const touch = Array.from(this.touchStates.activeTouches.values())[0];
            if (now - this.touchStates.lastTapTime < this.thresholds.doubleTap) {
                touch.isDoubleTap = true;
            }
            
            // Initialize single finger rotation
            this._initializeRotation(touch);
        } else if (touchCount === 2) {
            // Two fingers - could be pinch or pan
            this._initializePinchOrPan();
        }
    }

    _onTouchMove(event) {
        event.preventDefault();
        event.stopPropagation();
        
        // Update touch positions
        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            if (this.touchStates.activeTouches.has(touch.identifier)) {
                const storedTouch = this.touchStates.activeTouches.get(touch.identifier);
                
                // Check if touch has moved significantly
                const deltaX = touch.clientX - storedTouch.startX;
                const deltaY = touch.clientY - storedTouch.startY;
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                
                if (distance > this.thresholds.tapMaxDistance) {
                    storedTouch.moved = true;
                    storedTouch.isDoubleTap = false; // Cancel double tap if moved
                }
                
                // Update position
                storedTouch.x = touch.clientX;
                storedTouch.y = touch.clientY;
            }
        }
        
        const touchCount = this.touchStates.activeTouches.size;
        
        if (touchCount === 1 && this.touchStates.activeGesture !== 'pinch') {
            this._handleRotation();
        } else if (touchCount === 2) {
            this._handlePinchOrPan();
        }
    }

    _onTouchEnd(event) {
        event.preventDefault();
        event.stopPropagation();
        
        const now = Date.now();
        
        // Check for double tap completion
        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            const storedTouch = this.touchStates.activeTouches.get(touch.identifier);
            
            if (storedTouch && storedTouch.isDoubleTap && !storedTouch.moved) {
                this._handleDoubleTap(touch);
            }
            
            this.touchStates.activeTouches.delete(touch.identifier);
        }
        
        // Reset gesture state if no touches remain
        if (this.touchStates.activeTouches.size === 0) {
            this.touchStates.lastTapTime = now;
            this._resetGestureState();
        } else if (this.touchStates.activeTouches.size === 1) {
            // If going from 2 fingers to 1, restart rotation
            const remainingTouch = Array.from(this.touchStates.activeTouches.values())[0];
            this._initializeRotation(remainingTouch);
        }
    }

    _onTouchCancel(event) {
        event.preventDefault();
        
        for (let i = 0; i < event.changedTouches.length; i++) {
            this.touchStates.activeTouches.delete(event.changedTouches[i].identifier);
        }
        
        if (this.touchStates.activeTouches.size === 0) {
            this._resetGestureState();
        }
    }

    _initializeRotation(touch) {
        this.touchStates.activeGesture = 'rotate';
        this.touchStates.rotationStart = { x: touch.x, y: touch.y };
        this.touchStates.lastRotation = { x: touch.x, y: touch.y };
    }

    _handleRotation() {
        const touch = Array.from(this.touchStates.activeTouches.values())[0];
        if (!touch || !this.touchStates.lastRotation) return;
        
        const deltaX = touch.x - this.touchStates.lastRotation.x;
        const deltaY = touch.y - this.touchStates.lastRotation.y;
        
        // Rotate camera (orbit)
        this.camera.alpha -= deltaX * this.thresholds.rotationSensitivity;
        this.camera.beta -= deltaY * this.thresholds.rotationSensitivity;
        
        // Enforce beta limits
        this.camera.beta = Math.max(0.1, Math.min(Math.PI - 0.1, this.camera.beta));
        
        this.touchStates.lastRotation = { x: touch.x, y: touch.y };
    }

    _initializePinchOrPan() {
        const touches = Array.from(this.touchStates.activeTouches.values());
        if (touches.length !== 2) return;
        
        const distance = this._calculateDistance(touches[0], touches[1]);
        const center = this._calculateCenter(touches[0], touches[1]);
        
        this.touchStates.pinchStartDistance = distance;
        this.touchStates.lastPinchDistance = distance;
        this.touchStates.initialCameraRadius = this.camera.radius;
        
        this.touchStates.panStartCenter = center;
        this.touchStates.lastPanCenter = center;
        this.touchStates.initialCameraTarget = this.camera.target.clone();
        
        this.touchStates.activeGesture = 'pinch'; // Default to pinch, will determine from movement
    }

    _handlePinchOrPan() {
        const touches = Array.from(this.touchStates.activeTouches.values());
        if (touches.length !== 2) return;
        
        const currentDistance = this._calculateDistance(touches[0], touches[1]);
        const currentCenter = this._calculateCenter(touches[0], touches[1]);
        
        // Determine gesture type based on movement
        const distanceChange = Math.abs(currentDistance - this.touchStates.pinchStartDistance);
        const centerDeltaX = currentCenter.x - this.touchStates.panStartCenter.x;
        const centerDeltaY = currentCenter.y - this.touchStates.panStartCenter.y;
        const centerMovement = Math.sqrt(centerDeltaX * centerDeltaX + centerDeltaY * centerDeltaY);
        
        // Handle pinch zoom
        if (distanceChange > this.thresholds.minimumPinchDistance) {
            const scale = currentDistance / this.touchStates.pinchStartDistance;
            const newRadius = this.touchStates.initialCameraRadius / scale;
            
            this.camera.radius = Math.max(
                this.camera.lowerRadiusLimit || 1,
                Math.min(this.camera.upperRadiusLimit || 100, newRadius)
            );
        }
        
        // Handle pan (two finger drag)
        if (centerMovement > this.thresholds.minimumPanDistance) {
            const deltaX = currentCenter.x - this.touchStates.lastPanCenter.x;
            const deltaY = currentCenter.y - this.touchStates.lastPanCenter.y;
            
            // Calculate pan based on camera orientation
            const forward = this.camera.getForwardRay().direction;
            const right = BABYLON.Vector3.Cross(forward, this.camera.upVector);
            const up = BABYLON.Vector3.Cross(right, forward);
            
            // Scale pan based on camera distance
            const panScale = this.camera.radius * this.thresholds.panSensitivity;
            
            const panVector = right.scale(deltaX * panScale)
                .add(up.scale(deltaY * panScale));
            
            this.camera.target.addInPlace(panVector);
            
            this.touchStates.lastPanCenter = currentCenter;
        }
        
        this.touchStates.lastPinchDistance = currentDistance;
    }

    _handleDoubleTap(touch) {
        if (this.touchStates.isAnimating) return;
        
        this.touchStates.isAnimating = true;
        
        // Create a ray from the camera through the touch point
        const pickResult = this.scene.pick(
            touch.clientX,
            touch.clientY,
            (mesh) => mesh.isPickable || mesh.isVisible,
            false,
            this.camera
        );
        
        if (pickResult && pickResult.hit && pickResult.pickedPoint) {
            const distanceToPoint = BABYLON.Vector3.Distance(
                this.camera.target,
                pickResult.pickedPoint
            );
            
            const targetRadius = Math.max(
                Math.min(distanceToPoint * 1.5, this.camera.upperRadiusLimit || 10),
                this.camera.lowerRadiusLimit || 1
            );
            
            const animationGroup = animateCamera(
                this.camera,
                pickResult.pickedPoint,
                targetRadius,
                20,
                () => {
                    this.touchStates.isAnimating = false;
                }
            );
            
            animationGroup.play();
        } else {
            this.touchStates.isAnimating = false;
        }
    }

    _calculateDistance(touch1, touch2) {
        const dx = touch2.x - touch1.x;
        const dy = touch2.y - touch1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    _calculateCenter(touch1, touch2) {
        return {
            x: (touch1.x + touch2.x) / 2,
            y: (touch1.y + touch2.y) / 2
        };
    }

    _resetGestureState() {
        this.touchStates.activeGesture = null;
        this.touchStates.rotationStart = null;
        this.touchStates.lastRotation = null;
        this.touchStates.pinchStartDistance = null;
        this.touchStates.lastPinchDistance = null;
        this.touchStates.panStartCenter = null;
        this.touchStates.lastPanCenter = null;
        this.touchStates.initialCameraRadius = null;
        this.touchStates.initialCameraTarget = null;
    }

    dispose() {
        const canvas = this.scene.getEngine().getRenderingCanvas();
        
        // Remove all event listeners
        canvas.removeEventListener('touchstart', this._onTouchStart);
        canvas.removeEventListener('touchmove', this._onTouchMove);
        canvas.removeEventListener('touchend', this._onTouchEnd);
        canvas.removeEventListener('touchcancel', this._onTouchCancel);
        
        this.touchStates.activeTouches.clear();
        this._resetGestureState();
    }
}