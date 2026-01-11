# Resolution and Scaling Guide

## Understanding Hardware Scaling vs Device Pixel Ratio

These two concepts work together but control different aspects of rendering quality and performance.

---

## 🎨 Hardware Scaling (engine.setHardwareScalingLevel)

**What it does:** Changes the **internal render resolution** of the 3D scene.

### How it works:
```
Hardware Scaling = 1.0 (Default)
Canvas: 1920x1080 → Renders at: 1920x1080 → Display: 1920x1080
✓ Full resolution rendering

Hardware Scaling = 0.5 (Performance Mode)
Canvas: 1920x1080 → Renders at: 960x540 → Display: 1920x1080 (upscaled)
⚡ 4x faster rendering, slightly blurry

Hardware Scaling = 2.0 (Quality Mode)
Canvas: 1920x1080 → Renders at: 3840x2160 → Display: 1920x1080 (downsampled)
✨ Sharper image, super-sampling anti-aliasing, much slower
```

### Real-world example:
- **0.3x:** Renders at 30% resolution, then stretches to screen
  - 1920x1080 screen → renders 576x324 pixels
  - **Very fast**, noticeable blur
  - Good for: Testing heavy models, low-end GPUs

- **1.0x:** Renders at native resolution
  - 1920x1080 screen → renders 1920x1080 pixels
  - **Balanced** performance and quality
  - Good for: Most use cases

- **2.0x:** Renders at 2x resolution, then downsamples
  - 1920x1080 screen → renders 3840x2160 pixels (4K!)
  - **Very sharp**, acts as anti-aliasing
  - Good for: Screenshots, high-end GPUs

- **3.0x:** Renders at 3x resolution (ultra quality)
  - 1920x1080 screen → renders 5760x3240 pixels
  - **Extremely sharp**, may be very slow
  - Good for: Export quality, stress testing

### Performance Impact:
```
Scaling   Pixels Rendered    FPS Impact    Use Case
------------------------------------------------------
0.3x      ~10% pixels        +400%         Emergency performance
0.5x      25% pixels         +300%         Low-end hardware
0.7x      49% pixels         +100%         Mobile devices
1.0x      100% pixels        Baseline      Standard quality
1.5x      225% pixels        -50%          Enhanced quality
2.0x      400% pixels        -75%          High quality
3.0x      900% pixels        -90%          Ultra quality
```

---

## 📱 Device Pixel Ratio (window.devicePixelRatio)

**What it does:** Matches the **physical pixel density** of your display.

### How it works:
This is automatically detected by the browser based on your display:

```
Standard Display (1080p monitor)
Device Pixel Ratio: 1.0
1 CSS pixel = 1 physical pixel

Retina Display (MacBook Pro)
Device Pixel Ratio: 2.0
1 CSS pixel = 4 physical pixels (2x2 grid)

4K Display (High DPI)
Device Pixel Ratio: 2.0 - 3.0
1 CSS pixel = 4-9 physical pixels
```

### Why it matters:
Without accounting for DPR, your 3D scene would look blurry on high-DPI displays because:
- Canvas CSS size: 1000x1000 pixels
- Physical pixels: 2000x2000 (on Retina)
- If you only render 1000x1000, it gets stretched → **blurry**

### Babylon.js handles this automatically:
```javascript
// Engine automatically uses adaptToDeviceRatio: true
const engine = new BABYLON.Engine(canvas, true, {
    adaptToDeviceRatio: true  // Auto-detects and uses correct DPR
});
```

### Display Types:
| Display Type | DPR | Example |
|--------------|-----|---------|
| Standard HD | 1.0 | Desktop monitors |
| MacBook Retina | 2.0 | MacBook Pro 15" |
| iPhone | 2.0-3.0 | iPhone 12+, iPad Pro |
| 4K Monitor | 1.5-2.0 | Dell 4K, LG UltraFine |
| Windows Scaling | 1.25-1.5 | Windows "125%" setting |

---

## 🔬 Combined Effect

Both work together to determine final render quality:

### Example: Retina MacBook Pro
```
Screen Resolution: 2880x1800 physical pixels
Device Pixel Ratio: 2.0 (detected automatically)
Canvas CSS Size: 1440x900

Scenario 1: Hardware Scaling = 1.0
→ Renders: 1440x900 × 2.0 (DPR) = 2880x1800
→ Result: Perfect sharpness ✓

Scenario 2: Hardware Scaling = 0.5 (performance)
→ Renders: 1440x900 × 2.0 (DPR) × 0.5 = 1440x900
→ Result: Blurry but fast ⚡

Scenario 3: Hardware Scaling = 2.0 (quality)
→ Renders: 1440x900 × 2.0 (DPR) × 2.0 = 5760x3600
→ Result: Ultra-sharp but slow ✨
```

### Formula:
```
Final Render Resolution = Canvas Size × Device Pixel Ratio × Hardware Scaling

Performance Cost = (Hardware Scaling)² × GPU complexity
```

---

## 🎮 Practical Usage in the Comparison Tool

### Hardware Scaling Slider (0.3x - 3.0x)
**You can control this directly**
- Drag left (0.3x): Prioritize FPS, sacrifice quality
- Middle (1.0x): Balanced
- Drag right (3.0x): Prioritize quality, sacrifice FPS

### Device Pixel Ratio
**Auto-detected, read-only**
- Shows your display's native DPI
- 1.0 = Standard display
- 2.0+ = High-DPI display (Retina, 4K)
- Babylon.js automatically adapts to this

---

## 💡 Best Practices

### For Maximum Performance:
```
Hardware Scaling: 0.5x - 0.7x
Device Pixel Ratio: Auto (1.0 or higher depending on display)
Expected FPS Gain: 2-4x
Use when: Testing huge models, mobile devices
```

### For Maximum Quality:
```
Hardware Scaling: 2.0x - 3.0x
Device Pixel Ratio: Auto (2.0+ on Retina)
Expected FPS Loss: 50-90%
Use when: Taking screenshots, final renders
```

### For Balanced Experience:
```
Hardware Scaling: 1.0x
Device Pixel Ratio: Auto
Expected FPS: Baseline
Use when: Normal viewing, interactive work
```

---

## 🔍 Visual Comparison

### Resolution Math Examples:

**1920x1080 Display (DPR = 1.0)**
| Hardware Scaling | Actual Render | Pixels Rendered | vs Baseline |
|------------------|---------------|-----------------|-------------|
| 0.3x | 576×324 | 186,624 | 9% |
| 0.5x | 960×540 | 518,400 | 25% |
| 1.0x | 1920×1080 | 2,073,600 | 100% |
| 2.0x | 3840×2160 | 8,294,400 | 400% |
| 3.0x | 5760×3240 | 18,662,400 | 900% |

**MacBook Pro Retina (DPR = 2.0)**
| Hardware Scaling | Actual Render | Pixels Rendered | vs Baseline |
|------------------|---------------|-----------------|-------------|
| 0.3x | 1152×648 | 746,496 | 9% |
| 0.5x | 1920×1080 | 2,073,600 | 25% |
| 1.0x | 3840×2160 | 8,294,400 | 100% |
| 2.0x | 7680×4320 | 33,177,600 | 400% |
| 3.0x | 11520×6480 | 74,649,600 | 900% |

---

## 🧪 Testing Recommendations

1. **Start at 1.0x** (baseline)
   - Record FPS and quality

2. **Test 0.5x** (performance)
   - See FPS improvement
   - Evaluate if quality loss is acceptable

3. **Test 2.0x** (quality)
   - Check if your GPU can handle it
   - Evaluate quality improvement

4. **Compare WebGL vs WebGPU**
   - WebGPU should handle higher scaling better
   - Look for 30-50% FPS improvement

5. **Load heavy models**
   - Test with large .splat files (50MB+)
   - Find the breaking point for each renderer

---

## 📊 Expected Results

### WebGL Performance:
- **0.5x scaling:** 60+ FPS on most models
- **1.0x scaling:** 30-60 FPS on medium models
- **2.0x scaling:** 15-30 FPS on simple models
- **3.0x scaling:** <15 FPS (may struggle)

### WebGPU Performance (if supported):
- **0.5x scaling:** 120+ FPS on most models
- **1.0x scaling:** 60-90 FPS on medium models
- **2.0x scaling:** 30-60 FPS on complex models
- **3.0x scaling:** 15-30 FPS (better than WebGL)

---

## 🎯 Summary

| Aspect | Hardware Scaling | Device Pixel Ratio |
|--------|------------------|-------------------|
| **What** | Internal render resolution | Screen DPI adaptation |
| **Control** | Manual (slider 0.3x-3.0x) | Automatic (browser) |
| **Impact** | Performance vs Quality | Sharpness on HiDPI |
| **When to adjust** | Always (based on needs) | Never (auto-handled) |
| **Performance cost** | Squared (2x = 4x pixels) | Linear (2x = 2x pixels) |
| **Use for** | Balancing FPS/quality | Matching display type |

**Key Takeaway:** Hardware Scaling is your **performance knob** - turn it down for speed, up for quality. Device Pixel Ratio is **automatic** - it ensures your scene looks sharp on any display type.
