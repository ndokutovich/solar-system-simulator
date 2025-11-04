/**
 * Validation Utilities
 * Fail-fast validation for all inputs
 */

import { ERROR_MESSAGES } from '../../config/constants.js';

/**
 * Validates that a value is a number and not NaN
 */
export function validateNumber(value, name = 'value') {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new Error(`Invalid number for ${name}: ${value}`);
  }
  return true;
}

/**
 * Validates that a value is a finite number
 */
export function validateFiniteNumber(value, name = 'value') {
  validateNumber(value, name);
  if (!isFinite(value)) {
    throw new Error(`${name} must be finite: ${value}`);
  }
  return true;
}

/**
 * Validates that a value is a positive number
 */
export function validatePositiveNumber(value, name = 'value') {
  validateNumber(value, name);
  if (value <= 0) {
    throw new Error(`${name} must be positive: ${value}`);
  }
  return true;
}

/**
 * Validates that a value is within a range
 */
export function validateRange(value, min, max, name = 'value') {
  validateNumber(value, name);
  if (value < min || value > max) {
    throw new Error(`${name} out of range [${min}, ${max}]: ${value}`);
  }
  return true;
}

/**
 * Validates longitude (-180 to 180 degrees)
 */
export function validateLongitude(longitude) {
  validateNumber(longitude, 'longitude');
  if (longitude < -180 || longitude > 180) {
    throw new Error(ERROR_MESSAGES.INVALID_COORDINATES(null, longitude));
  }
  return true;
}

/**
 * Validates latitude (-90 to 90 degrees)
 */
export function validateLatitude(latitude) {
  validateNumber(latitude, 'latitude');
  if (latitude < -90 || latitude > 90) {
    throw new Error(ERROR_MESSAGES.INVALID_COORDINATES(latitude, null));
  }
  return true;
}

/**
 * Validates a Vector3 object
 */
export function validateVector3(vector, name = 'vector') {
  if (!vector || typeof vector !== 'object') {
    throw new Error(`Invalid Vector3 for ${name}: ${vector}`);
  }
  validateNumber(vector.x, `${name}.x`);
  validateNumber(vector.y, `${name}.y`);
  validateNumber(vector.z, `${name}.z`);
  return true;
}

/**
 * Validates a celestial body object
 */
export function validateCelestialBody(body) {
  if (!body || typeof body !== 'object') {
    throw new Error(`Invalid celestial body: ${body}`);
  }
  if (!body.id || typeof body.id !== 'string') {
    throw new Error(`Celestial body missing valid id: ${body.id}`);
  }
  return true;
}

/**
 * Validates time value (must be positive)
 */
export function validateTime(time) {
  validateNumber(time, 'time');
  if (time < 0) {
    throw new Error(ERROR_MESSAGES.INVALID_TIME(time));
  }
  return true;
}

/**
 * Validates scale mode
 */
export function validateScaleMode(mode) {
  const validModes = ['realistic', 'visible'];
  if (!validModes.includes(mode)) {
    throw new Error(ERROR_MESSAGES.INVALID_SCALE_MODE(mode));
  }
  return true;
}

/**
 * Validates DOM element exists
 */
export function validateDOMElement(id) {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(ERROR_MESSAGES.ELEMENT_NOT_FOUND(id));
  }
  return element;
}

/**
 * Validates WebGL support
 */
export function validateWebGLSupport() {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

  if (!gl) {
    throw new Error(ERROR_MESSAGES.WEBGL_NOT_SUPPORTED);
  }

  return true;
}

/**
 * Validates Three.js is loaded
 */
export function validateThreeJS() {
  // Check if THREE is available globally (loaded via script tag)
  if (typeof window !== 'undefined' && typeof window.THREE !== 'undefined') {
    return true;
  }
  if (typeof THREE === 'undefined') {
    throw new Error(ERROR_MESSAGES.THREE_NOT_LOADED);
  }
  return true;
}

/**
 * Validates an array is not empty
 */
export function validateNonEmptyArray(array, name = 'array') {
  if (!Array.isArray(array)) {
    throw new Error(`${name} must be an array: ${array}`);
  }
  if (array.length === 0) {
    throw new Error(`${name} cannot be empty`);
  }
  return true;
}

/**
 * Validates a string is not empty
 */
export function validateNonEmptyString(str, name = 'string') {
  if (typeof str !== 'string') {
    throw new Error(`${name} must be a string: ${str}`);
  }
  if (str.trim().length === 0) {
    throw new Error(`${name} cannot be empty`);
  }
  return true;
}

/**
 * Validates orbital parameters
 */
export function validateOrbitalParameters(orbital) {
  if (!orbital) return false;

  if (orbital.semi_major_axis_au !== undefined) {
    validateFiniteNumber(orbital.semi_major_axis_au, 'semi_major_axis_au');
    validateRange(orbital.semi_major_axis_au, 0, 1000, 'semi_major_axis_au');
  }

  if (orbital.semi_major_axis_km !== undefined) {
    validateFiniteNumber(orbital.semi_major_axis_km, 'semi_major_axis_km');
    validateRange(orbital.semi_major_axis_km, 0, 10000000, 'semi_major_axis_km');
  }

  if (orbital.eccentricity !== undefined) {
    validateRange(orbital.eccentricity, 0, 1, 'eccentricity');
  }

  if (orbital.inclination !== undefined) {
    validateRange(orbital.inclination, 0, 180, 'inclination');
  }

  if (orbital.period_days !== undefined) {
    validateFiniteNumber(orbital.period_days, 'period_days');
    if (orbital.period_days <= 0) {
      throw new Error(`Orbital period must be positive: ${orbital.period_days}`);
    }
  }

  return true;
}

/**
 * Validates rotation parameters
 */
export function validateRotationParameters(rotation) {
  if (!rotation) return false;

  if (rotation.period_days !== undefined) {
    validateFiniteNumber(rotation.period_days, 'period_days');
    // Note: Can be negative for retrograde rotation
  }

  if (rotation.axial_tilt !== undefined) {
    validateRange(rotation.axial_tilt, 0, 180, 'axial_tilt');
  }

  return true;
}

/**
 * Validates temperature parameters
 */
export function validateTemperatureParameters(temperature) {
  if (!temperature) return false;

  if (temperature.min_c !== undefined) {
    validateFiniteNumber(temperature.min_c, 'min_c');
    validateRange(temperature.min_c, -273.15, 6000, 'min_c');
  }

  if (temperature.max_c !== undefined) {
    validateFiniteNumber(temperature.max_c, 'max_c');
    validateRange(temperature.max_c, -273.15, 6000, 'max_c');
  }

  if (temperature.min_c !== undefined && temperature.max_c !== undefined) {
    if (temperature.min_c > temperature.max_c) {
      throw new Error(`Min temperature (${temperature.min_c}) cannot be greater than max (${temperature.max_c})`);
    }
  }

  return true;
}