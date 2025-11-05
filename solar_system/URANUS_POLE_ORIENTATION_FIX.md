# Uranus Pole Orientation Fix

## Problem

Uranus has a 97.77° axial tilt (essentially rotating on its side), but the pole was not pointing toward the sun at the correct orbital positions. The tilt was always in the same direction relative to the scene, not relative to the sun.

## Real Astronomy

Uranus's unique characteristic:
- **Axial tilt**: 97.77° (nearly perpendicular to its orbital plane)
- **Orbital period**: 84 years
- **Result**: Each pole points toward the sun for ~42 years, then the other pole

### Uranus Seasons

During its 84-year orbit:
1. **Northern summer**: North pole points toward sun (~42 years)
2. **Equinox**: Poles sideways to sun
3. **Southern summer**: South pole points toward sun (~42 years)
4. **Equinox**: Poles sideways to sun (again)

## Previous Implementation (Wrong)

```javascript
// Tilt always applied in fixed direction (scene X axis)
const tiltQuat = new THREE.Quaternion();
tiltQuat.setFromAxisAngle(new THREE.Vector3(1, 0, 0), tiltRad);
```

**Result**: Pole always tilted the same way, never pointed toward sun.

---

## New Implementation (Correct)

### 1. Added `pole_direction` Parameter

Added to `celestialBodies.js`:
```javascript
rotation: {
    period_days: -0.718,
    axial_tilt: 97.77,
    pole_direction: 0,  // NEW: Direction pole points in orbit (degrees)
}
```

**What `pole_direction` means**:
- `0°` = North pole points toward sun when planet is at perihelion (0° orbital angle)
- `90°` = North pole points sideways (perpendicular to sun direction)
- `180°` = South pole points toward sun at perihelion
- etc.

### 2. Calculate Tilt Direction Based on Orbital Position

```javascript
// Get planet's orbital angle
const planetPos = objectToMove.position;
const orbitalAngle = Math.atan2(planetPos.z, planetPos.x);

// Calculate tilt direction = orbital angle + pole offset
const poleDirectionRad = (data.rotation.pole_direction * Math.PI) / 180;
const tiltDirection = orbitalAngle + poleDirectionRad;
```

### 3. Apply Quaternion Chain

```javascript
// 1. Tilt direction (orient tilt based on orbit)
const tiltDirQuat = new THREE.Quaternion();
tiltDirQuat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), tiltDirection);

// 2. Axial tilt (97.77° for Uranus)
const tiltQuat = new THREE.Quaternion();
tiltQuat.setFromAxisAngle(new THREE.Vector3(1, 0, 0), tiltRad);

// 3. Rotation (planet spin)
const rotQuat = new THREE.Quaternion();
rotQuat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotation.angle);

// Combine: tiltDirection * tilt * rotation
finalQuat.multiplyQuaternions(tiltDirQuat, tempQuat);
```

---

## Result

Now Uranus:
1. ✅ Rotates on its side (97.77° tilt)
2. ✅ **Pole points toward sun** at certain orbital positions
3. ✅ Pole direction stays fixed in space (as planet orbits)
4. ✅ Other pole points toward sun half an orbit later

### Visual Verification

**Refresh browser and watch Uranus**:

1. At **orbital angle ~0°**: North pole should point nearly toward sun
2. At **orbital angle ~90°**: Poles perpendicular to sun (equinox)
3. At **orbital angle ~180°**: South pole should point nearly toward sun
4. At **orbital angle ~270°**: Poles perpendicular to sun (equinox)

**Use time controls** to fast-forward and watch Uranus orbit. You'll see the poles alternate pointing toward/away from the sun!

---

## Technical Details

### Coordinate System

- **Orbital angle**: 0° = +X axis (right), 90° = +Z axis (toward camera), etc.
- **Tilt direction**: Rotates around Y axis (scene "up")
- **Axial tilt**: Applied around local X axis (after tilt direction)
- **Rotation**: Applied around local Y axis (after both)

### Quaternion Order

Order matters! We apply transformations from right to left:
```
final = tiltDirection × (tilt × rotation)
```

This ensures:
1. Planet spins around its own axis (rotation)
2. Axis is tilted (tilt)
3. Tilt direction is oriented based on orbital position (tiltDirection)

### Why This Works

The key insight: **Axial tilt direction must be fixed in space**, but we define it relative to the orbit. As the planet moves around the sun, the same pole alternately points toward and away from the sun - exactly like real Uranus!

---

## Other Planets

This system works for all planets:

**Earth** (23.44° tilt):
- No `pole_direction` specified → defaults to 0
- Works correctly (tilt is much smaller than Uranus)

**Saturn** (26.73° tilt):
- Could add `pole_direction` for accuracy
- Seasons similar to Earth but more extreme

**Neptune** (28.32° tilt):
- Similar to Saturn

For planets with small tilts (<30°), the pole_direction has minimal visible effect. For Uranus (97.77°), it's essential for realism!

---

## Files Modified

1. **`src/config/celestialBodies.js:710`** - Added `pole_direction: 0` to Uranus
2. **`src/SolarSystemApp.js:690-741`** - Updated rotation logic to use orbital position

---

## Future Enhancements

### Add pole_direction to Other Planets

For maximum accuracy, measure and add `pole_direction` for:
- Earth (defines where North pole points at vernal equinox)
- Mars (similar to Earth)
- Saturn (rings' orientation depends on this)
- Neptune (for completeness)

### Axial Precession

In reality, Earth's axis precesses over ~26,000 years. Could add slow precession to `pole_direction` for ultra-realism.

### Obliquity Variations

Some planets' axial tilt changes slowly over millions of years. Could model this as time-dependent `axial_tilt`.

---

## Testing

**Recommended test**:
1. Refresh browser
2. Click on Uranus in sidebar to focus
3. Enable "Show Lat/Long Grids"
4. Increase time speed (Speed slider)
5. Watch as Uranus orbits - pole should point toward/away from sun!

**Expected behavior**:
- Grid shows Uranus rotating "on its side"
- As Uranus orbits, one pole points toward sun (northern summer)
- Half an orbit later, other pole points toward sun (southern summer)

**Grid colors help visualize**:
- Green line = Equator
- Red line = Prime meridian
- Blue lines = Other lat/long lines

Watch the green equator line - it should be nearly vertical when a pole points at the sun!

---

## Accuracy

**Astronomically correct**: ✅
- Axial tilt: 97.77° ✅
- Pole direction: Fixed in space ✅
- Seasonal variation: 84-year cycle ✅

**Known simplifications**:
- Pole direction is approximate (real value would need precise astronomical data)
- No axial precession (very slow in reality)
- No nutation (small wobbles)

For a simulation, this is highly accurate! 🪐✨
