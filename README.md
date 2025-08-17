# 3D Model Viewer

A 3D model viewer built with Babylon.js, specifically optimized for 3D Gaussian Splats. This viewer provides a consistent, high-performance experience across all devices, including desktop, mobile, and tablet.

## To implement / Fix
- better ui for mobile
- performance
- code quality
- revise export by url
- obj in case there no material, aply default material as in .stl 
- Multiple resize callbacks instead of debounced single handler
- gltf oclusion - verify
- fbx is not working
- its a bit slow loading in big 3d models

## 🌟 Features
Model Loading & Compatibility
- Drag-and-Drop: Easily load a model by dragging a file directly into the viewer.
- File Upload: Use the built-in interface to load a model from your device.
- URL Loading: Load models from a remote URL.
- Shareable URLs: Create and share URLs that save the model's current camera position, allowing others to see the exact view you're seeing.
- Supported Formats: The viewer is compatible with gltf, splat, ply, and spz model formats, leveraging the power of Babylon.js loaders.

### **🔧 Core Functionality**
- Customization: Adjust quality settings, toggle auto-rotation, and manage post-processing options.
- Intuitive Navigation: A clear info panel provides a guide for both mouse and touch controls.
- Developer Tools: Monitor performance with real-time stats like FPS, resolution, and vertex counts.
- Camera Controls: Easily reset the camera view and toggle fullscreen mode.
- URL Sharing: Share specific camera views with others via URL parameters

### **📱 Cross-Platform Support**
- Desktop: Full mouse and keyboard support.
- Mobile & Tablet: Optimized for touch gestures, including one-finger orbit, two-finger pan, and pinch-to-zoom.
- Responsive UI: A unified icon bar ensures a consistent user experience regardless of screen size or device orientation.

### **🎨 Advanced Features**
- **Post-processing pipeline** with sharpening and anti-aliasing
- **Quality presets** (Low/Medium/High) for performance optimization
- **Touch sensitivity adjustment** for mobile devices
- **Real-time performance monitoring** with FPS, resolution, and vertex counts
- **Model format support** via Babylon.js loaders
- **Auto-rotation** with customizable timing and speed

## 🚀 Getting Started

### **Prerequisites**
- Modern web browser with WebGL support
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

### **Basic Usage**
1. **Open the application** in your web browser
2. **Use the 6-icon toolbar** in the top-right corner:
   - ⚙️ **Settings**: Configure quality and visualization options
   - ℹ️ **Info**: Learn about navigation controls
   - 🔄 **Reset**: Return camera to default position
   - ⛶ **Fullscreen**: Toggle fullscreen mode
   - 🔧 **Dev Tools**: Load models and monitor performance
   - 📤 **Share**: Copy shareable URL with current camera position

## 🏗️ Architecture

### **File Structure**
```
viewer/
├── index.html              # Main HTML file
├── css/
│   └── styles.css          # Unified, organized stylesheet
├── js/
│   ├── main.js            # Application entry point
│   ├── ui.js              # UI controller (cleaned & organized)
│   ├── config.js          # Configuration settings
│   ├── helpers.js         # Utility functions
│   ├── modelLoader.js     # Model loading functionality
│   ├── cameraControl.js   # Camera control system
│   ├── gestureControl.js  # Touch gesture handling
│   ├── deviceDetection.js # Simple device detection
│   ├── mobileControl.js   # Mobile-specific controls
│   ├── postProcessing.js  # Rendering pipeline
│   └── picking.js         # 3D object interaction
└── README.md              # This file
```

### **Technology Stack**
- **🎮 Babylon.js**: 3D rendering engine
- **🎨 CSS Custom Properties**: Theming and responsive design
- **📱 Modern JavaScript (ES6+)**: Modular, clean code
- **🔧 Web APIs**: Fullscreen, Clipboard, Touch Events
- **📐 CSS Grid & Flexbox**: Responsive layouts

## ⚙️ Configuration

Most settings can be customized in `js/config.js`:

```javascript
export const CONFIG = {
    // Default model to load
    defaultModelUrl: "https://example.com/model.splat",
    
    // Camera behavior
    camera: {
        alpha: -Math.PI / 4,
        beta: Math.PI / 3,
        radius: 4,
        upperRadiusLimit: 7.0,
        lowerRadiusLimit: 2.0,
        useAutoRotationBehavior: true,
        // ... more camera settings
    },
    
    // Mobile-specific overrides
    mobile: {
        cameraInertia: 0.3,
        pinchPrecision: 30,
        angularSensibilityX: 3000,
        angularSensibilityY: 3000,
        // ... more mobile settings
    },
    
    // Post-processing effects
    postProcessing: {
        sharpenEnabled: true,
        sharpenEdgeAmount: 0.62,
        fxaaEnabled: true,
    },
    
    // Supported file formats
    modelLoader: {
        supportedFormats: ['splat', 'ply', 'spz'],
        defaultFallbackModel: "https://fallback.com/model.splat",
        defaultModelScale: 1.0,
    },
    
    // ... more configuration options
};
```

## 🎮 Controls

### Desktop
- **Left Click + Drag**: Orbit camera around the model
- **Right Click + Drag**: Pan the camera
- **Mouse Wheel**: Zoom in/out
- **Double Click**: Focus camera on clicked point

### Mobile/Touch
- **One Finger Drag**: Orbit camera
- **Two Finger Drag**: Pan camera  
- **Pinch**: Zoom in/out
- **Double Tap**: Focus camera on tapped point


## 🔧 Advanced Features

### URL Sharing
The viewer supports sharing a specific camera view by adding parameters to the URL. This is particularly useful for quickly showing a model from a specific angle.

Example URL:
https://yoursite.com/?model=https://example.com/model.gltf&alpha=1.5&beta=1.0&radius=5.0

Supported Parameters
model: The URL of the 3D model to load.
alpha, beta, radius: Camera position and zoom level.
tx, ty, tz: Target camera position.

### Quality Settings
- **Low**: Better performance, reduced visual fidelity
- **Medium**: Balanced performance and quality (default)
- **High**: Best visual quality, may impact performance

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

### WebGL Requirements
- WebGL2 support required
- Hardware-accelerated graphics recommended
- Minimum 1GB available GPU memory for large models

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
