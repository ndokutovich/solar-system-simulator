/**
 * RotationalMechanics.js
 *
 * Service for calculating rotational dynamics of celestial bodies
 * Handles simple rotation, spin-orbit resonances, and axial tilt
 */

import { validateNumber, validatePositiveNumber } from '../../infrastructure/utils/ValidationUtils.js';
import { Vector3 } from './CoordinateTransforms.js';

// Constants
const TWO_PI = 2 * Math.PI;

/**
 * Calculate rotation angle for a simple rotating body
 *
 * @param {number} time - Time in days
 * @param {number} rotationPeriod - Rotation period in days
 * @returns {number} Rotation angle in radians
 */
export function calculateSimpleRotation(time, rotationPeriod) {
    validateNumber(time, 'time');
    validateNumber(rotationPeriod, 'rotationPeriod');

    if (rotationPeriod === 0) {
        throw new Error('Rotation period cannot be zero');
    }

    // Negative period indicates retrograde rotation
    const angle = (time / Math.abs(rotationPeriod)) * TWO_PI;

    // Apply retrograde direction if needed
    return rotationPeriod < 0 ? -angle : angle;
}

/**
 * Calculate rotation angle for a body in spin-orbit resonance
 *
 * @param {number} orbitalAnomaly - True anomaly in radians
 * @param {number} orbitalPeriod - Orbital period in days
 * @param {number} resonance - Resonance object { rotations, orbits }
 * @param {number} time - Time in days
 * @returns {number} Rotation angle in radians
 */
export function calculateResonantRotation(orbitalAnomaly, orbitalPeriod, resonance, time) {
    validateNumber(orbitalAnomaly, 'orbitalAnomaly');
    validatePositiveNumber(orbitalPeriod, 'orbitalPeriod');
    validateNumber(time, 'time');

    if (!resonance || !resonance.rotations || !resonance.orbits) {
        throw new Error('Invalid resonance object');
    }

    const { rotations, orbits } = resonance;
    validatePositiveNumber(rotations, 'rotations');
    validatePositiveNumber(orbits, 'orbits');

    // Calculate rotation rate from resonance
    // For 3:2 resonance: planet rotates 3 times for every 2 orbits
    const rotationPeriod = (orbits / rotations) * orbitalPeriod;

    // Base rotation from time
    const baseRotation = (time / rotationPeriod) * TWO_PI;

    // Add coupling to orbital position for true resonance behavior
    // This ensures the same face points to the sun at perihelion
    const resonanceCoupling = orbitalAnomaly * (1 - orbits / rotations);

    return baseRotation + resonanceCoupling;
}

/**
 * Calculate tidal locking rotation (1:1 resonance)
 *
 * @param {number} orbitalAnomaly - True anomaly in radians
 * @returns {number} Rotation angle in radians
 */
export function calculateTidalLockRotation(orbitalAnomaly) {
    validateNumber(orbitalAnomaly, 'orbitalAnomaly');

    // For tidal locking, rotation equals orbital position
    return orbitalAnomaly;
}

/**
 * Apply axial tilt to rotation axis
 *
 * @param {number} axialTilt - Axial tilt in degrees
 * @returns {Vector3} Rotation axis vector
 */
export function calculateRotationAxis(axialTilt) {
    validateNumber(axialTilt, 'axialTilt');

    const tiltRad = (axialTilt * Math.PI) / 180;

    // Default axis is Z (0, 0, 1)
    // Tilt is applied in the XZ plane
    const x = Math.sin(tiltRad);
    const y = 0;
    const z = Math.cos(tiltRad);

    return new Vector3(x, y, z);
}

/**
 * Calculate rotation matrix for a body
 *
 * @param {number} angle - Rotation angle in radians
 * @param {Vector3} axis - Rotation axis
 * @returns {Array} 3x3 rotation matrix as flat array
 */
export function calculateRotationMatrix(angle, axis) {
    validateNumber(angle, 'angle');

    // Normalize axis
    const axisNorm = axis.normalize();
    const { x, y, z } = axisNorm;

    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const t = 1 - c;

    // Rodrigues' rotation formula
    return [
        t * x * x + c,     t * x * y - s * z, t * x * z + s * y,
        t * x * y + s * z, t * y * y + c,     t * y * z - s * x,
        t * x * z - s * y, t * y * z + s * x, t * z * z + c
    ];
}

/**
 * Calculate sub-solar point (point directly facing the sun)
 *
 * @param {number} rotation - Current rotation angle in radians
 * @param {number} axialTilt - Axial tilt in degrees
 * @param {number} orbitalPosition - Position in orbit (0-1)
 * @returns {Object} { longitude, latitude } in degrees
 */
export function calculateSubSolarPoint(rotation, axialTilt, orbitalPosition) {
    validateNumber(rotation, 'rotation');
    validateNumber(axialTilt, 'axialTilt');
    validateNumber(orbitalPosition, 'orbitalPosition');

    // Longitude is directly from rotation
    let longitude = -(rotation % TWO_PI) * 180 / Math.PI;

    // Normalize to -180 to 180
    while (longitude > 180) longitude -= 360;
    while (longitude < -180) longitude += 360;

    // Latitude varies with season due to axial tilt
    const seasonalAngle = orbitalPosition * TWO_PI;
    const latitude = Math.sin(seasonalAngle) * axialTilt;

    return { longitude, latitude };
}

/**
 * Calculate day/night terminator line
 *
 * @param {Object} subSolarPoint - { longitude, latitude } in degrees
 * @returns {Array} Array of { longitude, latitude } points defining terminator
 */
export function calculateTerminatorLine(subSolarPoint) {
    const points = [];
    const numPoints = 360;

    const sunLon = (subSolarPoint.longitude * Math.PI) / 180;
    const sunLat = (subSolarPoint.latitude * Math.PI) / 180;

    // Calculate great circle perpendicular to sun direction
    for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * TWO_PI;

        // Parametric equation for terminator
        const lat = Math.asin(Math.cos(angle) * Math.cos(sunLat));
        const lon = sunLon + Math.atan2(
            Math.sin(angle),
            Math.tan(sunLat) * Math.cos(angle)
        ) + Math.PI / 2;

        points.push({
            longitude: (lon * 180) / Math.PI,
            latitude: (lat * 180) / Math.PI
        });
    }

    return points;
}

/**
 * Calculate rotation for a body with all parameters
 *
 * @param {Object} rotationParams - Rotation parameters
 * @param {number} rotationParams.period_days - Rotation period in days
 * @param {Object} rotationParams.resonance - Optional resonance { rotations, orbits }
 * @param {number} rotationParams.axial_tilt - Axial tilt in degrees
 * @param {boolean} rotationParams.tidally_locked - Whether body is tidally locked
 * @param {number} time - Time in days
 * @param {number} orbitalAnomaly - True anomaly in radians (for resonant bodies)
 * @param {number} orbitalPeriod - Orbital period in days (for resonant bodies)
 * @returns {Object} { angle, axis, matrix }
 */
export function calculateBodyRotation(rotationParams, time, orbitalAnomaly = 0, orbitalPeriod = 0) {
    const {
        period_days,
        resonance,
        axial_tilt = 0,
        tidally_locked = false,
        initial_rotation = 0
    } = rotationParams;

    let angle;

    if (tidally_locked) {
        // Tidal locking (1:1 resonance)
        angle = calculateTidalLockRotation(orbitalAnomaly);
    } else if (resonance) {
        // Spin-orbit resonance
        angle = calculateResonantRotation(orbitalAnomaly, orbitalPeriod, resonance, time);
    } else {
        // Simple rotation
        angle = calculateSimpleRotation(time, period_days);
    }

    // Apply initial rotation offset
    angle += initial_rotation;

    const axis = calculateRotationAxis(axial_tilt);
    const matrix = calculateRotationMatrix(angle, axis);

    return { angle, axis, matrix };
}

/**
 * Calculate libration (apparent wobble) for resonant bodies
 *
 * @param {number} eccentricity - Orbital eccentricity
 * @param {number} trueAnomaly - True anomaly in radians
 * @param {Object} resonance - Resonance { rotations, orbits }
 * @returns {number} Libration angle in radians
 */
export function calculateLibration(eccentricity, trueAnomaly, resonance) {
    validateNumber(eccentricity, 'eccentricity');
    validateNumber(trueAnomaly, 'trueAnomaly');

    if (!resonance) return 0;

    const { rotations, orbits } = resonance;

    // Libration amplitude depends on eccentricity and resonance
    const amplitude = 2 * eccentricity * (rotations / orbits - 1);

    // Libration varies with orbital position
    return amplitude * Math.sin(trueAnomaly);
}

/**
 * Calculate solar day length (noon to noon)
 *
 * @param {number} rotationPeriod - Sidereal rotation period in days
 * @param {number} orbitalPeriod - Orbital period in days
 * @returns {number} Solar day length in days
 */
export function calculateSolarDay(rotationPeriod, orbitalPeriod) {
    validateNumber(rotationPeriod, 'rotationPeriod');
    validatePositiveNumber(orbitalPeriod, 'orbitalPeriod');

    // Handle tidally locked case
    if (Math.abs(rotationPeriod - orbitalPeriod) < 0.001) {
        return Infinity; // No solar day (always same face to sun)
    }

    // Solar day formula: 1/solar_day = 1/rotation - 1/orbit
    const rotRate = 1 / Math.abs(rotationPeriod);
    const orbRate = 1 / orbitalPeriod;

    const solarRate = rotRate - orbRate * Math.sign(rotationPeriod);

    if (Math.abs(solarRate) < 1e-10) {
        return Infinity;
    }

    return Math.abs(1 / solarRate);
}

/**
 * Determine rotation direction
 *
 * @param {number} rotationPeriod - Rotation period (negative for retrograde)
 * @returns {string} 'prograde' or 'retrograde'
 */
export function getRotationDirection(rotationPeriod) {
    validateNumber(rotationPeriod, 'rotationPeriod');
    return rotationPeriod >= 0 ? 'prograde' : 'retrograde';
}

/**
 * Calculate precession period (simplified)
 *
 * @param {number} axialTilt - Axial tilt in degrees
 * @param {number} rotationPeriod - Rotation period in days
 * @param {number} orbitalPeriod - Orbital period in days
 * @returns {number} Precession period in days (simplified estimate)
 */
export function calculatePrecessionPeriod(axialTilt, rotationPeriod, orbitalPeriod) {
    validateNumber(axialTilt, 'axialTilt');
    validateNumber(rotationPeriod, 'rotationPeriod');
    validatePositiveNumber(orbitalPeriod, 'orbitalPeriod');

    // Simplified precession calculation
    // Real precession depends on many factors (mass distribution, tidal forces, etc.)
    if (axialTilt === 0) return Infinity;

    const factor = 26000 * 365.25; // Earth's precession as baseline
    const tiltFactor = Math.sin((axialTilt * Math.PI) / 180);
    const rotFactor = Math.abs(rotationPeriod);

    return (factor * rotFactor) / (tiltFactor * orbitalPeriod);
}

export default {
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
};