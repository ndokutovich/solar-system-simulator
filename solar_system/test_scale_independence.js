/**
 * Test that scale sliders work independently
 */

console.log('🎚️ Scale Independence Test');
console.log('='.repeat(50));

// Simulate scale calculations
function getScaledRadius(radiusKm, type, parentRadiusKm, scaleMultipliers, mode) {
    let scale;

    if (mode === 'realistic') {
        if (type === 'moon') {
            const baseScale = radiusKm / 1000000;
            const minMoonSize = 0.0005;
            scale = Math.max(baseScale, minMoonSize) * scaleMultipliers.moon;
        } else if (type === 'star') {
            scale = (radiusKm / 5000000) * scaleMultipliers.sun;
        } else {
            scale = (radiusKm / 1000000) * scaleMultipliers.planet;
        }
    } else {
        // Visible mode
        if (type === 'moon' && parentRadiusKm) {
            const ratio = radiusKm / parentRadiusKm;
            const parentBaseScale = Math.log10(parentRadiusKm + 1) * 0.001; // Fixed: no planet multiplier
            scale = Math.max(parentBaseScale * ratio * 2, 0.0002) * scaleMultipliers.moon;
        } else if (type === 'star') {
            scale = Math.log10(radiusKm + 1) * 0.0003 * scaleMultipliers.sun;
        } else if (type === 'moon') {
            scale = Math.log10(radiusKm + 1) * 0.0008 * scaleMultipliers.moon;
        } else {
            scale = Math.log10(radiusKm + 1) * 0.001 * scaleMultipliers.planet;
        }
    }

    return scale;
}

// Test cases
const tests = [
    { planet: 'Earth', radius: 6371, moon: 'Moon', moonRadius: 1737.4 },
    { planet: 'Mars', radius: 3389.5, moon: 'Phobos', moonRadius: 11.27 }
];

// Test different multiplier combinations
const multiplierTests = [
    { planet: 1.0, moon: 1.0, label: 'Both at 1.0' },
    { planet: 2.0, moon: 1.0, label: 'Planet 2.0, Moon 1.0' },
    { planet: 1.0, moon: 2.0, label: 'Planet 1.0, Moon 2.0' },
    { planet: 1.5, moon: 14.5, label: 'Planet 1.5, Moon 14.5 (user test)' }
];

tests.forEach(test => {
    console.log(`\n${test.planet}-${test.moon} System:`);
    console.log('-'.repeat(40));

    multiplierTests.forEach(mult => {
        const scaleMultipliers = {
            sun: 1.0,
            planet: mult.planet,
            moon: mult.moon,
            moonOrbit: 1.0
        };

        // Calculate scales
        const planetScale = getScaledRadius(test.radius, 'planet', null, scaleMultipliers, 'visible');
        const moonScale = getScaledRadius(test.moonRadius, 'moon', test.radius, scaleMultipliers, 'visible');

        console.log(`\n${mult.label}:`);
        console.log(`  Planet scale: ${planetScale.toFixed(6)}`);
        console.log(`  Moon scale: ${moonScale.toFixed(6)}`);
        console.log(`  Moon/Planet ratio: ${(moonScale/planetScale * 100).toFixed(1)}%`);
    });
});

console.log('\n' + '='.repeat(50));
console.log('Expected Behavior:');
console.log('✅ Planet multiplier should ONLY affect planet size');
console.log('✅ Moon multiplier should ONLY affect moon size');
console.log('✅ Moon/Planet ratio should change based on multipliers');
console.log('');
console.log('FIXED: Moons now calculate from parent\'s base size,');
console.log('       not parent\'s scaled size!');