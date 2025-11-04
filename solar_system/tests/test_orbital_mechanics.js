/**
 * test_orbital_mechanics.js
 *
 * Comprehensive tests for OrbitalMechanics service
 * Tests Kepler's equation solver, orbital calculations, and transformations
 */

import {
    solveKeplersEquation,
    calculateTrueAnomaly,
    calculateMeanAnomaly,
    calculateOrbitalPosition,
    transformToSolarSystemFrame,
    calculateBodyPosition,
    calculateOrbitalVelocity,
    calculateOrbitalPhase,
    calculateDistanceFromSun,
    calculateApsides
} from '../src/domain/services/OrbitalMechanics.js';

import { Vector3 } from '../src/domain/services/CoordinateTransforms.js';

// Test helpers
function assertApproxEqual(actual, expected, tolerance = 1e-6, message = '') {
    if (Math.abs(actual - expected) > tolerance) {
        console.error(`❌ ${message}: Expected ${expected}, got ${actual} (diff: ${Math.abs(actual - expected)})`);
        return false;
    }
    return true;
}

function assertVectorApproxEqual(actual, expected, tolerance = 1e-6, message = '') {
    const dx = Math.abs(actual.x - expected.x);
    const dy = Math.abs(actual.y - expected.y);
    const dz = Math.abs(actual.z - expected.z);

    if (dx > tolerance || dy > tolerance || dz > tolerance) {
        console.error(`❌ ${message}: Expected (${expected.x}, ${expected.y}, ${expected.z}), got (${actual.x}, ${actual.y}, ${actual.z})`);
        return false;
    }
    return true;
}

// Test suite
let passedTests = 0;
let totalTests = 0;

// Test 1: Kepler's equation for circular orbit (e=0)
function testKeplersEquationCircular() {
    console.log('\nTest 1: Kepler\'s equation for circular orbit');
    totalTests++;

    const meanAnomaly = Math.PI / 4;
    const eccentricity = 0;
    const eccentricAnomaly = solveKeplersEquation(meanAnomaly, eccentricity);

    // For circular orbits, E = M
    if (assertApproxEqual(eccentricAnomaly, meanAnomaly, 1e-10, 'Circular orbit')) {
        console.log('✅ Kepler\'s equation for circular orbit');
        passedTests++;
    }
}

// Test 2: Kepler's equation for eccentric orbit
function testKeplersEquationEccentric() {
    console.log('\nTest 2: Kepler\'s equation for eccentric orbit');
    totalTests++;

    // Mercury's eccentricity
    const eccentricity = 0.2056;
    const meanAnomaly = Math.PI / 3;
    const eccentricAnomaly = solveKeplersEquation(meanAnomaly, eccentricity);

    // Verify Kepler's equation: M = E - e * sin(E)
    const calculatedM = eccentricAnomaly - eccentricity * Math.sin(eccentricAnomaly);

    if (assertApproxEqual(calculatedM, meanAnomaly, 1e-10, 'Eccentric orbit')) {
        console.log('✅ Kepler\'s equation for eccentric orbit');
        passedTests++;
    }
}

// Test 3: True anomaly calculation
function testTrueAnomaly() {
    console.log('\nTest 3: True anomaly calculation');
    totalTests++;

    // For E = 0, ν = 0
    const e = 0.2;
    let nu = calculateTrueAnomaly(0, e);

    let success = assertApproxEqual(nu, 0, 1e-10, 'True anomaly at E=0');

    // For E = π, ν = π (for any eccentricity)
    nu = calculateTrueAnomaly(Math.PI, e);
    success = success && assertApproxEqual(nu, Math.PI, 1e-10, 'True anomaly at E=π');

    if (success) {
        console.log('✅ True anomaly calculation');
        passedTests++;
    }
}

// Test 4: Mean anomaly calculation
function testMeanAnomaly() {
    console.log('\nTest 4: Mean anomaly calculation');
    totalTests++;

    const orbitalPeriod = 365.25; // Earth's period in days
    const time = 91.3125; // Quarter year
    const meanAnomaly = calculateMeanAnomaly(time, orbitalPeriod);

    // Should be π/2 (quarter orbit)
    if (assertApproxEqual(meanAnomaly, Math.PI / 2, 1e-6, 'Mean anomaly')) {
        console.log('✅ Mean anomaly calculation');
        passedTests++;
    }
}

// Test 5: Orbital position in plane
function testOrbitalPosition() {
    console.log('\nTest 5: Orbital position in plane');
    totalTests++;

    const a = 1.0; // 1 AU
    const e = 0.0;

    // At true anomaly = 0 (perihelion)
    let pos = calculateOrbitalPosition(a, e, 0);
    let success = assertVectorApproxEqual(pos, new Vector3(1, 0, 0), 1e-6, 'Position at perihelion');

    // At true anomaly = π/2
    pos = calculateOrbitalPosition(a, e, Math.PI / 2);
    success = success && assertVectorApproxEqual(pos, new Vector3(0, 1, 0), 1e-6, 'Position at π/2');

    // At true anomaly = π (aphelion)
    pos = calculateOrbitalPosition(a, e, Math.PI);
    success = success && assertVectorApproxEqual(pos, new Vector3(-1, 0, 0), 1e-6, 'Position at aphelion');

    if (success) {
        console.log('✅ Orbital position calculation');
        passedTests++;
    }
}

// Test 6: Orbital position with eccentricity
function testOrbitalPositionEccentric() {
    console.log('\nTest 6: Orbital position with eccentricity');
    totalTests++;

    const a = 1.0; // 1 AU
    const e = 0.5;

    // At perihelion (ν = 0)
    let pos = calculateOrbitalPosition(a, e, 0);
    const perihelionDist = a * (1 - e); // 0.5 AU
    let success = assertApproxEqual(pos.x, perihelionDist, 1e-6, 'Perihelion distance');

    // At aphelion (ν = π)
    pos = calculateOrbitalPosition(a, e, Math.PI);
    const aphelionDist = a * (1 + e); // 1.5 AU
    success = success && assertApproxEqual(Math.abs(pos.x), aphelionDist, 1e-6, 'Aphelion distance');

    if (success) {
        console.log('✅ Orbital position with eccentricity');
        passedTests++;
    }
}

// Test 7: Solar system frame transformation (no inclination)
function testSolarSystemFrameFlat() {
    console.log('\nTest 7: Solar system frame transformation (flat orbit)');
    totalTests++;

    const orbitalPos = new Vector3(1, 0, 0);
    const i = 0; // No inclination
    const Omega = 0; // No rotation of ascending node
    const omega = Math.PI / 4; // 45 degree argument of perihelion

    const solarPos = transformToSolarSystemFrame(orbitalPos, i, Omega, omega);

    // Should rotate by 45 degrees in XY plane
    const expected = new Vector3(Math.cos(omega), Math.sin(omega), 0);

    if (assertVectorApproxEqual(solarPos, expected, 1e-6, 'Flat orbit transformation')) {
        console.log('✅ Solar system frame transformation (flat)');
        passedTests++;
    }
}

// Test 8: Solar system frame transformation (with inclination)
function testSolarSystemFrameInclined() {
    console.log('\nTest 8: Solar system frame transformation (inclined orbit)');
    totalTests++;

    const orbitalPos = new Vector3(1, 0, 0);
    const i = Math.PI / 6; // 30 degree inclination
    const Omega = 0;
    const omega = 0;

    const solarPos = transformToSolarSystemFrame(orbitalPos, i, Omega, omega);

    // X component should remain 1, Z should be 0 (at perihelion)
    let success = assertApproxEqual(solarPos.x, 1, 1e-6, 'X component');
    success = success && assertApproxEqual(solarPos.z, 0, 1e-6, 'Z component at perihelion');

    // Now test at a different position (90 degrees in orbital plane)
    const orbitalPos2 = new Vector3(0, 1, 0);
    const solarPos2 = transformToSolarSystemFrame(orbitalPos2, i, Omega, omega);

    // Should have Z component due to inclination
    success = success && assertApproxEqual(solarPos2.z, Math.sin(i), 1e-6, 'Z component with inclination');

    if (success) {
        console.log('✅ Solar system frame transformation (inclined)');
        passedTests++;
    }
}

// Test 9: Complete body position calculation
function testCalculateBodyPosition() {
    console.log('\nTest 9: Complete body position calculation');
    totalTests++;

    const orbitalElements = {
        semiMajorAxis: 1.0,
        eccentricity: 0.0,
        inclination: 0,
        longitudeOfAscendingNode: 0,
        argumentOfPerihelion: 0,
        orbitalPeriod: 365.25
    };

    // At t=0, should be at perihelion (x=1, y=0, z=0)
    const pos = calculateBodyPosition(orbitalElements, 0);

    if (assertVectorApproxEqual(pos, new Vector3(1, 0, 0), 1e-6, 'Body position at t=0')) {
        console.log('✅ Complete body position calculation');
        passedTests++;
    }
}

// Test 10: Orbital velocity calculation
function testOrbitalVelocity() {
    console.log('\nTest 10: Orbital velocity calculation');
    totalTests++;

    const a = 1.0; // 1 AU
    const r = 1.0; // At 1 AU distance
    const period = 365.25; // Earth's period

    const velocity = calculateOrbitalVelocity(a, r, period);

    // Earth's orbital velocity is about 0.01720 AU/day
    const expectedVelocity = 2 * Math.PI / period;

    if (assertApproxEqual(velocity, expectedVelocity, 1e-4, 'Orbital velocity')) {
        console.log('✅ Orbital velocity calculation');
        passedTests++;
    }
}

// Test 11: Orbital phase calculation
function testOrbitalPhase() {
    console.log('\nTest 11: Orbital phase calculation');
    totalTests++;

    const period = 100;

    let success = true;

    // At t=0
    let phase = calculateOrbitalPhase(0, period);
    success = success && assertApproxEqual(phase, 0, 1e-6, 'Phase at t=0');

    // At quarter period
    phase = calculateOrbitalPhase(25, period);
    success = success && assertApproxEqual(phase, 0.25, 1e-6, 'Phase at quarter period');

    // At half period
    phase = calculateOrbitalPhase(50, period);
    success = success && assertApproxEqual(phase, 0.5, 1e-6, 'Phase at half period');

    // After full period
    phase = calculateOrbitalPhase(100, period);
    success = success && assertApproxEqual(phase, 0, 1e-6, 'Phase after full period');

    if (success) {
        console.log('✅ Orbital phase calculation');
        passedTests++;
    }
}

// Test 12: Distance from sun
function testDistanceFromSun() {
    console.log('\nTest 12: Distance from sun');
    totalTests++;

    const position = new Vector3(3, 4, 0);
    const distance = calculateDistanceFromSun(position);

    // Should be 5 (3-4-5 triangle)
    if (assertApproxEqual(distance, 5, 1e-6, 'Distance calculation')) {
        console.log('✅ Distance from sun calculation');
        passedTests++;
    }
}

// Test 13: Apsides calculation
function testApsides() {
    console.log('\nTest 13: Apsides calculation');
    totalTests++;

    const a = 1.0; // 1 AU
    const e = 0.2;

    const apsides = calculateApsides(a, e);

    let success = assertApproxEqual(apsides.perihelion, 0.8, 1e-6, 'Perihelion');
    success = success && assertApproxEqual(apsides.aphelion, 1.2, 1e-6, 'Aphelion');

    if (success) {
        console.log('✅ Apsides calculation');
        passedTests++;
    }
}

// Test 14: Mercury's orbit (real data validation)
function testMercuryOrbit() {
    console.log('\nTest 14: Mercury\'s orbit (real data)');
    totalTests++;

    const mercuryElements = {
        semiMajorAxis: 0.387098,  // AU
        eccentricity: 0.205630,
        inclination: 7.005 * Math.PI / 180,  // degrees to radians
        longitudeOfAscendingNode: 48.331 * Math.PI / 180,
        argumentOfPerihelion: 29.124 * Math.PI / 180,
        orbitalPeriod: 87.969  // days
    };

    // Calculate position at perihelion
    const pos = calculateBodyPosition(mercuryElements, 0);
    const distance = calculateDistanceFromSun(pos);

    const expectedPerihelion = 0.387098 * (1 - 0.205630);

    if (assertApproxEqual(distance, expectedPerihelion, 1e-4, 'Mercury perihelion')) {
        console.log('✅ Mercury orbit validation');
        passedTests++;
    }
}

// Test 15: High eccentricity handling
function testHighEccentricity() {
    console.log('\nTest 15: High eccentricity handling');
    totalTests++;

    const e = 0.9;  // Very eccentric orbit
    const M = Math.PI / 2;

    const E = solveKeplersEquation(M, e);

    // Verify solution
    const calculatedM = E - e * Math.sin(E);

    if (assertApproxEqual(calculatedM, M, 1e-6, 'High eccentricity Kepler solution')) {
        console.log('✅ High eccentricity handling');
        passedTests++;
    }
}

// Test 16: Negative time handling
function testNegativeTime() {
    console.log('\nTest 16: Negative time handling');
    totalTests++;

    const period = 100;

    // Negative time should wrap around correctly
    const phase = calculateOrbitalPhase(-25, period);

    if (assertApproxEqual(phase, 0.75, 1e-6, 'Negative time phase')) {
        console.log('✅ Negative time handling');
        passedTests++;
    }
}

// Test 17: Earth's orbit validation
function testEarthOrbit() {
    console.log('\nTest 17: Earth\'s orbit validation');
    totalTests++;

    const earthElements = {
        semiMajorAxis: 1.0,  // AU by definition
        eccentricity: 0.0167,
        inclination: 0,  // Reference plane
        longitudeOfAscendingNode: 0,
        argumentOfPerihelion: 0,
        orbitalPeriod: 365.25
    };

    // After quarter year, should be roughly at 90 degrees
    const pos = calculateBodyPosition(earthElements, 365.25 / 4);

    // Should be close to (0, 1, 0) but due to eccentricity, X won't be exactly 0
    // With eccentricity, there's a small X component
    let success = assertApproxEqual(Math.abs(pos.y), 1.0, 0.02, 'Earth quarter orbit Y');
    success = success && assertApproxEqual(Math.abs(pos.x), 0.0, 0.04, 'Earth quarter orbit X (with eccentricity)');

    if (success) {
        console.log('✅ Earth orbit validation');
        passedTests++;
    }
}

// Test 18: Conservation of energy
function testEnergyConservation() {
    console.log('\nTest 18: Conservation of energy');
    totalTests++;

    const a = 1.0;
    const period = 365.25;

    // Velocity at perihelion vs aphelion for eccentric orbit
    const e = 0.5;
    const rPeri = a * (1 - e);
    const rApo = a * (1 + e);

    const vPeri = calculateOrbitalVelocity(a, rPeri, period);
    const vApo = calculateOrbitalVelocity(a, rApo, period);

    // Angular momentum conservation: r1 * v1 = r2 * v2
    const L1 = rPeri * vPeri;
    const L2 = rApo * vApo;

    if (assertApproxEqual(L1, L2, 1e-6, 'Angular momentum conservation')) {
        console.log('✅ Energy conservation validation');
        passedTests++;
    }
}

// Run all tests
console.log('='.repeat(50));
console.log('Running OrbitalMechanics Tests');
console.log('='.repeat(50));

testKeplersEquationCircular();
testKeplersEquationEccentric();
testTrueAnomaly();
testMeanAnomaly();
testOrbitalPosition();
testOrbitalPositionEccentric();
testSolarSystemFrameFlat();
testSolarSystemFrameInclined();
testCalculateBodyPosition();
testOrbitalVelocity();
testOrbitalPhase();
testDistanceFromSun();
testApsides();
testMercuryOrbit();
testHighEccentricity();
testNegativeTime();
testEarthOrbit();
testEnergyConservation();

// Summary
console.log('\n' + '='.repeat(50));
console.log(`Test Results: ${passedTests}/${totalTests} passed`);
if (passedTests === totalTests) {
    console.log('🎉 All OrbitalMechanics tests passed!');
} else {
    console.log(`❌ ${totalTests - passedTests} tests failed`);
    process.exit(1);
}
console.log('='.repeat(50));