# 3D Model Viewer

A modern, responsive 3D model viewer built with Babylon.js, featuring a unified interface that works seamlessly across all devices and platforms. This application has been completely reorganized and optimized for consistent behavior and maintainability.


## To implement / Fix
- mobilie icons -- icon bar on mobile should be Hamburger based currently hamburger menu only apears in fullscreen mode
- better ui for mobile
- performance
- code quality 

## ✅ Recent Updates & Fixes

### **Completed Improvements**
- ✅ **Unified UI System**: Consistent 6-icon top bar across all devices
- ✅ **Fixed Positioning**: Icon bar always stays top-right regardless of orientation/fullscreen
- ✅ **Mobile Icon Sizing**: Proper touch-friendly icon sizes on mobile devices  
- ✅ **Touch Logic Separation**: Touch features don't interfere with PC functionality
- ✅ **Code Organization**: Complete restructure with clear sections and documentation
- ✅ **Removed Complex Device Detection**: Simplified to touch-only detection
- ✅ **CSS Architecture**: Organized into logical sections with consistent naming

### **Current Status**
- 🎯 **Production Ready**: Clean, organized, and fully functional codebase
- 📱 **Cross-Platform**: Works consistently on desktop, mobile, and tablet
- 🎮 **Universal Controls**: Same interface and positioning on all devices
- 🧹 **Clean Architecture**: Well-documented, maintainable code structure

## 🌟 Features

### **🎯 Universal Interface**
- **Unified 6-icon top bar** that works consistently on all devices
- **Responsive design** that adapts to any screen size
- **Touch-friendly controls** with proper sizing and gestures
- **Always top-right positioning** regardless of device orientation or fullscreen mode

### **🔧 Core Functionality**
- **Settings Panel**: Quality control, auto-rotation, post-processing options
- **Info Panel**: Interactive controls guide for mouse and touch navigation
- **Developer Tools**: Performance monitoring and model loading capabilities
- **Camera Controls**: Reset view, fullscreen toggle, and view sharing
- **Model Loading**: Support for file upload and URL loading
- **URL Sharing**: Share specific camera views with others via URL parameters

### **📱 Cross-Platform Support**
- **Desktop**: Full mouse and keyboard support
- **Mobile**: Touch gestures, swipe controls, and optimized UI
- **Tablet**: Hybrid touch and precision controls
- **All Orientations**: Landscape and portrait support

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

### Interface
- **Settings**: Toggle auto-rotation, adjust quality, configure post-processing
- **Info**: View control instructions and tips
- **Developer Tools**: Monitor performance, load new models
- **Reset View**: Return to initial camera position
- **Fullscreen**: Enter/exit fullscreen mode
- **Share**: Copy shareable URL with current camera position

## 🔧 Advanced Features

### URL Sharing
The application supports sharing specific camera views through URL parameters:
```
https://yoursite.com/?model=https://example.com/model.splat&alpha=1.5&beta=1.0&radius=5.0&tx=0&ty=0&tz=0
```

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

## 🌐 Browser Support

- **Chrome/Edge**: Full support (recommended)
- **Firefox**: Full support
- **Safari**: Supported with some WebGL limitations
- **Mobile Browsers**: Optimized support with touch controls

### WebGL Requirements
- WebGL2 support required
- Hardware-accelerated graphics recommended
- Minimum 1GB available GPU memory for large models

## 📱 Mobile Experience

The application includes extensive mobile optimizations:

- **Responsive Design**: Adapts to portrait and landscape orientations
- **Touch Gestures**: Advanced multi-touch handling with smoothing
- **Performance Optimization**: Lower default pixel ratios and quality settings
- **Mobile UI**: Floating action button and streamlined interface
- **Gesture Debouncing**: Prevents accidental inputs during complex gestures

## 🔬 Developer Information

### Performance Considerations
- Models are loaded asynchronously with progress indication
- Memory management includes automatic disposal of previous models
- Configurable hardware scaling for performance tuning
- Real-time performance monitoring available

### Extending the Application
1. **Adding New Model Formats**: Extend `modelLoader.js` and update supported formats in config
2. **Custom Post Effects**: Modify `postProcessing.js` to add new visual effects
3. **UI Customization**: Update `ui.js` and `styles.css` for interface changes
4. **Camera Behaviors**: Extend `cameraControl.js` for new camera animations


## 🐛 Troubleshooting

### Common Issues

**Models won't load**:
- Ensure you're running a local server (not opening HTML directly)
- Check browser console for CORS errors
- Verify model URL is accessible

**Performance issues**:
- Try lowering quality settings
- Disable post-processing effects
- Check if hardware acceleration is enabled

**Touch controls not working**:
- Ensure you're on a touch device
- Check if JavaScript is enabled
- Try refreshing the page

**Fullscreen not working**:
- Some browsers require user interaction before allowing fullscreen
- Check if fullscreen is disabled in browser settings

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
