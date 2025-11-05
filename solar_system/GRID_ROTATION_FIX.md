# Grid Rotation & Alignment Fix

## Problem

Latitude/longitude grids were **NOT rotating** with planets and were **NOT aligned** to the rotation axis (axial tilt).

### Root Cause

Grids were being added to the **container** instead of the **mesh**:

```javascript
// WRONG (before)
const parent = body.container || mesh;
this.createLatLongGrid(key, radius * 1.01, parent);
```

### Container vs Mesh Architecture

The planet structure is:
```
Container (non-rotating, only orbits)
├── Mesh (rotates with axial tilt applied)
│   └── Grid should be here! ✅
├── Moon orbit lines (fixed in space)
└── Label (sprite, always faces camera)
```

When grid was on **container**: Grid didn't rotate ❌
When grid is on **mesh**: Grid rotates with planet ✅

---

## Solution

**Changed grid parent from container to mesh** in 2 locations:

### 1. `toggleGrids()` method (Line 1103)
```javascript
// FIXED
this.createLatLongGrid(key, radius * 1.01, mesh);  // Always use mesh
```

### 2. `updateScale()` method (Line 746)
```javascript
// FIXED
this.createLatLongGrid(key, radius * 1.01, mesh);  // Always use mesh
```

---

## Result

Now grids:
1. ✅ **Rotate with the planet** as it spins
2. ✅ **Aligned to rotation axis** (respect axial tilt)
3. ✅ Scale correctly with planet size changes

### Visual Verification

**Earth** (23.44° tilt):
- Grid tilted ~23° from orbital plane
- Rotates once per ~24 hours
- Equator (green line) shows tilt clearly

**Uranus** (97.77° tilt):
- Grid nearly horizontal (on its side!)
- Rotates showing extreme tilt
- One of the poles points toward sun during orbit

**Venus** (177.36° tilt):
- Grid upside down (retrograde)
- Rotates backwards
- Axial tilt ~177° visible

**Jupiter** (3.13° tilt):
- Nearly vertical grid (minimal tilt)
- Spins very fast (9.9 hours)
- Almost no axial tilt visible

---

## Technical Notes

### Why Labels Stay on Container
Labels are sprites with billboard behavior (always face camera). They should NOT rotate with the planet:
```javascript
this.createLabel(key, name, container || mesh, radius);  // Container is correct for labels
```

### Why Moon Orbits Stay on Container
Moon orbit lines are fixed in space and should not rotate with parent planet:
```javascript
parentBody.container.add(orbit);  // Container is correct for moon orbits
```

### Grid Coordinate System
Grids are created in the planet's local coordinate system:
- **Latitude lines** (parallels): Circles parallel to equator
- **Longitude lines** (meridians): Great circles through poles
- **Equator**: Green (0° latitude)
- **Prime meridian**: Red (0° longitude)

When the mesh rotates with axial tilt applied via `setRotationFromAxisAngle()`, the grid rotates with it, maintaining alignment to the rotation axis.

---

## Testing Checklist

✅ Enable "Show Lat/Long Grids"
✅ Watch Earth grid rotate ~once per 24 seconds (scaled time)
✅ Verify Earth grid tilted ~23° from orbital plane
✅ Watch Uranus grid rotate nearly horizontal (97.77° tilt!)
✅ Watch Venus grid rotate backwards (retrograde)
✅ Watch Jupiter grid spin fast (9.9 hr day)
✅ Adjust scale sliders → grids resize and stay rotating
✅ Toggle "Realistic Scale" → grids recreate and rotate correctly

---

## Files Modified

- `src/SolarSystemApp.js:1103` - toggleGrids() method
- `src/SolarSystemApp.js:746` - updateScale() method

**Bonus Fix**: Also fixed sun grid scaling (was using planet scale, now uses sun scale)
- `src/SolarSystemApp.js:162` - Changed type from 'sun' to 'star'
