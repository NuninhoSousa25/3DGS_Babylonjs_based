# BabylonJS Gaussian Splats Viewer

A modern, feature-rich web-based viewer for Gaussian Splatting models built with Babylon.js. This application provides an intuitive interface for loading and interacting with 3D Gaussian splat models (`.splat`, `.ply`, `.spz`) with advanced camera controls, post-processing effects, and mobile optimization.

###To implement / Fix
- pinch on mobile, 
- camera colision by object or by setting
- local model loading
- drag and drop is not wokring, either remove or fix
- mobilie icons
- remove vr icon

## 🌟 Features

### Core Functionality
- **Multi-format Support**: Load `.splat`, `.ply`, and `.spz` Gaussian Splatting models
- **Flexible Loading**: Upload files directly or load from URLs
- **Drag & Drop**: Simply drag model files onto the canvas to load them
- **URL Sharing**: Share specific camera views with others via URL parameters

### Camera & Controls
- **Intuitive Navigation**: Orbit, pan, and zoom with mouse or touch
- **Double-click/tap Focus**: Click any point to smoothly animate the camera to focus on it
- **Auto-rotation**: Optional automatic camera rotation during idle periods
- **Mobile Optimized**: Custom touch gesture handling with smoothing and debouncing
- **Reset View**: Quickly return to the default camera position

### Visual Enhancements
- **Post-processing Pipeline**: Built-in sharpening and FXAA anti-aliasing
- **Quality Settings**: Adjustable performance/quality balance
- **Hardware Scaling**: Automatic pixel ratio optimization for different devices
- **Responsive Design**: Adapts to various screen sizes and orientations

### User Interface
- **Modern Icon-based UI**: Clean, intuitive control panel
- **Mobile-friendly**: Floating action button and touch-optimized controls on mobile
- **Real-time Metrics**: FPS, resolution, and vertex count monitoring
- **Accessibility**: High contrast mode and reduced motion support

### Developer Tools
- **Performance Monitoring**: Real-time FPS, resolution, and vertex statistics
- **Model Management**: Easy model loading and switching
- **Configuration System**: Centralized, easily customizable settings
- **WebXR Ready**: Prepared for VR/AR experiences

## 🚀 Getting Started

### Prerequisites
- A modern web browser with WebGL2 support
- Node.js and npm (for local development)
- A local server (required for file loading due to CORS restrictions)

### Quick Start

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/3DGS_Babylonjs_based.git
   cd 3DGS_Babylonjs_based
   ```

2. **Install a static file server** (if you don't have one):
   ```bash
   npm install -g serve
   # or
   npm install -g http-server
   # or
   yarn global add serve
   ```

3. **Start the server**:
   ```bash
   serve .
   # or
   http-server .
   ```

4. **Open your browser** and navigate to the provided URL (usually `http://localhost:5000`)

The application will automatically load the default model specified in `js/config.js`.

## 📁 Project Structure

```
├── css/
│   └── styles.css              # All styling with CSS custom properties
├── js/
│   ├── main.js                 # Application entry point
│   ├── config.js               # Centralized configuration
│   ├── cameraControl.js        # Camera setup and animation
│   ├── gestureControl.js       # Advanced touch gesture handling
│   ├── mobileControl.js        # Mobile device detection and optimization
│   ├── modelLoader.js          # Model loading and management
│   ├── ui.js                   # User interface creation and handling
│   ├── helpers.js              # Utility functions
│   ├── picking.js              # 3D object picking logic
│   ├── postProcessing.js       # Visual effects pipeline
│   └── setupXR.js              # WebXR configuration (placeholder)
├── .github/
│   └── workflows/
│       └── blank.yml           # GitHub Actions workflow
├── index.html                  # Main HTML file
└── README.md                   # This file
```

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

### WebXR Integration
The application is prepared for WebXR experiences:
```javascript
// XR configuration in config.js
xr: {
    optionalFeatures: ['teleportation', 'hand-tracking'],
    teleportation: {
        floorMesh: null,
    },
}
```

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
- [WebXR Specification](https://www.w3.org/TR/webxr/)

---

Built with ❤️ using Babylon.js and modern web technologies.
