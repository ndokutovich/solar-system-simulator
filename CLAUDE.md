# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an interactive 3D visualization of Mercury's terminator zones built with Three.js. The project demonstrates Mercury's unique 3:2 orbital resonance, temperature gradients, and the concept of "living on the terminator."

## Architecture

### Single-Page Application
The entire application is contained in `mercury_terminator_v2(1).html` - a self-contained HTML file with embedded CSS and JavaScript. There is no build process or external dependencies beyond the CDN-loaded Three.js library.

### Key Components

**Three.js Scene Structure:**
- `mercuryOrbitGroup` - Container for Mercury's orbital motion around the Sun
  - `mercuryGroup` - Container for Mercury itself with rotation
    - `mercury` - Main sphere mesh with temperature texture
    - `terminatorLines[]` - Morning (cyan) and evening (orange) terminator lines
    - `routePath` - Optional visualization of base routes (polar, comfort zone, etc.)
    - Pole markers (north=green, south=red)

**Dual Camera System:**
- `normalCamera` - Orbital view with OrbitControls for exploring the system
- `surfaceCamera` - First-person view from Mercury's surface for observing retrograde sun motion

### Physics Implementation

**3:2 Orbital Resonance:**
- Mercury rotates 3 times per 2 orbits around the Sun
- `mercuryRotation` tracks rotation (360° per 58.646 Earth days)
- `orbitalAngle` tracks position in orbit (360° per 87.969 Earth days)
- Relationship: `mercury.rotation.y = mercuryRotation * Math.PI / 180`

**Elliptical Orbit:**
- Eccentricity default: 0.206 (user adjustable)
- Distance calculation: `r = SUN_DISTANCE * (1 - e²) / (1 + e*cos(θ))`
- Terminator speed varies with orbital position (faster at perihelion)

**Temperature Model:**
- Calculated per-pixel on 2048x1024 canvas texture
- Based on longitude (primary) and latitude (modifier)
- Range: -173°C (night) to +427°C (subsolar point)
- Function: `tempToColor(temp)` maps temperatures to RGB gradient
- Blue (-173°C) → Cyan → Green (0°C) → Yellow (25°C) → Orange → Red (+427°C)

## Development Commands

### Running the Application
Simply open `mercury_terminator_v2(1).html` in a web browser. No build step or local server required.

### Testing Modifications
Since this is a single HTML file, changes take effect on browser refresh. Key areas to test after changes:
- Temperature texture updates: Check `updateTemperatureTexture()` and verify visual gradient
- Orbital mechanics: Verify resonance ratio display and terminator movement
- Surface view: Test WASD movement and sun elevation calculations
- Route visualization: Ensure routes stay attached to `mercuryGroup` not scene

## Important Implementation Details

### Coordinate Systems
- **Longitude**: 0° = subsolar point (facing Sun), ranges -180° to +180°
- **Latitude**: 0° = equator, ±90° = poles
- **Temperature texture**: Maps to sphere with (0,0) at left edge, center height
- **Terminator lines**: Positioned at ±90° longitude from subsolar point

### Camera Mode Switching
When entering surface view:
1. Switch from `normalCamera` to `surfaceCamera`
2. Disable OrbitControls
3. Calculate position on surface using lat/lon
4. Set camera.up to surface normal
5. WASD keys modify `observerPosition.lat/lon`

When exiting surface view:
1. Switch back to `normalCamera`
2. Re-enable OrbitControls
3. Remove sun path line if created

### Route Attachment
Routes must be added to `mercuryGroup` not `scene` to rotate with the planet:
```javascript
mercuryGroup.add(routePath);  // Correct - rotates with planet
scene.add(routePath);          // Wrong - stationary in space
```

### Performance Considerations
- Temperature texture is 2048x1024 - only regenerate when absolutely necessary
- Star field has 20,000 points - avoid recreating
- Use `needsUpdate = true` flag sparingly on textures/geometries

## Common Tasks

### Adding a New Route Type
1. Create function similar to `createPolarRoute()`, `createTerminatorRoute()`
2. Call `clearRoute()` first to remove existing route
3. Use `THREE.CatmullRomCurve3` for smooth paths or `BufferGeometry().setFromPoints()` for angular paths
4. Set line material with transparency and appropriate color
5. Add to `mercuryGroup` not scene
6. Add button in controls section with event listener

### Modifying Temperature Calculation
1. Edit `updateTemperatureTexture()` for visual representation
2. Edit `calculateTemperature(lon, lat)` for hover tooltip accuracy
3. Ensure both use same temperature model
4. Test at key points: subsolar (0°), terminators (±90°), antisolar (180°)

### Adjusting Orbital Parameters
- `SUN_DISTANCE = 15` - distance from Sun (cosmetic, not to scale)
- `MERCURY_RADIUS = 2` - planet radius (cosmetic)
- `ROTATION_PERIOD = 58.646` - sidereal day in Earth days (accurate)
- `MERCURY_YEAR_LENGTH = 87.969` - orbital period in Earth days (accurate)
- `SOLAR_DAY = 175.938` - sunrise to sunrise (accurate, derived from resonance)

### Extending Surface View Mode
The surface view mode (`isSurfaceView`) currently supports WASD movement. To add features:
- Sun path visualization: Implement in `createSunPath()` by calculating sun positions over one solar day
- Retrograde motion detection: Compare angular velocity of sun vs rotation at perihelion
- Time-lapse from surface: Increase time speed while in surface view and track sun elevation

## Known Limitations

1. **No manual sun elevation control**: Version 1 had a slider to manually position the sun. Version 2 removed this in favor of accurate orbital mechanics. If needed, could add back as "debug mode."

2. **Surface view sun path**: The `createSunPath()` function is a stub - needs implementation to show the retrograde motion trajectory.

3. **Temperature texture performance**: Regenerating 2M pixels on every change is expensive. Consider caching or shader-based approach for dynamic temperature maps.

4. **No save/load state**: User's exploration state (camera position, time speed, routes) resets on page reload.

## File Structure

```
mercury_terminator/
├── CLAUDE.md                      # This file
├── conversation.md                # Development history and research notes
├── mercury_terminator.html        # Version 1 (deprecated, can be removed)
└── mercury_terminator_v2(1).html  # Current implementation
```

## Version History

- **V1** (`mercury_terminator.html`): Initial implementation with sun rotating around stationary Mercury, manual sun elevation control
- **V2** (`mercury_terminator_v2(1).html`): Full orbital mechanics, surface view mode, accurate 3:2 resonance, dynamic terminator speed

**Recommendation**: Remove V1 as V2 is superior in every aspect except the manual sun control, which conflicts with the accurate physics model.
