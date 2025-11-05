/**
 * Coordinate Transform Service
 * Handles all coordinate system transformations
 * CRITICAL for correct temperature mapping and nested bodies
 *
 * This is the key fix for the Mercury temperature rotation problem!
 * The temperature map must be calculated in body-fixed coordinates.
 */

import { validateNumber, validateVector3, validateCelestialBody } from '../../infrastructure/utils/ValidationUtils.js';
import { degreesToRadians, radiansToDegrees } from '../../infrastructure/utils/MathUtils.js';

/**
 * Vector3 class for 3D vectors
 */
export class Vector3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  add(v) {
    return new Vector3(this.x + v.x, this.y + v.y, this.z + v.z);
  }

  subtract(v) {
    return new Vector3(this.x - v.x, this.y - v.y, this.z - v.z);
  }

  multiply(scalar) {
    return new Vector3(this.x * scalar, this.y * scalar, this.z * scalar);
  }

  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  normalize() {
    const len = this.length();
    if (len === 0) return new Vector3();
    return new Vector3(this.x / len, this.y / len, this.z / len);
  }

  dot(v) {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  cross(v) {
    return new Vector3(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x
    );
  }

  clone() {
    return new Vector3(this.x, this.y, this.z);
  }
}

/**
 * Matrix4 class for 4x4 transformation matrices
 */
export class Matrix4 {
  constructor() {
    this.elements = [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ];
  }

  static identity() {
    return new Matrix4();
  }

  static translation(x, y, z) {
    const m = new Matrix4();
    m.elements[12] = x;
    m.elements[13] = y;
    m.elements[14] = z;
    return m;
  }

  static rotationX(angle) {
    const m = new Matrix4();
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    m.elements[5] = c;
    m.elements[6] = s;
    m.elements[9] = -s;
    m.elements[10] = c;
    return m;
  }

  static rotationY(angle) {
    const m = new Matrix4();
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    m.elements[0] = c;
    m.elements[2] = -s;
    m.elements[8] = s;
    m.elements[10] = c;
    return m;
  }

  static rotationZ(angle) {
    const m = new Matrix4();
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    m.elements[0] = c;
    m.elements[1] = s;
    m.elements[4] = -s;
    m.elements[5] = c;
    return m;
  }

  multiply(m) {
    const result = new Matrix4();
    const ae = this.elements;
    const be = m.elements;
    const te = result.elements;

    for (let col = 0; col < 4; col++) {
      for (let row = 0; row < 4; row++) {
        const i = row + col * 4;
        te[i] = 0;
        for (let k = 0; k < 4; k++) {
          te[i] += ae[row + k * 4] * be[k + col * 4];
        }
      }
    }

    return result;
  }

  applyToVector3(v) {
    const e = this.elements;
    const x = v.x, y = v.y, z = v.z;
    const w = 1 / (e[3] * x + e[7] * y + e[11] * z + e[15]);

    return new Vector3(
      (e[0] * x + e[4] * y + e[8] * z + e[12]) * w,
      (e[1] * x + e[5] * y + e[9] * z + e[13]) * w,
      (e[2] * x + e[6] * y + e[10] * z + e[14]) * w
    );
  }

  getInverse() {
    const me = this.elements;
    const te = new Matrix4().elements;

    const n11 = me[0], n21 = me[1], n31 = me[2], n41 = me[3];
    const n12 = me[4], n22 = me[5], n32 = me[6], n42 = me[7];
    const n13 = me[8], n23 = me[9], n33 = me[10], n43 = me[11];
    const n14 = me[12], n24 = me[13], n34 = me[14], n44 = me[15];

    const t11 = n23 * n34 * n42 - n24 * n33 * n42 + n24 * n32 * n43 - n22 * n34 * n43 - n23 * n32 * n44 + n22 * n33 * n44;
    const t12 = n14 * n33 * n42 - n13 * n34 * n42 - n14 * n32 * n43 + n12 * n34 * n43 + n13 * n32 * n44 - n12 * n33 * n44;
    const t13 = n13 * n24 * n42 - n14 * n23 * n42 + n14 * n22 * n43 - n12 * n24 * n43 - n13 * n22 * n44 + n12 * n23 * n44;
    const t14 = n14 * n23 * n32 - n13 * n24 * n32 - n14 * n22 * n33 + n12 * n24 * n33 + n13 * n22 * n34 - n12 * n23 * n34;

    const det = n11 * t11 + n21 * t12 + n31 * t13 + n41 * t14;

    if (det === 0) return Matrix4.identity();

    const detInv = 1 / det;

    te[0] = t11 * detInv;
    te[1] = (n24 * n33 * n41 - n23 * n34 * n41 - n24 * n31 * n43 + n21 * n34 * n43 + n23 * n31 * n44 - n21 * n33 * n44) * detInv;
    te[2] = (n22 * n34 * n41 - n24 * n32 * n41 + n24 * n31 * n42 - n21 * n34 * n42 - n22 * n31 * n44 + n21 * n32 * n44) * detInv;
    te[3] = (n23 * n32 * n41 - n22 * n33 * n41 - n23 * n31 * n42 + n21 * n33 * n42 + n22 * n31 * n43 - n21 * n32 * n43) * detInv;

    te[4] = t12 * detInv;
    te[5] = (n13 * n34 * n41 - n14 * n33 * n41 + n14 * n31 * n43 - n11 * n34 * n43 - n13 * n31 * n44 + n11 * n33 * n44) * detInv;
    te[6] = (n14 * n32 * n41 - n12 * n34 * n41 - n14 * n31 * n42 + n11 * n34 * n42 + n12 * n31 * n44 - n11 * n32 * n44) * detInv;
    te[7] = (n12 * n33 * n41 - n13 * n32 * n41 + n13 * n31 * n42 - n11 * n33 * n42 - n12 * n31 * n43 + n11 * n32 * n43) * detInv;

    te[8] = t13 * detInv;
    te[9] = (n14 * n23 * n41 - n13 * n24 * n41 - n14 * n21 * n43 + n11 * n24 * n43 + n13 * n21 * n44 - n11 * n23 * n44) * detInv;
    te[10] = (n12 * n24 * n41 - n14 * n22 * n41 + n14 * n21 * n42 - n11 * n24 * n42 - n12 * n21 * n44 + n11 * n22 * n44) * detInv;
    te[11] = (n13 * n22 * n41 - n12 * n23 * n41 - n13 * n21 * n42 + n11 * n23 * n42 + n12 * n21 * n43 - n11 * n22 * n43) * detInv;

    te[12] = t14 * detInv;
    te[13] = (n13 * n24 * n31 - n14 * n23 * n31 + n14 * n21 * n33 - n11 * n24 * n33 - n13 * n21 * n34 + n11 * n23 * n34) * detInv;
    te[14] = (n14 * n22 * n31 - n12 * n24 * n31 - n14 * n21 * n32 + n11 * n24 * n32 + n12 * n21 * n34 - n11 * n22 * n34) * detInv;
    te[15] = (n12 * n23 * n31 - n13 * n22 * n31 + n13 * n21 * n32 - n11 * n23 * n32 - n12 * n21 * n33 + n11 * n22 * n33) * detInv;

    const result = new Matrix4();
    result.elements = te;
    return result;
  }
}

/**
 * Gets the rotation transformation for a body at a given time
 */
export function getBodyRotationTransform(body, time) {
  validateCelestialBody(body);
  validateNumber(time);

  if (!body.rotation) {
    return Matrix4.identity();
  }

  // Calculate current rotation angle
  const rotationAngle = (time / body.rotation.period_days) * Math.PI * 2;

  // Apply axial tilt first (around X axis)
  const tiltRad = degreesToRadians(body.rotation.axial_tilt || 0);
  const tiltMatrix = Matrix4.rotationX(tiltRad);

  // Then apply rotation around Y axis (planet's spin)
  const rotationMatrix = Matrix4.rotationY(rotationAngle);

  // Combine: first tilt, then rotate
  return rotationMatrix.multiply(tiltMatrix);
}

/**
 * Gets the orbital transformation for a body at a given time
 * This positions the body in its orbit around its parent
 */
export function getBodyOrbitalTransform(body, time, orbitalPosition) {
  if (!orbitalPosition) {
    return Matrix4.identity();
  }

  return Matrix4.translation(
    orbitalPosition.x,
    orbitalPosition.y,
    orbitalPosition.z
  );
}

/**
 * Converts local coordinates to world space through the hierarchy chain
 * @param {Vector3} localPosition - Position in body-fixed frame
 * @param {Object} body - The celestial body
 * @param {number} time - Current simulation time
 * @param {Function} getOrbitalPosition - Function to get orbital position
 * @returns {Vector3} Position in world space
 */
export function localToWorld(localPosition, body, time, getOrbitalPosition) {
  validateVector3(localPosition);
  validateCelestialBody(body);
  validateNumber(time);

  // Apply body rotation
  const rotationTransform = getBodyRotationTransform(body, time);
  let position = rotationTransform.applyToVector3(localPosition);

  // Apply orbital position
  if (body.orbital && getOrbitalPosition) {
    const orbitalPos = getOrbitalPosition(body, time);
    const orbitalTransform = getBodyOrbitalTransform(body, time, orbitalPos);
    position = orbitalTransform.applyToVector3(position);
  }

  // If has parent, transform through parent chain
  // (Would need to recursively apply parent transforms here)

  return position;
}

/**
 * Converts world coordinates to body-fixed coordinates
 * @param {Vector3} worldPosition - Position in world space
 * @param {Object} body - The celestial body
 * @param {number} time - Current simulation time
 * @param {Function} getOrbitalPosition - Function to get orbital position
 * @returns {Vector3} Position in body-fixed frame
 */
export function worldToLocal(worldPosition, body, time, getOrbitalPosition) {
  validateVector3(worldPosition);
  validateCelestialBody(body);
  validateNumber(time);

  let position = worldPosition.clone();

  // Remove orbital position
  if (body.orbital && getOrbitalPosition) {
    const orbitalPos = getOrbitalPosition(body, time);
    const orbitalTransform = getBodyOrbitalTransform(body, time, orbitalPos);
    const inverseOrbital = orbitalTransform.getInverse();
    position = inverseOrbital.applyToVector3(position);
  }

  // Remove body rotation
  const rotationTransform = getBodyRotationTransform(body, time);
  const inverseRotation = rotationTransform.getInverse();
  position = inverseRotation.applyToVector3(position);

  return position;
}

/**
 * CRITICAL FUNCTION FOR TEMPERATURE MAPS!
 * Calculates sun direction in body-fixed coordinates
 * This ensures the hot spot always faces the sun
 *
 * @param {Object} body - The celestial body
 * @param {number} time - Current simulation time
 * @param {Vector3} sunWorldPos - Sun position in world space
 * @param {Function} getBodyWorldPosition - Function to get body position in world
 * @returns {Vector3} Sun direction in body-fixed frame (normalized)
 */
export function getSunDirectionInBodyFrame(body, time, sunWorldPos, getBodyWorldPosition) {
  validateCelestialBody(body);
  validateNumber(time);
  validateVector3(sunWorldPos);

  // Get body position in world space
  const bodyWorldPos = getBodyWorldPosition(body, time);

  // Sun direction in world space
  const sunDirWorld = sunWorldPos.subtract(bodyWorldPos).normalize();

  // Transform to body-fixed frame (inverse of body's rotation)
  const sunDirLocal = worldToLocal(sunDirWorld, body, time, null);

  return sunDirLocal.normalize();
}

/**
 * Converts spherical coordinates (lon, lat) on body surface
 * to direction vector in body-fixed frame
 *
 * @param {number} longitude - Longitude in degrees (-180 to 180)
 * @param {number} latitude - Latitude in degrees (-90 to 90)
 * @param {number} radius - Radius of the body
 * @returns {Vector3} Position in body-fixed frame
 */
export function sphericalToBodyFixed(longitude, latitude, radius = 1) {
  validateNumber(longitude);
  validateNumber(latitude);
  validateNumber(radius);

  const lonRad = degreesToRadians(longitude);
  const latRad = degreesToRadians(latitude);

  return new Vector3(
    radius * Math.cos(latRad) * Math.cos(lonRad),
    radius * Math.sin(latRad),
    radius * Math.cos(latRad) * Math.sin(lonRad)
  );
}

/**
 * Converts body-fixed coordinates to spherical (lon, lat)
 *
 * @param {Vector3} position - Position in body-fixed frame
 * @returns {Object} { longitude, latitude, radius }
 */
export function bodyFixedToSpherical(position) {
  validateVector3(position);

  const radius = position.length();
  const latitude = radiansToDegrees(Math.asin(position.y / radius));
  const longitude = radiansToDegrees(Math.atan2(position.z, position.x));

  return { longitude, latitude, radius };
}

/**
 * Calculates sun angle at a surface point
 * This is the angle between the surface normal and sun direction
 * 0° = sun directly overhead (subsolar point)
 * 90° = sun at horizon (terminator)
 * 180° = sun directly opposite (antisolar point)
 *
 * @param {number} longitude - Surface longitude in degrees
 * @param {number} latitude - Surface latitude in degrees
 * @param {Object} body - The celestial body
 * @param {number} time - Current simulation time
 * @param {Vector3} sunWorldPos - Sun position in world space
 * @param {Function} getBodyWorldPosition - Function to get body position
 * @returns {number} Sun angle in degrees (0-180)
 */
export function calculateSunAngle(longitude, latitude, body, time, sunWorldPos, getBodyWorldPosition) {
  validateNumber(longitude);
  validateNumber(latitude);
  validateCelestialBody(body);

  // Surface point normal in body-fixed coords (normalized position)
  const surfaceNormal = sphericalToBodyFixed(longitude, latitude, 1);

  // Sun direction in body-fixed coords
  const sunDir = getSunDirectionInBodyFrame(body, time, sunWorldPos, getBodyWorldPosition);

  // Angle between surface normal and sun direction
  const dotProduct = surfaceNormal.dot(sunDir);
  const angle = Math.acos(Math.max(-1, Math.min(1, dotProduct)));

  return radiansToDegrees(angle);
}

/**
 * Finds the subsolar point (where sun is directly overhead)
 *
 * @param {Object} body - The celestial body
 * @param {number} time - Current simulation time
 * @param {Vector3} sunWorldPos - Sun position in world space
 * @param {Function} getBodyWorldPosition - Function to get body position
 * @returns {Object} { longitude, latitude } of subsolar point
 */
export function findSubsolarPoint(body, time, sunWorldPos, getBodyWorldPosition) {
  // Get sun direction in body-fixed frame
  const sunDir = getSunDirectionInBodyFrame(body, time, sunWorldPos, getBodyWorldPosition);

  // Convert to spherical coordinates
  return bodyFixedToSpherical(sunDir);
}

/**
 * Checks if a surface point is in daylight
 *
 * @param {number} longitude - Surface longitude in degrees
 * @param {number} latitude - Surface latitude in degrees
 * @param {Object} body - The celestial body
 * @param {number} time - Current simulation time
 * @param {Vector3} sunWorldPos - Sun position in world space
 * @param {Function} getBodyWorldPosition - Function to get body position
 * @returns {boolean} True if in daylight, false if in night
 */
export function isInDaylight(longitude, latitude, body, time, sunWorldPos, getBodyWorldPosition) {
  const sunAngle = calculateSunAngle(longitude, latitude, body, time, sunWorldPos, getBodyWorldPosition);
  return sunAngle < 90;
}

/**
 * Checks if a surface point is in the terminator zone
 *
 * @param {number} longitude - Surface longitude in degrees
 * @param {number} latitude - Surface latitude in degrees
 * @param {Object} body - The celestial body
 * @param {number} time - Current simulation time
 * @param {number} terminatorWidth - Width of terminator zone in degrees
 * @returns {boolean} True if in terminator zone
 */
export function isInTerminatorZone(longitude, latitude, body, time, sunWorldPos, getBodyWorldPosition, terminatorWidth = 10) {
  const sunAngle = calculateSunAngle(longitude, latitude, body, time, sunWorldPos, getBodyWorldPosition);
  return Math.abs(sunAngle - 90) < terminatorWidth / 2;
}

/**
 * Creates a transform matrix for the complete hierarchy chain
 * This is used to position objects correctly in the scene
 */
export function createHierarchyTransform(body, time, getOrbitalPosition, getParentTransform) {
  let transform = Matrix4.identity();

  // Apply body's own rotation
  const rotationTransform = getBodyRotationTransform(body, time);
  transform = transform.multiply(rotationTransform);

  // Apply orbital position
  if (body.orbital && getOrbitalPosition) {
    const orbitalPos = getOrbitalPosition(body, time);
    const orbitalTransform = Matrix4.translation(orbitalPos.x, orbitalPos.y, orbitalPos.z);
    transform = orbitalTransform.multiply(transform);
  }

  // Apply parent's transform if exists
  if (body.parent && getParentTransform) {
    const parentTransform = getParentTransform(body.parent, time);
    transform = parentTransform.multiply(transform);
  }

  return transform;
}