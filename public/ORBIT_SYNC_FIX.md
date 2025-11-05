# Moon Orbit "Dancing" Fix

## Problem
- Moon orbit lines were "dancing" (rotating) as planets rotated
- Actual moons followed correct stable paths
- Orbit visualizations and moon positions were out of sync

## Root Cause

### Object Hierarchy (Before Fix)
```
Planet Mesh (rotating)
├── Moon Orbit Line (rotating with parent!)
└── Other children
```

When `mesh.rotation.y = angle` was applied to planets, their child orbit lines rotated too!

## The Solution

### New Object Hierarchy (After Fix)
```
Planet Container (non-rotating)
├── Planet Mesh (rotating)
├── Moon Orbit Line 1 (non-rotating)
├── Moon Orbit Line 2 (non-rotating)
└── etc.
```

## Key Changes

1. **Created Container Structure** (Lines 210-234)
   - Planets now have a non-rotating container
   - Planet mesh is a child of container
   - Container moves in orbit, mesh rotates inside it

2. **Moon Orbits Added to Containers** (Lines 240-246)
   - Moon orbit lines are children of planet containers
   - They move with the planet but don't rotate

3. **Position Updates** (Lines 641-646, 662-667)
   - Containers move for planets
   - Only meshes rotate
   - Moons reference parent container positions

4. **Rotation Isolation** (Lines 672-678)
   - `mesh.rotation.y` only affects the planet mesh
   - Container stays orientation-fixed
   - Moon orbit lines stay aligned

## Visual Result

### Before
- Earth rotates → Moon orbit line spins around Earth
- Mars rotates → Phobos/Deimos orbits spin
- Orbit lines don't match moon paths

### After
- Earth rotates → Moon orbit stays fixed in space
- Mars rotates → Phobos/Deimos orbits stay fixed
- Orbit lines exactly match where moons travel

## Testing

Watch Jupiter system:
1. Jupiter rotates quickly (9.9 hour day)
2. Before: Io/Europa/Ganymede/Callisto orbit lines would spin wildly
3. After: Orbit lines stay perfectly stable while Jupiter spins

## Benefits

1. **Visual Accuracy**: Orbit lines show true moon paths
2. **No More "Dancing"**: Stable orbit visualizations
3. **Perfect Sync**: Moons follow their orbit lines exactly
4. **Maintains Features**: Planet rotation still works correctly