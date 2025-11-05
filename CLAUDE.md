# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

**Interactive 3D Solar System Simulator** with real astronomical data, built with Three.js. Features accurate orbital mechanics, temperature visualization, and a fully data-driven architecture ready for any star system.

**Architecture**: Config-driven, modular ES6
**Framework**: Three.js r128
**Data Source**: NASA planetary data
**Philosophy**: Single source of truth - all celestial body data in declarative config

## Current Application

The main application is located in `solar_system/`:

```
mercury_terminator/
├── solar_system/               # Main application
│   ├── index.html             # Entry point
│   ├── index.css              # Styles
│   ├── src/
│   │   ├── SolarSystemApp.js          # Main orchestrator
│   │   ├── config/
│   │   │   ├── celestialBodies.js     # ALL body data (planets, moons, stars)
│   │   │   ├── constants.js           # Physics/rendering constants
│   │   │   └── epoch.js               # J2000.0 epoch definition
│   │   ├── domain/                    # Business logic (no Three.js)
│   │   │   └── services/
│   │   │       ├── OrbitalMechanics.js      # Keplerian orbits
│   │   │       ├── RotationalMechanics.js   # Rotation, tidal locking
│   │   │       ├── DateTimeService.js       # Date/time conversions
│   │   │       └── CoordinateTransforms.js  # Coordinate systems
│   │   └── infrastructure/
│   │       └── utils/
│   │           └── ValidationUtils.js
│   ├── README.md
│   ├── SESSION_COMPLETE.md           # Feature implementation summary
│   ├── IMPLEMENTATION_SUMMARY.md     # Follow Body & Reverse Time docs
│   └── PLANETARY_PARADES.md          # Reference dates for alignments
├── CLAUDE.md                   # This file
├── README.md                   # Project readme
└── LICENSE

```

## Running the Application

### Development Mode

```bash
# Serve with npm script
npm run serve

# Or use any HTTP server (ES6 modules required)
python -m http.server 8000
# or
npx http-server

# Then open: http://localhost:8000/solar_system/index.html
```

Or use the provided `run.bat` script.

### First Time Setup

Download Three.js locally (one-time):

```bash
npm run download:three
```

This downloads Three.js r128 and OrbitControls to `solar_system/lib/three/`.

## Architecture Principles

### 1. **Config-Driven Design**

**ALL** celestial body data lives in `src/config/celestialBodies.js`:

```javascript
export const CELESTIAL_BODIES = {
  EARTH: {
    emoji: '🌍',
    type: 'planet',
    parent: 'sun',

    // Physical properties
    radius_km: 6371,
    mass_kg: 5.97237e24,

    // Orbital elements
    orbital: {
      semi_major_axis_au: 1.000001018,
      eccentricity: 0.0167086,
      inclination: 0.00005,
      period_days: 365.256363004
    },

    // Rotation
    rotation: {
      period_days: 0.99726968,
      axial_tilt: 23.4392811
    },

    // Temperature
    temperature: {
      min_c: -89,
      max_c: 58
    },

    // Rendering
    rendering: {
      color: 0x2233FF,
      albedo: 0.306
    },

    // Reflected light (Earthshine)
    reflectedLight: {
      enabled: true,
      intensity: 0.15,
      distance: 10,
      color: 0x4488ff
    },

    // Camera preset for this body
    cameraPreset: {
      enabled: true,
      name: 'Earth-Moon',
      cameraOffset: { x: 5, y: 3, z: 5 },
      follow: true
    }
  }
};

// System-wide camera presets
export const SYSTEM_CAMERA_PRESETS = [
  {
    id: 'full-system',
    name: 'Full System',
    cameraPosition: { x: 0, y: 500, z: 500 },
    targetPosition: { x: 0, y: 0, z: 0 }
  }
];
```

**Why this matters:**
- Add a planet → it appears in UI automatically
- Remove a planet → it disappears everywhere
- Change planet color → updates instantly
- **Swap star systems** → just replace the config file!

### 2. **No Hardcoded Planet References**

The app NEVER hardcodes planet names. Instead:

```javascript
// ✅ GOOD - Data-driven
for (const [key, data] of Object.entries(CELESTIAL_BODIES)) {
  if (data.type === 'planet') {
    createPlanet(key, data);
  }
}

// ❌ BAD - Hardcoded
createPlanet('EARTH');
createPlanet('MARS');
```

This makes the simulator work with **any star system** (Betelgeuse, Alpha Centauri, etc.)

### 3. **Domain Layer Independence**

Services in `domain/services/` are **pure functions** with **zero Three.js dependencies**:

```javascript
// domain/services/OrbitalMechanics.js
export function calculateBodyPosition(semiMajorAxis, eccentricity, meanAnomaly) {
  // Pure orbital mechanics - no rendering code
  // Testable without Three.js
  return { x, y, z };
}
```

### 4. **localStorage Persistence**

All user settings persist across page refreshes:
- Scale sliders (Sun, Planet, Moon, Moon Orbit)
- Camera follow state
- Visual toggles

**Implementation:** Each slider saves to `localStorage` on change and loads on startup.

## Key Features

### Time Control
- ✅ Play/Pause
- ✅ **Reverse time** (run simulation backward)
- ✅ Speed control (0-100x)
- ✅ Jump to any date/time
- ✅ **Starts at TODAY** by default
- ✅ Quick date presets (planetary parades)

### Camera System
- ✅ **Follow any body** (camera tracks planet/moon)
- ✅ **6 camera presets** (loaded from config)
  - Full System, Inner Planets, Outer Planets
  - Earth-Moon, Jupiter System, Saturn System
- ✅ **Preserve Zoom** mode (point at body vs move with body)
- ✅ Keyboard shortcuts (1-9 for planets)

### Visualization
- ✅ Orbits (color-coded by type)
- ✅ Labels (dynamic from config)
- ✅ Trails (path history)
- ✅ **Lat/Long grids** (rotate with planets)
- ✅ **Temperature maps** (real surface temps)
- ✅ **Day/night terminators**
- ✅ **Coordinate axes** (on all bodies)
- ✅ **Sun rays** (temperature gradient colors)
- ✅ **Reflected light** (Earthshine, etc.)

### Scale Modes
- ✅ **Realistic Scale** (true proportions)
- ✅ **Visible Scale** (logarithmic for visibility)
- ✅ Individual scale sliders (persist in localStorage)

### Information Display
- ✅ Selected object info panel (live stats)
- ✅ Detailed modal (all body properties)
- ✅ Real-time date display
- ✅ FPS counter

### Bodies Included
- ✅ 1 star (Sun)
- ✅ 9 planets (Mercury → Pluto)
- ✅ 11 major moons
- ✅ All dynamically loaded from config

## Common Tasks

### Adding a New Planet

1. **Add to config** (`src/config/celestialBodies.js`):
```javascript
export const CELESTIAL_BODIES = {
  // ... existing bodies

  NEW_PLANET: {
    emoji: '🪐',
    type: 'planet',
    parent: 'sun',
    radius_km: 50000,
    mass_kg: 1.0e26,

    orbital: {
      semi_major_axis_au: 5.2,
      eccentricity: 0.048,
      inclination: 1.3,
      mean_anomaly_epoch: 34.4,
      period_days: 4332
    },

    rotation: {
      period_days: 0.41,
      axial_tilt: 3.1
    },

    temperature: {
      min_c: -150,
      max_c: -100
    },

    rendering: {
      color: 0xFFCC99,
      albedo: 0.5
    }
  }
};
```

2. **Refresh the page** - Planet appears automatically in:
   - ✅ 3D scene
   - ✅ Body list
   - ✅ Follow dropdown
   - ✅ Keyboard shortcuts (if planet position < 10)

### Adding a Camera Preset

**For a specific body:**
```javascript
SATURN: {
  // ... other properties
  cameraPreset: {
    enabled: true,
    name: 'Saturn Rings',
    description: 'Close-up of Saturn\'s rings',
    cameraOffset: { x: 25, y: 15, z: 25 },
    follow: true
  }
}
```

**For the whole system:**
```javascript
export const SYSTEM_CAMERA_PRESETS = [
  {
    id: 'kuiper-belt',
    name: 'Kuiper Belt',
    description: 'View outer solar system',
    cameraPosition: { x: 0, y: 800, z: 800 },
    targetPosition: { x: 0, y: 0, z: 0 },
    follow: null
  }
];
```

### Changing Default Settings

Edit `src/SolarSystemApp.js` constructor:

```javascript
// Visibility flags
this.showOrbits = true;       // Orbits ON by default
this.showGrids = true;         // Grids ON by default
this.scaleMode = 'realistic';  // Realistic scale by default

// Initial time
this.time = getCurrentSimulationTime(); // Start at TODAY
```

And corresponding HTML checkboxes in `index.html`:
```html
<input type="checkbox" id="show-grids" checked>
```

### Modifying Orbital Mechanics

Edit `src/domain/services/OrbitalMechanics.js`:

1. Pure functions only (no Three.js)
2. Add validation for inputs
3. Return plain objects/numbers
4. SolarSystemApp.js will use the results

### Adding Reflected Light to a Body

In `celestialBodies.js`:
```javascript
VENUS: {
  // ... other properties
  reflectedLight: {
    enabled: true,
    intensity: 0.18,      // Brightness
    distance: 5,          // Range in AU
    color: 0xffffee       // Light color
  }
}
```

Light source is created automatically when feature is enabled.

## File Organization

### Config Files (`src/config/`)
- **celestialBodies.js** - ALL body data (★ most important)
- **constants.js** - Physics constants, rendering settings
- **epoch.js** - J2000.0 epoch definition

### Domain Services (`src/domain/services/`)
- **OrbitalMechanics.js** - Keplerian orbit calculations
- **RotationalMechanics.js** - Rotation, tidal locking, 3:2 resonance
- **DateTimeService.js** - Date ↔ simulation time conversions
- **CoordinateTransforms.js** - Coordinate system transforms

### Main Application
- **SolarSystemApp.js** - Orchestrator (creates bodies, handles UI, animation loop)
- **index.html** - UI, event handlers, initialization

## Debugging

Access the app in browser console:
```javascript
window.app                    // Main application instance
window.app.bodies             // Map of all celestial bodies
window.app.time               // Current simulation time
window.app.scaleMultipliers   // Current scale settings
window.app.followBody         // Currently followed body key
```

## Performance Notes

- **Animation**: 60 FPS target
- **Physics**: Calculated every frame (lightweight math)
- **Bodies**: ~20 bodies (1 sun + 9 planets + 11 moons)
- **Textures**: Generated once on load
- **Grids**: Created/destroyed on toggle
- **Trails**: Limited to recent positions

**Optimization**: Disable features you don't need (Grids, Temperature, Terminators, etc.)

## Testing Strategy

Run test pages in `solar_system/`:
- `test_*.html` - Various unit tests
- `test_*.js` - Test scripts

Example:
```bash
# Open in browser
http://localhost:8000/solar_system/test_moon_scales.js
```

## Documentation

Essential docs in `solar_system/`:

- **SESSION_COMPLETE.md** - Comprehensive feature summary (5 major features)
- **IMPLEMENTATION_SUMMARY.md** - Follow Body & Reverse Time implementation details
- **PLANETARY_PARADES.md** - Preset dates for planetary alignments
- **README.md** - Solar system specific readme

## Known Limitations

1. **No asteroids/comets** - Only major planets and moons
2. **No spacecraft** - Could be added to config
3. **Simplified physics** - Keplerian orbits (no perturbations)
4. **No rings** - Saturn rings not visualized (yet)
5. **Single star** - Currently designed for one star system

## Future Possibilities

- 🌌 **Multiple star systems** (Betelgeuse, Alpha Centauri)
- 🛸 **Spacecraft trajectories** (Voyager, New Horizons)
- ☄️ **Asteroids and comets**
- 🪐 **Saturn's rings** (particle system)
- 🔭 **Exoplanet systems**
- 🎮 **VR mode**
- 📱 **Touch controls**
- 💾 **Save/load simulation states**
- 🌈 **Custom themes**

## Code Quality Standards

### Naming Conventions
- **Functions**: `verbNoun` (calculatePosition, updateRotation)
- **Classes**: `PascalCase` (SolarSystemApp)
- **Constants**: `SCREAMING_SNAKE_CASE` (CELESTIAL_BODIES)
- **Config keys**: `UPPERCASE` (EARTH, JUPITER)

### Error Handling
- **Fail fast** - validate at boundaries
- **Clear messages** - include actual values
- **No silent failures** - always throw on invalid input

### State Management
- **Immutable updates** where possible
- **localStorage** for user preferences
- **No global variables** (except `window.app` for debugging)

## Support

For questions:
1. Check `solar_system/SESSION_COMPLETE.md` for feature documentation
2. Review `src/config/celestialBodies.js` for data structure
3. Check `src/SolarSystemApp.js` for application logic
4. See `src/domain/services/` for physics calculations

## Star System Portability

To use with a different star system:

1. **Create new config** (e.g., `betelgeuseBodies.js`)
2. **Define the star**:
   ```javascript
   BETELGEUSE: {
     emoji: '🔴',
     type: 'star',
     name_en: 'Betelgeuse',
     radius_km: 887000000,  // Red supergiant
     rendering: { color: 0xff0000 }
   }
   ```
3. **Add planets** with orbital elements
4. **Update imports** in `SolarSystemApp.js`
5. **Done!** Everything else works automatically

The architecture is **100% ready** for any star system! 🌟
