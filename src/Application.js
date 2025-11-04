/**
 * Main Application - Orchestrator
 * Coordinates all components and manages application lifecycle
 */

import { DOM_IDS, MERCURY_CONSTANTS, ANIMATION_CONFIG } from './config/constants.js';
import { createMercuryState, updateRotation, updateOrbitalPosition, setEccentricity, toggleAnimation, setTimeSpeed, resetMercuryState, calculateMercuryDay, calculateMercuryYearDay, calculateRotationCount, calculateOrbitCount, calculateLocalTime } from './domain/models/MercuryModel.js';
import { createObserver, moveNorth, moveSouth, moveWest, moveEast, setPosition, moveToHotPole, moveToWarmPole } from './domain/models/ObserverModel.js';
import { calculateRotationDelta, calculateOrbitalDelta, calculateOrbitalPosition, calculateTerminatorSpeed, calculateSunElevation } from './domain/services/PhysicsService.js';
import { calculateTemperature } from './domain/services/TemperatureService.js';
import { SceneComponent } from './presentation/components/SceneComponent.js';
import { CameraController } from './presentation/components/CameraController.js';
import { SunComponent } from './presentation/components/SunComponent.js';
import { MercuryComponent } from './presentation/components/MercuryComponent.js';
import { UIController } from './presentation/components/UIController.js';
import { cartesianToSpherical } from './infrastructure/utils/ThreeUtils.js';
import { validateWebGLSupport, validateThreeJS } from './infrastructure/utils/ValidationUtils.js';

export class Application {
  constructor() {
    this.mercuryState = null;
    this.observerState = null;

    // Components
    this.scene = null;
    this.cameraController = null;
    this.sunComponent = null;
    this.mercuryComponent = null;
    this.uiController = null;

    // References
    this.renderer = null;
    this.animationId = null;
  }

  /**
   * Initializes the application
   */
  async initialize() {
    try {
      this.validateEnvironment();
      this.initializeState();
      this.initializeComponents();
      this.setupScene();
      this.setupEventListeners();
      this.startAnimation();
    } catch (error) {
      this.handleInitializationError(error);
    }
  }

  /**
   * Validates environment requirements
   */
  validateEnvironment() {
    validateThreeJS();
    validateWebGLSupport();
  }

  /**
   * Initializes application state
   */
  initializeState() {
    this.mercuryState = createMercuryState();
    this.observerState = createObserver();
  }

  /**
   * Initializes all components
   */
  initializeComponents() {
    // Scene
    this.scene = new SceneComponent(DOM_IDS.CANVAS_CONTAINER);
    const sceneRefs = this.scene.initialize();
    this.renderer = sceneRefs.renderer;

    // Camera
    this.cameraController = new CameraController();
    this.cameraController.initialize(this.renderer.domElement);

    // Sun
    this.sunComponent = new SunComponent();
    const sunRefs = this.sunComponent.create();
    this.scene.add(sunRefs.sun);
    this.scene.add(sunRefs.sunLight);
    this.scene.add(sunRefs.ambientLight);

    // Mercury
    this.mercuryComponent = new MercuryComponent();
    const mercuryRefs = this.mercuryComponent.create();
    this.scene.add(mercuryRefs.mercuryOrbitGroup);
    this.scene.add(mercuryRefs.orbitLine);
    this.scene.add(this.mercuryComponent.getGrid());
    this.scene.add(this.mercuryComponent.getStars());

    // UI
    this.uiController = new UIController();
    this.uiController.initialize();
  }

  /**
   * Sets up scene configuration
   */
  setupScene() {
    window.addEventListener('resize', () => this.handleResize());
  }

  /**
   * Sets up all event listeners
   */
  setupEventListeners() {
    this.setupTimeControls();
    this.setupViewControls();
    this.setupDisplayControls();
    this.setupRouteControls();
    this.setupMouseControls();
    this.setupKeyboardControls();
  }

  /**
   * Sets up time control event listeners
   */
  setupTimeControls() {
    this.uiController.on(DOM_IDS.TIME_SPEED, 'input', (e) => {
      const speed = parseFloat(e.target.value);
      this.mercuryState = setTimeSpeed(this.mercuryState, speed);
      this.uiController.updateSpeedDisplay(speed);
    });

    this.uiController.on(DOM_IDS.PAUSE_BTN, 'click', () => {
      this.mercuryState = toggleAnimation(this.mercuryState);
      this.uiController.updatePauseButton(this.mercuryState.isAnimating);
    });

    this.uiController.on(DOM_IDS.RESET_BTN, 'click', () => {
      this.mercuryState = resetMercuryState();
      this.uiController.setSliderValue(DOM_IDS.TIME_SPEED, 1);
      this.uiController.updateSpeedDisplay(1);
    });

    this.uiController.on(DOM_IDS.ECCENTRICITY, 'input', (e) => {
      const ecc = parseFloat(e.target.value) / 100;
      this.mercuryState = setEccentricity(this.mercuryState, ecc);
      this.uiController.updateEccentricityDisplay(ecc);
      this.mercuryComponent.updateOrbit(ecc);
    });
  }

  /**
   * Sets up view control event listeners
   */
  setupViewControls() {
    this.uiController.on(DOM_IDS.VIEW_ORBIT, 'click', () => {
      this.cameraController.switchToOrbitView();
      this.cameraController.setOrbitalOverview();
      this.uiController.hideSurfacePanel();
    });

    this.uiController.on(DOM_IDS.VIEW_EQUATOR, 'click', () => {
      this.cameraController.switchToOrbitView();
      const mercuryPos = this.mercuryComponent.getMercuryGroup().position;
      this.cameraController.setEquatorView(mercuryPos);
      this.uiController.hideSurfacePanel();
    });

    this.uiController.on(DOM_IDS.VIEW_POLE, 'click', () => {
      this.cameraController.switchToOrbitView();
      const mercuryPos = this.mercuryComponent.getMercuryGroup().position;
      this.cameraController.setPoleView(mercuryPos);
      this.uiController.hideSurfacePanel();
    });

    this.uiController.on(DOM_IDS.VIEW_SURFACE, 'click', () => {
      if (this.cameraController.isInSurfaceView()) {
        this.cameraController.switchToOrbitView();
        this.uiController.hideSurfacePanel();
      } else {
        this.cameraController.switchToSurfaceView();
        this.uiController.showSurfacePanel();
      }
    });

    this.uiController.on(DOM_IDS.EXIT_SURFACE, 'click', () => {
      this.cameraController.switchToOrbitView();
      this.uiController.hideSurfacePanel();
    });
  }

  /**
   * Sets up display control event listeners
   */
  setupDisplayControls() {
    this.uiController.on(DOM_IDS.SHOW_GRID, 'change', (e) => {
      const grid = this.mercuryComponent.getGrid();
      if (grid) grid.visible = e.target.checked;
    });

    this.uiController.on(DOM_IDS.SHOW_TERMINATOR, 'change', (e) => {
      this.mercuryComponent.setTerminatorVisibility(e.target.checked);
    });

    this.uiController.on(DOM_IDS.SHOW_TEMP, 'change', (e) => {
      this.mercuryComponent.setTemperatureVisibility(e.target.checked);
    });

    this.uiController.on(DOM_IDS.SHOW_ORBIT, 'change', (e) => {
      const orbitLine = this.mercuryComponent.orbitLine;
      if (orbitLine) orbitLine.visible = e.target.checked;
    });

    this.uiController.on(DOM_IDS.SHOW_AXES, 'change', (e) => {
      this.mercuryComponent.setAxesVisibility(e.target.checked);
    });
  }

  /**
   * Sets up route control event listeners
   */
  setupRouteControls() {
    this.uiController.on(DOM_IDS.GO_HOT, 'click', () => {
      this.observerState = moveToHotPole();
      if (this.cameraController.isInSurfaceView()) {
        this.updateSurfaceView();
      }
    });

    this.uiController.on(DOM_IDS.GO_WARM, 'click', () => {
      this.observerState = moveToWarmPole();
      if (this.cameraController.isInSurfaceView()) {
        this.updateSurfaceView();
      }
    });
  }

  /**
   * Sets up mouse control event listeners
   */
  setupMouseControls() {
    this.renderer.domElement.addEventListener('mousemove', (e) => {
      this.handleMouseMove(e);
    });
  }

  /**
   * Sets up keyboard control event listeners
   */
  setupKeyboardControls() {
    window.addEventListener('keydown', (e) => {
      this.handleKeyDown(e);
    });
  }

  /**
   * Handles mouse move events
   */
  handleMouseMove(event) {
    if (this.cameraController.isInSurfaceView()) return;

    this.scene.updateMousePosition(event.clientX, event.clientY);

    const camera = this.cameraController.getActiveCamera();
    this.scene.raycaster.setFromCamera(this.scene.mouse, camera);

    const intersects = this.scene.raycaster.intersectObject(
      this.mercuryComponent.getMercury()
    );

    if (intersects.length > 0) {
      const point = intersects[0].point;
      const mercury = this.mercuryComponent.getMercury();
      const localPoint = mercury.worldToLocal(point.clone());

      const coords = cartesianToSpherical(
        localPoint.x,
        localPoint.y,
        localPoint.z,
        MERCURY_CONSTANTS.RADIUS
      );

      const temp = calculateTemperature(coords.lon, coords.lat);

      this.uiController.updatePointTemperature(temp);
      this.uiController.updatePointCoordinates(coords.lat, coords.lon);
    }
  }

  /**
   * Handles keyboard events
   */
  handleKeyDown(event) {
    if (!this.cameraController.isInSurfaceView()) return;

    switch (event.key.toLowerCase()) {
      case 'w':
        this.observerState = moveNorth(this.observerState);
        break;
      case 's':
        this.observerState = moveSouth(this.observerState);
        break;
      case 'a':
        this.observerState = moveWest(this.observerState);
        break;
      case 'd':
        this.observerState = moveEast(this.observerState);
        break;
      default:
        return;
    }

    this.updateSurfaceView();
  }

  /**
   * Updates surface view camera and UI
   */
  updateSurfaceView() {
    const mercuryPos = this.mercuryComponent.getMercuryGroup().position;

    const cameraInfo = this.cameraController.updateSurfaceCamera(
      this.observerState,
      mercuryPos,
      MERCURY_CONSTANTS.RADIUS
    );

    // Calculate sun elevation
    const sunPos = this.sunComponent.getSunGroup().position;
    const sunElevation = calculateSunElevation(
      sunPos,
      cameraInfo.position,
      cameraInfo.normal
    );

    this.uiController.updateSunHeight(sunElevation);
    this.uiController.updateObserverPosition(
      this.observerState.latitude,
      this.observerState.longitude
    );
  }

  /**
   * Handles window resize
   */
  handleResize() {
    const camera = this.cameraController.getActiveCamera();
    this.scene.handleResize(camera);
  }

  /**
   * Animation loop
   */
  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    if (this.mercuryState.isAnimating) {
      this.updatePhysics();
      this.updateUI();
    }

    if (this.cameraController.isInSurfaceView()) {
      this.updateSurfaceView();
    }

    this.cameraController.update();
    const camera = this.cameraController.getActiveCamera();
    this.scene.render(camera);
  }

  /**
   * Updates physics simulation
   */
  updatePhysics() {
    // Update rotation
    const rotDelta = calculateRotationDelta(this.mercuryState.timeSpeed);
    this.mercuryState = updateRotation(this.mercuryState, rotDelta);

    // Update orbital position
    const orbDelta = calculateOrbitalDelta(this.mercuryState.timeSpeed);
    this.mercuryState = updateOrbitalPosition(this.mercuryState, orbDelta);

    // Apply to 3D objects
    this.applyPhysicsToScene();
  }

  /**
   * Applies physics state to 3D scene
   */
  applyPhysicsToScene() {
    // Rotate Mercury
    const mercury = this.mercuryComponent.getMercury();
    mercury.rotation.y = this.mercuryState.rotation * Math.PI / 180;

    // Update orbital position
    const orbitalPos = calculateOrbitalPosition(
      this.mercuryState.orbitalAngle,
      this.mercuryState.eccentricity,
      MERCURY_CONSTANTS.SUN_DISTANCE
    );

    const mercuryGroup = this.mercuryComponent.getMercuryGroup();
    mercuryGroup.position.x = orbitalPos.x;
    mercuryGroup.position.z = orbitalPos.z;

    // Update light direction
    this.sunComponent.updateLightDirection(mercuryGroup.position);
  }

  /**
   * Updates UI displays
   */
  updateUI() {
    const day = calculateMercuryDay(this.mercuryState.rotation);
    const year = calculateMercuryYearDay(this.mercuryState.orbitalAngle);
    const rotations = calculateRotationCount(this.mercuryState.rotation);
    const orbits = calculateOrbitCount(this.mercuryState.orbitalAngle);
    const localTime = calculateLocalTime(this.mercuryState.rotation);
    const termSpeed = calculateTerminatorSpeed(
      this.mercuryState.orbitalAngle,
      this.mercuryState.eccentricity
    );

    this.uiController.updateMercuryDay(day);
    this.uiController.updateMercuryYear(year);
    this.uiController.updateResonance(rotations, orbits);
    this.uiController.updateLocalTime(localTime);
    this.uiController.updateTerminatorSpeed(termSpeed);
  }

  /**
   * Starts animation loop
   */
  startAnimation() {
    this.animate();
  }

  /**
   * Handles initialization errors
   */
  handleInitializationError(error) {
    console.error('Application initialization failed:', error);
    const loading = document.getElementById(DOM_IDS.LOADING);
    if (loading) {
      loading.textContent = `Ошибка: ${error.message}`;
      loading.style.color = '#ff0000';
    }
  }

  /**
   * Cleanup and dispose
   */
  dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.scene) {
      this.scene.dispose();
    }
    if (this.uiController) {
      this.uiController.dispose();
    }
  }
}
