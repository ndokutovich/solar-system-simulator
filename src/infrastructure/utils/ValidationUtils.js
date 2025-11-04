/**
 * Validation Utilities - Fail Fast Approach
 * All validations throw immediately with clear error messages
 */

import { ERROR_MESSAGES, SURFACE_NAVIGATION } from '../../config/constants.js';

/**
 * Validates that Three.js library is loaded
 * @throws {Error} If THREE is not defined
 */
export function validateThreeJS() {
  if (typeof THREE === 'undefined') {
    throw new Error(ERROR_MESSAGES.THREE_NOT_LOADED);
  }
}

/**
 * Validates that a DOM element exists
 * @param {string} elementId - The ID of the element to validate
 * @returns {HTMLElement} The validated element
 * @throws {Error} If element is not found
 */
export function validateElement(elementId) {
  if (!elementId) {
    throw new Error('Element ID is required');
  }

  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(ERROR_MESSAGES.ELEMENT_NOT_FOUND(elementId));
  }

  return element;
}

/**
 * Validates temperature value is within valid range
 * @param {number} temperature - Temperature in Celsius
 * @returns {number} The validated temperature
 * @throws {Error} If temperature is invalid
 */
export function validateTemperature(temperature) {
  if (typeof temperature !== 'number' || !isFinite(temperature)) {
    throw new Error(ERROR_MESSAGES.INVALID_TEMPERATURE(temperature));
  }
  return temperature;
}

/**
 * Validates latitude coordinate
 * @param {number} latitude - Latitude in degrees
 * @returns {number} The validated latitude
 * @throws {Error} If latitude is invalid
 */
export function validateLatitude(latitude) {
  if (typeof latitude !== 'number' || !isFinite(latitude)) {
    throw new Error(`Invalid latitude: ${latitude}`);
  }

  if (latitude < SURFACE_NAVIGATION.LAT_MIN || latitude > SURFACE_NAVIGATION.LAT_MAX) {
    throw new Error(`Latitude out of range: ${latitude} (must be -90 to 90)`);
  }

  return latitude;
}

/**
 * Validates longitude coordinate
 * @param {number} longitude - Longitude in degrees
 * @returns {number} The validated longitude
 * @throws {Error} If longitude is invalid
 */
export function validateLongitude(longitude) {
  if (typeof longitude !== 'number' || !isFinite(longitude)) {
    throw new Error(`Invalid longitude: ${longitude}`);
  }

  return longitude;
}

/**
 * Validates geographic coordinates
 * @param {number} lat - Latitude in degrees
 * @param {number} lon - Longitude in degrees
 * @returns {{lat: number, lon: number}} The validated coordinates
 * @throws {Error} If coordinates are invalid
 */
export function validateCoordinates(lat, lon) {
  try {
    const validLat = validateLatitude(lat);
    const validLon = validateLongitude(lon);
    return { lat: validLat, lon: validLon };
  } catch (error) {
    throw new Error(ERROR_MESSAGES.INVALID_COORDINATES(lat, lon));
  }
}

/**
 * Validates time speed value
 * @param {number} speed - Time speed multiplier
 * @returns {number} The validated speed
 * @throws {Error} If speed is invalid
 */
export function validateTimeSpeed(speed) {
  if (typeof speed !== 'number' || !isFinite(speed) || speed < 0) {
    throw new Error(ERROR_MESSAGES.INVALID_TIME_SPEED(speed));
  }
  return speed;
}

/**
 * Validates eccentricity value
 * @param {number} eccentricity - Orbital eccentricity (0-1)
 * @returns {number} The validated eccentricity
 * @throws {Error} If eccentricity is invalid
 */
export function validateEccentricity(eccentricity) {
  if (typeof eccentricity !== 'number' || !isFinite(eccentricity)) {
    throw new Error(`Invalid eccentricity: ${eccentricity}`);
  }

  if (eccentricity < 0 || eccentricity > 1) {
    throw new Error(`Eccentricity out of range: ${eccentricity} (must be 0-1)`);
  }

  return eccentricity;
}

/**
 * Validates that WebGL is supported
 * @throws {Error} If WebGL is not supported
 */
export function validateWebGLSupport() {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

  if (!gl) {
    throw new Error(ERROR_MESSAGES.WEBGL_NOT_SUPPORTED);
  }
}

/**
 * Validates a THREE.Vector3 object
 * @param {THREE.Vector3} vector - The vector to validate
 * @returns {THREE.Vector3} The validated vector
 * @throws {Error} If vector is invalid
 */
export function validateVector3(vector) {
  if (!vector || typeof vector.x !== 'number' || typeof vector.y !== 'number' || typeof vector.z !== 'number') {
    throw new Error('Invalid Vector3 object');
  }
  return vector;
}

/**
 * Validates an angle in degrees
 * @param {number} angle - Angle in degrees
 * @returns {number} The validated angle
 * @throws {Error} If angle is invalid
 */
export function validateAngle(angle) {
  if (typeof angle !== 'number' || !isFinite(angle)) {
    throw new Error(`Invalid angle: ${angle}`);
  }
  return angle;
}
