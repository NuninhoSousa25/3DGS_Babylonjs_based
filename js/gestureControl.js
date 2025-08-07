// js/gestureControl.js

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
            activeGesture: null, // 'pinch', 'pan', or null
            gestureStartTime: 0,
            gestureEndTime: 0,
            
            // Pinch specific state
            pinchStartDistance: null,
            pinchStartCenter: null,
            lastPinchCenter: null,
            lastPinchDistance: null,
            
            // Pan specific state
            lastPanPosition: null,
            panStartPosition: null,
            
            // Performance optimization
            lastUpdateTime: 0,
            
            // Smoothing buffers
            pinchDistanceBuffer: [],
            panPositionBuffer: [],
            
            // Animation state
            isAnimating: false,
            
            // Gesture history for conflict resolution
            lastGestureType: null,
            lastGestureEndTime: 0
        };

        this.thresholds = {
            doubleTap: CONFIG.gesture.doubleTapThreshold,
            pinchDebounce: CONFIG.gesture.pinchDebounceThreshold,
            pinchSensitivity: CONFIG.gesture.pinchSensitivity,
            panSensitivity: CONFIG.mobile.panningSensibility / 1000,
            minimumPinchDistance: CONFIG.mobile.minimumPinchDistance,
            minimumPanDistance: CONFIG.mobile.minimumPanDistance,
            touchActionDelay: CONFIG.mobile.touchActionDelay || 100,
            gestureStabilityThreshold: CONFIG.mobile.gestureStabilityThreshold || 5,
            tapMaxDistance: CONFIG.gesture.tapMaxDistance || 10,
            gestureChangeTimeout: CONFIG.gesture.gestureChangeTimeout || 350,
            enableExclusivity: CONFIG.gesture.enableGestureExclusivity || true,
            smoothingFactor: CONFIG.gesture.smoothingFactor || 0.2
        };

        // Disable default camera behaviors for mobile
        if (camera.inputs.attached.pointers) {
            camera.inputs.attached.pointers.buttons = [1]; // Only allow left click for desktop
            camera.inputs.attached.pointers.pinchInwards = false;
            camera.inputs.attached.pointers.pinchPrecision = 0;
        }

        this._init();
    }

    _init() {
        this.scene.onPointerObservable.add((pointerInfo) => {
            // Throttle updates for better performance
            const now = Date.now();
            
            // Skip handling if animation is in progress
            if (this.touchStates.isAnimating) return;
            
            // Skip very rapid updates for better performance
            if (now - this.touchStates.lastUpdateTime < 16) return; // ~60fps
            this.touchStates.lastUpdateTime = now;

            switch (pointerInfo.type) {
                case BABYLON.PointerEventTypes.POINTERDOWN:
                    this._onPointerDown(pointerInfo.event);
                    break;
                case BABYLON.PointerEventTypes.POINTERUP:
                    this._onPointerUp(pointerInfo.event);
                    break;
                case BABYLON.PointerEventTypes.POINTERMOVE:
                    this._onPointerMove(pointerInfo.event);
                    break;
                case BABYLON.PointerEventTypes.POINTERCANCEL:
                    this._onPointerCancel(pointerInfo.event);
                    break;
            }
        });
    }

    _onPointerDown(event) {
        if (event.pointerType !== 'touch') return;

        event.preventDefault();
        
        const now = Date.now();
        const touchInfo = {
            x: event.clientX,
            y: event.clientY,
            startX: event.clientX,
            startY: event.clientY,
            timestamp: now,
            pointerId: event.pointerId,
            moved: false
        };
        
        this.touchStates.activeTouches.set(event.pointerId, touchInfo);

        // Check for double tap
        if (this.touchStates.activeTouches.size === 1 && 
            now - this.touchStates.lastTapTime < this.thresholds.doubleTap) {
            // Mark as potential double tap, but confirm only if the touch doesn't move much
            touchInfo.isDoubleTap = true;
        }

        // Initialize gesture state based on number of touches
        if (this.touchStates.activeTouches.size === 2) {
            // Reset any active gesture if exclusivity is enabled
            if (this.thresholds.enableExclusivity) {
                this.touchStates.activeGesture = null;
            }
            
            // Delay initialization to determine gesture type
            setTimeout(() => {
                if (this.touchStates.activeTouches.size === 2 && !this.touchStates.activeGesture) {
                    this._initializePinch();
                }
            }, this.thresholds.touchActionDelay);
        } else if (this.touchStates.activeTouches.size === 1) {
            // Reset any active gesture if exclusivity is enabled
            if (this.thresholds.enableExclusivity) {
                this.touchStates.activeGesture = null;
            }
            
            // Delay initialization to determine if it's a tap or pan
            setTimeout(() => {
                if (this.touchStates.activeTouches.size === 1 && !this.touchStates.activeGesture) {
                    const touch = this.touchStates.activeTouches.get(event.pointerId);
                    if (touch && !touch.isDoubleTap) {
                        this._initializePan(touch);
                    }
                }
            }, this.thresholds.touchActionDelay);
        }
    }

    _onPointerMove(event) {
        if (event.pointerType !== 'touch') return;

        event.preventDefault();

        if (this.touchStates.activeTouches.has(event.pointerId)) {
            const previousTouch = this.touchStates.activeTouches.get(event.pointerId);
            const deltaX = event.clientX - previousTouch.x;
            const deltaY = event.clientY - previousTouch.y;
            
            // Calculate total movement from start
            const totalDeltaX = event.clientX - previousTouch.startX;
            const totalDeltaY = event.clientY - previousTouch.startY;
            
            // Mark touch as moved if exceeds threshold
            if (!previousTouch.moved && 
                (Math.abs(totalDeltaX) > this.thresholds.tapMaxDistance || 
                 Math.abs(totalDeltaY) > this.thresholds.tapMaxDistance)) {
                previousTouch.moved = true;
                
                // Cancel double tap if touch has moved too much
                if (previousTouch.isDoubleTap) {
                    previousTouch.isDoubleTap = false;
                }
            }
            
            // Update touch info
            this.touchStates.activeTouches.set(event.pointerId, {
                ...previousTouch,
                x: event.clientX,
                y: event.clientY,
                deltaX,
                deltaY,
                timestamp: Date.now()
            });

            // Handle gesture based on active gesture type
            if (this.touchStates.activeTouches.size === 2) {
                if (this.touchStates.activeGesture === 'pinch' || !this.touchStates.activeGesture) {
                    this._handlePinchMove();
                }
            } else if (this.touchStates.activeTouches.size === 1) {
                if (this.touchStates.activeGesture === 'pan' || !this.touchStates.activeGesture) {
                    this._handlePanMove(event);
                }
            }
        }
    }

    _onPointerUp(event) {
        if (event.pointerType !== 'touch') return;

        event.preventDefault();
        
        // Handle double tap completion if this was a potential double tap
        const touch = this.touchStates.activeTouches.get(event.pointerId);
        if (touch && touch.isDoubleTap && !touch.moved) {
            this._handleDoubleTap(event);
        }
        
        // Reset state
        this.touchStates.activeTouches.delete(event.pointerId);
        
        // Store last tap time for double tap detection
        this.touchStates.lastTapTime = Date.now();
        
        // End gesture if no touches remain
        if (this.touchStates.activeTouches.size === 0) {
            // Store last gesture info for debouncing
            if (this.touchStates.activeGesture) {
                this.touchStates.lastGestureType = this.touchStates.activeGesture;
                this.touchStates.lastGestureEndTime = Date.now();
            }
            
            this._resetTouchStates();
        } else if (this.touchStates.activeTouches.size === 1 && this.touchStates.activeGesture === 'pinch') {
            // If pinch ends and one finger remains, transition to pan
            const remainingTouch = Array.from(this.touchStates.activeTouches.values())[0];
            setTimeout(() => {
                // Only transition if still in same state
                if (this.touchStates.activeTouches.size === 1) {
                    this._initializePan(remainingTouch);
                }
            }, this.thresholds.touchActionDelay);
        }
    }

    _onPointerCancel(event) {
        if (event.pointerType !== 'touch') return;
        
        // Simply clean up the touch state
        this.touchStates.activeTouches.delete(event.pointerId);
        
        if (this.touchStates.activeTouches.size === 0) {
            this._resetTouchStates();
        }
    }

    _handleDoubleTap(event) {
        // Skip if animation is already in progress
        if (this.touchStates.isAnimating) return;
        
        // Set animation flag to prevent other gestures
        this.touchStates.isAnimating = true;
        
        // Get pick result at tap position
        const pickResult = this._getPickResult(event.clientX, event.clientY);
        
        if (pickResult && pickResult.hit && pickResult.pickedPoint) {
            const distanceToPoint = BABYLON.Vector3.Distance(this.camera.target, pickResult.pickedPoint);
            
            // Calculate appropriate target radius
            const targetRadius = Math.max(
                Math.min(distanceToPoint * 1.5, CONFIG.camera.upperRadiusLimit),
                CONFIG.camera.lowerRadiusLimit
            );

            // Perform camera animation
            const animationGroup = animateCamera(
                this.camera, 
                pickResult.pickedPoint, 
                targetRadius, 
                20, // Faster animation duration
                () => {
                    // Reset animation flag when complete
                    this.touchStates.isAnimating = false;
                }
            );
            
            animationGroup.play();
        } else {
            // If no hit, reset animation flag
            this.touchStates.isAnimating = false;
        }
    }

    _initializePinch() {
        // Skip if another gesture is active and exclusivity is enabled
        if (this.thresholds.enableExclusivity && 
            this.touchStates.activeGesture && 
            this.touchStates.activeGesture !== 'pinch') {
            return;
        }
        
        // Skip if pinch was recently active (debounce)
        const now = Date.now();
        if (this.touchStates.lastGestureType === 'pinch' && 
            now - this.touchStates.lastGestureEndTime < this.thresholds.gestureChangeTimeout) {
            this.touchStates.activeGesture = 'pinch';
            return;
        }
        
        const touches = Array.from(this.touchStates.activeTouches.values());
        if (touches.length !== 2) return;
        
        const distance = this._calculateTouchDistance(touches[0], touches[1]);
        
        // Only initialize if distance exceeds threshold
        if (distance < this.thresholds.minimumPinchDistance) return;
        
        const center = this._calculateTouchCenter(touches[0], touches[1]);
        
        this.touchStates.pinchStartDistance = distance;
        this.touchStates.lastPinchDistance = distance;
        this.touchStates.pinchStartCenter = center;
        this.touchStates.lastPinchCenter = center;
        this.touchStates.activeGesture = 'pinch';
        this.touchStates.gestureStartTime = now;
        
        // Initialize smoothing buffer with current distance
        this.touchStates.pinchDistanceBuffer = new Array(3).fill(distance);
    }

    _handlePinchMove() {
        if (this.touchStates.activeGesture !== 'pinch' && this.thresholds.enableExclusivity) {
            // If exclusivity is enabled and this isn't a pinch, exit
            if (this.touchStates.activeGesture) return;
            
            // Check if touches have moved enough to determine if this is a pinch
            const touches = Array.from(this.touchStates.activeTouches.values());
            if (touches.length !== 2) return;
            
            // Calculate current distance and compare to initial
            const currentDistance = this._calculateTouchDistance(touches[0], touches[1]);
            
            // If no pinch start distance set, try to initialize
            if (!this.touchStates.pinchStartDistance) {
                this._initializePinch();
                return;
            }
            
            // Determine if movement suggests a pinch gesture
            const distanceDelta = Math.abs(currentDistance - this.touchStates.pinchStartDistance);
            if (distanceDelta > this.thresholds.minimumPinchDistance) {
                this.touchStates.activeGesture = 'pinch';
            } else {
                return; // Not enough movement to classify as pinch
            }
        }

        const touches = Array.from(this.touchStates.activeTouches.values());
        if (touches.length !== 2) return;
        
        const currentDistance = this._calculateTouchDistance(touches[0], touches[1]);
        const currentCenter = this._calculateTouchCenter(touches[0], touches[1]);
        
        // Apply smoothing to pinch distance
        this.touchStates.pinchDistanceBuffer.push(currentDistance);
        this.touchStates.pinchDistanceBuffer = this.touchStates.pinchDistanceBuffer.slice(-3); // Keep last 3 values
        const smoothedDistance = this.touchStates.pinchDistanceBuffer.reduce((sum, val) => sum + val, 0) / 
                               this.touchStates.pinchDistanceBuffer.length;
        
        if (this.touchStates.lastPinchDistance) {
            // Calculate zoom with improved sensitivity and smoothing
            const zoomDelta = (smoothedDistance - this.touchStates.lastPinchDistance) * 
                            this.thresholds.pinchSensitivity * 
                            (this.camera.radius / 10); // Scale based on current radius
            
            // Apply zoom with smooth interpolation
            const targetRadius = BABYLON.Scalar.Lerp(
                this.camera.radius,
                this.camera.radius - zoomDelta,
                this.thresholds.smoothingFactor
            );
            
            this.camera.radius = BABYLON.Scalar.Clamp(
                targetRadius,
                this.camera.lowerRadiusLimit,
                this.camera.upperRadiusLimit
            );
        }
        
        // Handle pan during pinch based on center point movement
        if (this.touchStates.lastPinchCenter) {
            const deltaX = currentCenter.x - this.touchStates.lastPinchCenter.x;
            const deltaY = currentCenter.y - this.touchStates.lastPinchCenter.y;
            
            // Only pan if the center has moved beyond threshold
            if (Math.abs(deltaX) > this.thresholds.minimumPanDistance || 
                Math.abs(deltaY) > this.thresholds.minimumPanDistance) {
                
                // Use reduced sensitivity for pinch-panning for better control
                this._panCamera(deltaX, deltaY, 0.5);
            }
        }
        
        this.touchStates.lastPinchDistance = smoothedDistance;
        this.touchStates.lastPinchCenter = currentCenter;
    }

    _initializePan(touch) {
        // Skip if another gesture is active and exclusivity is enabled
        if (this.thresholds.enableExclusivity && 
            this.touchStates.activeGesture && 
            this.touchStates.activeGesture !== 'pan') {
            return;
        }
        
        // Skip if pan was recently active (debounce)
        const now = Date.now();
        if (this.touchStates.lastGestureType === 'pan' && 
            now - this.touchStates.lastGestureEndTime < this.thresholds.gestureChangeTimeout) {
            this.touchStates.activeGesture = 'pan';
            return;
        }
        
        if (!touch) return;
        
        this.touchStates.panStartPosition = { x: touch.x, y: touch.y };
        this.touchStates.lastPanPosition = { x: touch.x, y: touch.y };
        this.touchStates.activeGesture = 'pan';
        this.touchStates.gestureStartTime = now;
        
        // Initialize smoothing buffer with current position
        this.touchStates.panPositionBuffer = new Array(3).fill({ x: touch.x, y: touch.y });
    }

    _handlePanMove(event) {
        if (this.touchStates.activeGesture !== 'pan' && this.thresholds.enableExclusivity) {
            // If exclusivity is enabled and this isn't a pan, exit
            if (this.touchStates.activeGesture) return;
            
            // Check if touch has moved enough to consider a pan
            const touch = this.touchStates.activeTouches.get(event.pointerId);
            if (!touch) return;
            
            if (!this.touchStates.panStartPosition) {
                this._initializePan(touch);
                return;
            }
            
            // Determine if movement suggests a pan gesture
            const deltaX = Math.abs(touch.x - this.touchStates.panStartPosition.x);
            const deltaY = Math.abs(touch.y - this.touchStates.panStartPosition.y);
            
            if (deltaX > this.thresholds.minimumPanDistance || 
                deltaY > this.thresholds.minimumPanDistance) {
                this.touchStates.activeGesture = 'pan';
            } else {
                return; // Not enough movement to classify as pan
            }
        }

        if (!this.touchStates.lastPanPosition) return;
        
        // Apply smoothing to pan position
        this.touchStates.panPositionBuffer.push({ x: event.clientX, y: event.clientY });
        this.touchStates.panPositionBuffer = this.touchStates.panPositionBuffer.slice(-3); // Keep last 3 values
        
        const smoothedX = this.touchStates.panPositionBuffer.reduce((sum, pos) => sum + pos.x, 0) / 
                        this.touchStates.panPositionBuffer.length;
        const smoothedY = this.touchStates.panPositionBuffer.reduce((sum, pos) => sum + pos.y, 0) / 
                        this.touchStates.panPositionBuffer.length;
        
        const deltaX = smoothedX - this.touchStates.lastPanPosition.x;
        const deltaY = smoothedY - this.touchStates.lastPanPosition.y;
        
        if (Math.abs(deltaX) > this.thresholds.minimumPanDistance || 
            Math.abs(deltaY) > this.thresholds.minimumPanDistance) {
            this._panCamera(deltaX, deltaY, 1.0);
        }
        
        this.touchStates.lastPanPosition = { 
            x: smoothedX, 
            y: smoothedY,
            timestamp: Date.now()
        };
    }

    _panCamera(deltaX, deltaY, sensitivityMultiplier = 1.0) {
        const speed = this.thresholds.panSensitivity * 
                     this.camera.radius * 
                     sensitivityMultiplier;

        const worldDelta = BABYLON.Vector3.TransformCoordinates(
            new BABYLON.Vector3(deltaX * speed, -deltaY * speed, 0),
            BABYLON.Matrix.RotationY(this.camera.alpha)
        );

        // Apply smooth interpolation to the target position
        const newTarget = this.camera.target.add(worldDelta);
        this.camera.target = BABYLON.Vector3.Lerp(
            this.camera.target,
            newTarget,
            this.thresholds.smoothingFactor
        );
    }

    _calculateTouchDistance(touch1, touch2) {
        return Math.hypot(touch2.x - touch1.x, touch2.y - touch1.y);
    }

    _calculateTouchCenter(touch1, touch2) {
        return {
            x: (touch1.x + touch2.x) / 2,
            y: (touch1.y + touch2.y) / 2
        };
    }

    _getPickResult(x, y) {
        return this.scene.pick(
            x,
            y,
            (mesh) => mesh.isPickable || mesh.isVisible,
            false,
            this.camera
        );
    }

    _resetTouchStates() {
        this.touchStates.activeGesture = null;
        this.touchStates.pinchStartDistance = null;
        this.touchStates.lastPinchDistance = null;
        this.touchStates.pinchStartCenter = null;
        this.touchStates.lastPinchCenter = null;
        this.touchStates.panStartPosition = null;
        this.touchStates.lastPanPosition = null;
        this.touchStates.pinchDistanceBuffer = [];
        this.touchStates.panPositionBuffer = [];
    }

    dispose() {
        this.touchStates.activeTouches.clear();
        this._resetTouchStates();
    }
}