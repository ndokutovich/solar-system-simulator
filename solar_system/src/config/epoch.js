/**
 * Astronomical Epoch Definition
 *
 * J2000.0 is the standard astronomical epoch used for:
 * - Planetary orbital elements
 * - Star catalogs
 * - Celestial coordinate systems
 *
 * Definition: January 1, 2000, 12:00 TT (Terrestrial Time)
 * Equivalent to: January 1, 2000, 11:58:55.816 UTC
 *
 * For simplicity, we use 12:00 UTC as the epoch.
 */

/**
 * J2000.0 Epoch
 * @constant {Object}
 */
export const EPOCH = {
    /** Human-readable name */
    name: 'J2000.0',

    /** JavaScript Date object (UTC) */
    date: new Date('2000-01-01T12:00:00Z'),

    /** Julian Date (astronomical standard) */
    julianDate: 2451545.0,

    /** Unix timestamp (milliseconds since 1970-01-01) */
    unixTimestamp: 946728000000
};

/**
 * Convert Julian Date to Unix timestamp
 * @param {number} jd - Julian Date
 * @returns {number} Unix timestamp in milliseconds
 */
export function julianDateToUnix(jd) {
    const unixEpochJD = 2440587.5; // Unix epoch (1970-01-01) in JD
    const daysSinceUnixEpoch = jd - unixEpochJD;
    return daysSinceUnixEpoch * 86400000; // Convert days to milliseconds
}

/**
 * Convert Unix timestamp to Julian Date
 * @param {number} unixTime - Unix timestamp in milliseconds
 * @returns {number} Julian Date
 */
export function unixToJulianDate(unixTime) {
    const unixEpochJD = 2440587.5;
    const daysSinceUnixEpoch = unixTime / 86400000;
    return unixEpochJD + daysSinceUnixEpoch;
}
