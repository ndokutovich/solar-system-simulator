/**
 * Simple test runner for CoordinateTransforms
 * Run with: node test_coordinates.js
 */

import {
  Vector3,
  Matrix4,
  sphericalToBodyFixed,
  bodyFixedToSpherical,
  getSunDirectionInBodyFrame,
  calculateSunAngle,
  findSubsolarPoint
} from './src/domain/services/CoordinateTransforms.js';
import { CELESTIAL_BODIES } from './src/config/celestialBodies.js';

// Test utilities
let testCount = 0;
let passCount = 0;

function assert(condition, message) {
  testCount++;
  if (condition) {
    passCount++;
    console.log(`✅ ${message}`);
  } else {
    console.error(`❌ ${message}`);
  }
}

function approximately(a, b, epsilon = 0.001) {
  return Math.abs(a - b) < epsilon;
}

// Run tests
console.log('=== CoordinateTransforms Test Suite ===\n');

// Test 1: Vector3 operations
console.log('Testing Vector3...');
{
  const v1 = new Vector3(1, 2, 3);
  const v2 = new Vector3(4, 5, 6);

  const sum = v1.add(v2);
  assert(sum.x === 5 && sum.y === 7 && sum.z === 9, 'Vector3 addition');

  const diff = v2.subtract(v1);
  assert(diff.x === 3 && diff.y === 3 && diff.z === 3, 'Vector3 subtraction');

  const scaled = v1.multiply(2);
  assert(scaled.x === 2 && scaled.y === 4 && scaled.z === 6, 'Vector3 scalar multiplication');

  const normalized = new Vector3(3, 0, 4).normalize();
  assert(approximately(normalized.x, 0.6) && approximately(normalized.z, 0.8), 'Vector3 normalization');

  const dot = v1.dot(v2);
  assert(dot === 32, 'Vector3 dot product');
}

// Test 2: Spherical to body-fixed conversion
console.log('\nTesting spherical conversions...');
{
  // lon=0, lat=0 should be on +X axis (equator, prime meridian)
  const p1 = sphericalToBodyFixed(0, 0, 1);
  assert(approximately(p1.x, 1) && approximately(p1.y, 0) && approximately(p1.z, 0),
    'lon=0°, lat=0° → +X axis');

  // lon=90, lat=0 should be on +Z axis (equator, 90° east)
  const p2 = sphericalToBodyFixed(90, 0, 1);
  assert(approximately(p2.x, 0) && approximately(p2.y, 0) && approximately(p2.z, 1),
    'lon=90°, lat=0° → +Z axis');

  // lon=0, lat=90 should be on +Y axis (north pole)
  const p3 = sphericalToBodyFixed(0, 90, 1);
  assert(approximately(p3.x, 0) && approximately(p3.y, 1) && approximately(p3.z, 0),
    'lon=0°, lat=90° → +Y axis (north pole)');

  // lon=180, lat=0 should be on -X axis
  const p4 = sphericalToBodyFixed(180, 0, 1);
  assert(approximately(p4.x, -1) && approximately(p4.y, 0) && approximately(p4.z, 0),
    'lon=180°, lat=0° → -X axis');

  // Round-trip test
  const original = { longitude: 45, latitude: 30, radius: 2 };
  const bodyFixed = sphericalToBodyFixed(original.longitude, original.latitude, original.radius);
  const converted = bodyFixedToSpherical(bodyFixed);
  assert(
    approximately(converted.longitude, original.longitude) &&
    approximately(converted.latitude, original.latitude) &&
    approximately(converted.radius, original.radius),
    'Round-trip spherical ↔ body-fixed conversion'
  );
}

// Test 3: Matrix4 operations
console.log('\nTesting Matrix4...');
{
  // Identity matrix
  const identity = Matrix4.identity();
  const v = new Vector3(1, 2, 3);
  const transformed = identity.applyToVector3(v);
  assert(transformed.x === 1 && transformed.y === 2 && transformed.z === 3,
    'Identity matrix leaves vector unchanged');

  // Translation
  const translation = Matrix4.translation(10, 20, 30);
  const translated = translation.applyToVector3(new Vector3(1, 2, 3));
  assert(translated.x === 11 && translated.y === 22 && translated.z === 33,
    'Translation matrix');

  // Rotation around Y axis (90 degrees)
  const rotation = Matrix4.rotationY(Math.PI / 2);
  const rotated = rotation.applyToVector3(new Vector3(1, 0, 0));
  assert(approximately(rotated.x, 0) && approximately(rotated.z, -1),
    'Rotation around Y axis');
}

// Test 4: Sun direction calculation (CRITICAL TEST)
console.log('\nTesting sun direction in body frame...');
{
  // Mock Mercury
  const mercury = {
    id: 'mercury',
    name: 'Mercury',
    rotation: {
      period_days: 58.646,
      axial_tilt: 0.034
    }
  };

  // Mock functions
  const getBodyWorldPosition = (body, time) => new Vector3(15, 0, 0); // Mercury at (15,0,0)
  const sunWorldPos = new Vector3(0, 0, 0); // Sun at origin

  // At time=0, with no rotation
  const sunDir = getSunDirectionInBodyFrame(mercury, 0, sunWorldPos, getBodyWorldPosition);

  // Sun is at -X direction from Mercury
  // In body-fixed frame (no rotation), should also be -X
  assert(approximately(sunDir.x, -1) && approximately(sunDir.y, 0) && approximately(sunDir.z, 0),
    'Sun direction in body frame (Mercury at +X, sun at origin)');

  // Test sun angle calculation
  // Subsolar point should have angle = 0°
  const subsolarAngle = calculateSunAngle(180, 0, mercury, 0, sunWorldPos, getBodyWorldPosition);
  assert(approximately(subsolarAngle, 0, 5),
    'Subsolar point has sun angle ≈ 0°');

  // Antisolar point should have angle = 180°
  const antisolarAngle = calculateSunAngle(0, 0, mercury, 0, sunWorldPos, getBodyWorldPosition);
  assert(approximately(antisolarAngle, 180, 5),
    'Antisolar point has sun angle ≈ 180°');

  // Terminator should have angle ≈ 90°
  const terminatorAngle = calculateSunAngle(90, 0, mercury, 0, sunWorldPos, getBodyWorldPosition);
  assert(approximately(terminatorAngle, 90, 5),
    'Terminator has sun angle ≈ 90°');
}

// Test 5: Find subsolar point
console.log('\nTesting subsolar point calculation...');
{
  const earth = {
    id: 'earth',
    name: 'Earth',
    rotation: {
      period_days: 1,
      axial_tilt: 23.4
    }
  };

  const getBodyWorldPosition = (body, time) => new Vector3(100, 0, 0);
  const sunWorldPos = new Vector3(0, 0, 0);

  const subsolar = findSubsolarPoint(earth, 0, sunWorldPos, getBodyWorldPosition);
  console.log(`  Subsolar point: lon=${subsolar.longitude.toFixed(1)}°, lat=${subsolar.latitude.toFixed(1)}°`);

  // Subsolar longitude should be approximately 180° (facing sun at -X)
  assert(approximately(Math.abs(subsolar.longitude), 180, 10),
    'Subsolar point longitude ≈ ±180°');
}

// Summary
console.log('\n=== Test Results ===');
console.log(`Passed: ${passCount}/${testCount}`);
console.log(`Success rate: ${(passCount / testCount * 100).toFixed(1)}%`);

if (passCount === testCount) {
  console.log('\n🎉 All tests passed!');
  console.log('The coordinate transform system is working correctly.');
  console.log('This should fix the temperature map rotation issue from Mercury!');
} else {
  console.log('\n⚠️ Some tests failed. Review the implementation.');
}