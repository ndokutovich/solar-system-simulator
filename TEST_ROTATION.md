# Rotation Test Plan

## Test Case: Mercury at Initial Position

**Setup:**
- Mercury at (15, 0, 0)
- Sun at (0, 0, 0)
- Sun is to the WEST (-X direction) from Mercury
- Rotation should be 0

**Expected Result:**
- Hot spot (RED) should face WEST towards sun
- Cold spot (BLUE) should face EAST away from sun

## Current Texture Analysis

From `calculatePixelTemperature`:
```
lon = -180 to -90: sunAngle = 180 to 270 → COLD to COOLING
lon = -90 to 0:    sunAngle = 270 to 360 → COLD to HEATING
lon = 0 to 90:     sunAngle = 0 to 90    → HEATING to HOT
lon = 90 to 180:   sunAngle = 90 to 180  → HOT to COOLING
```

Wait, let me recalculate:
```javascript
const sunAngle = ((lon + 360) % 360);
```

- lon=-180 → (-180+360)%360 = 180
- lon=-90 → (-90+360)%360 = 270
- lon=0 → (0+360)%360 = 0
- lon=90 → (90+360)%360 = 90
- lon=135 → (135+360)%360 = 135
- lon=180 → (180+360)%360 = 180

Temperature by sunAngle:
```javascript
if (sunAngle < 90)       → temp = -173 + (sunAngle/90)*600  // 0-89°: HEATING
else if (sunAngle < 180) → temp = 427                        // 90-179°: HOT
else if (sunAngle < 270) → temp = 427 - ((sunAngle-180)/90)*600  // 180-269°: COOLING
else                     → temp = -173                       // 270-359°: COLD
```

So in LONGITUDE coordinates:
- **lon 0° to 89° = HEATING**
- **lon 90° to 179° = HOT (427°C)** ← SUBSOLAR POINT
- **lon 180° to 269° = COOLING**
- **lon 270° to 359° = COLD (-173°C)** ← ANTISOLAR POINT

Peak hot: lon=135° (middle of 90-179 range)

## Three.js Sphere UV Mapping

Standard Three.js SphereGeometry:
- Texture wraps around sphere
- **U=0 (left edge)** starts at **positive Z axis**
- **U increases counterclockwise** when viewed from above (from +Y)

Texture X to Longitude mapping:
```javascript
const lon = (x / width - 0.5) * 360;
```
- x=0 → lon=-180
- x=width/4 → lon=-90
- x=width/2 → lon=0
- x=3width/4 → lon=90
- x=width → lon=180

Texture U (0 to 1) to longitude:
- U=0 → lon=-180° (texture left edge)
- U=0.25 → lon=-90°
- U=0.5 → lon=0°
- U=0.75 → lon=90° ← **HOT ZONE STARTS**
- U=0.875 → lon=135° ← **PEAK HOT**
- U=1.0 → lon=180°

## Three.js Sphere Geometry Default Orientation

When `rotation.y = 0`:
- **U=0** (texture left) → **+Z axis** (north/forward)
- **U=0.25** → **+X axis** (east/right)
- **U=0.5** → **-Z axis** (south/back)
- **U=0.75** → **-X axis** (west/left)

So hot spot at U=0.75-0.875:
- U=0.75 → -X (west)
- U=0.875 is 35% between U=0.75 and U=1.0
- U=0.875 → between -X and +Z → northwest

Actually, U wraps around, so:
- U=0.875 → between -X (west) and -X/-Z (southwest)

## What We Need

Mercury at (15, 0, 0), Sun at (0, 0, 0):
- Sun is at **-X direction** (due west)
- Hot spot (U=0.875, lon=135°) should point **-X**

At rotation.y=0:
- U=0.875 points somewhere near -X already!

Let me calculate exactly:
- U=0 → angle 0 → +Z
- U → angle = U * 2π
- U=0.875 → angle = 0.875 * 2π = 5.5 rad = 315° = -45°
- angle=-45° from +Z means: 45° clockwise from +Z
- That's between +Z and +X, specifically at +X+Z diagonal (northeast)

Wait, that's wrong. Let me recalculate the direction:
- Angle 0° is +Z (north)
- Angle 90° is +X (east)
- Angle 180° is -Z (south)
- Angle 270° is -X (west)
- Angle 315° is between -X and +Z, which is northwest

Hmm, but that doesn't match...

Actually in Three.js, rotation goes COUNTERCLOCKWISE from above:
- 0° = +Z
- 90° = -X (west)
- 180° = -Z
- 270° = +X (east)

So:
- U=0.75 → 270° → +X (EAST) ← This doesn't match my earlier analysis!

Let me check Three.js documentation...

Actually, SphereGeometry in Three.js:
- phiStart = 0, phiLength = 2π
- phi=0 is at **+X axis**
- phi increases counterclockwise when viewed from +Y

So:
- phi=0 → +X (east)
- phi=π/2 → -Z (south)
- phi=π → -X (west)
- phi=3π/2 → +Z (north)

And texture U maps to phi:
- U=0 → phi=0 → +X
- U=0.25 → phi=π/2 → -Z
- U=0.5 → phi=π → -X
- U=0.75 → phi=3π/2 → +Z

So hot spot at U=0.75 to U=0.875:
- U=0.75 → +Z (north)
- U=0.875 is 50% between U=0.75 and U=1.0
- U=0.875 → phi = 0.875*2π = 5.5 rad
- 5.5 rad = 315° → between +Z and +X → northeast

NO WAIT. U wraps:
- U=1.0 wraps back to U=0
- So between U=0.75 and U=1.0 is between +Z and +X

Let me just test this empirically!

## SIMPLE TEST

Set rotation.y to specific values and see where hot spot points:

1. **rotation.y = 0**: Hot spot should point at... (we'll see!)
2. **rotation.y = π/2**: Hot spot rotates 90° CCW, should point at...
3. **rotation.y = π**: Hot spot rotates 180°
4. **rotation.y = 3π/2**: Hot spot rotates 270° CCW

The hot spot is at U=0.875, which at rotation.y=0 points to phi=5.5rad=315°

In world space at rotation.y=0:
- phi=0 → +X
- phi=315° = -45° → 45° before +X going backwards
- Going backwards from +X: +X → +Z → -X → -Z → +X
- 45° before +X is +X+Z (northeast)

WAIT. Angle convention:
- phi=315° = 360°-45° = -45°
- In standard trig: -45° from +X is towards +Z... no wait
- Standard: 0° = +X, 90° = +Y, but this is in XZ plane
- 0° = +X, 90° = -Z (going south), 180° = -X, 270° = +Z
- So 315° = 270° + 45° = +Z direction + 45° towards +X = between +Z and +X

So at rotation.y=0, hot spot at U=0.875 points NORTHEAST (+X+Z diagonal)

For Mercury at (15, 0, 0), we need hot spot to point WEST (-X)

From NORTHEAST to WEST is: -90° - 45° = -135° = 225° CCW

So we need: rotation.y = 225° = 5π/4 rad

Let me verify:
- At rotation.y = 5π/4, the phi=315° direction rotates by 5π/4
- New direction: 315° + 225° = 540° = 180° = -X ✓

## FINAL FORMULA

For Mercury at (orbitalX, 0, orbitalZ):
- Angle to sun: sunAngle = atan2(-orbitalZ, -orbitalX)
- At (15, 0, 0): sunAngle = atan2(0, -15) = π (180° = -X direction)
- Hot spot at rotation.y=0 points to 315° (+X+Z)
- Need hot spot to point to 180° (-X)
- Required base rotation: 180° - 315° = -135° = 225° = 5π/4

General formula:
```
rotation.y = mercuryRotation + (sunAngle - hotSpotInitialAngle)
where hotSpotInitialAngle = 315° = 7π/4 rad
```

Or simpler:
```
rotation.y = mercuryRotation + sunAngle - 7π/4
```
