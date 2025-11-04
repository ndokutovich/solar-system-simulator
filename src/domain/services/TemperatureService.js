/**
 * Temperature Service - Business Logic Layer
 * Pure functions for temperature calculations and color mapping
 */

import { MERCURY_CONSTANTS, TEMPERATURE_COLORS } from '../../config/constants.js';
import { validateLongitude, validateLatitude, validateTemperature } from '../../infrastructure/utils/ValidationUtils.js';
import { degreesToRadians } from '../../infrastructure/utils/ThreeUtils.js';

/**
 * Calculates temperature at given longitude and latitude
 * @param {number} longitude - Longitude in degrees
 * @param {number} latitude - Latitude in degrees
 * @returns {number} Temperature in Celsius
 */
export function calculateTemperature(longitude, latitude) {
  validateLongitude(longitude);
  validateLatitude(latitude);

  const baseTemp = calculateBaseTemperature(longitude);
  const modifiedTemp = applyLatitudeModification(baseTemp, latitude);

  return modifiedTemp;
}

/**
 * Calculates base temperature from longitude (ignoring latitude)
 * @param {number} longitude - Longitude in degrees
 * @returns {number} Base temperature in Celsius
 */
function calculateBaseTemperature(longitude) {
  const sunAngle = ((longitude + 180) % 360);
  const { MIN_TEMP, MAX_TEMP } = MERCURY_CONSTANTS;

  if (sunAngle < 85) {
    // Deep night
    return MIN_TEMP;
  } else if (sunAngle < 95) {
    // Morning terminator
    const factor = (sunAngle - 85) / 10;
    return MIN_TEMP + factor * 60;
  } else if (sunAngle < 265) {
    // Daytime - sinusoidal variation
    const dayAngle = ((sunAngle - 95) / 170) * Math.PI;
    return 200 + 227 * Math.sin(dayAngle);
  } else if (sunAngle < 275) {
    // Evening terminator
    const factor = (sunAngle - 265) / 10;
    return MAX_TEMP - factor * 60;
  } else {
    // Night
    return MIN_TEMP;
  }
}

/**
 * Applies latitude modification to temperature
 * @param {number} baseTemp - Base temperature
 * @param {number} latitude - Latitude in degrees
 * @returns {number} Modified temperature
 */
function applyLatitudeModification(baseTemp, latitude) {
  const latRad = degreesToRadians(latitude);
  const latFactor = Math.cos(latRad);

  // Poles are cooler
  return baseTemp * latFactor + (1 - latFactor) * (-100);
}

/**
 * Converts temperature to RGB color string
 * @param {number} temperature - Temperature in Celsius
 * @returns {string} RGB color string "rgb(r, g, b)"
 */
export function temperatureToColor(temperature) {
  validateTemperature(temperature);

  const normalized = normalizeTemperature(temperature);

  if (normalized < TEMPERATURE_COLORS.DEEP_COLD) {
    return deepColdColor(normalized);
  } else if (normalized < TEMPERATURE_COLORS.COLD_TO_MODERATE) {
    return coldToModerateColor(normalized);
  } else if (normalized < TEMPERATURE_COLORS.COMFORT_ZONE) {
    return comfortZoneColor(normalized);
  } else if (normalized < TEMPERATURE_COLORS.WARM) {
    return warmColor(normalized);
  } else {
    return hotColor(normalized);
  }
}

/**
 * Normalizes temperature to 0-1 range
 * @param {number} temp - Temperature in Celsius
 * @returns {number} Normalized value (0-1)
 */
function normalizeTemperature(temp) {
  const { MIN_TEMP, TEMP_RANGE } = MERCURY_CONSTANTS;
  return (temp - MIN_TEMP) / TEMP_RANGE;
}

/**
 * Deep cold color (blue)
 * @param {number} normalized - Normalized temperature
 * @returns {string} RGB color
 */
function deepColdColor(normalized) {
  const blue = Math.floor(TEMPERATURE_COLORS.BASE_BLUE + normalized * 400);
  return `rgb(0, 0, ${blue})`;
}

/**
 * Cold to moderate transition (blue to green)
 * @param {number} normalized - Normalized temperature
 * @returns {string} RGB color
 */
function coldToModerateColor(normalized) {
  const factor = (normalized - TEMPERATURE_COLORS.DEEP_COLD) / 0.16;
  const green = Math.floor(factor * 255);
  const blue = Math.floor(255 * (1 - factor));
  return `rgb(0, ${green}, ${blue})`;
}

/**
 * Comfort zone color (green to yellow)
 * @param {number} normalized - Normalized temperature
 * @returns {string} RGB color
 */
function comfortZoneColor(normalized) {
  const factor = (normalized - TEMPERATURE_COLORS.COLD_TO_MODERATE) / 0.09;
  const red = Math.floor(factor * 255);
  return `rgb(${red}, 255, 0)`;
}

/**
 * Warm color (yellow to orange)
 * @param {number} normalized - Normalized temperature
 * @returns {string} RGB color
 */
function warmColor(normalized) {
  const factor = (normalized - TEMPERATURE_COLORS.COMFORT_ZONE) / 0.25;
  const green = Math.floor(255 * (1 - factor * 0.5));
  return `rgb(255, ${green}, 0)`;
}

/**
 * Hot color (orange to red)
 * @param {number} normalized - Normalized temperature
 * @returns {string} RGB color
 */
function hotColor(normalized) {
  const factor = (normalized - TEMPERATURE_COLORS.WARM) / 0.33;
  const green = Math.floor(128 * (1 - factor));
  return `rgb(255, ${green}, 0)`;
}

/**
 * Determines if temperature is in comfort zone
 * @param {number} temperature - Temperature in Celsius
 * @returns {boolean} True if in comfort zone (0-50°C)
 */
export function isComfortZone(temperature) {
  return temperature >= 0 && temperature <= 50;
}

/**
 * Determines if temperature is extreme
 * @param {number} temperature - Temperature in Celsius
 * @returns {boolean} True if extreme (<-100°C or >300°C)
 */
export function isExtremeTemperature(temperature) {
  return temperature < -100 || temperature > 300;
}

/**
 * Gets temperature description
 * @param {number} temperature - Temperature in Celsius
 * @returns {string} Description of temperature
 */
export function getTemperatureDescription(temperature) {
  if (temperature < -150) return 'Глубокая ночь';
  if (temperature < 0) return 'Холод';
  if (isComfortZone(temperature)) return 'Комфортная зона';
  if (temperature < 200) return 'Тепло';
  if (temperature < 350) return 'Жарко';
  return 'Экстремальная жара';
}
