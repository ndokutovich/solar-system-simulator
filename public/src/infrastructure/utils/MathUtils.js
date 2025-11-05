/**
 * Mathematical Utilities
 * Common math functions and constants
 */

// Mathematical constants
export const TWO_PI = Math.PI * 2;
export const HALF_PI = Math.PI / 2;
export const DEG_TO_RAD = Math.PI / 180;
export const RAD_TO_DEG = 180 / Math.PI;

/**
 * Converts degrees to radians
 */
export function degreesToRadians(degrees) {
  return degrees * DEG_TO_RAD;
}

/**
 * Converts radians to degrees
 */
export function radiansToDegrees(radians) {
  return radians * RAD_TO_DEG;
}

/**
 * Normalizes an angle to 0-360 range
 */
export function normalizeAngle(angle) {
  angle = angle % 360;
  if (angle < 0) angle += 360;
  return angle;
}

/**
 * Normalizes an angle to -180 to 180 range
 */
export function normalizeAngleSigned(angle) {
  angle = normalizeAngle(angle);
  if (angle > 180) angle -= 360;
  return angle;
}

/**
 * Clamps a value between min and max
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation
 */
export function lerp(start, end, t) {
  return start + (end - start) * t;
}

/**
 * Smooth step interpolation
 */
export function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/**
 * Cosine interpolation (smoother than linear)
 */
export function cosineInterpolate(start, end, t) {
  const t2 = (1 - Math.cos(t * Math.PI)) / 2;
  return start * (1 - t2) + end * t2;
}

/**
 * Cubic ease-in-out
 */
export function easeInOutCubic(t) {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Maps a value from one range to another
 */
export function mapRange(value, inMin, inMax, outMin, outMax) {
  return ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
}

/**
 * Calculates distance between two 3D points
 */
export function distance3D(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dz = p2.z - p1.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Calculates distance between two 2D points
 */
export function distance2D(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Solves quadratic equation ax² + bx + c = 0
 * Returns array of real solutions
 */
export function solveQuadratic(a, b, c) {
  const discriminant = b * b - 4 * a * c;

  if (discriminant < 0) {
    return []; // No real solutions
  } else if (discriminant === 0) {
    return [-b / (2 * a)]; // One solution
  } else {
    const sqrtDiscriminant = Math.sqrt(discriminant);
    return [
      (-b + sqrtDiscriminant) / (2 * a),
      (-b - sqrtDiscriminant) / (2 * a)
    ];
  }
}

/**
 * Calculates logarithmic scale value
 * Useful for planet size scaling
 */
export function logScale(value, base = 10) {
  return Math.log(value) / Math.log(base);
}

/**
 * Calculates power scale value
 * Useful for distance scaling
 */
export function powerScale(value, exponent = 0.5) {
  return Math.pow(value, exponent);
}

/**
 * Generates a random number in range
 */
export function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * Generates a random integer in range (inclusive)
 */
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Calculates modulo (always positive)
 */
export function mod(n, m) {
  return ((n % m) + m) % m;
}

/**
 * Checks if two numbers are approximately equal
 */
export function approximately(a, b, epsilon = 0.00001) {
  return Math.abs(a - b) < epsilon;
}

/**
 * Calculates the mean of an array of numbers
 */
export function mean(numbers) {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

/**
 * Calculates the standard deviation of an array of numbers
 */
export function standardDeviation(numbers) {
  const avg = mean(numbers);
  const squareDiffs = numbers.map(n => Math.pow(n - avg, 2));
  const avgSquareDiff = mean(squareDiffs);
  return Math.sqrt(avgSquareDiff);
}

/**
 * Converts temperature from Celsius to Fahrenheit
 */
export function celsiusToFahrenheit(celsius) {
  return celsius * 9 / 5 + 32;
}

/**
 * Converts temperature from Celsius to Kelvin
 */
export function celsiusToKelvin(celsius) {
  return celsius + 273.15;
}

/**
 * Converts temperature from Kelvin to Celsius
 */
export function kelvinToCelsius(kelvin) {
  return kelvin - 273.15;
}

/**
 * Calculates great circle distance between two points on a sphere
 * (Haversine formula)
 */
export function greatCircleDistance(lat1, lon1, lat2, lon2, radius) {
  const lat1Rad = degreesToRadians(lat1);
  const lat2Rad = degreesToRadians(lat2);
  const deltaLat = degreesToRadians(lat2 - lat1);
  const deltaLon = degreesToRadians(lon2 - lon1);

  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1Rad) * Math.cos(lat2Rad) *
            Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return radius * c;
}

/**
 * Calculates bearing from point 1 to point 2 on a sphere
 */
export function calculateBearing(lat1, lon1, lat2, lon2) {
  const lat1Rad = degreesToRadians(lat1);
  const lat2Rad = degreesToRadians(lat2);
  const deltaLon = degreesToRadians(lon2 - lon1);

  const x = Math.sin(deltaLon) * Math.cos(lat2Rad);
  const y = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
            Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(deltaLon);

  const bearing = Math.atan2(x, y);
  return normalizeAngle(radiansToDegrees(bearing));
}