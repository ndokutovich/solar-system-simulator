/**
 * Mercury Model - Domain Entity
 * Represents the state and properties of Mercury planet
 */

import { MERCURY_CONSTANTS } from '../../config/constants.js';
import { validateAngle, validateEccentricity } from '../../infrastructure/utils/ValidationUtils.js';

/**
 * Creates a new Mercury state object
 * @returns {MercuryState} Initial Mercury state
 */
export function createMercuryState() {
  return {
    rotation: 0,           // Current rotation angle (degrees)
    orbitalAngle: 0,       // Current orbital position (degrees)
    eccentricity: MERCURY_CONSTANTS.ECCENTRICITY,
    isAnimating: true,
    timeSpeed: 1
  };
}

/**
 * Updates Mercury's rotation angle
 * @param {MercuryState} state - Current state
 * @param {number} deltaAngle - Angle change in degrees
 * @returns {MercuryState} Updated state
 */
export function updateRotation(state, deltaAngle) {
  validateAngle(deltaAngle);

  return {
    ...state,
    rotation: (state.rotation + deltaAngle) % 360
  };
}

/**
 * Updates Mercury's orbital position
 * @param {MercuryState} state - Current state
 * @param {number} deltaAngle - Angle change in degrees
 * @returns {MercuryState} Updated state
 */
export function updateOrbitalPosition(state, deltaAngle) {
  validateAngle(deltaAngle);

  return {
    ...state,
    orbitalAngle: (state.orbitalAngle + deltaAngle) % 360
  };
}

/**
 * Sets Mercury's eccentricity
 * @param {MercuryState} state - Current state
 * @param {number} eccentricity - New eccentricity value
 * @returns {MercuryState} Updated state
 */
export function setEccentricity(state, eccentricity) {
  const validated = validateEccentricity(eccentricity);

  return {
    ...state,
    eccentricity: validated
  };
}

/**
 * Toggles animation state
 * @param {MercuryState} state - Current state
 * @returns {MercuryState} Updated state
 */
export function toggleAnimation(state) {
  return {
    ...state,
    isAnimating: !state.isAnimating
  };
}

/**
 * Sets time speed
 * @param {MercuryState} state - Current state
 * @param {number} speed - New time speed
 * @returns {MercuryState} Updated state
 */
export function setTimeSpeed(state, speed) {
  if (speed < 0) {
    throw new Error(`Time speed cannot be negative: ${speed}`);
  }

  return {
    ...state,
    timeSpeed: speed
  };
}

/**
 * Resets Mercury state to initial values
 * @returns {MercuryState} Reset state
 */
export function resetMercuryState() {
  return createMercuryState();
}

/**
 * Calculates Mercury's day number
 * @param {number} rotation - Current rotation in degrees
 * @returns {number} Day number (1-176)
 */
export function calculateMercuryDay(rotation) {
  const normalizedRotation = rotation % 360;
  return Math.floor((normalizedRotation / 360) * MERCURY_CONSTANTS.SOLAR_DAY) + 1;
}

/**
 * Calculates Mercury's year day
 * @param {number} orbitalAngle - Current orbital angle in degrees
 * @returns {number} Year day number (1-88)
 */
export function calculateMercuryYearDay(orbitalAngle) {
  const normalizedAngle = orbitalAngle % 360;
  return Math.floor((normalizedAngle / 360) * MERCURY_CONSTANTS.ORBITAL_PERIOD) + 1;
}

/**
 * Calculates number of complete rotations
 * @param {number} rotation - Total rotation in degrees
 * @returns {number} Number of complete rotations
 */
export function calculateRotationCount(rotation) {
  return Math.floor(rotation / 360);
}

/**
 * Calculates number of complete orbits
 * @param {number} orbitalAngle - Total orbital angle in degrees
 * @returns {number} Number of complete orbits
 */
export function calculateOrbitCount(orbitalAngle) {
  return Math.floor(orbitalAngle / 360);
}

/**
 * Calculates local time on Mercury
 * @param {number} rotation - Current rotation in degrees
 * @returns {string} Local time in format "HH:mm"
 */
export function calculateLocalTime(rotation) {
  const hours = ((rotation / 15) % 24).toFixed(1);
  return `${hours}:00`;
}
