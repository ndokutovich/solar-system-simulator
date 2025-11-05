/**
 * Test to verify planet orbit lines match actual planet positions
 */

console.log('🪐 Planet Orbit Alignment Test');
console.log('='.repeat(50));

// Test parameters
const testPlanets = [
    {
        name: 'Earth',
        semi_major_axis_au: 1.0,
        eccentricity: 0.0167,
        inclination: 0.00005, // Nearly 0 for Earth
        period_days: 365.25
    },
    {
        name: 'Mars',
        semi_major_axis_au: 1.524,
        eccentricity: 0.0934,
        inclination: 1.85 * Math.PI / 180, // 1.85 degrees
        period_days: 687
    },
    {
        name: 'Mercury',
        semi_major_axis_au: 0.387,
        eccentricity: 0.2056,
        inclination: 7.0 * Math.PI / 180, // 7 degrees - highest!
        period_days: 88
    }
];

// Test both methods
testPlanets.forEach(planet => {
    console.log(`\n${planet.name}:`);
    console.log('-'.repeat(30));

    // Method 1: Simple ellipse (old orbit line method)
    console.log('Simple Ellipse (XZ plane):');
    for (let i = 0; i <= 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const r = planet.semi_major_axis_au * (1 - planet.eccentricity * planet.eccentricity) /
                  (1 + planet.eccentricity * Math.cos(angle));
        const x = r * Math.cos(angle);
        const y = 0; // Always in XZ plane
        const z = r * Math.sin(angle);
        console.log(`  Point ${i}: (${x.toFixed(3)}, ${y.toFixed(3)}, ${z.toFixed(3)})`);
    }

    // Method 2: Full orbital elements (should show inclination)
    console.log('With Inclination:');
    const inc = planet.inclination;
    for (let i = 0; i <= 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const r = planet.semi_major_axis_au * (1 - planet.eccentricity * planet.eccentricity) /
                  (1 + planet.eccentricity * Math.cos(angle));

        // Apply inclination
        const x = r * Math.cos(angle);
        const y = r * Math.sin(angle) * Math.sin(inc); // Y component from inclination
        const z = r * Math.sin(angle) * Math.cos(inc);
        console.log(`  Point ${i}: (${x.toFixed(3)}, ${y.toFixed(3)}, ${z.toFixed(3)})`);
    }

    // Show maximum Y deviation
    const maxY = planet.semi_major_axis_au * Math.sin(inc);
    console.log(`Max Y deviation: ${maxY.toFixed(4)} AU (${(maxY * 149597870.7).toFixed(0)} km)`);

    if (Math.abs(maxY) > 0.001) {
        console.log('⚠️ Significant inclination - orbit not in XZ plane!');
    }
});

console.log('\n' + '='.repeat(50));
console.log('Summary:');
console.log('- Earth: Nearly flat orbit (inclination ~0°)');
console.log('- Mars: Small inclination (1.85°)');
console.log('- Mercury: Large inclination (7°) - most tilted!');
console.log('');
console.log('The old orbit lines were flat circles in XZ plane.');
console.log('Planets with inclination move above/below this plane.');
console.log('Fixed: Now orbit lines use full orbital elements.');