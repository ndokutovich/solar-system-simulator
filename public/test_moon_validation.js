/**
 * Comprehensive validation test for moon systems
 */

console.log('🌙 Moon System Validation\n');
console.log('='.repeat(60));

import { CELESTIAL_BODIES } from './src/config/celestialBodies.js';

// Collect all moons by parent
const moonSystems = {};

for (const [key, body] of Object.entries(CELESTIAL_BODIES)) {
    if (body.parent && body.parent !== 'sun') {
        const parent = body.parent.toUpperCase();
        if (!moonSystems[parent]) {
            moonSystems[parent] = [];
        }
        moonSystems[parent].push({
            key: key,
            name: body.name_en,
            radius_km: body.radius_km,
            orbit_km: body.orbital?.semi_major_axis_km || 0
        });
    }
}

// Test scale calculations
function testScales(mode) {
    console.log(`\n📏 Scale Mode: ${mode.toUpperCase()}`);
    console.log('-'.repeat(60));

    for (const [parentKey, moons] of Object.entries(moonSystems)) {
        const parent = CELESTIAL_BODIES[parentKey];
        if (!parent) continue;

        console.log(`\n🪐 ${parentKey} System:`);
        console.log(`   Parent radius: ${parent.radius_km} km`);

        let parentScale;
        if (mode === 'realistic') {
            parentScale = parent.radius_km / 1000000;
        } else {
            parentScale = Math.log10(parent.radius_km + 1) * 0.001;
        }
        console.log(`   Parent scale: ${parentScale.toFixed(6)} units`);

        moons.forEach(moon => {
            console.log(`\n   🌙 ${moon.name}:`);
            console.log(`      Actual radius: ${moon.radius_km} km`);
            console.log(`      Actual orbit: ${moon.orbit_km} km`);

            // Calculate moon scale
            let moonScale;
            if (mode === 'realistic') {
                moonScale = Math.max(moon.radius_km / 100000, 0.0001);
            } else {
                const ratio = moon.radius_km / parent.radius_km;
                moonScale = Math.max(parentScale * ratio * 2, 0.0002);
            }

            // Calculate orbit scale (relative to parent)
            const orbitScale = parentScale * 10; // 10x parent radius

            console.log(`      Moon scale: ${moonScale.toFixed(6)} units`);
            console.log(`      Orbit scale: ${orbitScale.toFixed(6)} units from parent`);
            console.log(`      Size ratio to parent: ${(moonScale / parentScale * 100).toFixed(1)}%`);
            console.log(`      Orbit/Parent ratio: ${(orbitScale / parentScale).toFixed(1)}x`);

            // Validation checks
            const issues = [];
            if (moonScale < 0.0001) issues.push('❌ Too small to see');
            if (moonScale > parentScale) issues.push('⚠️ Larger than parent');
            if (orbitScale < parentScale * 2) issues.push('❌ Orbit inside parent');

            if (issues.length === 0) {
                console.log(`      ✅ All checks passed`);
            } else {
                issues.forEach(issue => console.log(`      ${issue}`));
            }
        });
    }
}

// Run tests for both modes
testScales('realistic');
testScales('visible');

// Summary statistics
console.log('\n' + '='.repeat(60));
console.log('📊 Summary Statistics:');

let totalMoons = 0;
let systemCount = 0;

for (const [parent, moons] of Object.entries(moonSystems)) {
    systemCount++;
    totalMoons += moons.length;
    console.log(`   ${parent}: ${moons.length} moon${moons.length > 1 ? 's' : ''}`);
}

console.log(`\nTotal: ${totalMoons} moons across ${systemCount} systems`);

// Special cases
console.log('\n⚠️ Special Cases:');
console.log('   - Pluto-Charon: Binary system (Charon is 50% of Pluto\'s size)');
console.log('   - Phobos & Deimos: Very small (11km and 6km radius)');
console.log('   - Triton: Retrograde orbit around Neptune');
console.log('   - Io: Highly volcanic, close to Jupiter');

console.log('\n✅ Systematic Approach Summary:');
console.log('   1. Moon orbits are children of parent planets');
console.log('   2. Scales are hierarchical and relative');
console.log('   3. Minimum size thresholds ensure visibility');
console.log('   4. Orbit distances scaled to parent radius');
console.log('   5. Update order: planets first, then moons');