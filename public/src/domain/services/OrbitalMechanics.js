/**
 * OrbitalMechanics.js
 *
 * Service for calculating orbital positions using Kepler's laws.
 * Handles elliptical orbits with proper eccentric and true anomaly calculations.
 */

import { validateNumber, validatePositiveNumber } from '../../infrastructure/utils/ValidationUtils.js';
import { Vector3 } from './CoordinateTransforms.js';

// Physical constants
const TWO_PI = 2 * Math.PI;
const EPSILON = 1e-10;
const MAX_ITERATIONS = 100;

/**
 * Solve Kepler's equation: M = E - e * sin(E)
 * Using Newton-Raphson method
 *
 * @param {number} meanAnomaly - Mean anomaly in radians
 * @param {number} eccentricity - Orbital eccentricity
 * @returns {number} Eccentric anomaly in radians
 */
export function solveKeplersEquation(meanAnomaly, eccentricity) {
    validateNumber(meanAnomaly, 'meanAnomaly');
    validateNumber(eccentricity, 'eccentricity');

    if (eccentricity < 0 || eccentricity >= 1) {
        throw new Error(`Invalid eccentricity: ${eccentricity} (must be 0 <= e < 1 for elliptical orbits)`);
    }

    // Normalize mean anomaly to [0, 2π]
    let M = meanAnomaly % TWO_PI;
    if (M < 0) M += TWO_PI;

    // Initial guess for eccentric anomaly
    let E = M;
    if (eccentricity > 0.8) {
        E = Math.PI;
    }

    // Newton-Raphson iteration
    for (let i = 0; i < MAX_ITERATIONS; i++) {
        const sinE = Math.sin(E);
        const cosE = Math.cos(E);
        const f = E - eccentricity * sinE - M;
        const df = 1 - eccentricity * cosE;

        const deltaE = f / df;
        E -= deltaE;

        if (Math.abs(deltaE) < EPSILON) {
            return E;
        }
    }

    // If we didn't converge, use a fallback method
    return fallbackKeplerSolver(M, eccentricity);
}

/**
 * Fallback solver using bisection method
 * @private
 */
function fallbackKeplerSolver(M, e) {
    let E0 = 0;
    let E1 = TWO_PI;

    for (let i = 0; i < MAX_ITERATIONS; i++) {
        const E = (E0 + E1) / 2;
        const f = E - e * Math.sin(E) - M;

        if (Math.abs(f) < EPSILON) {
            return E;
        }

        if (f > 0) {
            E1 = E;
        } else {
            E0 = E;
        }
    }

    return (E0 + E1) / 2;
}

/**
 * Calculate true anomaly from eccentric anomaly
 *
 * @param {number} eccentricAnomaly - Eccentric anomaly in radians
 * @param {number} eccentricity - Orbital eccentricity
 * @returns {number} True anomaly in radians
 */
export function calculateTrueAnomaly(eccentricAnomaly, eccentricity) {
    validateNumber(eccentricAnomaly, 'eccentricAnomaly');
    validateNumber(eccentricity, 'eccentricity');

    const E = eccentricAnomaly;
    const e = eccentricity;

    // Using the formula: tan(ν/2) = sqrt((1+e)/(1-e)) * tan(E/2)
    const factor = Math.sqrt((1 + e) / (1 - e));
    const tanHalfE = Math.tan(E / 2);
    const tanHalfNu = factor * tanHalfE;

    let nu = 2 * Math.atan(tanHalfNu);

    // Normalize to [0, 2π]
    if (nu < 0) nu += TWO_PI;

    return nu;
}

/**
 * Calculate mean anomaly from time
 *
 * @param {number} time - Time since perihelion in days
 * @param {number} orbitalPeriod - Orbital period in days
 * @returns {number} Mean anomaly in radians
 */
export function calculateMeanAnomaly(time, orbitalPeriod) {
    validateNumber(time, 'time');
    validatePositiveNumber(orbitalPeriod, 'orbitalPeriod');

    const n = TWO_PI / orbitalPeriod; // Mean motion
    return n * time;
}

/**
 * Calculate orbital position in the orbital plane
 *
 * @param {number} semiMajorAxis - Semi-major axis in AU
 * @param {number} eccentricity - Orbital eccentricity
 * @param {number} trueAnomaly - True anomaly in radians
 * @returns {Vector3} Position in orbital plane (x along perihelion, y perpendicular, z=0)
 */
export function calculateOrbitalPosition(semiMajorAxis, eccentricity, trueAnomaly) {
    validatePositiveNumber(semiMajorAxis, 'semiMajorAxis');
    validateNumber(eccentricity, 'eccentricity');
    validateNumber(trueAnomaly, 'trueAnomaly');

    // Calculate radius
    const r = semiMajorAxis * (1 - eccentricity * eccentricity) / (1 + eccentricity * Math.cos(trueAnomaly));

    // Position in orbital plane
    const x = r * Math.cos(trueAnomaly);
    const y = r * Math.sin(trueAnomaly);
    const z = 0;

    return new Vector3(x, y, z);
}

/**
 * Apply orbital element transformations to get position in solar system frame
 *
 * @param {Vector3} orbitalPosition - Position in orbital plane
 * @param {number} inclination - Inclination in radians
 * @param {number} longitudeOfAscendingNode - Longitude of ascending node in radians
 * @param {number} argumentOfPerihelion - Argument of perihelion in radians
 * @returns {Vector3} Position in solar system frame
 */
export function transformToSolarSystemFrame(orbitalPosition, inclination, longitudeOfAscendingNode, argumentOfPerihelion) {
    validateNumber(inclination, 'inclination');
    validateNumber(longitudeOfAscendingNode, 'longitudeOfAscendingNode');
    validateNumber(argumentOfPerihelion, 'argumentOfPerihelion');

    const i = inclination;
    const Omega = longitudeOfAscendingNode;
    const omega = argumentOfPerihelion;

    // Rotation matrices
    const cosOmega = Math.cos(Omega);
    const sinOmega = Math.sin(Omega);
    const cosi = Math.cos(i);
    const sini = Math.sin(i);
    const cosomega = Math.cos(omega);
    const sinomega = Math.sin(omega);

    // Combined rotation matrix elements
    const Px = cosOmega * cosomega - sinOmega * sinomega * cosi;
    const Py = sinOmega * cosomega + cosOmega * sinomega * cosi;
    const Pz = sinomega * sini;

    const Qx = -cosOmega * sinomega - sinOmega * cosomega * cosi;
    const Qy = -sinOmega * sinomega + cosOmega * cosomega * cosi;
    const Qz = cosomega * sini;

    // Apply transformation
    const x = Px * orbitalPosition.x + Qx * orbitalPosition.y;
    const y = Py * orbitalPosition.x + Qy * orbitalPosition.y;
    const z = Pz * orbitalPosition.x + Qz * orbitalPosition.y;

    return new Vector3(x, y, z);
}

/**
 * Calculate complete orbital position for a body at a given time
 *
 * @param {Object} orbitalElements - Orbital elements
 * @param {number} orbitalElements.semiMajorAxis - Semi-major axis in AU
 * @param {number} orbitalElements.eccentricity - Eccentricity
 * @param {number} orbitalElements.inclination - Inclination in radians
 * @param {number} orbitalElements.longitudeOfAscendingNode - Longitude of ascending node in radians
 * @param {number} orbitalElements.argumentOfPerihelion - Argument of perihelion in radians
 * @param {number} orbitalElements.orbitalPeriod - Orbital period in days
 * @param {number} orbitalElements.mean_anomaly_epoch - Mean anomaly at J2000.0 epoch in degrees (optional)
 * @param {number} time - Time in days since J2000.0 epoch
 * @returns {Vector3} Position in solar system frame
 */
export function calculateBodyPosition(orbitalElements, time) {
    const {
        semiMajorAxis,
        eccentricity,
        inclination = 0,
        longitudeOfAscendingNode = 0,
        argumentOfPerihelion = 0,
        orbitalPeriod,
        mean_anomaly_epoch = 0 // Default to 0 (perihelion at epoch) for backward compatibility
    } = orbitalElements;

    // Calculate mean anomaly from epoch
    // If mean_anomaly_epoch is provided, use it to calculate current mean anomaly
    // Formula: M(t) = M0 + n*t, where M0 is mean anomaly at epoch, n is mean motion
    const meanMotion = TWO_PI / orbitalPeriod; // radians per day
    const meanAnomalyAtEpochRad = (mean_anomaly_epoch * Math.PI) / 180; // Convert degrees to radians
    const meanAnomaly = meanAnomalyAtEpochRad + (meanMotion * time);

    // Solve Kepler's equation for eccentric anomaly
    const eccentricAnomaly = solveKeplersEquation(meanAnomaly, eccentricity);

    // Calculate true anomaly
    const trueAnomaly = calculateTrueAnomaly(eccentricAnomaly, eccentricity);

    // Calculate position in orbital plane
    const orbitalPos = calculateOrbitalPosition(semiMajorAxis, eccentricity, trueAnomaly);

    // Transform to solar system frame
    const solarSystemPos = transformToSolarSystemFrame(
        orbitalPos,
        inclination,
        longitudeOfAscendingNode,
        argumentOfPerihelion
    );

    return solarSystemPos;
}

/**
 * Calculate orbital velocity at a given position
 * Using vis-viva equation: v² = μ(2/r - 1/a)
 *
 * @param {number} semiMajorAxis - Semi-major axis in AU
 * @param {number} currentRadius - Current distance from focus in AU
 * @param {number} orbitalPeriod - Orbital period in days
 * @returns {number} Orbital velocity in AU/day
 */
export function calculateOrbitalVelocity(semiMajorAxis, currentRadius, orbitalPeriod) {
    validatePositiveNumber(semiMajorAxis, 'semiMajorAxis');
    validatePositiveNumber(currentRadius, 'currentRadius');
    validatePositiveNumber(orbitalPeriod, 'orbitalPeriod');

    // Calculate gravitational parameter
    const n = TWO_PI / orbitalPeriod; // Mean motion
    const mu = n * n * semiMajorAxis * semiMajorAxis * semiMajorAxis;

    // Vis-viva equation
    const vSquared = mu * (2 / currentRadius - 1 / semiMajorAxis);

    return Math.sqrt(Math.max(0, vSquared));
}

/**
 * Calculate orbital phase (0-1) for visualization
 *
 * @param {number} time - Current time in days
 * @param {number} orbitalPeriod - Orbital period in days
 * @returns {number} Phase from 0 to 1
 */
export function calculateOrbitalPhase(time, orbitalPeriod) {
    validateNumber(time, 'time');
    validatePositiveNumber(orbitalPeriod, 'orbitalPeriod');

    const phase = (time % orbitalPeriod) / orbitalPeriod;
    return phase < 0 ? phase + 1 : phase;
}

/**
 * Calculate distance from focus (sun)
 *
 * @param {Vector3} position - Position in solar system frame
 * @returns {number} Distance in AU
 */
export function calculateDistanceFromSun(position) {
    return position.length();
}

/**
 * Calculate perihelion and aphelion distances
 *
 * @param {number} semiMajorAxis - Semi-major axis in AU
 * @param {number} eccentricity - Eccentricity
 * @returns {Object} { perihelion, aphelion } in AU
 */
export function calculateApsides(semiMajorAxis, eccentricity) {
    validatePositiveNumber(semiMajorAxis, 'semiMajorAxis');
    validateNumber(eccentricity, 'eccentricity');

    return {
        perihelion: semiMajorAxis * (1 - eccentricity),
        aphelion: semiMajorAxis * (1 + eccentricity)
    };
}

export default {
    solveKeplersEquation,
    calculateTrueAnomaly,
    calculateMeanAnomaly,
    calculateOrbitalPosition,
    transformToSolarSystemFrame,
    calculateBodyPosition,
    calculateOrbitalVelocity,
    calculateOrbitalPhase,
    calculateDistanceFromSun,
    calculateApsides
};