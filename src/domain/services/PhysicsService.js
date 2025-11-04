/**
 * Physics Service - Business Logic Layer
 * Pure functions for orbital mechanics and physics calculations
 */

import { MERCURY_CONSTANTS, ANIMATION_CONFIG } from '../../config/constants.js';
import { validateAngle, validateEccentricity, validateTimeSpeed } from '../../infrastructure/utils/ValidationUtils.js';
import { degreesToRadians, calculateOrbitalRadius } from '../../infrastructure/utils/ThreeUtils.js';

/**
 * Calculates rotation delta for given time speed
 * @param {number} timeSpeed - Time acceleration factor
 * @returns {number} Rotation delta in degrees
 */
export function calculateRotationDelta(timeSpeed) {
  validateTimeSpeed(timeSpeed);

  const deltaTime = timeSpeed * ANIMATION_CONFIG.DELTA_TIME_MULTIPLIER;
  return deltaTime * (360 / MERCURY_CONSTANTS.SIDEREAL_DAY);
}

/**
 * Calculates orbital motion delta for given time speed
 * @param {number} timeSpeed - Time acceleration factor
 * @returns {number} Orbital angle delta in degrees
 */
export function calculateOrbitalDelta(timeSpeed) {
  validateTimeSpeed(timeSpeed);

  const deltaTime = timeSpeed * ANIMATION_CONFIG.DELTA_TIME_MULTIPLIER;
  return deltaTime * (360 / MERCURY_CONSTANTS.ORBITAL_PERIOD);
}

/**
 * Calculates Mercury's position in orbit
 * @param {number} orbitalAngle - Current orbital angle in degrees
 * @param {number} eccentricity - Orbital eccentricity
 * @param {number} semiMajorAxis - Semi-major axis length
 * @returns {{x: number, z: number}} Position in orbital plane
 */
export function calculateOrbitalPosition(orbitalAngle, eccentricity, semiMajorAxis) {
  validateAngle(orbitalAngle);
  validateEccentricity(eccentricity);

  const angleRad = degreesToRadians(orbitalAngle);
  const radius = calculateOrbitalRadius(semiMajorAxis, eccentricity, angleRad);

  return {
    x: radius * Math.cos(angleRad),
    z: radius * Math.sin(angleRad)
  };
}

/**
 * Calculates terminator speed based on orbital position
 * @param {number} orbitalAngle - Current orbital angle in degrees
 * @param {number} eccentricity - Orbital eccentricity
 * @returns {number} Terminator speed in km/h
 */
export function calculateTerminatorSpeed(orbitalAngle, eccentricity) {
  validateAngle(orbitalAngle);
  validateEccentricity(eccentricity);

  const angleRad = degreesToRadians(orbitalAngle);
  const speedMultiplier = 1 + eccentricity * Math.cos(angleRad);

  return speedMultiplier * MERCURY_CONSTANTS.TERMINATOR_SPEED;
}

/**
 * Verifies 3:2 resonance relationship
 * @param {number} rotationCount - Number of rotations
 * @param {number} orbitCount - Number of orbits
 * @returns {boolean} True if resonance is maintained
 */
export function verifyResonance(rotationCount, orbitCount) {
  if (orbitCount === 0) return true;

  const ratio = rotationCount / orbitCount;
  const expectedRatio = MERCURY_CONSTANTS.RESONANCE_RATIO;

  // Allow small tolerance for floating point
  return Math.abs(ratio - expectedRatio) < 0.01;
}

/**
 * Calculates sun elevation angle from observer position
 * @param {THREE.Vector3} sunPosition - Sun position vector
 * @param {THREE.Vector3} observerPosition - Observer position vector
 * @param {THREE.Vector3} surfaceNormal - Surface normal at observer
 * @returns {number} Sun elevation in degrees
 */
export function calculateSunElevation(sunPosition, observerPosition, surfaceNormal) {
  const sunDirection = sunPosition.clone().sub(observerPosition).normalize();
  const dotProduct = sunDirection.dot(surfaceNormal);
  const elevation = Math.asin(dotProduct);

  return elevation * 180 / Math.PI;
}

/**
 * Determines if observer is in daylight
 * @param {number} sunElevation - Sun elevation in degrees
 * @returns {boolean} True if in daylight
 */
export function isInDaylight(sunElevation) {
  return sunElevation > 0;
}

/**
 * Calculates angular velocity based on orbital parameters
 * @param {number} eccentricity - Orbital eccentricity
 * @param {number} orbitalAngle - Current orbital angle in degrees
 * @returns {number} Angular velocity factor
 */
export function calculateAngularVelocity(eccentricity, orbitalAngle) {
  validateEccentricity(eccentricity);
  validateAngle(orbitalAngle);

  const angleRad = degreesToRadians(orbitalAngle);
  return 1 + eccentricity * Math.cos(angleRad);
}
