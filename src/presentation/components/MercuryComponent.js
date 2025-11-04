/**
 * Mercury Component - Presentation Layer
 * Creates and manages Mercury planet rendering
 */

import {
  MERCURY_CONSTANTS,
  MERCURY_RENDERING,
  TERMINATOR_CONFIG,
  POLE_MARKERS,
  STARS_CONFIG,
  GRID_CONFIG,
  ORBIT_CONFIG
} from '../../config/constants.js';
import { temperatureToColor } from '../../domain/services/TemperatureService.js';
import {
  createSphereGeometry,
  createConeGeometry,
  createLine,
  degreesToRadians,
  generateOrbitPoints,
  updateLineGeometry
} from '../../infrastructure/utils/ThreeUtils.js';

export class MercuryComponent {
  constructor() {
    this.mercuryOrbitGroup = null;
    this.mercuryGroup = null;
    this.mercury = null;
    this.tempTexture = null;
    this.terminatorLines = [];
    this.orbitLine = null;
    this.routePath = null;
    this.gridHelper = null;
    this.axesHelper = null;
    this.perihelionMarker = null;
    this.aphelionMarker = null;
    this.routeLines = [];
  }

  /**
   * Creates Mercury and related objects
   * @returns {Object} Mercury references
   */
  create() {
    this.createOrbitGroup();
    this.createMercuryGroup();
    this.createPlanet();
    this.createTerminatorLines();
    this.createPoleMarkers();
    this.createAxes();
    this.createOrbitLine();
    this.createPerihelionMarkers();
    this.createGrid();
    this.createStars();

    this.positionInOrbit();

    return {
      mercuryOrbitGroup: this.mercuryOrbitGroup,
      mercuryGroup: this.mercuryGroup,
      mercury: this.mercury,
      terminatorLines: this.terminatorLines,
      orbitLine: this.orbitLine
    };
  }

  /**
   * Creates orbit group for Mercury
   */
  createOrbitGroup() {
    this.mercuryOrbitGroup = new THREE.Group();
  }

  /**
   * Creates Mercury group
   */
  createMercuryGroup() {
    this.mercuryGroup = new THREE.Group();
  }

  /**
   * Creates the planet mesh
   */
  createPlanet() {
    const geometry = createSphereGeometry(
      MERCURY_CONSTANTS.RADIUS,
      MERCURY_RENDERING.SEGMENTS_WIDTH,
      MERCURY_RENDERING.SEGMENTS_HEIGHT
    );

    this.createTemperatureTexture();

    const material = new THREE.MeshPhongMaterial({
      map: this.tempTexture,
      bumpScale: MERCURY_RENDERING.BUMP_SCALE,
      specular: new THREE.Color(MERCURY_RENDERING.SPECULAR_COLOR),
      shininess: MERCURY_RENDERING.SHININESS
    });

    this.mercury = new THREE.Mesh(geometry, material);
    this.mercury.castShadow = true;
    this.mercury.receiveShadow = true;

    this.mercuryGroup.add(this.mercury);
  }

  /**
   * Creates temperature texture
   */
  createTemperatureTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = MERCURY_RENDERING.TEXTURE_WIDTH;
    canvas.height = MERCURY_RENDERING.TEXTURE_HEIGHT;

    this.tempTexture = new THREE.CanvasTexture(canvas);
    this.updateTemperatureTexture();
  }

  /**
   * Updates temperature texture with current data
   */
  updateTemperatureTexture() {
    const canvas = this.tempTexture.image;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;

    // Clear canvas
    ctx.fillStyle = '#000033';
    ctx.fillRect(0, 0, width, height);

    // Draw temperature map
    this.drawTemperatureMap(ctx, width, height);

    // Add craters for detail
    this.addCraters(ctx, width, height);

    this.tempTexture.needsUpdate = true;
  }

  /**
   * Draws temperature map on canvas
   */
  drawTemperatureMap(ctx, width, height) {
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const lon = (x / width - 0.5) * 360;
        const lat = (0.5 - y / height) * 180;

        const temp = this.calculatePixelTemperature(lon, lat);
        const color = temperatureToColor(temp);

        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  /**
   * Calculates temperature - CORRECT VERSION
   * lon=180° faces sun (subsolar point) = HOT
   * lon=0° faces away (antisolar point) = COLD
   */
  calculatePixelTemperature(lon, lat) {
    // Normalize longitude to -180 to 180
    const normLon = ((lon + 180) % 360) - 180;

    // Calculate distance from subsolar point at lon=180°
    const distFromSubsolar = Math.abs(normLon - 180) > 180 ?
      360 - Math.abs(normLon - 180) : Math.abs(normLon - 180);

    // Temperature gradient from subsolar to antisolar
    let baseTemp;
    if (distFromSubsolar < 90) {
      // Day side: 0° to 90° from subsolar point
      // lon=180° → 427°C, decreasing towards terminators
      const normalized = distFromSubsolar / 90;
      baseTemp = 427 - normalized * 300; // 427°C to 127°C
    } else {
      // Night side: 90° to 180° from subsolar point
      // Terminators to antisolar point (lon=0°)
      const normalized = (distFromSubsolar - 90) / 90;
      baseTemp = 127 - normalized * 300; // 127°C to -173°C
    }

    // Latitude cooling - poles receive less sunlight
    const latRad = degreesToRadians(lat);
    const latitudeFactor = Math.cos(latRad);

    return baseTemp * (0.3 + 0.7 * latitudeFactor);
  }

  /**
   * Adds crater details to texture
   */
  addCraters(ctx, width, height) {
    ctx.globalAlpha = 0.3;

    for (let i = 0; i < MERCURY_RENDERING.CRATER_COUNT; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const r = Math.random() * MERCURY_RENDERING.CRATER_MAX_RADIUS +
                MERCURY_RENDERING.CRATER_MIN_RADIUS;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.5)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }

  /**
   * Creates terminator lines
   */
  createTerminatorLines() {
    const points = this.generateTerminatorPoints();

    // Morning terminator
    const morningLine = createLine(
      points,
      TERMINATOR_CONFIG.MORNING_COLOR,
      TERMINATOR_CONFIG.LINE_WIDTH,
      true,
      TERMINATOR_CONFIG.OPACITY
    );
    morningLine.rotation.z = Math.PI / 2;

    // Evening terminator
    const eveningLine = createLine(
      points.map(p => p.clone()),
      TERMINATOR_CONFIG.EVENING_COLOR,
      TERMINATOR_CONFIG.LINE_WIDTH,
      true,
      TERMINATOR_CONFIG.OPACITY
    );
    eveningLine.rotation.z = -Math.PI / 2;

    this.terminatorLines = [morningLine, eveningLine];
    this.mercuryGroup.add(morningLine);
    this.mercuryGroup.add(eveningLine);
  }

  /**
   * Generates points for terminator line
   */
  generateTerminatorPoints() {
    const points = [];
    const segments = TERMINATOR_CONFIG.SEGMENTS;
    const radius = MERCURY_CONSTANTS.RADIUS * TERMINATOR_CONFIG.OFFSET_FACTOR;

    for (let i = 0; i <= segments; i++) {
      const lat = -Math.PI / 2 + (i / segments) * Math.PI;
      const y = Math.sin(lat) * radius;
      const r = Math.cos(lat) * radius;
      points.push(new THREE.Vector3(r, y, 0));
    }

    return points;
  }

  /**
   * Creates pole markers
   */
  createPoleMarkers() {
    const geometry = createConeGeometry(
      POLE_MARKERS.RADIUS,
      POLE_MARKERS.HEIGHT,
      POLE_MARKERS.SEGMENTS
    );

    // North pole
    const northMaterial = new THREE.MeshBasicMaterial({
      color: POLE_MARKERS.NORTH_COLOR
    });
    const northPole = new THREE.Mesh(geometry, northMaterial);
    northPole.position.set(0, MERCURY_CONSTANTS.RADIUS + POLE_MARKERS.OFFSET, 0);

    // South pole
    const southMaterial = new THREE.MeshBasicMaterial({
      color: POLE_MARKERS.SOUTH_COLOR
    });
    const southPole = new THREE.Mesh(geometry, southMaterial);
    southPole.position.set(0, -MERCURY_CONSTANTS.RADIUS - POLE_MARKERS.OFFSET, 0);
    southPole.rotation.z = Math.PI;

    this.mercuryGroup.add(northPole);
    this.mercuryGroup.add(southPole);
  }

  /**
   * Creates axes helper
   */
  createAxes() {
    this.axesHelper = new THREE.AxesHelper(3);
    this.axesHelper.visible = false;
    this.mercuryGroup.add(this.axesHelper);
  }

  /**
   * Creates orbit line
   */
  createOrbitLine() {
    const points = generateOrbitPoints(
      MERCURY_CONSTANTS.SUN_DISTANCE,
      MERCURY_CONSTANTS.ECCENTRICITY,
      ORBIT_CONFIG.SEGMENTS
    );

    this.orbitLine = createLine(
      points,
      ORBIT_CONFIG.COLOR,
      1,
      true,
      ORBIT_CONFIG.OPACITY
    );
  }

  /**
   * Creates perihelion and aphelion markers
   */
  createPerihelionMarkers() {
    const a = MERCURY_CONSTANTS.SUN_DISTANCE;
    const e = MERCURY_CONSTANTS.ECCENTRICITY;

    // Perihelion (closest point to sun) - at angle 0
    const perihelionDist = a * (1 - e);
    const perihelionGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const perihelionMaterial = new THREE.MeshBasicMaterial({
      color: 0xff4444,
      transparent: true,
      opacity: 0.8
    });
    this.perihelionMarker = new THREE.Mesh(perihelionGeometry, perihelionMaterial);
    this.perihelionMarker.position.x = perihelionDist;
    this.perihelionMarker.position.z = 0;
    this.perihelionMarker.visible = false; // Hidden by default

    // Aphelion (farthest point from sun) - at angle PI
    const aphelionDist = a * (1 + e);
    const aphelionGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const aphelionMaterial = new THREE.MeshBasicMaterial({
      color: 0x4444ff,
      transparent: true,
      opacity: 0.8
    });
    this.aphelionMarker = new THREE.Mesh(aphelionGeometry, aphelionMaterial);
    this.aphelionMarker.position.x = -aphelionDist;
    this.aphelionMarker.position.z = 0;
    this.aphelionMarker.visible = false; // Hidden by default

    // Add to orbit group (not Mercury group, as they stay fixed in orbit)
    this.mercuryOrbitGroup.add(this.perihelionMarker);
    this.mercuryOrbitGroup.add(this.aphelionMarker);
  }

  /**
   * Creates coordinate grid
   */
  createGrid() {
    this.gridHelper = new THREE.GridHelper(
      GRID_CONFIG.SIZE,
      GRID_CONFIG.DIVISIONS,
      GRID_CONFIG.COLOR_CENTER,
      GRID_CONFIG.COLOR_GRID
    );
    this.gridHelper.position.y = GRID_CONFIG.Y_POSITION;
  }

  /**
   * Creates star field
   */
  createStars() {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];

    for (let i = 0; i < STARS_CONFIG.COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const r = STARS_CONFIG.DISTANCE;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      vertices.push(x, y, z);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

    const material = new THREE.PointsMaterial({
      color: STARS_CONFIG.COLOR,
      size: STARS_CONFIG.SIZE,
      sizeAttenuation: false
    });

    this.stars = new THREE.Points(geometry, material);
  }

  /**
   * Positions Mercury in orbit
   */
  positionInOrbit() {
    this.mercuryGroup.position.set(MERCURY_CONSTANTS.SUN_DISTANCE, 0, 0);
    this.mercuryOrbitGroup.add(this.mercuryGroup);
  }

  /**
   * Updates orbit line with new eccentricity
   */
  updateOrbit(eccentricity) {
    const points = generateOrbitPoints(
      MERCURY_CONSTANTS.SUN_DISTANCE,
      eccentricity,
      ORBIT_CONFIG.SEGMENTS
    );

    updateLineGeometry(this.orbitLine, points);
  }

  /**
   * Gets Mercury mesh for raycasting
   */
  getMercury() {
    return this.mercury;
  }

  /**
   * Gets Mercury group
   */
  getMercuryGroup() {
    return this.mercuryGroup;
  }

  /**
   * Gets orbit group
   */
  getOrbitGroup() {
    return this.mercuryOrbitGroup;
  }

  /**
   * Gets grid helper
   */
  getGrid() {
    return this.gridHelper;
  }

  /**
   * Gets stars
   */
  getStars() {
    return this.stars;
  }

  /**
   * Sets terminator visibility
   */
  setTerminatorVisibility(visible) {
    this.terminatorLines.forEach(line => {
      line.visible = visible;
    });
  }

  /**
   * Sets temperature map visibility
   */
  setTemperatureVisibility(visible) {
    if (visible) {
      this.mercury.material.map = this.tempTexture;
    } else {
      this.mercury.material.map = null;
      this.mercury.material.color = new THREE.Color(0x888888);
    }
    this.mercury.material.needsUpdate = true;
  }

  /**
   * Sets axes visibility
   */
  setAxesVisibility(visible) {
    if (this.axesHelper) {
      this.axesHelper.visible = visible;
    }
  }

  /**
   * Sets perihelion/aphelion markers visibility
   */
  setPerihelionVisibility(visible) {
    if (this.perihelionMarker) {
      this.perihelionMarker.visible = visible;
    }
    if (this.aphelionMarker) {
      this.aphelionMarker.visible = visible;
    }
  }

  /**
   * Shows route visualization on Mercury surface
   * @param {string} routeType - Type of route: 'polar', 'terminator', or 'comfort'
   */
  showRoute(routeType) {
    this.clearRoutes(); // Clear existing routes first

    let points = [];
    const segments = 100;

    switch (routeType) {
      case 'polar':
        // Route from south pole to north pole along 0° longitude
        for (let i = 0; i <= segments; i++) {
          const lat = -90 + (180 * i / segments);
          const lon = 0;
          const radius = MERCURY_CONSTANTS.RADIUS + 0.05; // Slightly above surface

          const latRad = degreesToRadians(lat);
          const lonRad = degreesToRadians(lon);

          points.push(new THREE.Vector3(
            radius * Math.cos(latRad) * Math.sin(lonRad),
            radius * Math.sin(latRad),
            radius * Math.cos(latRad) * Math.cos(lonRad)
          ));
        }
        break;

      case 'terminator':
        // Route along morning terminator (90° longitude)
        for (let i = 0; i <= segments; i++) {
          const lat = -80 + (160 * i / segments); // Avoid poles
          const lon = 90;
          const radius = MERCURY_CONSTANTS.RADIUS + 0.05;

          const latRad = degreesToRadians(lat);
          const lonRad = degreesToRadians(lon);

          points.push(new THREE.Vector3(
            radius * Math.cos(latRad) * Math.sin(lonRad),
            radius * Math.sin(latRad),
            radius * Math.cos(latRad) * Math.cos(lonRad)
          ));
        }
        break;

      case 'comfort':
        // Route through comfort zone (around terminator at equator)
        for (let i = 0; i <= segments; i++) {
          const lon = 60 + (60 * i / segments); // 60° to 120° longitude
          const lat = 0; // Equator
          const radius = MERCURY_CONSTANTS.RADIUS + 0.05;

          const latRad = degreesToRadians(lat);
          const lonRad = degreesToRadians(lon);

          points.push(new THREE.Vector3(
            radius * Math.cos(latRad) * Math.sin(lonRad),
            radius * Math.sin(latRad),
            radius * Math.cos(latRad) * Math.cos(lonRad)
          ));
        }
        break;
    }

    if (points.length > 0) {
      const routeLine = createLine(points, 0x00ff00, 3, false, 1);
      this.routeLines.push(routeLine);
      this.mercuryGroup.add(routeLine);
    }
  }

  /**
   * Clears all route visualizations
   */
  clearRoutes() {
    this.routeLines.forEach(line => {
      this.mercuryGroup.remove(line);
      if (line.geometry) line.geometry.dispose();
      if (line.material) line.material.dispose();
    });
    this.routeLines = [];
  }

  /**
   * Updates terminator line orientation
   * This is no longer needed as terminators rotate with the planet mesh
   * @param {number} angle - Angle in radians (kept for compatibility)
   */
  updateTerminatorOrientation(angle) {
    // Terminators are now fixed to the planet mesh and rotate with it
    // No additional rotation needed
  }
}
