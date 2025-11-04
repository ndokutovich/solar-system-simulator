/**
 * Main entry point - Minimal test version
 * Testing Mercury with proper sun-locked temperature
 */

import { SCENE_CONFIG, CAMERA_CONFIG, SUN_CONFIG, DOM_IDS } from './config/constants.js';
import { CELESTIAL_BODIES } from './config/celestialBodies.js';
import { validateWebGLSupport, validateThreeJS } from './infrastructure/utils/ValidationUtils.js';
import { getSunDirectionInBodyFrame, Vector3 } from './domain/services/CoordinateTransforms.js';

// Simple temperature shader that uses sun direction
const temperatureVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const temperatureFragmentShader = `
  uniform vec3 sunDirection;
  uniform float minTemp;
  uniform float maxTemp;
  uniform bool showGrid;

  varying vec3 vNormal;
  varying vec3 vPosition;

  vec3 temperatureToColor(float temp, float minT, float maxT) {
    float normalized = (temp - minT) / (maxT - minT);

    // Color gradient from cold (blue) to hot (red)
    if (normalized < 0.25) {
      // Deep cold: blue
      return vec3(0.0, 0.0, 0.5 + normalized * 2.0);
    } else if (normalized < 0.5) {
      // Cold to cool: blue to cyan
      float t = (normalized - 0.25) * 4.0;
      return vec3(0.0, t, 1.0);
    } else if (normalized < 0.75) {
      // Warm: yellow
      float t = (normalized - 0.5) * 4.0;
      return vec3(1.0, 1.0, 1.0 - t);
    } else {
      // Hot: orange to red
      float t = (normalized - 0.75) * 4.0;
      return vec3(1.0, 1.0 - t * 0.5, 0.0);
    }
  }

  float calculateTemperature(vec3 normal, vec3 sunDir) {
    float cosAngle = dot(normal, sunDir);

    // Subsolar point (sun overhead)
    if (cosAngle > 0.99) {
      return maxTemp;
    }
    // Day side
    else if (cosAngle > 0.0) {
      return mix(minTemp + (maxTemp - minTemp) * 0.3, maxTemp, pow(cosAngle, 0.25));
    }
    // Night side
    else {
      return minTemp;
    }
  }

  void main() {
    vec3 normal = normalize(vNormal);

    // Calculate temperature based on sun angle
    float temp = calculateTemperature(normal, normalize(sunDirection));

    // Convert to color
    vec3 color = temperatureToColor(temp, minTemp, maxTemp);

    // Optional grid overlay
    if (showGrid) {
      float lon = atan(vPosition.z, vPosition.x);
      float lat = asin(vPosition.y / length(vPosition));

      float lonLines = abs(fract(degrees(lon) / 10.0) - 0.5);
      float latLines = abs(fract(degrees(lat) / 10.0) - 0.5);

      if (min(lonLines, latLines) < 0.05) {
        color = mix(vec3(0.0, 1.0, 0.0), color, 0.5);
      }
    }

    gl_FragColor = vec4(color, 1.0);
  }
`;

class MinimalSolarSystem {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;

    this.sun = null;
    this.mercury = null;
    this.mercuryMaterial = null;

    this.time = 0;
    this.isPaused = false;
    this.timeSpeed = 1;
  }

  initialize() {
    try {
      // Validate environment
      validateThreeJS();
      validateWebGLSupport();

      this.setupScene();
      this.setupLights();
      this.createSun();
      this.createMercury();
      this.setupControls();
      this.hideLoading();
      this.animate();

      console.log('🚀 Solar System initialized successfully!');
      console.log('🔥 Mercury temperature should track sun position');
      console.log('📍 Hot side (red) should always face sun');
      console.log('❄️ Cold side (blue) should always face away');

    } catch (error) {
      console.error('Initialization failed:', error);
      this.showError(error.message);
    }
  }

  setupScene() {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(SCENE_CONFIG.BACKGROUND_COLOR);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      CAMERA_CONFIG.FOV,
      window.innerWidth / window.innerHeight,
      CAMERA_CONFIG.NEAR,
      CAMERA_CONFIG.FAR
    );
    this.camera.position.set(30, 20, 30);

    // Renderer
    const canvas = document.getElementById(DOM_IDS.CANVAS_CONTAINER);
    this.renderer = new THREE.WebGLRenderer({
      antialias: SCENE_CONFIG.ANTIALIAS,
      logarithmicDepthBuffer: SCENE_CONFIG.LOGARITHMIC_DEPTH
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(SCENE_CONFIG.PIXEL_RATIO);
    canvas.appendChild(this.renderer.domElement);

    // Resize handler
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  setupLights() {
    // Ambient light (so we can see the back side)
    const ambient = new THREE.AmbientLight(0x404040, 0.3);
    this.scene.add(ambient);
  }

  createSun() {
    // Sun sphere
    const sunGeometry = new THREE.SphereGeometry(3, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({
      color: SUN_CONFIG.COLOR,
      emissive: SUN_CONFIG.EMISSIVE,
      emissiveIntensity: SUN_CONFIG.EMISSIVE_INTENSITY
    });
    this.sun = new THREE.Mesh(sunGeometry, sunMaterial);
    this.sun.position.set(0, 0, 0);
    this.scene.add(this.sun);

    // Sun light
    const sunLight = new THREE.DirectionalLight(SUN_CONFIG.LIGHT_COLOR, SUN_CONFIG.LIGHT_INTENSITY);
    sunLight.position.set(0, 0, 0);
    this.scene.add(sunLight);

    // Point light for better illumination
    const pointLight = new THREE.PointLight(SUN_CONFIG.LIGHT_COLOR, SUN_CONFIG.POINT_LIGHT_INTENSITY);
    pointLight.position.set(0, 0, 0);
    this.scene.add(pointLight);
  }

  createMercury() {
    const mercury = CELESTIAL_BODIES.MERCURY;

    // Mercury sphere
    const mercuryGeometry = new THREE.SphereGeometry(2, 64, 64);

    // Temperature shader material
    this.mercuryMaterial = new THREE.ShaderMaterial({
      uniforms: {
        sunDirection: { value: new THREE.Vector3(-1, 0, 0) },
        minTemp: { value: mercury.temperature.min_c },
        maxTemp: { value: mercury.temperature.max_c },
        showGrid: { value: true }
      },
      vertexShader: temperatureVertexShader,
      fragmentShader: temperatureFragmentShader,
      side: THREE.FrontSide
    });

    this.mercury = new THREE.Mesh(mercuryGeometry, this.mercuryMaterial);

    // Start at position (15, 0, 0)
    this.mercury.position.set(15, 0, 0);

    this.scene.add(this.mercury);

    // Add orbit line
    const orbitPoints = [];
    for (let i = 0; i <= 100; i++) {
      const angle = (i / 100) * Math.PI * 2;
      orbitPoints.push(new THREE.Vector3(
        Math.cos(angle) * 15,
        0,
        Math.sin(angle) * 15
      ));
    }
    const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
    const orbitMaterial = new THREE.LineBasicMaterial({
      color: 0x444466,
      opacity: 0.5,
      transparent: true
    });
    const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
    this.scene.add(orbitLine);

    // Add axes helper to Mercury
    const axes = new THREE.AxesHelper(3);
    this.mercury.add(axes);

    // Add terminators
    this.createTerminators();
  }

  createTerminators() {
    // Morning terminator (cyan)
    const morningPoints = [];
    for (let i = 0; i <= 64; i++) {
      const lat = (i / 64 - 0.5) * Math.PI;
      morningPoints.push(new THREE.Vector3(
        0,
        Math.sin(lat) * 2.01,
        Math.cos(lat) * 2.01
      ));
    }
    const morningGeometry = new THREE.BufferGeometry().setFromPoints(morningPoints);
    const morningMaterial = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      linewidth: 2,
      transparent: true,
      opacity: 0.7
    });
    const morningTerminator = new THREE.Line(morningGeometry, morningMaterial);
    morningTerminator.rotation.z = Math.PI / 2;
    this.mercury.add(morningTerminator);

    // Evening terminator (orange)
    const eveningPoints = morningPoints.map(p => p.clone());
    const eveningGeometry = new THREE.BufferGeometry().setFromPoints(eveningPoints);
    const eveningMaterial = new THREE.LineBasicMaterial({
      color: 0xff8800,
      linewidth: 2,
      transparent: true,
      opacity: 0.7
    });
    const eveningTerminator = new THREE.Line(eveningGeometry, eveningMaterial);
    eveningTerminator.rotation.z = -Math.PI / 2;
    this.mercury.add(eveningTerminator);
  }

  setupControls() {
    // OrbitControls
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = CAMERA_CONFIG.DAMPING_FACTOR;
    this.controls.target.set(0, 0, 0);

    // UI controls
    const speedSlider = document.getElementById(DOM_IDS.TIME_SPEED);
    if (speedSlider) {
      speedSlider.addEventListener('input', (e) => {
        this.timeSpeed = parseFloat(e.target.value);
        document.getElementById(DOM_IDS.SPEED_VALUE).textContent = `${this.timeSpeed.toFixed(1)}x`;
      });
    }

    const pauseBtn = document.getElementById(DOM_IDS.PAUSE_BTN);
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => {
        this.isPaused = !this.isPaused;
        pauseBtn.textContent = this.isPaused ? '▶️ Play' : '⏸️ Pause';
      });
    }

    const resetBtn = document.getElementById(DOM_IDS.RESET_BTN);
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.time = 0;
        this.mercury.position.set(15, 0, 0);
      });
    }
  }

  updatePhysics(deltaTime) {
    if (this.isPaused) return;

    // Update time
    this.time += deltaTime * this.timeSpeed * 0.01; // Scale time appropriately

    // Calculate Mercury's orbital position
    const mercury = CELESTIAL_BODIES.MERCURY;
    const orbitalAngle = (this.time / mercury.orbital.period_days) * Math.PI * 2;

    // Simple circular orbit for now (will add eccentricity later)
    this.mercury.position.x = Math.cos(orbitalAngle) * 15;
    this.mercury.position.z = Math.sin(orbitalAngle) * 15;

    // CRITICAL: Update sun direction in Mercury's body-fixed frame
    // This is the working solution from debug_temperature.html!

    // Calculate sun direction from Mercury to Sun
    const sunPos = new THREE.Vector3(0, 0, 0);
    const mercuryPos = this.mercury.position.clone();
    const toSun = sunPos.sub(mercuryPos).normalize();

    // Transform to Mercury's local space
    // This is the critical part that makes it work!
    this.mercury.updateMatrixWorld();
    const mercuryMatrixInverse = new THREE.Matrix4().copy(this.mercury.matrixWorld).invert();
    const sunDirLocal = toSun.clone().applyMatrix4(mercuryMatrixInverse).normalize();

    // Update shader uniform with LOCAL sun direction
    this.mercuryMaterial.uniforms.sunDirection.value.copy(sunDirLocal);

    // Debug logging
    if (Math.floor(this.time) % 10 === 0 && Math.floor(this.time) !== this.lastLogTime) {
      this.lastLogTime = Math.floor(this.time);
      console.log('Mercury position:', mercuryPos);
      console.log('Sun direction (local):', sunDirLocal);
      console.log('Orbital angle:', (orbitalAngle * 180 / Math.PI).toFixed(1) + '°');
    }

    // Display info
    const infoDiv = document.getElementById(DOM_IDS.SIM_DAY);
    if (infoDiv) {
      infoDiv.textContent = `Day ${Math.floor(this.time)}`;
    }

    const angleDiv = document.getElementById(DOM_IDS.SUN_ANGLE);
    if (angleDiv) {
      angleDiv.textContent = `Orbital: ${(orbitalAngle * 180 / Math.PI).toFixed(1)}°`;
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // Update physics
    this.updatePhysics(16); // Assume 60 FPS

    // Update controls
    if (this.controls) {
      this.controls.update();
    }

    // Render
    this.renderer.render(this.scene, this.camera);
  }

  hideLoading() {
    const loading = document.getElementById('loading') || document.getElementById(DOM_IDS.LOADING);
    if (loading) {
      loading.style.display = 'none';
    }
  }

  showError(message) {
    const loading = document.getElementById('loading') || document.getElementById(DOM_IDS.LOADING);
    if (loading) {
      loading.textContent = `Error: ${message}`;
      loading.style.color = '#ff0000';
    }
  }
}

// Auto-initialize only if not imported as a module
// When imported dynamically, index.html will initialize it manually
if (typeof window !== 'undefined' && !window.solarSystemApp) {
  // Only auto-initialize if loaded directly, not via dynamic import
  if (document.currentScript && document.currentScript.src) {
    window.addEventListener('DOMContentLoaded', () => {
      console.log('🌌 Auto-initializing Solar System Simulation...');
      const app = new MinimalSolarSystem();
      app.initialize();
      window.solarSystemApp = app;
    });
  }
}

// Export to make it a valid ES6 module
export default MinimalSolarSystem;