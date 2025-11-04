# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Interactive 3D visualization of Mercury's terminator zones built with Three.js, following clean code principles, SOLID architecture, and fail-fast validation.

**Architecture**: Modular ES6 with clear separation of concerns
**Framework**: Three.js r128
**Style**: Clean Code, SOLID principles, Functional + OOP hybrid

## Architecture

### Refactored Clean Code Structure

The application follows a layered architecture with strict separation of concerns:

```
mercury_terminator/
├── index.html              # Entry point HTML
├── index.css               # Styles
├── src/
│   ├── main.js            # Bootstrap entry point
│   ├── Application.js     # Main orchestrator
│   ├── config/
│   │   └── constants.js   # ALL configuration and magic numbers
│   ├── domain/            # Business logic layer (no dependencies on Three.js)
│   │   ├── models/        # Immutable state models
│   │   │   ├── MercuryModel.js    # Planet state management
│   │   │   └── ObserverModel.js   # Surface observer state
│   │   └── services/      # Pure business logic functions
│   │       ├── PhysicsService.js       # Orbital mechanics
│   │       └── TemperatureService.js   # Temperature calculations
│   ├── presentation/      # Three.js rendering layer
│   │   └── components/
│   │       ├── SceneComponent.js       # Scene & renderer setup
│   │       ├── CameraController.js     # Camera management
│   │       ├── SunComponent.js         # Sun and lighting
│   │       ├── MercuryComponent.js     # Mercury planet rendering
│   │       └── UIController.js         # DOM interactions
│   └── infrastructure/    # Cross-cutting concerns
│       └── utils/
│           ├── ValidationUtils.js  # Fail-fast validation
│           └── ThreeUtils.js       # Three.js helper functions
└── (legacy)/
    ├── index.js (OLD)     # Deprecated monolithic code
    └── mercury_terminator.html (V1) # Can be deleted
```

### Key Architectural Principles

1. **Single Responsibility**: Each module has exactly one reason to change
2. **Dependency Inversion**: Domain layer has zero dependencies on Three.js
3. **Fail Fast**: All inputs validated at boundaries with clear error messages
4. **Immutability**: State models return new objects, never mutate
5. **Pure Functions**: Business logic has no side effects
6. **No Magic Numbers**: All constants centralized in config/constants.js

### Layer Responsibilities

**Configuration Layer** (`config/`)
- Centralizes ALL magic numbers and configuration
- Exports named constants grouped by concern
- No business logic, only data

**Domain Layer** (`domain/`)
- **Models**: Immutable state containers with pure transformations
- **Services**: Pure functions for physics, temperature calculations
- **Zero dependencies** on Three.js or DOM
- All functions are testable without rendering

**Presentation Layer** (`presentation/`)
- **Components**: Three.js object creation and management
- **Controllers**: Camera, UI, and user interaction handling
- Depends on domain layer, not vice versa
- Each component manages one aspect of rendering

**Infrastructure Layer** (`infrastructure/`)
- **Validation**: Fail-fast input validation with clear errors
- **Utils**: Reusable helper functions
- No business logic

## Development Commands

### Running the Application
```bash
# Serve with any HTTP server (required for ES6 modules)
python -m http.server 8000
# or
npx http-server

# Then open: http://localhost:8000
```

### Architecture Validation
Check these principles are maintained:
```bash
# No imports of Three.js in domain/ layer
grep -r "THREE" src/domain/  # Should return nothing

# No magic numbers outside config/
grep -r "[0-9]\{2,\}" src/domain/ src/presentation/ # Investigate any findings

# All functions in services/ are pure
# They should only import from domain/models, config/, or utils/
```

## Code Quality Standards

### Function Size
- **Maximum 20 lines** per function
- If longer, extract helper functions
- Exception: Application.js setup methods (documented)

### File Size
- **Maximum 200 lines** per file
- All current files comply except Application.js (400 lines, orchestrator exception)

### Validation
- **All public functions** validate inputs
- **Fail fast** - throw immediately on invalid input
- **Clear errors** - include actual value in error message

### State Management
- **Never mutate** - always return new state objects
- Use spread operator: `return { ...state, newField: value }`
- Models in `domain/models/` enforce this pattern

### Naming Conventions
- **Functions**: verbNoun (calculateTemperature, updateRotation)
- **Classes**: PascalCase (MercuryComponent, PhysicsService)
- **Constants**: SCREAMING_SNAKE_CASE (MERCURY_RADIUS)
- **Files**: Match export name (PhysicsService.js exports PhysicsService)

## Common Tasks

### Adding a New Feature

1. **Start with Domain Logic**
   ```javascript
   // src/domain/services/NewFeatureService.js
   export function calculateSomething(input) {
     validateInput(input);  // Fail fast
     return pureCalculation(input);  // No side effects
   }
   ```

2. **Add Constants** (if needed)
   ```javascript
   // src/config/constants.js
   export const NEW_FEATURE_CONFIG = {
     THRESHOLD: 42,
     COLOR: 0xff00ff
   };
   ```

3. **Create Presentation Component** (if needed)
   ```javascript
   // src/presentation/components/NewComponent.js
   import { calculateSomething } from '../../domain/services/NewFeatureService.js';

   export class NewComponent {
     create() {
       const result = calculateSomething(input);
       // Create Three.js objects using result
     }
   }
   ```

4. **Integrate in Application.js**
   ```javascript
   // src/Application.js
   import { NewComponent } from './presentation/components/NewComponent.js';

   initializeComponents() {
     this.newComponent = new NewComponent();
     const refs = this.newComponent.create();
     this.scene.add(refs.object);
   }
   ```

### Modifying Physics/Temperature

1. **Edit service function** in `domain/services/`
2. **Business logic only** - no Three.js code
3. **Add validation** for new parameters
4. **Return pure values** - no side effects
5. **Update Application.js** to use new calculations

### Adding UI Controls

1. **Add DOM ID** to `config/constants.js` in `DOM_IDS`
2. **Add HTML element** to `index.html`
3. **Register handler** in `Application.js`:
   ```javascript
   setupNewControl() {
     this.uiController.on(DOM_IDS.NEW_BUTTON, 'click', () => {
       // Update state immutably
       this.someState = updateSomeState(this.someState, newValue);
     });
   }
   ```

### Debugging

The application exposes itself to window:
```javascript
// In browser console
window.mercuryApp                    // Access application instance
window.mercuryApp.mercuryState       // Inspect current state
window.mercuryApp.cameraController   // Access components
```

## Error Handling Strategy

### Fail Fast at Boundaries
```javascript
// ✅ GOOD - Validate immediately
export function calculateTemperature(longitude, latitude) {
  validateLongitude(longitude);  // Throws if invalid
  validateLatitude(latitude);    // Throws if invalid
  return calculation();
}

// ❌ BAD - Silent failure
export function calculateTemperature(longitude, latitude) {
  if (!longitude) return 0;  // Wrong! Should throw
  return calculation();
}
```

### Clear Error Messages
```javascript
// ✅ GOOD - Actionable error
throw new Error(`Invalid latitude: ${lat} (must be -90 to 90)`);

// ❌ BAD - Vague error
throw new Error('Invalid input');
```

### Validation Layers
1. **Entry points** (UI events, mouse clicks) - validate user input
2. **Service functions** - validate parameters
3. **Model updates** - validate state transitions

## Testing Strategy

While no test framework is currently integrated, the architecture enables testing:

### Unit Testing Domain Layer
```javascript
// Domain functions are pure - easy to test
import { calculateTemperature } from './domain/services/TemperatureService.js';

// No mocking needed!
const temp = calculateTemperature(0, 0);  // Subsolar point
assert(temp === 427);
```

### Testing State Models
```javascript
import { updateRotation } from './domain/models/MercuryModel.js';

const state = createMercuryState();
const newState = updateRotation(state, 10);

assert(newState.rotation === 10);
assert(state.rotation === 0);  // Immutability check
```

## Performance Considerations

### Texture Updates
- Temperature texture is 2048x1024 (2M pixels)
- Only regenerate when absolutely necessary
- Currently: generated once on load

### Animation Loop
- Runs at 60 FPS
- Physics updates are lightweight (pure math)
- Three.js rendering is the bottleneck

### State Updates
- Immutable updates create new objects
- JavaScript GC handles old objects
- No observable performance impact

## Known Limitations

1. **OrbitControls**: Using Three.js built-in, not abstracted
2. **No route visualization**: Polar/terminator routes not yet implemented in refactored code
3. **No retrograde sun path**: Surface view sun path calculation is stubbed
4. **Temperature texture**: Generated per-pixel in JS (could use shader)

## Migration Notes

### From Legacy index.js

The old monolithic `index.js` (1000+ lines) has been refactored into:
- 1 orchestrator (Application.js)
- 5 presentation components
- 2 domain models
- 2 domain services
- 2 utility modules
- 1 config module

**Breaking Changes:**
- None - HTML and CSS remain unchanged
- Same DOM IDs, same UI behavior
- Three.js r128 compatible

**Legacy File Status:**
- `index.js` - Can be deleted after verification
- `mercury_terminator.html` (V1) - Can be deleted

### Verification Checklist

After refactoring, verify:
- [ ] Application loads without errors
- [ ] Mercury rotates with 3:2 resonance
- [ ] Temperature map displays correctly
- [ ] All camera views work (orbit, equator, pole, surface)
- [ ] Time controls (speed, pause, reset) function
- [ ] Surface view with WASD navigation works
- [ ] Mouse hover shows temperature/coordinates
- [ ] All checkboxes toggle visibility
- [ ] Eccentricity slider updates orbit

## Future Improvements

1. **Add TypeScript** - Gradual migration with JSDoc types first
2. **Extract OrbitControls** - Wrap in CameraController abstraction
3. **Implement Routes** - Finish route visualization (polar, comfort, terminator)
4. **Shader Temperature** - Move pixel generation to GPU
5. **Add Tests** - Jest or Vitest for domain layer
6. **State Management** - Consider Redux/Zustand if complexity grows

## Support

For questions about the refactored architecture:
1. Check this file first
2. Review `src/Application.js` for integration examples
3. Examine domain layer for business logic
4. Check config/constants.js for all magic numbers

The refactored code prioritizes:
- **Readability** over cleverness
- **Explicit** over implicit
- **Pure functions** over stateful classes (where appropriate)
- **Fail fast** over silent failures
- **Immutability** over mutation
