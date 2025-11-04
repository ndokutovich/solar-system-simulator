/**
 * Observer Model - Domain Entity
 * Represents an observer on Mercury's surface
 */

import { SURFACE_NAVIGATION } from '../../config/constants.js';
import { validateCoordinates, validateLatitude } from '../../infrastructure/utils/ValidationUtils.js';
import { clampLatitude, normalizeLongitude } from '../../infrastructure/utils/ThreeUtils.js';

/**
 * Creates a new observer state
 * @param {number} lat - Initial latitude (default: 0)
 * @param {number} lon - Initial longitude (default: 0)
 * @returns {ObserverState} Observer state object
 */
export function createObserver(lat = 0, lon = 0) {
  const coords = validateCoordinates(lat, lon);

  return {
    latitude: coords.lat,
    longitude: coords.lon
  };
}

/**
 * Moves observer north
 * @param {ObserverState} observer - Current observer state
 * @param {number} degrees - Degrees to move (default: MOVE_SPEED_DEGREES)
 * @returns {ObserverState} Updated observer state
 */
export function moveNorth(observer, degrees = SURFACE_NAVIGATION.MOVE_SPEED_DEGREES) {
  const newLat = clampLatitude(observer.latitude + degrees);

  return {
    ...observer,
    latitude: newLat
  };
}

/**
 * Moves observer south
 * @param {ObserverState} observer - Current observer state
 * @param {number} degrees - Degrees to move (default: MOVE_SPEED_DEGREES)
 * @returns {ObserverState} Updated observer state
 */
export function moveSouth(observer, degrees = SURFACE_NAVIGATION.MOVE_SPEED_DEGREES) {
  const newLat = clampLatitude(observer.latitude - degrees);

  return {
    ...observer,
    latitude: newLat
  };
}

/**
 * Moves observer west
 * @param {ObserverState} observer - Current observer state
 * @param {number} degrees - Degrees to move (default: MOVE_SPEED_DEGREES)
 * @returns {ObserverState} Updated observer state
 */
export function moveWest(observer, degrees = SURFACE_NAVIGATION.MOVE_SPEED_DEGREES) {
  const newLon = normalizeLongitude(observer.longitude - degrees);

  return {
    ...observer,
    longitude: newLon
  };
}

/**
 * Moves observer east
 * @param {ObserverState} observer - Current observer state
 * @param {number} degrees - Degrees to move (default: MOVE_SPEED_DEGREES)
 * @returns {ObserverState} Updated observer state
 */
export function moveEast(observer, degrees = SURFACE_NAVIGATION.MOVE_SPEED_DEGREES) {
  const newLon = normalizeLongitude(observer.longitude + degrees);

  return {
    ...observer,
    longitude: newLon
  };
}

/**
 * Sets observer position to specific coordinates
 * @param {ObserverState} observer - Current observer state
 * @param {number} lat - New latitude
 * @param {number} lon - New longitude
 * @returns {ObserverState} Updated observer state
 */
export function setPosition(observer, lat, lon) {
  const coords = validateCoordinates(lat, lon);

  return {
    latitude: coords.lat,
    longitude: coords.lon
  };
}

/**
 * Moves observer to hot pole (subsolar longitude)
 * @returns {ObserverState} Observer at hot pole
 */
export function moveToHotPole() {
  return createObserver(0, 0);
}

/**
 * Moves observer to warm pole (90° longitude)
 * @returns {ObserverState} Observer at warm pole
 */
export function moveToWarmPole() {
  return createObserver(0, 90);
}

/**
 * Gets formatted coordinate string
 * @param {ObserverState} observer - Observer state
 * @returns {string} Formatted coordinates
 */
export function getCoordinateString(observer) {
  return `${observer.latitude.toFixed(1)}° с.ш., ${observer.longitude.toFixed(1)}° в.д.`;
}
