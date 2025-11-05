# Moon System Analysis

## Current Problems
1. Orbits drawn in wrong places (not centered on parent objects)
2. Moon sizes not systematically scaled
3. Moon orbit distances not properly proportioned
4. Parent-child relationships not properly managed

## Investigation Points

### 1. Data Structure Analysis
- How are parent-child relationships stored?
- What coordinate systems are used?
- How are orbits calculated?

### 2. Rendering Pipeline
- When are moons created?
- How are positions updated?
- When are orbit visualizations updated?

### 3. Scale Hierarchy
Need to establish clear scale ratios:
- Sun → Planets
- Planets → Moons
- Realistic vs Visible modes

## Systematic Approach Needed

### A. Data Model
```javascript
// Each body should know:
{
  id: 'moon',
  parent: 'planet',  // Reference to parent
  children: [],      // References to children

  // Position can be:
  absolutePosition: Vector3,  // Position in world space
  relativePosition: Vector3,  // Position relative to parent

  // Scale can be:
  absoluteScale: number,      // Size in world units
  relativeScale: number,      // Size relative to parent
}
```

### B. Update Order
1. Update sun (root)
2. Update planets (children of sun)
3. Update moons (children of planets)
4. Update orbit visualizations last

### C. Scale Rules

#### Realistic Mode
- Sun: 1:1,000,000 of real size
- Planets: 1:1,000,000 of real size
- Moons: Should be visible but proportional
  - Option 1: 1:100,000 (10x boost)
  - Option 2: Minimum size threshold
  - Option 3: Scale relative to parent planet

#### Visible Mode
- Sun: Logarithmic scale
- Planets: Logarithmic scale
- Moons: Relative to parent planet
  - e.g., Moon = 27% of Earth size (accurate ratio)
  - But with minimum size for visibility

### D. Orbit Visualization Rules
1. Planet orbits: Centered at (0,0,0) - the sun
2. Moon orbits: Must follow parent planet position
3. Update order matters!

## Code Issues Found

### Issue 1: Orbit Creation
- Orbits are created once at initialization
- Moon orbits are drawn at (0,0,0) initially
- They try to move later but may not be updating correctly

### Issue 2: Scale Mismatch
- Moon positions use one scale
- Orbit visualizations use different scale
- This causes visual disconnect

### Issue 3: Parent Reference
- Using string references ('earth', 'mars')
- Need to convert to uppercase ('EARTH', 'MARS')
- May cause lookup failures

## Proposed Solution

### Step 1: Create Proper Hierarchy
- Build parent-child tree structure
- Update in correct order (root to leaves)

### Step 2: Unified Scale System
```javascript
const ScaleConfig = {
  realistic: {
    sun: 1/1000000,
    planet: 1/1000000,
    moon: {
      minSize: 0.001,  // Minimum visible size
      scaleFactor: 1/100000,  // Or relative to parent
    },
    orbits: {
      planet: 1.0,  // AU scale
      moon: 1.0,    // Relative to parent distance
    }
  },
  visible: {
    sun: 'logarithmic',
    planet: 'logarithmic',
    moon: 'relative',  // % of parent size
    orbits: {
      planet: 10.0,   // Compressed
      moon: 5.0,      // Visible separation
    }
  }
}
```

### Step 3: Fix Update Pipeline
1. Calculate all planet positions first
2. Then calculate moon positions relative to updated parent
3. Update orbit visualizations to match

### Step 4: Test Cases
- Earth-Moon system (well known)
- Mars-Phobos/Deimos (very small moons)
- Jupiter system (4 major moons)
- Saturn system (Titan + small moons)
- Neptune-Triton (retrograde orbit)
- Pluto-Charon (binary system)