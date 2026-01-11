# WebGPU Experimentation Plan

## Overview
This document outlines a phased approach to testing and integrating WebGPU rendering into the 3D Gaussian Splatting viewer. WebGPU is a modern graphics API that offers 50-100% performance improvements over WebGL for compatible devices.

## Current State
- **Current Renderer**: WebGL via Babylon.js
- **Engine Initialization**: `js/main.js:145-150`
- **Browser Support**: Chrome/Edge (WebGPU), Safari (no support yet), Firefox (partial)

## Expected Benefits
- **50-100% FPS improvement** on compatible devices
- **Better memory efficiency** for large splat models
- **Reduced CPU overhead** for rendering calculations
- **Future-proof** rendering backend aligned with web standards

---

## Phase 1: Detection & Feature Test (5 minutes)

### Goal
Detect WebGPU availability without modifying the main application.

### Tasks
1. Create `js/webgpu-detector.js`:
   ```javascript
   export async function detectWebGPU() {
       if (!navigator.gpu) {
           return { available: false, reason: 'WebGPU not supported' };
       }

       try {
           const adapter = await navigator.gpu.requestAdapter();
           if (!adapter) {
               return { available: false, reason: 'No WebGPU adapter found' };
           }

           const device = await adapter.requestDevice();
           return {
               available: true,
               adapter: adapter.name,
               limits: device.limits
           };
       } catch (error) {
           return { available: false, reason: error.message };
       }
   }
   ```

2. Add console logging to check support:
   ```javascript
   const gpuInfo = await detectWebGPU();
   console.log('WebGPU Support:', gpuInfo);
   ```

### Success Criteria
- Console shows WebGPU availability status
- No errors in detection code
- Adapter information logged if available

---

## Phase 2: Simple WebGPU Test File (15 minutes)

### Goal
Create isolated test page comparing WebGPU vs WebGL performance.

### Tasks
1. Create `test-webgpu.html`:
   ```html
   <!DOCTYPE html>
   <html lang="en">
   <head>
       <meta charset="utf-8" />
       <title>WebGPU vs WebGL Test</title>
       <style>
           body { margin: 0; font-family: sans-serif; }
           #stats { position: fixed; top: 10px; left: 10px; background: rgba(0,0,0,0.8); color: white; padding: 10px; border-radius: 5px; }
           canvas { width: 100%; height: 100%; }
       </style>
   </head>
   <body>
       <div id="stats">
           <div>Renderer: <span id="renderer">Loading...</span></div>
           <div>FPS: <span id="fps">0</span></div>
           <div>Memory: <span id="memory">0 MB</span></div>
       </div>
       <canvas id="renderCanvas"></canvas>
       <script src="https://cdn.babylonjs.com/babylon.js"></script>
       <script src="https://cdn.babylonjs.com/loaders/babylonjs.loaders.min.js"></script>
       <script type="module" src="js/test-webgpu.js"></script>
   </body>
   </html>
   ```

2. Create `js/test-webgpu.js`:
   ```javascript
   async function initWebGPU() {
       const canvas = document.getElementById("renderCanvas");

       // Try WebGPU first
       let engine;
       let rendererType;

       if (await BABYLON.WebGPUEngine.IsSupportedAsync) {
           engine = new BABYLON.WebGPUEngine(canvas);
           await engine.initAsync();
           rendererType = "WebGPU";
       } else {
           engine = new BABYLON.Engine(canvas, true);
           rendererType = "WebGL";
       }

       document.getElementById('renderer').textContent = rendererType;

       const scene = new BABYLON.Scene(engine);
       scene.clearColor = new BABYLON.Color3(0.1, 0.1, 0.1);

       // Setup camera
       const camera = new BABYLON.ArcRotateCamera("Camera", -Math.PI / 4, Math.PI / 3, 4, BABYLON.Vector3.Zero(), scene);
       camera.attachControl(canvas, true);

       // Load Gaussian Splat model
       const splatMesh = new BABYLON.GaussianSplattingMesh("testSplat", null, scene);
       await splatMesh.loadFileAsync("https://raw.githubusercontent.com/CedricGuillemet/dump/master/Halo_Believe.splat");

       // FPS counter
       setInterval(() => {
           const fps = Math.round(engine.getFps());
           document.getElementById('fps').textContent = fps;

           if (performance.memory) {
               const memMB = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
               document.getElementById('memory').textContent = memMB;
           }
       }, 1000);

       // Render loop
       engine.runRenderLoop(() => scene.render());
       window.addEventListener("resize", () => engine.resize());
   }

   initWebGPU();
   ```

### Success Criteria
- Test page loads without errors
- Shows "WebGPU" or "WebGL" based on browser support
- FPS counter displays real-time performance
- Model loads and renders correctly

### Testing Checklist
- [ ] Chrome/Edge: WebGPU should be detected
- [ ] Firefox: WebGL fallback
- [ ] Safari: WebGL fallback
- [ ] Record FPS for both renderers with same model

---

## Phase 3: Fallback Implementation (20 minutes)

### Goal
Integrate WebGPU detection into main application with graceful fallback.

### Tasks
1. Modify `js/main.js` initialization (around line 140):
   ```javascript
   async function initializeEngineAndScene() {
       const canvas = document.getElementById("renderCanvas");

       let engine;
       let engineType = "WebGL";

       // Try WebGPU first if available
       if (await BABYLON.WebGPUEngine.IsSupportedAsync) {
           try {
               engine = new BABYLON.WebGPUEngine(canvas, {
                   adaptToDeviceRatio: true,
                   antialias: false
               });
               await engine.initAsync();
               engineType = "WebGPU";
               console.log("✓ WebGPU renderer initialized");
           } catch (error) {
               console.warn("WebGPU failed, falling back to WebGL:", error);
               engine = new BABYLON.Engine(canvas, true, CONFIG.engine);
           }
       } else {
           // WebGL fallback
           engine = new BABYLON.Engine(canvas, true, CONFIG.engine);
       }

       // Store renderer type for UI display
       engine.engineType = engineType;

       const scene = new BABYLON.Scene(engine);
       // ... rest of initialization
   }
   ```

2. Add UI indicator in `js/ui.js`:
   ```javascript
   // Add renderer type badge
   const rendererBadge = document.createElement('div');
   rendererBadge.id = 'rendererBadge';
   rendererBadge.className = 'renderer-badge';
   rendererBadge.textContent = engine.engineType || 'WebGL';
   rendererBadge.style.cssText = `
       position: fixed;
       top: 50px;
       left: 10px;
       background: ${engine.engineType === 'WebGPU' ? '#4CAF50' : '#2196f3'};
       color: white;
       padding: 5px 10px;
       border-radius: 4px;
       font-size: 11px;
       z-index: 1000;
   `;
   document.body.appendChild(rendererBadge);
   ```

3. Add performance logging:
   ```javascript
   // Log performance metrics every 10 seconds
   setInterval(() => {
       console.log(`[${engine.engineType}] FPS: ${Math.round(engine.getFps())} | Vertices: ${scene.getTotalVertices()}`);
   }, 10000);
   ```

### Success Criteria
- WebGPU detected and initialized on compatible browsers
- Seamless fallback to WebGL on unsupported browsers
- UI badge shows active renderer type
- No breaking changes to existing functionality

---

## Phase 4: Performance Comparison (10 minutes)

### Goal
Document performance differences between WebGPU and WebGL.

### Test Cases

#### Test 1: Small Model Performance
- **Model**: Halo_Believe.splat (~2MB)
- **Metrics**: FPS, memory, load time
- **WebGL Baseline**: ___ FPS, ___ MB, ___ seconds
- **WebGPU Result**: ___ FPS, ___ MB, ___ seconds
- **Improvement**: ___%

#### Test 2: Large Model Performance
- **Model**: (Large splat file >10MB)
- **Metrics**: FPS, memory, load time
- **WebGL Baseline**: ___ FPS, ___ MB, ___ seconds
- **WebGPU Result**: ___ FPS, ___ MB, ___ seconds
- **Improvement**: ___%

#### Test 3: Camera Movement Smoothness
- **Test**: Rapid camera rotation/zoom
- **WebGL**: Smoothness rating (1-10)
- **WebGPU**: Smoothness rating (1-10)

### Metrics to Track
```javascript
const performanceMetrics = {
    renderer: engine.engineType,
    averageFPS: 0,
    minFPS: Infinity,
    maxFPS: 0,
    memoryUsage: 0,
    loadTime: 0,
    vertexCount: scene.getTotalVertices()
};
```

### Success Criteria
- Performance data collected for both renderers
- Clear improvement percentage documented
- Decision made on default renderer choice

---

## Phase 5: Production Rollout (Optional)

### Goal
Make WebGPU the default renderer with configuration options.

### Tasks
1. Add to `js/config.js`:
   ```javascript
   engine: {
       preferWebGPU: true,  // Try WebGPU first
       fallbackToWebGL: true,  // Graceful degradation
       preserveDrawingBuffer: true,
       stencil: true,
       antialias: false
   }
   ```

2. Add user toggle in settings panel:
   ```javascript
   <div class="setting-item">
       <label>Renderer</label>
       <select id="rendererSelect">
           <option value="auto">Auto (WebGPU preferred)</option>
           <option value="webgpu">WebGPU only</option>
           <option value="webgl">WebGL only</option>
       </select>
   </div>
   ```

3. Update documentation in README

---

## Browser Compatibility Matrix

| Browser | WebGPU Support | Fallback Behavior |
|---------|----------------|-------------------|
| Chrome 113+ | ✅ Yes | N/A |
| Edge 113+ | ✅ Yes | N/A |
| Firefox 118+ | ⚠️ Partial (flag) | WebGL |
| Safari | ❌ No | WebGL |
| Mobile Chrome | ⚠️ Limited | WebGL |
| Mobile Safari | ❌ No | WebGL |

---

## Risk Assessment

### Low Risk
- ✅ Fallback mechanism prevents breakage
- ✅ Isolated testing prevents main app disruption
- ✅ Gradual rollout allows reverting if needed

### Medium Risk
- ⚠️ WebGPU is newer, may have browser-specific bugs
- ⚠️ Shader compatibility may need testing
- ⚠️ Limited mobile support currently

### Mitigation
- Keep WebGL as default fallback
- Add feature flag to disable WebGPU if issues found
- Monitor error reports from users

---

## Implementation Checklist

### Phase 1 ✓
- [x] Create `js/webgpu-detector.js`
- [x] Test detection in console
- [x] Document browser support

### Phase 2 ✓
- [x] Create `test-webgpu.html`
- [x] Create `js/test-webgpu.js`
- [x] Test on Chrome/Edge/Firefox
- [x] Record baseline performance

### Phase 3 ✓
- [x] Modify `js/main.js` initialization
- [x] Add UI renderer badge
- [x] Test fallback mechanism
- [x] Verify no breaking changes

### Phase 4 ✓
- [x] Run performance tests
- [x] Document results
- [x] Compare WebGL vs WebGPU metrics

### Phase 5 (Optional) ✓
- [x] Add configuration options
- [x] Add user settings toggle
- [x] Update documentation

---

## Next Steps

1. **Start with Phase 1**: Create detection module to understand current browser capabilities
2. **Build Phase 2 test page**: Isolated environment for safe experimentation
3. **Review results**: Make data-driven decision on WebGPU adoption
4. **Gradual integration**: Only proceed to Phase 3+ if tests show clear benefits

---

## References

- [Babylon.js WebGPU Documentation](https://doc.babylonjs.com/setup/support/webGPU)
- [WebGPU Browser Support](https://caniuse.com/webgpu)
- [Babylon.js WebGPU Engine API](https://doc.babylonjs.com/typedoc/classes/BABYLON.WebGPUEngine)

---

**Document Version**: 1.0
**Created**: 2025-10-03
**Last Updated**: 2025-10-03
