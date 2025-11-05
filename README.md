# Solar System Simulator

Interactive 3D solar system simulator with real astronomical data, accurate orbital mechanics, temperature visualization, and a fully data-driven architecture ready for any star system.

## Quick Start

### Development Mode

```bash
# Serve from source
npm run serve

# Open in browser (opens automatically)
http://localhost:8000/solar_system/index.html
```

### Production Build

```bash
# First time setup - download Three.js locally
npm run download:three

# Install dependencies (only http-server)
npm install

# Build to public/ directory
npm run build

# Serve production build
npm run serve:public

# Open in browser
http://localhost:8000
```

## Features

### Solar System
- ✅ **9 Planets** - Mercury through Pluto (dynamically loaded from config)
- ✅ **11 Major Moons** - Luna, Io, Europa, Ganymede, Callisto, Titan, and more
- ✅ **Real Astronomical Data** - NASA planetary data
- ✅ **Accurate Orbital Mechanics** - Keplerian orbits with true eccentricity
- ✅ **3:2 Spin-Orbit Resonance** - Mercury rotates correctly

### Time Control
- ✅ **Play/Pause** - Control simulation
- ✅ **Reverse Time** - Run simulation backward
- ✅ **Speed Control** - 0-100x real-time speed
- ✅ **Jump to Date** - Any date/time with presets
- ✅ **Starts at Today** - Real current planetary positions

### Camera & Views
- ✅ **Follow Any Body** - Camera tracks planets and moons
- ✅ **6 Camera Presets** - Full System, Inner/Outer Planets, planetary systems
- ✅ **Preserve Zoom** - Point at body vs follow with body
- ✅ **Keyboard Shortcuts** - 1-9 for quick planet selection

### Visualization
- ✅ **Orbits** - Color-coded by type (planet/moon)
- ✅ **Labels** - Dynamic from config
- ✅ **Trails** - Path history
- ✅ **Lat/Long Grids** - Rotate with planets
- ✅ **Temperature Maps** - Real surface temperatures
- ✅ **Day/Night Terminators** - Sunlight boundaries
- ✅ **Coordinate Axes** - On all bodies
- ✅ **Sun Rays** - Temperature gradient visualization
- ✅ **Reflected Light** - Earthshine and more

### Scale Modes
- ✅ **Realistic Scale** - True proportions
- ✅ **Visible Scale** - Logarithmic for visibility
- ✅ **Individual Sliders** - Sun, Planet, Moon, Moon Orbit scales
- ✅ **localStorage Persistence** - Settings saved across refreshes

## Architecture

### Config-Driven Design

**ALL** celestial body data lives in a single declarative config file:

```javascript
// solar_system/src/config/celestialBodies.js
export const CELESTIAL_BODIES = {
  EARTH: {
    emoji: '🌍',
    type: 'planet',
    parent: 'sun',
    radius_km: 6371,
    mass_kg: 5.97237e24,
    orbital: { /* ... */ },
    rotation: { /* ... */ },
    temperature: { /* ... */ },
    rendering: { /* ... */ }
  },
  // ... all other bodies
};
```

**Why this matters:**
- Add a planet → it appears everywhere automatically
- Remove a planet → it disappears from all UI
- Change planet color → updates instantly
- **Swap star systems** → just replace the config file!

### Clean Architecture

```
solar_system/
├── index.html                    # Entry point
├── index.css                     # Styles
├── manifest.json                 # PWA manifest
├── *.svg                         # Icons
├── src/
│   ├── SolarSystemApp.js         # Main orchestrator
│   ├── config/
│   │   ├── celestialBodies.js    # ⭐ ALL body data (single source of truth)
│   │   ├── constants.js          # Physics/rendering constants
│   │   └── epoch.js              # J2000.0 epoch
│   ├── domain/                   # Pure business logic (no Three.js)
│   │   └── services/
│   │       ├── OrbitalMechanics.js
│   │       ├── RotationalMechanics.js
│   │       ├── DateTimeService.js
│   │       └── CoordinateTransforms.js
│   └── infrastructure/
│       └── utils/
│           └── ValidationUtils.js
└── scripts/                      # Build scripts
    ├── clean-public.js
    └── build.js
```

### Key Principles

- ✅ **100% Config-Driven** - No hardcoded planet references
- ✅ **Domain Independence** - Pure functions, no Three.js in domain layer
- ✅ **localStorage Persistence** - All user settings saved
- ✅ **Fail-Fast Validation** - Clear error messages
- ✅ **Immutable Updates** - State changes without mutation
- ✅ **Star System Ready** - Swap to any star system instantly

## Build System

The project uses a simple Node.js build system with **no bundler** - just file copying.

### Commands

```bash
# Download Three.js locally (first time only)
npm run download:three

# Clean and build to public/
npm run build

# Just clean public/ directory
npm run clean

# Serve development version
npm run serve

# Serve production build
npm run serve:public
```

### Build Output (`public/` directory)

```
public/
├── index.html          # Main entry point
├── index.css           # Styles
├── manifest.json       # PWA manifest
├── *.svg              # Icons (favicon, PWA icons)
├── src/               # Source code (ES6 modules)
└── lib/               # Three.js (local copy)
    └── three/
        ├── three.min.js
        └── OrbitControls.js
```

### Features

- ✅ **No bundler** - ES6 modules work directly in browser
- ✅ **Local Three.js** - No CDN dependency
- ✅ **Cross-platform** - Works on Windows, Mac, Linux
- ✅ **Fast builds** - Just file copying (~1 second)
- ✅ **Simple** - Pure Node.js, no webpack/rollup/vite

## Documentation

### Main Documentation
- **[CLAUDE.md](CLAUDE.md)** - Complete development guide, architecture principles, common tasks
- **[solar_system/README.md](solar_system/README.md)** - Solar system specific documentation
- **[LICENSE](LICENSE)** - MIT License

### Feature Documentation
- **[solar_system/SESSION_COMPLETE.md](solar_system/SESSION_COMPLETE.md)** - Comprehensive feature summary
- **[solar_system/IMPLEMENTATION_SUMMARY.md](solar_system/IMPLEMENTATION_SUMMARY.md)** - Follow Body & Reverse Time implementation
- **[solar_system/PLANETARY_PARADES.md](solar_system/PLANETARY_PARADES.md)** - Reference dates for planetary alignments

## Controls

### Time
- **Play/Pause** - Start/stop simulation
- **Speed Slider** - 0-100x real-time (with reverse)
- **Jump to Date** - Any date/time with quick presets
- **Reset** - Reset all settings to defaults

### Camera
- **Follow Dropdown** - Follow any planet or moon
- **Camera Presets** - 6 preset views (Full System, Inner Planets, etc.)
- **Preserve Zoom** - Keep camera distance or follow body
- **Keyboard** - Press 1-9 to jump to planets
- **Mouse** - Orbit, pan, zoom (standard Three.js controls)

### View Options
- **Show Orbits** - Display orbital paths
- **Show Labels** - Body names and emojis
- **Show Trails** - Path history
- **Show Lat/Long Grids** - Coordinate grids on bodies
- **Show Axes** - Coordinate axes on all bodies
- **Show Temperature** - Real surface temperature maps
- **Show Terminator** - Day/night boundaries
- **Show Sun Rays** - Temperature gradient visualization
- **Show Reflected Light** - Earthshine and similar effects

### Scale
- **Realistic/Visible** - Toggle between true scale and logarithmic
- **Sun Scale** - Adjust sun size (0.5-50x)
- **Planet Scale** - Adjust planet sizes (0.5-50x)
- **Moon Scale** - Adjust moon sizes (0.5-50x)
- **Moon Orbit Scale** - Adjust moon orbit sizes (0.5-50x)

### Object Info
- Click any body in the **Celestial Bodies** list to focus camera
- Click **Details** button to see full properties modal
- Real-time stats: position, distance, temperature, orbital phase

## Technology Stack

- **Three.js r128** - 3D rendering engine (local copy, no CDN)
- **Vanilla JavaScript ES6** - Modules, classes, pure functions
- **Node.js** - Build system and download script only
- **HTML5 Canvas** - Texture generation
- **CSS3** - UI styling with backdrop filters
- **PWA** - Progressive Web App ready (manifest, icons)

**No build tools, no transpilation, no bundler** - Just pure ES6 modules!

## Development

See **[CLAUDE.md](CLAUDE.md)** for complete development guide including:

### Quick Tasks
- **Adding a planet** - Just add to `celestialBodies.js` config
- **Adding a camera preset** - Config-based, no code changes
- **Changing defaults** - Update constructor in `SolarSystemApp.js`
- **Adding reflected light** - Enable in body's config

### Code Standards
- **Config-driven** - No hardcoded planet references
- **Pure domain functions** - No Three.js in domain layer
- **Fail-fast validation** - Clear error messages
- **Immutable updates** - State changes return new objects
- **localStorage persistence** - All user settings saved

### Star System Portability

Want to simulate a different star system?

1. Create new config file (e.g., `betelgeuseBodies.js`)
2. Define the star and its planets
3. Update import in `SolarSystemApp.js`
4. Done! Everything else works automatically

The architecture is **100% ready** for any star system.

## Astronomical Data

All orbital and physical data sourced from:
- **NASA Planetary Fact Sheets**
- **JPL Horizons System**
- **IAU standards** (J2000.0 epoch)

### Mercury's 3:2 Resonance
Mercury uniquely rotates **3 times per 2 orbits**, creating:
- 176 Earth-day solar day (sunrise to sunrise)
- Temperature extremes: -173°C to +427°C
- "Hot poles" at 0° and 180° longitude
- "Warm poles" at 90° and 270° longitude

## Performance

- **60 FPS** - Smooth animation loop
- **~20 Bodies** - 1 star + 9 planets + 11 moons
- **Keplerian Orbits** - Lightweight math calculations
- **Dynamic Textures** - Generated once on load
- **Optimized Rendering** - Three.js hardware acceleration

**Performance Tips:**
- Disable features you don't need (Grids, Temperature, Trails)
- Use Realistic Scale to reduce visual clutter
- Reduce individual scale multipliers

## Browser Compatibility

- **Modern Browsers** - Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Requires WebGL** - Hardware-accelerated 3D graphics
- **ES6 Modules** - Must be served via HTTP (not `file://`)
- **PWA Support** - Can be installed as standalone app

## Known Limitations

1. **No Asteroids/Comets** - Only major planets and moons
2. **No Spacecraft** - Could be added to config
3. **Simplified Physics** - Keplerian orbits (no perturbations)
4. **No Rings** - Saturn rings not visualized
5. **Single Star** - Currently designed for one-star systems

## Future Possibilities

- 🌌 Multiple star systems (binary stars, Betelgeuse, Alpha Centauri)
- 🛸 Spacecraft trajectories (Voyager, New Horizons)
- ☄️ Asteroids and comets
- 🪐 Saturn's rings (particle system)
- 🔭 Exoplanet systems
- 🎮 VR mode
- 📱 Touch controls
- 💾 Save/load simulation states

## Credits

Built with:
- **NASA planetary data** - Accurate astronomical measurements
- **Three.js** - 3D rendering engine
- **Clean Architecture** - SOLID principles, config-driven design

## License

MIT License - See [LICENSE](LICENSE) file

---

**Interactive 3D Solar System Simulator**
**Config-Driven • Accurate Physics • Ready for Any Star System**
