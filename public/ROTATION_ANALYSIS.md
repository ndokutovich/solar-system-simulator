# Mercury Temperature Rotation Analysis

## The Problem
The temperature heatmap is rotating with Mercury instead of staying locked to the sun.

## Test Results

### Test 1: No Rotation ✅
- Mercury mesh: `rotation.y = 0`
- Sun direction: World space directly
- **Result**: Hot side correctly faces sun

### Test 2: With Rotation (Current Implementation) ❌
- Mercury mesh: `rotation.y = time * 2`
- Sun direction: Transformed to local space with matrix inverse
- **Result**: Hot side rotates with Mercury (WRONG for temperature)

### Test 3: Counter-Rotation (Solution) ✅
- Mercury mesh: `rotation.y = 0` (no visual rotation)
- Track rotation separately for physics calculations
- Sun direction: World space directly
- **Result**: Temperature stays sun-locked

## Why This Happens

When we rotate Mercury's mesh:
1. The shader's normal vectors rotate with the mesh
2. The matrix inverse transformation accounts for this rotation
3. The hot spot ends up rotating with Mercury

## The Core Issue

**Temperature maps should show heat distribution, not surface features!**

- Temperature depends on: **Sun angle only**
- Temperature does NOT depend on: **Mercury's rotation**

## Solutions

### Option 1: Don't Rotate Mercury (Simple)
```javascript
// Don't rotate the mesh
mercury.rotation.y = 0;
// Sun direction is just world direction
const sunDirLocal = toSunWorld.clone();
```

### Option 2: Separate Visual and Physical Rotation
```javascript
// Track rotation for physics
const physicalRotation = time * rotationRate;
// But don't apply to mesh
mercury.rotation.y = 0;
// Use world sun direction
const sunDirLocal = toSunWorld.clone();
```

### Option 3: Counter-Rotate Sun Direction
```javascript
// Apply rotation
mercury.rotation.y = rotationAngle;
// Counter-rotate sun direction
const counterRotation = -rotationAngle;
const sunDirLocal = toSunWorld.clone()
    .applyAxisAngle(new THREE.Vector3(0, 1, 0), counterRotation);
```

## Recommendation

Use **Option 1** for temperature visualization:
- Temperature maps show thermal state
- Hot side should always face sun
- Mercury's rotation is irrelevant for temperature distribution

## Test Command

Open: http://localhost:8080/solar_system/test_heatmap_rotation.html

Try each test button to see the difference!