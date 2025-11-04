/**
 * Three.js Utility Functions
 * Pure utility functions for Three.js operations
 */

/**
 * Converts degrees to radians
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 */
export function degreesToRadians(degrees) {
  return degrees * Math.PI / 180;
}

/**
 * Converts radians to degrees
 * @param {number} radians - Angle in radians
 * @returns {number} Angle in degrees
 */
export function radiansToDegrees(radians) {
  return radians * 180 / Math.PI;
}

/**
 * Creates a sphere geometry with specified parameters
 * @param {number} radius - Sphere radius
 * @param {number} widthSegments - Number of horizontal segments
 * @param {number} heightSegments - Number of vertical segments
 * @returns {THREE.SphereGeometry} The created geometry
 */
export function createSphereGeometry(radius, widthSegments, heightSegments) {
  return new THREE.SphereGeometry(radius, widthSegments, heightSegments);
}

/**
 * Creates a cone geometry for pole markers
 * @param {number} radius - Base radius
 * @param {number} height - Cone height
 * @param {number} segments - Radial segments
 * @returns {THREE.ConeGeometry} The created geometry
 */
export function createConeGeometry(radius, height, segments) {
  return new THREE.ConeGeometry(radius, height, segments);
}

/**
 * Normalizes longitude to -180 to 180 range
 * @param {number} longitude - Longitude in degrees
 * @returns {number} Normalized longitude
 */
export function normalizeLongitude(longitude) {
  let normalized = longitude % 360;
  if (normalized > 180) normalized -= 360;
  if (normalized < -180) normalized += 360;
  return normalized;
}

/**
 * Clamps latitude to valid range
 * @param {number} latitude - Latitude in degrees
 * @returns {number} Clamped latitude
 */
export function clampLatitude(latitude) {
  return Math.max(-90, Math.min(90, latitude));
}

/**
 * Converts spherical coordinates to Cartesian
 * @param {number} radius - Distance from origin
 * @param {number} latDegrees - Latitude in degrees
 * @param {number} lonDegrees - Longitude in degrees
 * @returns {{x: number, y: number, z: number}} Cartesian coordinates
 */
export function sphericalToCartesian(radius, latDegrees, lonDegrees) {
  const lat = degreesToRadians(latDegrees);
  const lon = degreesToRadians(lonDegrees);

  return {
    x: radius * Math.cos(lat) * Math.sin(lon),
    y: radius * Math.sin(lat),
    z: radius * Math.cos(lat) * Math.cos(lon)
  };
}

/**
 * Converts Cartesian coordinates to spherical
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} z - Z coordinate
 * @param {number} radius - Expected radius
 * @returns {{lat: number, lon: number}} Latitude and longitude in degrees
 */
export function cartesianToSpherical(x, y, z, radius) {
  const lat = radiansToDegrees(Math.asin(y / radius));
  const lon = radiansToDegrees(Math.atan2(x, z));

  return { lat, lon };
}

/**
 * Creates a line from an array of points
 * @param {Array<THREE.Vector3>} points - Array of Vector3 points
 * @param {number} color - Line color (hex)
 * @param {number} linewidth - Line width
 * @param {boolean} transparent - Whether line is transparent
 * @param {number} opacity - Line opacity (0-1)
 * @returns {THREE.Line} The created line
 */
export function createLine(points, color, linewidth = 1, transparent = false, opacity = 1) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color,
    linewidth,
    transparent,
    opacity
  });
  return new THREE.Line(geometry, material);
}

/**
 * Creates a dashed line from an array of points
 * @param {Array<THREE.Vector3>} points - Array of Vector3 points
 * @param {number} color - Line color (hex)
 * @param {number} dashSize - Size of dashes
 * @param {number} gapSize - Size of gaps
 * @returns {THREE.Line} The created line
 */
export function createDashedLine(points, color, dashSize, gapSize) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineDashedMaterial({
    color,
    linewidth: 3,
    transparent: true,
    opacity: 0.8,
    dashSize,
    gapSize
  });
  const line = new THREE.Line(geometry, material);
  line.computeLineDistances();
  return line;
}

/**
 * Updates a line geometry with new points
 * @param {THREE.Line} line - The line to update
 * @param {Array<THREE.Vector3>} points - New points
 */
export function updateLineGeometry(line, points) {
  line.geometry.setFromPoints(points);
}

/**
 * Calculates orbital radius for elliptical orbit
 * @param {number} semiMajorAxis - Semi-major axis length
 * @param {number} eccentricity - Orbital eccentricity
 * @param {number} angleRadians - True anomaly in radians
 * @returns {number} Orbital radius at given angle
 */
export function calculateOrbitalRadius(semiMajorAxis, eccentricity, angleRadians) {
  return semiMajorAxis * (1 - eccentricity * eccentricity) /
         (1 + eccentricity * Math.cos(angleRadians));
}

/**
 * Generates points for an elliptical orbit
 * @param {number} semiMajorAxis - Semi-major axis length
 * @param {number} eccentricity - Orbital eccentricity
 * @param {number} segments - Number of segments
 * @returns {Array<THREE.Vector3>} Array of points defining the orbit
 */
export function generateOrbitPoints(semiMajorAxis, eccentricity, segments) {
  const points = [];
  const angleStep = Math.PI * 2 / segments;

  for (let i = 0; i <= segments; i++) {
    const angle = i * angleStep;
    const r = calculateOrbitalRadius(semiMajorAxis, eccentricity, angle);
    const x = r * Math.cos(angle);
    const z = r * Math.sin(angle);
    points.push(new THREE.Vector3(x, 0, z));
  }

  return points;
}
