/**
 * Test to verify moon scales and orbit distances are correct
 */

console.log('🌙 Moon Scale Test\n');
console.log('=' .repeat(50));

// Example moon data
const moons = [
    { name: 'Moon (Earth)', radius_km: 1737.4, orbit_km: 384400 },
    { name: 'Phobos (Mars)', radius_km: 11.27, orbit_km: 9376 },
    { name: 'Io (Jupiter)', radius_km: 1821.6, orbit_km: 421800 },
    { name: 'Titan (Saturn)', radius_km: 2574.7, orbit_km: 1221865 },
];

// Test both scale modes
const modes = ['realistic', 'visible'];

modes.forEach(mode => {
    console.log(`\n📏 Scale Mode: ${mode.toUpperCase()}`);
    console.log('-'.repeat(40));

    moons.forEach(moon => {
        // Calculate moon size
        let moonRadius;
        if (mode === 'realistic') {
            // Moons at 1/100,000 scale (10x boost for visibility)
            moonRadius = moon.radius_km / 100000;
        } else {
            // Visible mode - logarithmic scale
            const logScale = Math.log10(moon.radius_km + 1) * 0.001;
            moonRadius = logScale * 0.8;
        }

        // Calculate orbit distance
        let orbitScale;
        if (mode === 'realistic') {
            orbitScale = 0.5; // 1/2 AU scale for visibility
        } else {
            orbitScale = 2.0;  // 2x scale in visible mode for better visibility
        }

        // Convert km to AU for orbit
        const orbitAU = moon.orbit_km / 149597870.7;
        const scaledOrbit = orbitAU * orbitScale;

        console.log(`\n${moon.name}:`);
        console.log(`  Original: radius=${moon.radius_km}km, orbit=${moon.orbit_km}km`);
        console.log(`  Scaled radius: ${moonRadius.toFixed(6)} units`);
        console.log(`  Scaled orbit: ${scaledOrbit.toFixed(6)} units`);
        console.log(`  Visibility: ${moonRadius > 0.0001 ? '✅ Visible' : '❌ Too small'}`);

        // Compare to Earth for reference (Earth radius = 6371km)
        const earthRadius = mode === 'realistic' ? 6371 / 1000000 : Math.log10(6371 + 1) * 0.001;
        const relativeSize = (moonRadius / earthRadius * 100).toFixed(1);
        console.log(`  Size relative to Earth: ${relativeSize}%`);
    });
});

console.log('\n' + '='.repeat(50));
console.log('💡 Summary:');
console.log('- In REALISTIC mode: Moons are 10x larger than true scale for visibility');
console.log('- In VISIBLE mode: Moons use logarithmic scaling at 80% of planet scale');
console.log('- Moon orbits are scaled appropriately for each mode');
console.log('- All moons should now be visible in both modes');