# Complete Coordinate System Analysis

## Object Hierarchy

```
Scene (world space, origin at 0,0,0)
│
├── Sun (at 0, 0, 0)
│   ├── sunSphere
│   ├── sunGlow
│   └── sunRays
│
├── mercuryOrbitGroup (at 0, 0, 0)
│   │
│   ├── mercuryGroup (positioned at orbital location)
│   │   │   Initial: (15, 0, 0) - see positionInOrbit() line 397
│   │   │   Runtime: Updated via mercuryGroup.position.x/z in Application.js
│   │   │
│   │   ├── mercury (sphere mesh)
│   │   │   │   rotation.y = planet's axial rotation
│   │   │   │   Temperature texture mapped to sphere
│   │   │   │
│   │   │   └── Material
│   │   │       └── map: tempTexture (canvas texture)
│   │   │
│   │   ├── morningTerminator (line)
│   │   │   rotation.z = π/2 (90°)
│   │   │
│   │   ├── eveningTerminator (line)
│   │   │   rotation.z = -π/2 (-90°)
│   │   │
│   │   ├── poleMarkers
│   │   ├── axesHelper
│   │   └── routeLines
│   │
│   ├── perihelionMarker (at orbital point, not in mercuryGroup!)
│   └── aphelionMarker (at orbital point, not in mercuryGroup!)
│
├── orbitLine (separate, not in hierarchy)
├── gridHelper
└── stars
```

## Temperature Texture Mapping

**File:** MercuryComponent.js lines 144-178

### Longitude to X mapping:
```javascript
const lon = (x / width - 0.5) * 360;
```

- x=0 → lon = -180°
- x=width/4 → lon = -90°
- x=width/2 → lon = 0°
- x=3*width/4 → lon = 90°
- x=width → lon = 180°

### Temperature by Longitude:
```javascript
if (sunAngle < 90)       // -180° to -90°: Heating up
if (sunAngle < 180)      // -90° to 0°: HOT (427°C)
if (sunAngle < 270)      // 0° to 90°: Cooling down
else                     // 90° to 180°: COLD (-173°C)
```

**BUT WAIT!** sunAngle = ((lon + 360) % 360)

So for lon=-180 to 180:
- lon=-180 → sunAngle=180 → HOT? NO! sunAngle=180, so goes to third case (cooling)
- lon=-90 → sunAngle=270 → COLD
- lon=0 → sunAngle=0 → Heating
- lon=90 → sunAngle=90 → Transition to hot
- lon=135 → sunAngle=135 → HOT (427°C)
- lon=180 → sunAngle=180 → Start cooling

### ACTUAL Hot Spot Location in Texture:
**Longitude 90° to 180° is HOT (427°C)**

In texture coordinates:
- lon=135° is center of hot zone
- x/width = (135 + 180)/360 = 315/360 = 0.875

**Hot spot is at 87.5% across the texture width (right side of texture)**

## Three.js Sphere UV Mapping

Three.js maps textures to spheres as follows:
- Texture X (U) maps to longitude: 0 to 2π (0° to 360°)
- **Texture left edge (U=0) = longitude 0°**
- **Texture right edge (U=1) = longitude 360° = 0°**
- Sphere rotation.y rotates around Y axis (vertical)

### Default Orientation (rotation.y = 0):
- **+X axis (right) = longitude 0°**
- **-X axis (left) = longitude 180°**
- **+Z axis (front) = longitude 270° = -90°**
- **-Z axis (back) = longitude 90°**

Wait, let me verify Three.js convention...

Actually, in Three.js SphereGeometry:
- U=0 (texture left) maps to phi=0
- phi goes 0 to 2π around the equator
- **When rotation.y=0:**
  - phi=0 is at **+Z axis**
  - phi=π/2 is at **+X axis**
  - phi=π is at **-Z axis**
  - phi=3π/2 is at **-X axis**

So the mapping is:
- Texture U=0 (left edge) → +Z axis (front of sphere)
- Texture U=0.25 → +X axis (right)
- Texture U=0.5 → -Z axis (back)
- Texture U=0.75 → -X axis (left)

## Current Temperature Texture Hot Spot

From calculatePixelTemperature:
- Hot at longitude 90° to 180°
- Peak at ~135°

In texture coordinates:
- lon=135° → x = (135/360 + 0.5) * width = 0.875 * width

In Three.js sphere mapping (rotation.y=0):
- Texture U=0.875
- This is 0.875 * 2π = 5.5 radians = 315°
- phi=315° → This is between -X and +Z

**So the hot spot in the texture (at U=0.875) maps to approximately -X/-Z diagonal when rotation.y=0**

## Current Situation

### Initial Position (Application.js initialization):
```javascript
// MercuryComponent.js line 397
mercuryGroup.position.set(MERCURY_CONSTANTS.SUN_DISTANCE, 0, 0);
// Mercury starts at (15, 0, 0) - to the right of sun
```

### Mercury at (15, 0, 0) - Right of Sun
- Sun is at (0, 0, 0)
- Sun direction from Mercury: **towards -X axis**
- For hot spot to face sun, we need the texture hot spot to point **-X**

### Where is texture hot spot pointing?
- Texture hot spot at U=0.875
- At rotation.y=0, this points to about **-X/-Z diagonal** (southwest)
- We need it to point **-X** (west)

### Required Rotation
To align hot spot (-X/-Z diagonal) with sun (-X direction):
- Need to rotate to move hot spot from southwest to west
- That's about +45° or -315°

## The Problem with Current Code

```javascript
// Application.js line 431
mercury.rotation.y = this.mercuryState.rotation * Math.PI / 180 + angleToSun + textureHotSpotOffset;
```

Issues:
1. `angleToSun = atan2(-z, -x)` - for Mercury at (15,0,0), this gives atan2(0, -15) = π (180°)
2. `textureHotSpotOffset = 135° = 2.356 rad`
3. When rotation=0, orbital at (15,0,0):
   - `rotation.y = 0 + π + 2.356 = 5.498 rad = 315°`

But we need to think about what rotation.y means!

## Three.js Rotation Convention

rotation.y rotates around the Y axis (up-down):
- Positive rotation = **counterclockwise when viewed from above**
- rotation.y = 0: texture U=0 points at **+Z** (north in world)
- rotation.y = π/2: texture U=0 points at **-X** (west in world)
- rotation.y = π: texture U=0 points at **-Z** (south in world)
- rotation.y = 3π/2: texture U=0 points at **+X** (east in world)

## Solution Strategy

1. Calculate where sun is relative to Mercury
2. Calculate what rotation.y makes the hot spot point at the sun
3. Add the planet's actual rotation on top of that

Let me work through this...

### When Mercury is at (15, 0, 0):
- Sun is at **-X direction** from Mercury's perspective
- We want hot spot (texture U=0.875) to point **-X**

Texture U=0.875 corresponds to phi = 0.875 * 2π = 5.5 rad = 315° = -45°

For phi=315° on the mesh to point at -X:
- phi=315° should map to world -X direction
- phi=0 normally maps to +Z
- To make phi=315° map to -X, we need phi=0 to map to...
  - phi needs to rotate by: -X is at 270° (or -90°)
  - phi=315° to point at 270° means: 270° - 315° = -45° rotation

Wait, this is getting confusing. Let me use a different approach.

## Simple Fix Approach

**Goal:** Hot spot should always face sun, regardless of orbital position

**Observation:**
- Texture hot spot is at a fixed position in texture space
- Need to rotate planet so that position faces the sun

**Method:**
1. Find angle from Mercury to Sun in XZ plane
2. Find where texture hot spot is in mesh local coordinates
3. Rotate mesh so hot spot points towards sun angle
4. Add planet's actual rotation

The issue is we're not accounting for where the hot spot actually is in the initial mesh orientation!
