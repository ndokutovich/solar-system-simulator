/**
 * Sun Component - Presentation Layer
 * Creates and manages the Sun and lighting
 */

import { SUN_CONFIG, AMBIENT_CONFIG, RENDERING_CONFIG } from '../../config/constants.js';
import { createSphereGeometry } from '../../infrastructure/utils/ThreeUtils.js';

export class SunComponent {
  constructor() {
    this.sunGroup = null;
    this.sunSphere = null;
    this.sunLight = null;
    this.pointLight = null;
    this.ambientLight = null;
  }

  /**
   * Creates the sun and lighting system
   * @returns {Object} Sun and light references
   */
  create() {
    this.createSunGroup();
    this.createSunSphere();
    this.createSunGlow();
    this.createDirectionalLight();
    this.createPointLight();
    this.createAmbientLight();

    return {
      sun: this.sunGroup,
      sunLight: this.sunLight,
      ambientLight: this.ambientLight
    };
  }

  /**
   * Creates the sun group container
   */
  createSunGroup() {
    this.sunGroup = new THREE.Group();
    this.sunGroup.position.set(0, 0, 0);
  }

  /**
   * Creates the sun sphere mesh
   */
  createSunSphere() {
    const geometry = createSphereGeometry(SUN_CONFIG.RADIUS, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: SUN_CONFIG.COLOR
    });

    this.sunSphere = new THREE.Mesh(geometry, material);
    this.sunGroup.add(this.sunSphere);
  }

  /**
   * Creates sun glow effect
   */
  createSunGlow() {
    const geometry = createSphereGeometry(SUN_CONFIG.GLOW_RADIUS, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: SUN_CONFIG.GLOW_COLOR,
      transparent: true,
      opacity: SUN_CONFIG.GLOW_OPACITY
    });

    const glow = new THREE.Mesh(geometry, material);
    this.sunGroup.add(glow);
  }

  /**
   * Creates directional light from sun
   */
  createDirectionalLight() {
    this.sunLight = new THREE.DirectionalLight(
      0xffffff,
      SUN_CONFIG.LIGHT_INTENSITY
    );

    this.sunLight.position.set(0, 0, 0);
    this.configureShadows();
  }

  /**
   * Configures shadow mapping
   */
  configureShadows() {
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = RENDERING_CONFIG.SHADOW_MAP_SIZE;
    this.sunLight.shadow.mapSize.height = RENDERING_CONFIG.SHADOW_MAP_SIZE;
    this.sunLight.shadow.camera.near = RENDERING_CONFIG.SHADOW_NEAR;
    this.sunLight.shadow.camera.far = RENDERING_CONFIG.SHADOW_FAR;
  }

  /**
   * Creates point light at sun position
   */
  createPointLight() {
    this.pointLight = new THREE.PointLight(
      0xffffff,
      SUN_CONFIG.POINT_LIGHT_INTENSITY,
      SUN_CONFIG.POINT_LIGHT_DISTANCE
    );

    this.sunGroup.add(this.pointLight);
  }

  /**
   * Creates ambient light
   */
  createAmbientLight() {
    this.ambientLight = new THREE.AmbientLight(
      AMBIENT_CONFIG.COLOR,
      AMBIENT_CONFIG.INTENSITY
    );
  }

  /**
   * Updates light direction based on Mercury position
   * @param {THREE.Vector3} mercuryPosition - Mercury's current position
   */
  updateLightDirection(mercuryPosition) {
    if (!this.sunLight || !mercuryPosition) {
      throw new Error('Cannot update light: missing components');
    }

    const lightDirection = mercuryPosition.clone()
      .normalize()
      .multiplyScalar(-10);

    this.sunLight.position.copy(lightDirection);
    this.sunLight.target.position.copy(mercuryPosition);
  }

  /**
   * Gets sun group
   * @returns {THREE.Group} Sun group
   */
  getSunGroup() {
    return this.sunGroup;
  }

  /**
   * Gets directional light
   * @returns {THREE.DirectionalLight} Sun light
   */
  getSunLight() {
    return this.sunLight;
  }

  /**
   * Gets ambient light
   * @returns {THREE.AmbientLight} Ambient light
   */
  getAmbientLight() {
    return this.ambientLight;
  }
}
