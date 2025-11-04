# Mercury Fix - Aligned with Other Planets

## Changes Made

### 1. Removed Special Temperature Shader
**Before**: Mercury used a complex custom shader material for temperature visualization
**After**: Mercury now uses standard `MeshPhongMaterial` like other planets

```javascript
// Now Mercury uses:
material = new THREE.MeshPhongMaterial({
    color: 0x888888,  // Gray like Mercury
    emissive: 0x222222,
    emissiveIntensity: 0.05
});
```

### 2. Disabled Special Temperature Updates
**Before**: Mercury had special `updateMercuryTemperature()` function calls
**After**: Commented out - Mercury updates position and rotation only, like other planets

### 3. Consistent Behavior
Now Mercury:
- Uses the same material system as other planets
- Updates position using the same orbital mechanics
- Updates rotation using the same rotation mechanics
- No special shader updates that could interfere with positioning

## Result
Mercury should now orbit properly aligned with other planets in the solar system, following the same physics and rendering pipeline.

## To Re-enable Temperature Visualization
If you want to bring back Mercury's temperature visualization later:
1. Uncomment the temperature shader material in `PlanetaryRenderer.js` line 156
2. Uncomment the `updateMercuryTemperature()` call in `test_system.html` line 176
3. Ensure the temperature shader update doesn't interfere with positioning

## Note
The temperature visualization worked correctly in `debug_temperature.html` because it was a simpler setup. The issue arose when integrating with the full planetary system where Mercury's special handling conflicted with the standard orbital mechanics.