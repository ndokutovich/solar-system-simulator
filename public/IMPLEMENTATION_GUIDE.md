# Solar System Implementation Guide

## 📁 Three Different Implementations

### 1. **index.html** (Russian UI - Temperature Focus)
- **File**: Uses `src/main.js` with `MinimalSolarSystem` class
- **Purpose**: Original Mercury temperature testing
- **Mercury**: Has **working temperature shader**
- **Features**:
  - Real-time temperature heatmap on Mercury
  - 3:2 spin-orbit resonance
  - Detailed Russian controls
  - Coordinate grids and advanced options
- **Implementation**: Self-contained Mercury with custom shader

### 2. **index_full.html** (English UI - Full System)
- **File**: Uses `src/SolarSystemApp.js` with `PlanetaryRenderer.js`
- **Purpose**: Complete solar system visualization
- **Mercury**: Standard gray material (temperature disabled)
- **Features**:
  - All 31 celestial bodies
  - Planet selection
  - Info panels
  - Clean English UI
- **Implementation**: Modular with separate renderer

### 3. **test_system.html** (Test Version)
- **File**: Uses `PlanetaryRenderer.js` directly
- **Purpose**: Testing planetary system
- **Mercury**: Standard gray material (temperature disabled)
- **Features**:
  - Simple controls
  - FPS counter
  - Minimal UI
- **Implementation**: Direct test harness

## 🔧 Mercury Temperature Status

### Where Temperature Works ✅
- **index.html** - Temperature shader active and working
- **debug_temperature.html** - Original working solution

### Where Temperature is Disabled ❌
- **index_full.html** - Uses standard material
- **test_system.html** - Uses standard material

## 📝 Key Differences

| Feature | index.html | index_full.html | test_system.html |
|---------|------------|-----------------|-------------------|
| Language | Russian | English | English |
| Mercury Temp | ✅ Working | ❌ Disabled | ❌ Disabled |
| All Planets | ❌ Mercury only | ✅ All 31 | ✅ All 31 |
| UI Complexity | High | Medium | Low |
| Class | MinimalSolarSystem | SolarSystemApp | TestSolarSystem |

## 🚀 How to Re-enable Temperature in Full System

To enable Mercury's temperature in index_full.html or test_system.html:

1. In `PlanetaryRenderer.js`, change line 155-161:
```javascript
// FROM:
case 'MERCURY':
    material = new THREE.MeshPhongMaterial({
        color: 0x888888,
        emissive: 0x222222,
        emissiveIntensity: 0.05
    });
    break;

// TO:
case 'MERCURY':
    material = this.createMercuryMaterial(data);
    break;
```

2. In `test_system.html`, uncomment lines 176-178:
```javascript
if (key === 'MERCURY') {
    this.updateMercuryTemperature(body);
}
```

## 🎯 Recommendations

- **For temperature testing**: Use `index.html` (Russian)
- **For full solar system**: Use `index_full.html` (English)
- **For development**: Use `test_system.html`

## ⚠️ Important Notes

1. Mercury's temperature shader requires proper rotation to work
2. The coordinate transformation (world to local) is critical
3. Each implementation is independent - changes to one don't affect others
4. The physics services (OrbitalMechanics, RotationalMechanics) are shared

## 🐛 Common Issues

### Temperature not following sun
- **Cause**: Missing rotation update or incorrect coordinate transform
- **Fix**: Ensure Mercury rotates and sun direction is transformed to local space

### Mercury inside sun
- **Cause**: Sun too large
- **Fix**: Adjust sun scale in `getScaledRadius()`

### Infinite loading
- **Cause**: Module initialization not triggered
- **Fix**: Manually initialize after dynamic import

---

*Last Updated: Current Session*