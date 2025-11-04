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
   * Calculates temperature for a pixel
   */
  calculatePixelTemperature(lon, lat) {
    const sunAngle = ((lon + 360) % 360);
    let temp;

    if (sunAngle < 90) {
      temp = -173 + (sunAngle / 90) * 600;
    } else if (sunAngle < 180) {
      temp = 427;
    } else if (sunAngle < 270) {
      temp = 427 - ((sunAngle - 180) / 90) * 600;
    } else {
      temp = -173;
    }

    // Polar modification
    const polarFactor = Math.abs(Math.sin(degreesToRadians(lat)));
    return temp * (1 - polarFactor * 0.3);
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
}
