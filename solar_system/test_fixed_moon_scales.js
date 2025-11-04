/**
 * Test FIXED moon scaling - all moons should be smaller than their parents
 */

console.log('🌙 FIXED Moon System Scale Test');
console.log('='.repeat(60));

// Test data
const systems = [
    {
        planet: 'Earth',
        radius: 6371,
        moons: [
            { name: 'Moon', radius: 1737.4, expectedRatio: 27.3 }
        ]
    },
    {
        planet: 'Mars',
        radius: 3389.5,
        moons: [
            { name: 'Phobos', radius: 11.27, expectedRatio: 0.33 },
            { name: 'Deimos', radius: 6.2, expectedRatio: 0.18 }
        ]
    },
    {
        planet: 'Jupiter',
        radius: 69911,
        moons: [
            { name: 'Io', radius: 1821.6, expectedRatio: 2.6 },
            { name: 'Europa', radius: 1560.8, expectedRatio: 2.2 },
            { name: 'Ganymede', radius: 2634.1, expectedRatio: 3.8 },
            { name: 'Callisto', radius: 2410.3, expectedRatio: 3.4 }
        ]
    },
    {
        planet: 'Pluto',
        radius: 1188.3,
        moons: [
            { name: 'Charon', radius: 606, expectedRatio: 51.0 }
        ]
    }
];

// Test both modes
['realistic', 'visible'].forEach(mode => {
    console.log(`\n📏 MODE: ${mode.toUpperCase()}`);
    console.log('-'.repeat(60));

    systems.forEach(system => {
        console.log(`\n🪐 ${system.planet} System:`);

        // Calculate planet scale
        let planetScale;
        if (mode === 'realistic') {
            planetScale = system.radius / 1000000;
        } else {
            // Visible mode - logarithmic
            planetScale = Math.log10(system.radius + 1) * 0.001;
        }

        console.log(`   ${system.planet}: ${planetScale.toFixed(6)} units`);

        system.moons.forEach(moon => {
            // Calculate moon scale
            let moonScale;
            if (mode === 'realistic') {
                // Same scale as planets but with minimum
                moonScale = Math.max(moon.radius / 1000000, 0.0005);
            } else {
                // Relative to parent in visible mode
                const ratio = moon.radius / system.radius;
                moonScale = Math.max(planetScale * ratio * 2, 0.0002);
            }

            // Calculate orbit distance
            const orbitScale = mode === 'realistic'
                ? Math.max(0.01, planetScale * 3)
                : Math.max(0.05, planetScale * 5);

            const sizeRatio = (moonScale / planetScale * 100).toFixed(1);
            const actualRatio = moon.expectedRatio.toFixed(1);

            console.log(`\n   🌙 ${moon.name}:`);
            console.log(`      Size: ${moonScale.toFixed(6)} units`);
            console.log(`      Ratio: ${sizeRatio}% of ${system.planet}`);
            console.log(`      (Actual: ${actualRatio}%)`);
            console.log(`      Orbit: ${orbitScale.toFixed(6)} units from center`);

            // Validation
            const issues = [];
            if (moonScale > planetScale) {
                issues.push(`❌ MOON LARGER THAN PLANET!`);
            }
            if (orbitScale < planetScale + moonScale) {
                issues.push(`❌ Moon inside planet!`);
            }

            if (issues.length === 0) {
                console.log(`      ✅ Scales correct`);
            } else {
                issues.forEach(issue => console.log(`      ${issue}`));
            }
        });
    });
});

console.log('\n' + '='.repeat(60));
console.log('📊 Summary:');
console.log('- Moon sizes now use same scale as planets (1:1,000,000)');
console.log('- Minimum moon size: 0.0005 units for visibility');
console.log('- Moon orbits: 3x parent radius (realistic), 5x (visible)');
console.log('- All moons should be smaller than their parents');
console.log('- Pluto-Charon is special case (binary system)');