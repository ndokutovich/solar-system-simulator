# Mercury Rotation Analysis

## Current Implementation

### How Planet Rotation Works

**Location:** `Application.js:415`

```javascript
mercury.rotation.y = this.mercuryState.rotation * Math.PI / 180;
```

**What Happens:**
1. Every animation frame, `updatePhysics()` calculates rotation delta
2. `calculateRotationDelta(timeSpeed)` computes degrees to rotate based on time speed
3. `updateRotation()` adds delta to current rotation (in degrees)
4. Result is applied to Mercury mesh's Y-axis rotation

**Key Point:** The **planet mesh itself rotates**. The texture is "painted" on the mesh, so it rotates with the mesh.

---

## Temperature Heat Map

### How It Works

**Location:** `MercuryComponent.js:111-157`

**Creation Process:**
1. **One-time generation** in `createTemperatureTexture()` at initialization
2. Creates a 2048x1024 canvas (2M pixels)
3. For each pixel:
   - Convert pixel position to longitude/latitude
   - Calculate temperature at that lon/lat
   - Paint pixel with temperature color

**Critical Issue:** The temperature map is created **ONCE** and assumes:
- Longitude 0° = subsolar point (hottest)
- Longitude 180° = antisolar point (coldest)

**Temperature Calculation (Line 162-176):**
```javascript
calculatePixelTemperature(lon, lat) {
  const sunAngle = ((lon + 360) % 360);

  if (sunAngle < 90) {
    temp = -173 + (sunAngle / 90) * 600;  // Heating up
  } else if (sunAngle < 180) {
    temp = 427;  // Peak temperature
  } else if (sunAngle < 270) {
    temp = 427 - ((sunAngle - 180) / 90) * 600;  // Cooling down
  } else {
    temp = -173;  // Night side
  }
}
```

**Texture Mapping:**
- Longitude maps to X coordinate (0-360° → 0-2048 pixels)
- Latitude maps to Y coordinate (-90 to +90° → 1024-0 pixels)
- Texture wraps around sphere using UV coordinates

---

## Terminator Lines

### How They Work

**Location:** `MercuryComponent.js:209-253`

**Creation Process:**
1. **One-time generation** in `createTerminatorLines()` at initialization
2. Creates vertical semicircle from south pole to north pole
3. Two lines created:
   - **Morning terminator** (cyan) - rotated +90° around Z-axis
   - **Evening terminator** (orange) - rotated -90° around Z-axis

**Positioning:**
```javascript
// Morning terminator at X = 0 (90° longitude in model space)
morningLine.rotation.z = Math.PI / 2;

// Evening terminator at X = 0 (270° longitude in model space)
eveningLine.rotation.z = -Math.PI / 2;
```

**Key Point:** Lines are **fixed to the planet mesh** (added to `mercuryGroup`), so they rotate with the planet.

---

## 🔴 THE PROBLEM

### Current Behavior (INCORRECT)

**What's happening:**
1. ✅ Planet rotates correctly (mesh spins on Y-axis)
2. ✅ Texture rotates with planet (correct - it's painted on the mesh)
3. ✅ Terminator lines rotate with planet (correct - they're part of mercuryGroup)
4. ❌ **SUN POSITION IS FIXED** - The sun never moves!

### The Issue

In the current implementation:
- Temperature map assumes longitude 0° always faces the sun
- As the planet rotates, the hot spot rotates away from the sun
- The sun stays at position (0, 0, 0) and never moves in orbit
- Mercury orbits around the sun, but sun doesn't move relative to Mercury

**Expected Behavior:**
- Sun should remain at a fixed position in space (0, 0, 0) ✅ CORRECT
- Mercury should orbit around the sun ✅ CORRECT (mercuryGroup.position.x/z changes)
- Mercury should rotate on its axis ✅ CORRECT (mercury.rotation.y changes)
- **But the hot spot should always face the sun** ❌ WRONG

---

## 🎯 Root Cause Analysis

### Why The Hot Spot Moves

The temperature texture is created with a **fixed orientation**:
- Longitude 0° = hot
- Longitude 180° = cold

But this is in **texture space**, not **world space**.

When the planet rotates:
- The texture rotates with it
- Longitude 0° on the texture rotates away from the sun
- The hot spot no longer faces the sun

### Visual Example

**Initial State:**
```
Sun → [🔥 Hot spot at lon=0°] ← Planet surface
```

**After 180° rotation:**
```
Sun → [🥶 Cold spot at lon=180° (was 0°)] ← Planet surface
      [🔥 Hot spot now on far side]
```

---

## ✅ WHAT'S WORKING CORRECTLY

1. **Orbital Mechanics**
   - Mercury moves in elliptical orbit ✅
   - Orbital position calculated correctly ✅
   - Position updated every frame ✅

2. **Rotation Mechanics**
   - 3:2 spin-orbit resonance ratio ✅
   - Rotation speed calculated correctly ✅
   - Rotation applied to mesh ✅

3. **Terminator Lines**
   - Positioned correctly in model space ✅
   - Rotate with planet as expected ✅
   - Morning/evening terminators at 90° separation ✅

4. **Lighting**
   - Directional light points from sun to Mercury ✅
   - Light direction updates with Mercury's orbital position ✅

---

## 🔧 WHAT NEEDS TO BE FIXED

### Option 1: Dynamic Texture (Current Approach - WRONG)

**Problem:** The texture is static and doesn't account for rotation

**What Should Happen:**
- Temperature should be calculated based on **sun direction in world space**
- Need to calculate angle between surface point and sun
- Update texture every frame (expensive!) OR use shader

### Option 2: Stationary Texture (Astronomically Correct - RECOMMENDED)

**How Real Mercury Works:**
1. Mercury rotates slowly (58.646 Earth days per rotation)
2. Temperature map is relatively **fixed to the surface** (thermal inertia)
3. As Mercury rotates, different parts face the sun
4. The hot spot moves across the surface over time

**What Should Happen:**
- Texture should be **fixed to the planet surface** ✅ (Already correct!)
- But we need to **offset the texture** so the hot spot aligns with sun direction
- Need to calculate texture rotation based on orbital position

### Option 3: Shader-Based (Best Performance)

Calculate temperature in real-time using a custom shader:
- Pass sun direction to shader as uniform
- Calculate temperature per-pixel based on sun angle
- No texture updates needed

---

## 🎨 Current Coordinate System

### Planet Mesh Rotation
- Y-axis rotation (vertical axis)
- 0° rotation = initial orientation
- Positive rotation = counterclockwise from above

### Temperature Texture Mapping
- Longitude 0° → Texture X = 0
- Longitude 180° → Texture X = 0.5 (middle)
- Longitude 360° → Texture X = 1.0 (wraps to 0)

### Sun Position
- Fixed at (0, 0, 0) in world space
- Directional light points from sun to Mercury
- Light direction updates with Mercury's orbital position

### Terminator Lines
- Morning: Perpendicular to sun direction (90° in model space)
- Evening: Opposite side (-90° in model space)
- Both rotate with planet mesh

---

## 📊 Summary

**Current Status:**
- ✅ Planet rotates correctly
- ✅ Texture rotates with planet (as designed)
- ✅ Terminator lines rotate with planet (as designed)
- ✅ Orbital motion works correctly
- ❌ Hot spot doesn't track the sun
- ❌ Temperature map orientation is static

**The Real Issue:**
The temperature map is created once with a fixed orientation, assuming longitude 0° always faces the sun. This is incorrect for a rotating planet.

**Next Steps:**
1. Decide on approach (dynamic texture, offset texture, or shader)
2. Implement sun-tracking for temperature calculation
3. Either:
   - Regenerate texture every frame (expensive)
   - Offset texture rotation to match sun direction (simple fix)
   - Use shader for real-time calculation (best solution)
