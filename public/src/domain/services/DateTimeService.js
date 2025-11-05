/**
 * Date/Time Service
 *
 * Converts between real calendar dates and simulation time.
 * Uses J2000.0 epoch (January 1, 2000, 12:00 UTC) as reference.
 */

import { EPOCH } from '../../config/epoch.js';

/**
 * Convert simulation time (days since J2000.0 epoch) to real date
 * @param {number} simulationTimeDays - Days since J2000.0 epoch (can be negative for dates before 2000)
 * @returns {Date} Real calendar date (UTC)
 *
 * @example
 * simulationTimeToDate(0) // Returns: Jan 1, 2000, 12:00 UTC (epoch)
 * simulationTimeToDate(365.25) // Returns: Jan 1, 2001, 12:00 UTC (one year later)
 * simulationTimeToDate(-365.25) // Returns: Jan 1, 1999, 12:00 UTC (one year before)
 */
export function simulationTimeToDate(simulationTimeDays) {
    if (typeof simulationTimeDays !== 'number' || !isFinite(simulationTimeDays)) {
        throw new Error(`Invalid simulation time: ${simulationTimeDays} (must be finite number)`);
    }

    const milliseconds = simulationTimeDays * 24 * 60 * 60 * 1000;
    return new Date(EPOCH.date.getTime() + milliseconds);
}

/**
 * Convert real date to simulation time (days since J2000.0 epoch)
 * @param {Date} date - Real calendar date
 * @returns {number} Days since J2000.0 epoch (negative if date is before epoch)
 *
 * @example
 * dateToSimulationTime(new Date('2000-01-01T12:00:00Z')) // Returns: 0 (epoch)
 * dateToSimulationTime(new Date('2001-01-01T12:00:00Z')) // Returns: ~365.25
 * dateToSimulationTime(new Date('1999-01-01T12:00:00Z')) // Returns: ~-365.25
 */
export function dateToSimulationTime(date) {
    if (!(date instanceof Date) || !isFinite(date.getTime())) {
        throw new Error(`Invalid date: ${date} (must be valid Date object)`);
    }

    const milliseconds = date.getTime() - EPOCH.date.getTime();
    return milliseconds / (24 * 60 * 60 * 1000);
}

/**
 * Format date for display in UI
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string (e.g., "Jan 15, 2025, 14:30 UTC")
 */
export function formatDate(date) {
    if (!(date instanceof Date) || !isFinite(date.getTime())) {
        return 'Invalid Date';
    }

    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC'
    };

    return date.toLocaleString('en-US', options) + ' UTC';
}

/**
 * Format date with seconds for precise display
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string with seconds
 */
export function formatDatePrecise(date) {
    if (!(date instanceof Date) || !isFinite(date.getTime())) {
        return 'Invalid Date';
    }

    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'UTC'
    };

    return date.toLocaleString('en-US', options) + ' UTC';
}

/**
 * Calculate Julian Date (astronomical standard)
 * @param {Date} date - Calendar date
 * @returns {number} Julian Date (days since Jan 1, 4713 BC)
 *
 * Julian Date is the standard way to express time in astronomy.
 * J2000.0 epoch = JD 2451545.0
 */
export function dateToJulianDate(date) {
    if (!(date instanceof Date) || !isFinite(date.getTime())) {
        throw new Error(`Invalid date: ${date}`);
    }

    const unixTime = date.getTime();
    const unixEpochJD = 2440587.5; // Unix epoch (Jan 1, 1970, 00:00 UTC) in JD
    const daysSinceUnixEpoch = unixTime / 86400000; // milliseconds to days
    return unixEpochJD + daysSinceUnixEpoch;
}

/**
 * Convert Julian Date to JavaScript Date
 * @param {number} jd - Julian Date
 * @returns {Date} JavaScript Date object
 */
export function julianDateToDate(jd) {
    if (typeof jd !== 'number' || !isFinite(jd)) {
        throw new Error(`Invalid Julian Date: ${jd}`);
    }

    const unixEpochJD = 2440587.5;
    const daysSinceUnixEpoch = jd - unixEpochJD;
    const unixTime = daysSinceUnixEpoch * 86400000;
    return new Date(unixTime);
}

/**
 * Get current simulation time for "now"
 * @returns {number} Days since J2000.0 epoch representing current real time
 */
export function getCurrentSimulationTime() {
    return dateToSimulationTime(new Date());
}

/**
 * Format simulation time as days since epoch
 * @param {number} simulationTimeDays - Days since J2000.0
 * @returns {string} Formatted string (e.g., "Days since J2000.0: 9345.67")
 */
export function formatSimulationTime(simulationTimeDays) {
    if (typeof simulationTimeDays !== 'number' || !isFinite(simulationTimeDays)) {
        return 'Invalid Time';
    }

    return `Days since J2000.0: ${simulationTimeDays.toFixed(2)}`;
}

/**
 * Parse date string from HTML input elements
 * @param {string} dateStr - Date string (YYYY-MM-DD format)
 * @param {string} timeStr - Time string (HH:MM format), defaults to "12:00"
 * @returns {Date} Parsed date in UTC
 */
export function parseDateTime(dateStr, timeStr = '12:00') {
    if (!dateStr) {
        throw new Error('Date string is required');
    }

    // Ensure time has seconds
    const timeWithSeconds = timeStr.includes(':00:') ? timeStr : `${timeStr}:00`;

    // Combine and parse as UTC
    const dateTimeStr = `${dateStr}T${timeWithSeconds}Z`;
    const date = new Date(dateTimeStr);

    if (!isFinite(date.getTime())) {
        throw new Error(`Invalid date/time: ${dateStr} ${timeStr}`);
    }

    return date;
}

/**
 * Get date for HTML date input (YYYY-MM-DD format)
 * @param {Date} date - Date object
 * @returns {string} Date string in YYYY-MM-DD format
 */
export function getDateInputValue(date) {
    if (!(date instanceof Date) || !isFinite(date.getTime())) {
        return '';
    }

    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

/**
 * Get time for HTML time input (HH:MM format)
 * @param {Date} date - Date object
 * @returns {string} Time string in HH:MM format
 */
export function getTimeInputValue(date) {
    if (!(date instanceof Date) || !isFinite(date.getTime())) {
        return '12:00';
    }

    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');

    return `${hours}:${minutes}`;
}

/**
 * Validate date is within reasonable simulation range
 * @param {Date} date - Date to validate
 * @param {number} maxYearsBefore - Maximum years before epoch (default: 100)
 * @param {number} maxYearsAfter - Maximum years after epoch (default: 100)
 * @returns {boolean} True if date is in valid range
 */
export function isDateInValidRange(date, maxYearsBefore = 100, maxYearsAfter = 100) {
    if (!(date instanceof Date) || !isFinite(date.getTime())) {
        return false;
    }

    const simTime = dateToSimulationTime(date);
    const daysInYear = 365.25;

    const minDays = -maxYearsBefore * daysInYear;
    const maxDays = maxYearsAfter * daysInYear;

    return simTime >= minDays && simTime <= maxDays;
}

/**
 * Get preset dates for quick navigation
 * @returns {Object} Object with preset date definitions
 */
export function getPresetDates() {
    return {
        epoch: {
            name: 'J2000.0 Epoch',
            date: EPOCH.date,
            description: 'Standard astronomical epoch (Jan 1, 2000)'
        },
        today: {
            name: 'Today',
            date: new Date(),
            description: 'Current date and time'
        },
        newYear2030: {
            name: 'New Year 2030',
            date: new Date('2030-01-01T00:00:00Z'),
            description: 'Start of 2030'
        },
        newYear2050: {
            name: 'New Year 2050',
            date: new Date('2050-01-01T00:00:00Z'),
            description: 'Start of 2050'
        },
        century21Start: {
            name: '21st Century',
            date: new Date('2000-01-01T00:00:00Z'),
            description: 'Start of 21st century'
        }
    };
}
