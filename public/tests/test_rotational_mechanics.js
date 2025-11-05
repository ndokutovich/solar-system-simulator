/**
 * test_rotational_mechanics.js
 *
 * Comprehensive tests for RotationalMechanics service
 * Tests rotation calculations, spin-orbit resonances, and axial tilt
 */

import {
    calculateSimpleRotation,
    calculateResonantRotation,
    calculateTidalLockRotation,
    calculateRotationAxis,
    calculateRotationMatrix,
    calculateSubSolarPoint,
    calculateTerminatorLine,
    calculateBodyRotation,
    calculateLibration,
    calculateSolarDay,
    getRotationDirection,
    calculatePrecessionPeriod
} from '../src/domain/services/RotationalMechanics.js';

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

// Test 1: Simple rotation
function testSimpleRotation() {
    console.log('\nTest 1: Simple rotation');
    totalTests++;

    const period = 1; // 1 day period
    const time = 0.5; // Half day

    const angle = calculateSimpleRotation(time, period);

    // Should be π (half rotation)
    if (assertApproxEqual(angle, Math.PI, 1e-6, 'Simple rotation')) {
        console.log('✅ Simple rotation calculation');
        passedTests++;
    }
}

// Test 2: Retrograde rotation
function testRetrogradeRotation() {
    console.log('\nTest 2: Retrograde rotation');
    totalTests++;

    const period = -1; // Negative period for retrograde
    const time = 0.5;

    const angle = calculateSimpleRotation(time, period);

    // Should be -π (half rotation backwards)
    if (assertApproxEqual(angle, -Math.PI, 1e-6, 'Retrograde rotation')) {
        console.log('✅ Retrograde rotation calculation');
        passedTests++;
    }
}

// Test 3: Resonant rotation (Mercury's 3:2)
function testResonantRotation() {
    console.log('\nTest 3: Resonant rotation (Mercury 3:2)');
    totalTests++;

    const orbitalPeriod = 88;
    const resonance = { rotations: 3, orbits: 2 };

    // At perihelion (anomaly = 0)
    const angle = calculateResonantRotation(0, orbitalPeriod, resonance, 0);

    if (assertApproxEqual(angle, 0, 1e-6, 'Resonant rotation at perihelion')) {
        console.log('✅ Resonant rotation calculation');
        passedTests++;
    }
}

// Test 4: Tidal lock rotation
function testTidalLockRotation() {
    console.log('\nTest 4: Tidal lock rotation');
    totalTests++;

    const orbitalAnomaly = Math.PI / 3;
    const angle = calculateTidalLockRotation(orbitalAnomaly);

    // Should equal orbital anomaly
    if (assertApproxEqual(angle, orbitalAnomaly, 1e-6, 'Tidal lock')) {
        console.log('✅ Tidal lock rotation');
        passedTests++;
    }
}

// Test 5: Rotation axis with no tilt
function testRotationAxisNoTilt() {
    console.log('\nTest 5: Rotation axis with no tilt');
    totalTests++;

    const axis = calculateRotationAxis(0);

    // Should be pure Z axis
    if (assertVectorApproxEqual(axis, new Vector3(0, 0, 1), 1e-6, 'No tilt axis')) {
        console.log('✅ Rotation axis with no tilt');
        passedTests++;
    }
}

// Test 6: Rotation axis with tilt
function testRotationAxisWithTilt() {
    console.log('\nTest 6: Rotation axis with tilt');
    totalTests++;

    const tilt = 23.5; // Earth's tilt
    const axis = calculateRotationAxis(tilt);

    const expectedX = Math.sin(23.5 * Math.PI / 180);
    const expectedZ = Math.cos(23.5 * Math.PI / 180);

    let success = assertApproxEqual(axis.x, expectedX, 1e-6, 'Tilted axis X');
    success = success && assertApproxEqual(axis.z, expectedZ, 1e-6, 'Tilted axis Z');
    success = success && assertApproxEqual(axis.y, 0, 1e-6, 'Tilted axis Y');

    if (success) {
        console.log('✅ Rotation axis with tilt');
        passedTests++;
    }
}

// Test 7: Rotation matrix
function testRotationMatrix() {
    console.log('\nTest 7: Rotation matrix');
    totalTests++;

    const angle = Math.PI / 2; // 90 degree rotation
    const axis = new Vector3(0, 0, 1); // Around Z axis

    const matrix = calculateRotationMatrix(angle, axis);

    // 90 degree rotation around Z should swap X and Y
    // Matrix element [0,0] should be ~0 (cos 90°)
    // Matrix element [0,1] should be ~-1 (-sin 90°)
    // Matrix element [1,0] should be ~1 (sin 90°)
    // Matrix element [1,1] should be ~0 (cos 90°)

    let success = assertApproxEqual(matrix[0], 0, 1e-6, 'Matrix[0,0]');
    success = success && assertApproxEqual(matrix[1], -1, 1e-6, 'Matrix[0,1]');
    success = success && assertApproxEqual(matrix[3], 1, 1e-6, 'Matrix[1,0]');
    success = success && assertApproxEqual(matrix[4], 0, 1e-6, 'Matrix[1,1]');
    success = success && assertApproxEqual(matrix[8], 1, 1e-6, 'Matrix[2,2]');

    if (success) {
        console.log('✅ Rotation matrix calculation');
        passedTests++;
    }
}

// Test 8: Sub-solar point
function testSubSolarPoint() {
    console.log('\nTest 8: Sub-solar point');
    totalTests++;

    const rotation = 0;
    const axialTilt = 0;
    const orbitalPosition = 0;

    const point = calculateSubSolarPoint(rotation, axialTilt, orbitalPosition);

    let success = assertApproxEqual(point.longitude, 0, 1e-6, 'Longitude');
    success = success && assertApproxEqual(point.latitude, 0, 1e-6, 'Latitude');

    if (success) {
        console.log('✅ Sub-solar point calculation');
        passedTests++;
    }
}

// Test 9: Sub-solar point with tilt
function testSubSolarPointWithTilt() {
    console.log('\nTest 9: Sub-solar point with tilt');
    totalTests++;

    const rotation = 0;
    const axialTilt = 23.5;
    const orbitalPosition = 0.25; // Northern summer

    const point = calculateSubSolarPoint(rotation, axialTilt, orbitalPosition);

    // At 0.25 orbital position, latitude should be maximum (23.5°)
    let success = assertApproxEqual(point.longitude, 0, 1e-6, 'Longitude');
    success = success && assertApproxEqual(point.latitude, 23.5, 1e-6, 'Latitude at summer');

    if (success) {
        console.log('✅ Sub-solar point with tilt');
        passedTests++;
    }
}

// Test 10: Terminator line
function testTerminatorLine() {
    console.log('\nTest 10: Terminator line');
    totalTests++;

    const subSolarPoint = { longitude: 0, latitude: 0 };
    const terminator = calculateTerminatorLine(subSolarPoint);

    // Should have 360 points
    let success = terminator.length === 360;

    // Points should be 90° from sub-solar point
    if (success && terminator.length > 0) {
        // Check a few points
        const point = terminator[0];
        // The terminator should be approximately 90° from sub-solar
        const expectedLon = 90; // or -90
        success = success && (Math.abs(point.longitude - expectedLon) < 10 ||
                              Math.abs(point.longitude + expectedLon) < 10);
    }

    if (success) {
        console.log('✅ Terminator line calculation');
        passedTests++;
    }
}

// Test 11: Complete body rotation
function testBodyRotation() {
    console.log('\nTest 11: Complete body rotation');
    totalTests++;

    const rotationParams = {
        period_days: 1,
        axial_tilt: 0,
        tidally_locked: false
    };

    const result = calculateBodyRotation(rotationParams, 0.5);

    let success = assertApproxEqual(result.angle, Math.PI, 1e-6, 'Rotation angle');
    success = success && assertVectorApproxEqual(result.axis, new Vector3(0, 0, 1), 1e-6, 'Rotation axis');
    success = success && result.matrix.length === 9;

    if (success) {
        console.log('✅ Complete body rotation');
        passedTests++;
    }
}

// Test 12: Mercury's 3:2 resonance full test
function testMercuryResonance() {
    console.log('\nTest 12: Mercury 3:2 resonance');
    totalTests++;

    const rotationParams = {
        period_days: 58.646,
        resonance: { rotations: 3, orbits: 2 },
        axial_tilt: 0.034
    };

    const orbitalPeriod = 87.969;
    const time = orbitalPeriod; // One full orbit

    const result = calculateBodyRotation(rotationParams, time, 0, orbitalPeriod);

    // After one orbit, Mercury should have rotated 1.5 times (3/2)
    const expectedRotations = 1.5;
    const expectedAngle = expectedRotations * 2 * Math.PI;

    if (assertApproxEqual(result.angle % (2 * Math.PI), expectedAngle % (2 * Math.PI), 0.1, 'Mercury resonance')) {
        console.log('✅ Mercury 3:2 resonance');
        passedTests++;
    }
}

// Test 13: Libration calculation
function testLibration() {
    console.log('\nTest 13: Libration calculation');
    totalTests++;

    const eccentricity = 0.2;
    const trueAnomaly = Math.PI / 2;
    const resonance = { rotations: 3, orbits: 2 };

    const libration = calculateLibration(eccentricity, trueAnomaly, resonance);

    // For 3:2 resonance, amplitude = 2 * e * (3/2 - 1) = 2 * 0.2 * 0.5 = 0.2
    // At π/2, sin(π/2) = 1, so libration = 0.2
    const expectedLibration = 2 * eccentricity * (3/2 - 1) * Math.sin(trueAnomaly);

    if (assertApproxEqual(libration, expectedLibration, 1e-6, 'Libration')) {
        console.log('✅ Libration calculation');
        passedTests++;
    }
}

// Test 14: Solar day calculation
function testSolarDay() {
    console.log('\nTest 14: Solar day calculation');
    totalTests++;

    // Earth's solar day
    const rotPeriod = 0.99727; // Sidereal day (slightly less than 1)
    const orbPeriod = 365.25;

    const solarDay = calculateSolarDay(rotPeriod, orbPeriod);

    // Should be very close to 1 day
    if (assertApproxEqual(solarDay, 1, 0.001, 'Earth solar day')) {
        console.log('✅ Solar day calculation');
        passedTests++;
    }
}

// Test 15: Mercury's solar day
function testMercurySolarDay() {
    console.log('\nTest 15: Mercury solar day');
    totalTests++;

    const rotPeriod = 58.646;
    const orbPeriod = 87.969;

    const solarDay = calculateSolarDay(rotPeriod, orbPeriod);

    // Mercury's solar day is about 176 Earth days
    if (assertApproxEqual(solarDay, 175.938, 1, 'Mercury solar day')) {
        console.log('✅ Mercury solar day');
        passedTests++;
    }
}

// Test 16: Rotation direction
function testRotationDirection() {
    console.log('\nTest 16: Rotation direction');
    totalTests++;

    let success = getRotationDirection(1) === 'prograde';
    success = success && getRotationDirection(-1) === 'retrograde';
    success = success && getRotationDirection(0) === 'prograde';

    if (success) {
        console.log('✅ Rotation direction');
        passedTests++;
    }
}

// Test 17: Tidally locked body
function testTidallyLocked() {
    console.log('\nTest 17: Tidally locked body');
    totalTests++;

    const rotationParams = {
        period_days: 27.322, // Moon's period
        tidally_locked: true,
        axial_tilt: 1.54
    };

    const orbitalAnomaly = Math.PI / 4;
    const result = calculateBodyRotation(rotationParams, 100, orbitalAnomaly, 27.322);

    // Rotation should equal orbital anomaly for tidal lock
    if (assertApproxEqual(result.angle, orbitalAnomaly, 1e-6, 'Tidal lock')) {
        console.log('✅ Tidally locked rotation');
        passedTests++;
    }
}

// Test 18: Precession period
function testPrecessionPeriod() {
    console.log('\nTest 18: Precession period');
    totalTests++;

    const axialTilt = 23.5;
    const rotPeriod = 1;
    const orbPeriod = 365.25;

    const precession = calculatePrecessionPeriod(axialTilt, rotPeriod, orbPeriod);

    // Should be a large positive number
    let success = precession > 0;
    success = success && isFinite(precession);

    // No tilt should give infinite precession
    const noPrecession = calculatePrecessionPeriod(0, rotPeriod, orbPeriod);
    success = success && !isFinite(noPrecession);

    if (success) {
        console.log('✅ Precession period');
        passedTests++;
    }
}

// Test 19: Venus retrograde rotation
function testVenusRetrograde() {
    console.log('\nTest 19: Venus retrograde rotation');
    totalTests++;

    const rotationParams = {
        period_days: -243.025, // Negative for retrograde
        axial_tilt: 177.4 // Nearly upside down
    };

    const result = calculateBodyRotation(rotationParams, 121.5); // Half rotation period

    // Should rotate backwards
    const expectedAngle = -Math.PI;

    if (assertApproxEqual(result.angle, expectedAngle, 0.01, 'Venus retrograde')) {
        console.log('✅ Venus retrograde rotation');
        passedTests++;
    }
}

// Test 20: Identity rotation matrix
function testIdentityMatrix() {
    console.log('\nTest 20: Identity rotation matrix');
    totalTests++;

    const angle = 0; // No rotation
    const axis = new Vector3(0, 0, 1);

    const matrix = calculateRotationMatrix(angle, axis);

    // Should be identity matrix
    let success = assertApproxEqual(matrix[0], 1, 1e-6, 'Identity[0,0]');
    success = success && assertApproxEqual(matrix[4], 1, 1e-6, 'Identity[1,1]');
    success = success && assertApproxEqual(matrix[8], 1, 1e-6, 'Identity[2,2]');
    success = success && assertApproxEqual(matrix[1], 0, 1e-6, 'Identity[0,1]');

    if (success) {
        console.log('✅ Identity rotation matrix');
        passedTests++;
    }
}

// Run all tests
console.log('='.repeat(50));
console.log('Running RotationalMechanics Tests');
console.log('='.repeat(50));

testSimpleRotation();
testRetrogradeRotation();
testResonantRotation();
testTidalLockRotation();
testRotationAxisNoTilt();
testRotationAxisWithTilt();
testRotationMatrix();
testSubSolarPoint();
testSubSolarPointWithTilt();
testTerminatorLine();
testBodyRotation();
testMercuryResonance();
testLibration();
testSolarDay();
testMercurySolarDay();
testRotationDirection();
testTidallyLocked();
testPrecessionPeriod();
testVenusRetrograde();
testIdentityMatrix();

// Summary
console.log('\n' + '='.repeat(50));
console.log(`Test Results: ${passedTests}/${totalTests} passed`);
if (passedTests === totalTests) {
    console.log('🎉 All RotationalMechanics tests passed!');
} else {
    console.log(`❌ ${totalTests - passedTests} tests failed`);
    process.exit(1);
}
console.log('='.repeat(50));