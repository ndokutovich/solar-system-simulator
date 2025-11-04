/**
 * Scene Component - Presentation Layer
 * Manages Three.js scene setup and rendering
 */

import { SCENE_CONFIG, RENDERING_CONFIG, CAMERA_CONFIG } from '../../config/constants.js';
import { validateElement, validateThreeJS } from '../../infrastructure/utils/ValidationUtils.js';

export class SceneComponent {
  constructor(containerId) {
    validateThreeJS();
    this.container = validateElement(containerId);

    this.scene = null;
    this.renderer = null;
    this.raycaster = null;
    this.mouse = null;
  }

  /**
   * Initializes the scene and renderer
   * @returns {Object} Scene and renderer references
   */
  initialize() {
    this.createScene();
    this.createRenderer();
    this.createRaycaster();

    return {
      scene: this.scene,
      renderer: this.renderer,
      raycaster: this.raycaster,
      mouse: this.mouse
    };
  }

  /**
   * Creates the Three.js scene
   */
  createScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(SCENE_CONFIG.BACKGROUND_COLOR);
  }

  /**
   * Creates and configures the renderer
   */
  createRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: RENDERING_CONFIG.ANTIALIAS,
      logarithmicDepthBuffer: RENDERING_CONFIG.LOGARITHMIC_DEPTH
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.configureRenderer();
    this.attachToDOM();
  }

  /**
   * Configures renderer settings
   */
  configureRenderer() {
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  /**
   * Attaches renderer to DOM
   */
  attachToDOM() {
    this.container.appendChild(this.renderer.domElement);
  }

  /**
   * Creates raycaster for mouse interaction
   */
  createRaycaster() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
  }

  /**
   * Updates mouse position for raycasting
   * @param {number} clientX - Mouse X position
   * @param {number} clientY - Mouse Y position
   */
  updateMousePosition(clientX, clientY) {
    this.mouse.x = (clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(clientY / window.innerHeight) * 2 + 1;
  }

  /**
   * Handles window resize
   * @param {THREE.Camera} camera - Camera to update
   */
  handleResize(camera) {
    if (!camera) return;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /**
   * Renders the scene
   * @param {THREE.Camera} camera - Camera to render from
   */
  render(camera) {
    if (!camera || !this.scene) {
      throw new Error('Cannot render: camera or scene not initialized');
    }

    this.renderer.render(this.scene, camera);
  }

  /**
   * Adds object to scene
   * @param {THREE.Object3D} object - Object to add
   */
  add(object) {
    if (!object) {
      throw new Error('Cannot add null object to scene');
    }
    this.scene.add(object);
  }

  /**
   * Removes object from scene
   * @param {THREE.Object3D} object - Object to remove
   */
  remove(object) {
    if (!object) return;
    this.scene.remove(object);
  }

  /**
   * Gets object from scene by property
   * @param {string} property - Property name
   * @param {*} value - Property value
   * @returns {THREE.Object3D|null} Found object or null
   */
  getObjectByProperty(property, value) {
    return this.scene.getObjectByProperty(property, value);
  }

  /**
   * Cleanup resources
   */
  dispose() {
    if (this.renderer) {
      this.renderer.dispose();
    }
    if (this.scene) {
      this.scene.clear();
    }
  }
}
