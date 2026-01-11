# 3D Model Viewer

A comprehensive 3D model viewer built with Babylon.js, specifically optimized for 3D Gaussian Splats and traditional mesh models. This viewer provides a consistent, high-performance experience across all devices, including desktop, mobile, and tablet, with advanced sharing capabilities and complete state preservation.

## 📋 Development Status

### 🔄 To Implement / Fix
- Multiple resize callbacks instead of debounced single handler
- Default cube after error in loading model is not cleared when a new model is loaded after
- Loading optimization for large 3D models
- Check behavior with auto rotate and horizontal limitation
- Loading model popup usually doesn't appear centered
- GLTF culling / occlusion verification
- FBX format support debugging
- Performance optimizations for large models (>100MB)
- Code quality improvements and documentation
- Better UI layout for smaller mobile screens
- Revise picking logic - not consistent when trying to select 3D Gaussian Splats

### ✅ Recently Completed
- **Gaussian Splat Orientation Fix** - Gaussian Splat models (.splat, .ply, .spz, .sog) now have their Z-axis scale inverted by default to fix mirroring issues during loading.
- **Parallel Model Pre-fetching** - Model download now starts immediately upon page load, running in parallel with engine initialization to significantly reduce wait times
- **Early Loading Overlay** - Real-time download progress bar and status feedback for shared URLs, eliminating "ghost loading" uncertainty
- **Optimized Initialization** - Reduced post-loading transition delay from 50ms to 5ms for snappier experience once model is ready
- **WebGPU Integration** - Seamlessly leverages WebGPU for 50-100% FPS improvement on compatible devices with graceful fallback to WebGL
- **Camera Limits Master Toggle Fix** - "Enable Camera Limits" now properly controls all restrictions
- **WordPress Embedding Support** - fixed background color inheritance issues in iframe contexts
- **Wheel Event Prevention** - scroll wheel over viewer no longer scrolls parent page when embedded
- **Default Settings Configuration** - camera limits and zoom toggles now respect CONFIG defaults
- **Background Color Picker** with full URL parameter support and real-time updates
- **Model Scale Slider Fix** - now correctly updates when models are normalized during loading
- **Precision Scale Control** - Model scale slider now supports values down to 0.001 with 3-decimal precision input
- **Extended Zoom Limits** - "Max Distance" and "Min Distance" sliders now allow for much closer zoom levels (down to 0.1 and 0.01 respectively)
- **Shared URL State Fidelity** - Shared URLs now bypass automatic model normalization to ensure the recipient sees exactly the same view (scale and position) as the sender
- **File Size Display Fix** - properly shows file sizes for both local files and URL-loaded models
- **Shared URL Loading Feedback** - immediate loading spinner and messages when opening shared URLs
- **Comprehensive URL sharing** with complete state preservation
- **URL compression system** for shorter, cleaner shareable links
- **Enhanced settings panel** with all options exportable via URL
- **Camera limits system** with full URL serialization
- **Export functionality** with HTML/ZIP package generation
- **Post-processing pipeline** with sharpening and anti-aliasing
- **Touch controls optimization** for mobile devices

## 🌟 Core Features

### **📁 Model Loading & Compatibility**
- **Drag & Drop**: Easily load models by dragging files directly into the viewer (optimized for large splat files)
- **File Upload**: Built-in interface to load models from your device
- **URL Loading**: Load models from remote URLs with automatic format detection
- **Format Support**: Compatible with GLTF, GLB, SPLAT, PLY, SPZ, and SOG formats
- **Automatic Orientation**: Gaussian Splat models (.splat, .ply, .spz, .sog) are automatically oriented to fix upside-down loading issues
- **Automatic Scaling**: Intelligent model scaling based on format and size

### **🔗 Advanced URL Sharing System**
- **Complete State Preservation**: URLs capture and restore the entire viewer state
- **Compressed URLs**: Intelligent compression reduces URL length by 30-50%
- **Bidirectional Support**: Generate and consume shareable links seamlessly
- **Backward Compatibility**: Works with existing URL formats

### **🌐 WordPress & Iframe Embedding**
- **WordPress Compatible**: Designed to work seamlessly in WordPress iframes
- **Background Color Fix**: Prevents theme color inheritance issues
- **Scroll Isolation**: Mouse wheel over viewer won't scroll parent page
- **CSS Override Protection**: Robust styling prevents theme conflicts

**📊 What Gets Shared:**
- Camera position, rotation, and zoom level
- Model URL and scale
- All settings panel configurations
- Camera movement limits and restrictions
- Post-processing effects and quality settings
- Touch sensitivity for mobile devices

### **🎛️ Settings Panel**
- **Visualization Controls**: Auto-rotation, render resolution, field of view, model scaling, background color picker
- **Camera Limits**: Comprehensive zoom, rotation, and panning restrictions
- **Post-Processing**: Sharpening effects with intensity control, anti-aliasing options
- **Touch Controls**: Sensitivity adjustment for mobile devices
- **Real-time Updates**: All changes instantly applied and saved to URLs

## 🎯 Picking & Interaction System

The viewer employs a specialized multi-strategy picking system to handle the unique challenges of 3D Gaussian Splats (which lack traditional triangle geometry).

### **🔍 The 4 Picking Strategies**
To ensure reliable interaction (like double-click to focus) across all models, the `getPickResult` function in `js/picking.js` executes the following fallbacks:

1.  **Helper Mesh Picking**: Hits an invisible "Proxy Box" that perfectly wraps the model. This is the most accurate method for Gaussian Splats.
2.  **Broader Selection**: A secondary pass that ignores strict pickability flags to find any visible mesh under the cursor.
3.  **Ray-Sphere Intersection**: A mathematical check against a bounding sphere. Used if the proxy box is missed.
4.  **Standard Ray Casting**: A manual ray cast from the camera through the pointer coordinates.

### **🛠️ Debugging & Scale Troubleshooting**

The Developer Panel includes a **Picking Strategy** dropdown that allows you to:
-   **Force specific strategies**: Isolate and test each picking method individually (e.g., force "Helper Mesh" to see if the proxy box is correctly sized).
-   **Disable fallbacks**: When a specific strategy is selected, the system will not fall back to others, allowing for precise debugging of failure points.
-   **Default Behavior (ALL)**: The "ALL" option restores the standard multi-step fallback behavior.

For advanced debugging, you can use `togglePickingHelperVisibility(true)` in the console to visualize the invisible helper meshes.

The console will also log which strategy successfully captured the click, or why a specific strategy failed.

### **📱 Mobile Interaction Fixes**
-   **Touch Picking**: The `GestureControl` system now uses the enhanced `getPickResult` instead of standard Babylon picking.
-   **Zoom Consistency**: Double-tap zoom level on mobile now matches the desktop behavior (`distance * 3.5`).

## 🚀 Getting Started

### **Prerequisites**
- Modern web browser with WebGL2 or WebGPU support
- Secure Context (HTTPS or `localhost`) is required for WebGPU functionality.
- Local web server (for file loading capabilities)

### **Installation**
1. **Clone or download** the project files
2. **Start a local web server** in the project directory:
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js (http-server)
   npx http-server -p 8000
   
   # Using PHP  
   php -S localhost:8000
   ```
3. **Open your browser** and navigate to `http://localhost:8000`

### **WordPress Embedding**
To embed the viewer in WordPress or other CMS platforms:

1. **Upload the viewer files** to your web server
2. **Create an iframe** with the viewer URL:
   ```html
   <iframe src="https://yoursite.com/viewer/"
           width="800" height="600"
           frameborder="0"
           allowfullscreen>
   </iframe>
   ```
3. **Optional**: Add specific model URLs or settings via URL parameters
4. **Responsive**: The viewer automatically adapts to iframe dimensions

**✅ Embedding Features:**
- Automatic background color correction for WordPress themes
- Scroll wheel isolation (won't scroll parent page)
- CSS protection against theme interference
- Fullscreen support where permitted

### **Basic Usage**
1. **Open the application** in your web browser
2. **Use the 6-icon toolbar** in the top-right corner:
   - ⚙️ **Settings**: Configure quality and visualization options
   - ℹ️ **Info**: Learn about navigation controls
   - 🔄 **Reset**: Return camera to default position
   - ⛶ **Fullscreen**: Toggle fullscreen mode
   - 🔧 **Dev Tools**: Load models and monitor performance
   - 📤 **Share**: Copy shareable URL with current camera position

## 📚 WebGPU Testing & Diagnostics

To assess and troubleshoot WebGPU functionality, the viewer includes dedicated test pages:

-   **WebGPU Detection Test (`test-webgpu-detection.html`)**:
    -   Provides detailed diagnostic information about your browser's WebGPU capabilities, including GPU adapter details, device limits, supported features, and browser information.
    -   **Important**: WebGPU requires a **Secure Context** (HTTPS or `localhost`). If you are testing locally via an IP address (`http://192.168.1.x`), WebGPU will be unavailable.

-   **WebGPU vs WebGL Performance Comparison Lab (`test-webgpu-comparison.html`)**:
    -   An interactive environment to compare the performance of WebGPU and WebGL side-by-side.
    -   Allows switching renderers, adjusting resolution, loading different model complexities, and monitoring real-time performance statistics.

## 🏗️ Architecture

### **File Structure**
```
viewer/
├── index.html              # Main HTML file
├── css/
│   └── styles.css          # Unified, organized stylesheet
├── js/
│   ├── main.js            # Application entry point & scene initialization
│   ├── ui.js              # UI controller with URL compression system
│   ├── config.js          # Configuration settings & constants
│   ├── helpers.js         # Utility functions & DOM management
│   ├── modelLoader.js     # Model loading functionality
│   ├── cameraControl.js   # Camera control system
│   ├── cameraLimits.js    # Camera movement restrictions
│   ├── gestureControl.js  # Touch gesture handling
│   ├── deviceDetection.js # Device capability detection
│   ├── mobileControl.js   # Mobile-specific controls
│   ├── postProcessing.js  # Rendering pipeline & effects
│   ├── picking.js         # 3D object interaction
│   ├── export/
│   │   └── ViewerExporter.js # HTML/ZIP export functionality
│   └── ui/
│       ├── components/
│       │   ├── controls.js    # Reusable UI controls
│       │   ├── icons.js       # SVG icon definitions
│       │   └── toast.js       # Notification system
│       └── panels/
│           ├── settingsPanel.js # Settings & quality controls
│           ├── devPanel.js      # Developer tools & model loading
│           └── infoPanel.js     # Control information & help
└── README.md              # This documentation
```

### **Technology Stack**
- **🎮 Babylon.js**: 3D rendering engine (WebGL2 & WebGPU)
- **🎨 CSS Custom Properties**: Theming and responsive design
- **📱 Modern JavaScript (ES6+)**: Modular, clean code
- **🔧 Web APIs**: Fullscreen, Clipboard, Touch Events
- **📐 CSS Grid & Flexbox**: Responsive layouts

## ⚙️ Configuration

The viewer is highly configurable through `js/config.js`. All settings are organized into logical sections:

```javascript
export const CONFIG = {
    // Default model to load on startup
    defaultModelUrl: "https://example.com/model.splat",
    
    // Camera behavior and defaults
    camera: {
        alpha: -Math.PI / 4,           // Initial horizontal rotation
        beta: Math.PI / 3,             // Initial vertical rotation  
        radius: 4,                     // Initial zoom distance
        upperRadiusLimit: 7.0,         // Maximum zoom out
        lowerRadiusLimit: 2.0,         // Maximum zoom in
        useAutoRotationBehavior: true, // Enable auto-rotation
        autoRotation: {
            idleRotationWaitTime: 5000,    // Delay before auto-rotation
            idleRotationSpeed: 0.01,       // Rotation speed
            idleRotationSpinUpTime: 2000   // Spin-up time
        }
    },
    
    // Camera movement limits and restrictions
    cameraLimits: {
        enabled: true,                             // Master toggle default state
        defaultRestrictions: {
            zoom: true,                            // Enable zoom limits by default
            vertical: true,                        // Enable vertical rotation limits
            horizontal: false,                     // Disable horizontal limits by default
            panning: true                          // Enable panning by default
        },
        defaultLimits: {
            zoom: { min: 1.0, max: 15.0 },        // Distance limits
            vertical: { upLimit: -80, downLimit: 5 }, // Vertical angle limits (degrees)
            panning: { maxDistance: 10.0 }         // Maximum pan distance
        }
    },
    
    // Post-processing effects configuration
    postProcessing: {
        sharpenEnabled: true,              // Enable sharpening
        sharpenEdgeAmount: 0.62,          // Sharpening intensity
        fxaaEnabled: true,                // Legacy FXAA setting
        antiAliasing: {
            type: 'fxaa',                 // none, fxaa
            taaSamples: 16                // TAA sample count (if supported)
        }
    },
    
    // Model loading configuration
    modelLoader: {
        supportedFormats: ['splat', 'ply', 'spz', 'sog', 'gltf', 'glb'],
        defaultFallbackModel: "https://fallback.com/model.splat",
        defaultModelScale: 1.0,
        maxFileSize: 500 * 1024 * 1024  // 500MB limit
    },
    
    // Mobile and touch-specific settings
    mobile: {
        cameraInertia: 0.3,               // Touch inertia
        pinchPrecision: 30,               // Pinch sensitivity
        angularSensibilityX: 3000,        // Touch rotation sensitivity
        angularSensibilityY: 3000,
        panningSensibility: 1000,         // Touch panning sensitivity
        autoSwitchToMobile: true          // Auto-detect mobile devices
    },
    
    // UI behavior and performance
    ui: {
        domReadyDelay: 100,               // DOM initialization delay
        sensitivity: {
            baseAngular: 3000,            // Base rotation sensitivity
            basePanning: 1000             // Base panning sensitivity
        }
    },
    
    // Engine and rendering settings
    engine: {
        preferWebGPU: true,                // Attempt to use WebGPU first if available
        fallbackToWebGL: true,             // Fallback to WebGL if WebGPU initialization fails
        antialias: false,                 // Engine-level antialiasing
        stencil: true,                   // Stencil buffer
        preserveDrawingBuffer: true,      // Buffer preservation
        powerPreference: "high-performance" // GPU preference
    }
};
```

### **🔧 Customization Options**

**Camera Limits**: Modify `cameraLimits.defaultLimits` to change movement restrictions
**Performance**: Adjust `postProcessing` settings for different quality/performance balance  
**Mobile Experience**: Tune `mobile` settings for optimal touch responsiveness
**Model Support**: Add new formats to `modelLoader.supportedFormats`
**Auto-Rotation**: Customize timing and behavior in `camera.autoRotation`

## 🎮 Controls

### Desktop
- **Left Click + Drag**: Orbit camera around the model
- **Right Click + Drag**: Pan the camera
- **Mouse Wheel**: Zoom in/out (isolated when embedded in iframes)
- **Double Click**: Focus camera on clicked point

### Mobile/Touch
- **One Finger Drag**: Orbit camera
- **Two Finger Drag**: Pan camera
- **Pinch**: Zoom in/out
- **Double Tap**: Focus camera on tapped point

### Embedding Behavior
- **Scroll Isolation**: Mouse wheel over embedded viewer won't scroll parent page
- **Camera Limits**: Master toggle controls all movement restrictions
- **Background Consistency**: Maintains dark theme regardless of parent page styling


## 🔧 Advanced Features

### 🔗 Comprehensive URL Sharing System

The viewer features an advanced URL sharing system that preserves the complete application state, allowing you to share not just camera positions but entire viewing configurations.

#### **🎯 How It Works**
1. **Configure Your View**: Set up the perfect camera angle, adjust settings, apply post-processing
2. **Click Share Button**: Press the share icon (📤) in the toolbar
3. **Copy & Share**: URL is automatically copied to clipboard with all state preserved
4. **Seamless Restoration**: Recipients see exactly what you configured

#### **🗜️ URL Compression System**
To keep URLs manageable, the system uses intelligent compression:

- **Parameter Name Shortening**: Long names become short codes
- **Value Compression**: Common values get abbreviated
- **Base64 Fallback**: Extremely long URLs get base64 encoded
- **30-50% Size Reduction**: Typical compression saves significant space

#### **📊 Complete Parameter Reference**

**🎥 Camera & Model Parameters**
```
Full Name        → Short Code  │ Description
─────────────────┼─────────────┼────────────────────────
model            → m           │ Model URL to load
alpha            → a           │ Camera horizontal rotation (radians)
beta             → b           │ Camera vertical rotation (radians) 
radius           → r           │ Camera distance from target
fov              → f           │ Field of view (radians)
tx, ty, tz       → x, y, z     │ Camera target position (3D coordinates)
scale            → s           │ Model scale multiplier
```

**⚙️ Settings Panel Parameters**
```
Full Name        → Short Code  │ Description
─────────────────┼─────────────┼────────────────────────
autoRotate       → ar          │ Auto-rotation enabled (1/0)
renderScale      → rs          │ Render resolution multiplier (0.1-2.0)
sharpen          → sh          │ Sharpening enabled (1/0)  
sharpenIntensity → si          │ Sharpening intensity (0.0-2.0)
antiAliasing     → aa          │ Anti-aliasing type (n/f for none/fxaa)
touchSensitivity → ts          │ Touch sensitivity (1-10 scale)
backgroundColor  → bg          │ Scene background color (hex format #RRGGBB)
```

**🎛️ Camera Limits Parameters**
```
Full Name        → Short Code  │ Description
─────────────────┼─────────────┼────────────────────────
restrictions     → rest        │ Active restrictions (v=vertical, d=distance, p=panning)
alphaMin         → an          │ Minimum horizontal rotation
alphaMax         → ax          │ Maximum horizontal rotation
betaMin          → bn          │ Minimum vertical rotation
betaMax          → bx          │ Maximum vertical rotation
radiusMin        → rn          │ Minimum zoom distance
radiusMax        → rx          │ Maximum zoom distance
```

#### **📝 Example URLs**

**Before Compression:**
```
https://viewer.com/?model=https://example.com/model.splat&alpha=-1.47&beta=1.05&radius=4.00&fov=0.80&tx=0.00&ty=0.00&tz=0.00&scale=0.50&renderScale=1.0&sharpen=0&betaMin=0.175&betaMax=1.658&radiusMin=1.00&radiusMax=15.00&restrictions=vdp
```

**After Compression:**
```
https://viewer.com/?m=https://example.com/model.splat&a=-1.47&b=1.05&r=4.00&f=0.80&x=0.00&y=0.00&z=0.00&s=0.50&rs=1.0&sh=0&bn=0.18&bx=1.66&rn=1.00&rx=15.00&rest=vdp
```

#### **🔄 Backward Compatibility**
- Works with existing long-form parameter URLs
- Automatically detects and decompresses short-form URLs  
- Mixed parameter formats supported in same URL
- Graceful fallback for unrecognized parameters

### 📤 Export System

The viewer includes a powerful export system that creates standalone viewers with complete state preservation.

#### **🎯 Export Options**

**📄 HTML Export (Single File)**
- Self-contained HTML file with embedded assets
- All JavaScript, CSS, and model data included
- Complete viewer functionality preserved
- Perfect for email attachments or simple sharing

**📦 ZIP Package Export**
- Organized file structure for easy editing
- Separate HTML, CSS, JavaScript, and model files
- Includes comprehensive README with setup instructions
- Ideal for developers and advanced users

#### **✨ What Gets Exported**
- **Complete Model Data**: Original model embedded or referenced
- **Camera State**: Exact position, rotation, and zoom level
- **All Settings**: Quality, post-processing, auto-rotation, etc.
- **Camera Limits**: Movement restrictions and boundaries
- **Visual State**: Field of view, model scale, target position
- **Metadata**: Export date, version info, original URL

#### **🔧 How to Export**
1. **Set Up Your View**: Configure camera, settings, and model
2. **Click Export Button**: Located next to the share button in toolbar
3. **Choose Format**: Select HTML (single file) or ZIP (package)
4. **Download**: File automatically downloads with timestamp

**📊 Export File Sizes**
- **HTML Export**: Typically 2-10MB depending on model size
- **ZIP Export**: Similar size but organized for editing
- **Compression**: Efficient encoding minimizes file size

### 🎛️ Render Resolution & Performance

The viewer provides direct control over the rendering pipeline to balance visual fidelity and performance:

- **Render Resolution**: A manual slider (0.1x - 2.0x) controls the hardware scaling level.
  - **1.0x**: Native resolution (sharpest standard view).
  - **< 1.0x**: Upscaled (improves FPS on low-end devices).
  - **> 1.0x**: Supersampled (highest quality, heavier on GPU).

- **Post-Processing**: Effects are independent of resolution.
  - **Sharpening**: Enhances edge definition (configurable intensity).
  - **FXAA**: Fast approximate anti-aliasing (can be toggled separately).

By default, post-processing effects are disabled to ensure maximum compatibility and performance, but can be easily enabled via the Settings Panel.

### Mobile Optimizations
- Automatic device detection
- Touch-optimized gesture handling
- Reduced pixel ratios for better performance
- Simplified UI for smaller screens
- Hardware-specific camera sensitivity adjustments

### Post-Processing Pipeline
- **Sharpening**: Enhances edge definition
- **FXAA**: Fast approximate anti-aliasing
- **Hardware Scaling**: Dynamic resolution adjustment

### Rendering Requirements
- **WebGL2 Support**: Required for traditional rendering.
- **WebGPU Support**: Recommended for optimal performance on compatible browsers.
- Hardware-accelerated graphics recommended.
- Minimum 1GB available GPU memory for large models.

## 📄 License

This project is open source. Please check the repository for specific license information.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- [Babylon.js](https://babylonjs.com/) - 3D engine
- [Gaussian Splatting](https://github.com/graphdeco-inria/gaussian-splatting) - Original research
- [CedricGuillemet](https://github.com/CedricGuillemet) - Gaussian Splatting implementation for Babylon.js

## 📚 Additional Resources

- [Babylon.js Documentation](https://doc.babylonjs.com/)
- [Gaussian Splatting Paper](https://repo-sam.inria.fr/fungraph/3d-gaussian-splatting/)

---

Built with ❤️ using Babylon.js and modern web technologies.
