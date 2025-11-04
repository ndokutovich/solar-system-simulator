/**
 * Camera Controller - Presentation Layer
 * Manages camera states and transitions
 */

import { CAMERA_CONFIG, CONTROLS_CONFIG } from '../../config/constants.js';
import { sphericalToCartesian } from '../../infrastructure/utils/ThreeUtils.js';

export class CameraController {
  constructor() {
    this.normalCamera = null;
    this.surfaceCamera = null;
    this.activeCamera = null;
    this.controls = null;
    this.isSurfaceView = false;
  }

  /**
   * Initializes cameras
   * @param {HTMLElement} domElement - DOM element for controls
   * @returns {Object} Camera references
   */
  initialize(domElement) {
    this.createNormalCamera();
    this.createSurfaceCamera();
    this.createControls(domElement);
    this.activeCamera = this.normalCamera;

    return {
      normalCamera: this.normalCamera,
      surfaceCamera: this.surfaceCamera,
      activeCamera: this.activeCamera,
      controls: this.controls
    };
  }

  /**
   * Creates orbital view camera
   */
  createNormalCamera() {
    const config = CAMERA_CONFIG.ORBITAL;

    this.normalCamera = new THREE.PerspectiveCamera(
      config.FOV,
      window.innerWidth / window.innerHeight,
      config.NEAR,
      config.FAR
    );

    const pos = config.INITIAL_POSITION;
    this.normalCamera.position.set(pos.x, pos.y, pos.z);
    this.normalCamera.lookAt(0, 0, 0);
  }

  /**
   * Creates surface view camera
   */
  createSurfaceCamera() {
    const config = CAMERA_CONFIG.SURFACE;

    this.surfaceCamera = new THREE.PerspectiveCamera(
      config.FOV,
      window.innerWidth / window.innerHeight,
      config.NEAR,
      config.FAR
    );
  }

  /**
   * Creates orbit controls
   * @param {HTMLElement} domElement - DOM element for controls
   */
  createControls(domElement) {
    this.controls = new THREE.OrbitControls(this.normalCamera, domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = CONTROLS_CONFIG.DAMPING_FACTOR;
    this.controls.minDistance = CONTROLS_CONFIG.MIN_DISTANCE;
    this.controls.maxDistance = CONTROLS_CONFIG.MAX_DISTANCE;
  }

  /**
   * Switches to orbital view
   */
  switchToOrbitView() {
    this.isSurfaceView = false;
    this.activeCamera = this.normalCamera;
    this.controls.enabled = true;
  }

  /**
   * Switches to surface view
   */
  switchToSurfaceView() {
    this.isSurfaceView = true;
    this.activeCamera = this.surfaceCamera;
    this.controls.enabled = false;
  }

  /**
   * Sets camera to orbital overview position
   */
  setOrbitalOverview() {
    this.normalCamera.position.set(20, 15, 25);
    this.normalCamera.lookAt(0, 0, 0);
    this.controls.update();
  }

  /**
   * Sets camera to equator view
   * @param {THREE.Vector3} mercuryPosition - Mercury's position
   */
  setEquatorView(mercuryPosition) {
    this.normalCamera.position.set(
      mercuryPosition.x + 5,
      mercuryPosition.y,
      mercuryPosition.z + 5
    );
    this.normalCamera.lookAt(mercuryPosition);
    this.controls.update();
  }

  /**
   * Sets camera to pole view
   * @param {THREE.Vector3} mercuryPosition - Mercury's position
   */
  setPoleView(mercuryPosition) {
    this.normalCamera.position.set(
      mercuryPosition.x,
      mercuryPosition.y + 8,
      mercuryPosition.z + 2
    );
    this.normalCamera.lookAt(mercuryPosition);
    this.controls.update();
  }

  /**
   * Updates surface camera position
   * @param {Object} observer - Observer state {lat, lon}
   * @param {THREE.Vector3} mercuryPosition - Mercury's position
   * @param {number} mercuryRadius - Planet radius
   * @returns {Object} Camera info
   */
  updateSurfaceCamera(observer, mercuryPosition, mercuryRadius) {
    const coords = sphericalToCartesian(
      mercuryRadius,
      observer.latitude,
      observer.longitude
    );

    const height = CAMERA_CONFIG.SURFACE.OBSERVER_HEIGHT;
    const normal = new THREE.Vector3(coords.x, coords.y, coords.z).normalize();

    this.surfaceCamera.position.set(
      mercuryPosition.x + coords.x + normal.x * height,
      mercuryPosition.y + coords.y + normal.y * height,
      mercuryPosition.z + coords.z + normal.z * height
    );

    const lookAtPoint = new THREE.Vector3(
      mercuryPosition.x + coords.x + normal.x * 10,
      mercuryPosition.y + coords.y + normal.y * 0.5,
      mercuryPosition.z + coords.z + normal.z * 10
    );

    this.surfaceCamera.lookAt(lookAtPoint);
    this.surfaceCamera.up.copy(normal);

    return { normal, position: this.surfaceCamera.position };
  }

  /**
   * Updates controls
   */
  update() {
    if (this.controls && this.controls.enabled) {
      this.controls.update();
    }
  }

  /**
   * Gets active camera
   * @returns {THREE.Camera} Active camera
   */
  getActiveCamera() {
    return this.activeCamera;
  }

  /**
   * Checks if in surface view
   * @returns {boolean} True if in surface view
   */
  isInSurfaceView() {
    return this.isSurfaceView;
  }
}
