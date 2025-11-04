/**
 * SolarSystemApp.js
 *
 * Main orchestrator for the complete solar system simulation
 * Integrates all physics services with Three.js rendering
 */

import { CELESTIAL_BODIES } from './config/celestialBodies.js';
import { RENDERING, PHYSICS, UI } from './config/constants.js';
import { calculateBodyPosition, calculateOrbitalPhase, calculateDistanceFromSun, calculateOrbitalPosition } from './domain/services/OrbitalMechanics.js';
import { calculateBodyRotation, calculateSubSolarPoint } from './domain/services/RotationalMechanics.js';
import { getSunDirectionInBodyFrame } from './domain/services/CoordinateTransforms.js';
import { validateDOMElement, validateWebGLSupport } from './infrastructure/utils/ValidationUtils.js';

export class SolarSystemApp {
    constructor(containerId) {
        this.container = validateDOMElement(containerId);
        validateWebGLSupport();

        // Core state
        this.time = 0;
        this.timeSpeed = 1;
        this.isPaused = false;
        this.scaleMode = 'visible'; // 'realistic' or 'visible'

        // Scale multipliers for real-time adjustment (per mode)
        this.scaleMultipliers = {
            realistic: {
                sun: 1.0,
                planet: 1.0,
                moon: 10.0,  // Default to 10x for better moon visibility
                moonOrbit: 1.0
            },
            visible: {
                sun: 1.0,
                planet: 1.0,
                moon: 10.0,  // Default to 10x for better moon visibility
                moonOrbit: 1.0
            }
        };

        // Celestial bodies
        this.bodies = new Map();
        this.trails = new Map();
        this.labels = new Map();
        this.grids = new Map();

        // Visibility flags
        this.showOrbits = true;
        this.showLabels = false;
        this.showTrails = false;
        this.showSunGlow = true;
        this.showGrids = false;

        // Three.js components
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;

        // UI elements
        this.stats = null;
        this.infoPanel = null;

        // Initialize
        this.init();
    }

    init() {
        this.initScene();
        this.initLights();
        this.initBodies();
        this.initControls();
        this.initUI();
        this.animate();
    }

    initScene() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);

        // Add stars
        const starsGeometry = new THREE.BufferGeometry();
        const starPositions = [];
        for (let i = 0; i < 10000; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = 1000;

            starPositions.push(
                r * Math.sin(phi) * Math.cos(theta),
                r * Math.sin(phi) * Math.sin(theta),
                r * Math.cos(phi)
            );
        }
        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));

        const starsMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.5,
            sizeAttenuation: false
        });

        this.stars = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(this.stars);

        // Camera
        this.camera = new THREE.PerspectiveCamera(
            45,
            this.container.clientWidth / this.container.clientHeight,
            0.001,
            10000
        );
        this.camera.position.set(5, 3, 5);
        this.camera.lookAt(0, 0, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            logarithmicDepthBuffer: true
        });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // Handle resize
        window.addEventListener('resize', () => this.onWindowResize(), false);
    }

    initLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.2);
        this.scene.add(ambientLight);

        // Sun light (point light at origin)
        this.sunLight = new THREE.PointLight(0xffffff, 2, 100);
        this.sunLight.position.set(0, 0, 0);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.scene.add(this.sunLight);
    }

    initBodies() {
        // Create Sun
        this.createSun();

        // Create planets
        for (const [key, bodyData] of Object.entries(CELESTIAL_BODIES)) {
            if (key === 'SUN') continue;
            this.createCelestialBody(key, bodyData);
        }
    }

    createSun() {
        const sunData = CELESTIAL_BODIES.SUN;

        // Sun geometry
        const sunRadius = this.getScaledRadius(sunData.radius_km, 'star');
        const sunGeometry = new THREE.SphereGeometry(sunRadius, 64, 32);

        // Sun material (self-illuminated)
        const sunMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00
            // MeshBasicMaterial is self-illuminated, no emissive needed
        });

        const sun = new THREE.Mesh(sunGeometry, sunMaterial);
        sun.name = 'Sun';

        // Add glow effect
        const glowGeometry = new THREE.SphereGeometry(sunRadius * 1.5, 32, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff88,
            transparent: true,
            opacity: 0.3
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.name = 'SunGlow'; // Name it so we can find and update it
        glow.visible = this.showSunGlow; // Respect initial visibility setting
        sun.add(glow);

        this.scene.add(sun);
        this.bodies.set('SUN', {
            mesh: sun,
            glow: glow, // Store reference to glow sphere
            data: sunData,
            type: 'star'
        });

        // Create label for Sun
        this.createLabel('SUN', sunData.name_en || 'Sun', sun, sunRadius);
    }

    createCelestialBody(key, bodyData) {
        // Get parent radius if this is a moon
        let parentRadiusKm = null;
        if (bodyData.parent && bodyData.parent !== 'sun') {
            const parentKey = bodyData.parent.toUpperCase();
            if (CELESTIAL_BODIES[parentKey]) {
                parentRadiusKm = CELESTIAL_BODIES[parentKey].radius_km;
            }
        }

        const radius = this.getScaledRadius(bodyData.radius_km, bodyData.type, parentRadiusKm);
        const geometry = new THREE.SphereGeometry(radius, 32, 16);

        // Determine material based on body type and data
        let material;

        if (bodyData.temperature && key === 'MERCURY') {
            // Special temperature shader for Mercury
            material = this.createTemperatureMaterial(bodyData);
        } else {
            // Standard material for other bodies
            material = new THREE.MeshPhongMaterial({
                color: this.getBodyColor(key, bodyData),
                shininess: 30
            });
        }

        // Create container for planets that have moons (to separate rotation from orbit lines)
        const isParentOfMoons = !bodyData.parent || bodyData.parent === 'sun';
        let container = null;
        let mesh = null;

        if (isParentOfMoons) {
            // Create a container that doesn't rotate
            container = new THREE.Group();
            container.name = bodyData.name + '_container';

            // Create the actual planet mesh that will rotate
            mesh = new THREE.Mesh(geometry, material);
            mesh.name = bodyData.name;
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            // Add mesh to container
            container.add(mesh);
        } else {
            // Moons don't need containers
            mesh = new THREE.Mesh(geometry, material);
            mesh.name = bodyData.name;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
        }

        // Create orbit visualization
        if (bodyData.orbital) {
            const orbit = this.createOrbitLine(bodyData.orbital, bodyData.parent);

            // CRITICAL: Add moon orbits to parent CONTAINERS (not rotating meshes)
            if (bodyData.parent && bodyData.parent !== 'sun') {
                // Moon orbit should be child of parent's container
                const parentBody = this.bodies.get(bodyData.parent.toUpperCase());
                if (parentBody && parentBody.container) {
                    // Add orbit to parent's container - moves with parent but doesn't rotate
                    parentBody.container.add(orbit);
                } else {
                    // Parent not created yet, store for later
                    if (!this.pendingMoonOrbits) this.pendingMoonOrbits = new Map();
                    this.pendingMoonOrbits.set(key, { orbit, parent: bodyData.parent });
                }
            } else {
                // Planet orbits go in the scene at origin (sun position)
                this.scene.add(orbit);
            }
        }

        // Add to scene
        if (container) {
            this.scene.add(container);
        } else {
            this.scene.add(mesh);
        }

        // Store in bodies map
        this.bodies.set(key, {
            mesh: mesh,
            container: container, // Store container reference
            data: bodyData,
            type: bodyData.type,
            material: material
        });

        // Create label for this body
        this.createLabel(key, bodyData.name_en || bodyData.name, container || mesh, radius);

        // Check if any pending moon orbits need this planet as parent
        if (this.pendingMoonOrbits) {
            for (const [moonKey, pending] of this.pendingMoonOrbits) {
                if (pending.parent.toUpperCase() === key) {
                    // Now we can add the moon orbit to parent's container
                    if (container) {
                        container.add(pending.orbit);
                    }
                    this.pendingMoonOrbits.delete(moonKey);
                }
            }
        }
    }

    createTemperatureMaterial(bodyData) {
        const vertexShader = `
            varying vec3 vNormal;
            varying vec3 vPosition;

            void main() {
                vNormal = normalize(normalMatrix * normal);
                vPosition = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        const fragmentShader = `
            uniform vec3 sunDirection;
            uniform float minTemp;
            uniform float maxTemp;
            uniform float terminatorTemp;

            varying vec3 vNormal;
            varying vec3 vPosition;

            vec3 tempToColor(float temp) {
                float t = (temp - minTemp) / (maxTemp - minTemp);
                t = clamp(t, 0.0, 1.0);

                // Color gradient: cold (blue) -> terminator (orange) -> hot (yellow/white)
                vec3 cold = vec3(0.0, 0.0, 0.5);
                vec3 terminator = vec3(1.0, 0.5, 0.0);
                vec3 hot = vec3(1.0, 1.0, 0.3);

                if (t < 0.5) {
                    return mix(cold, terminator, t * 2.0);
                } else {
                    return mix(terminator, hot, (t - 0.5) * 2.0);
                }
            }

            float calculateTemperature(vec3 normal, vec3 sunDir) {
                float cosAngle = dot(normal, sunDir);

                if (cosAngle > 0.99) {
                    // Subsolar point
                    return maxTemp;
                } else if (cosAngle > 0.0) {
                    // Day side
                    float dayTemp = mix(terminatorTemp, maxTemp, pow(cosAngle, 0.25));
                    return dayTemp;
                } else {
                    // Night side
                    return minTemp;
                }
            }

            void main() {
                float temperature = calculateTemperature(vNormal, sunDirection);
                vec3 color = tempToColor(temperature);
                gl_FragColor = vec4(color, 1.0);
            }
        `;

        return new THREE.ShaderMaterial({
            uniforms: {
                sunDirection: { value: new THREE.Vector3(1, 0, 0) },
                minTemp: { value: bodyData.temperature.min_c },
                maxTemp: { value: bodyData.temperature.max_c },
                terminatorTemp: { value: bodyData.temperature.terminator_c || 100 }
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader
        });
    }

    createOrbitLine(orbital, parent) {
        const points = [];
        const segments = 128;

        // Determine if this is a moon orbit
        const isMoonOrbit = parent && parent !== 'sun';

        // Calculate proper scale for orbits - MUST match moon position calculation exactly
        let orbitScale;
        let semiMajorAxis;

        if (isMoonOrbit) {
            // For moons, convert km to AU (same as position calculation)
            semiMajorAxis = orbital.semi_major_axis_km / 149597870.7;

            // Calculate same dynamic scale as moon position
            const parentBody = this.bodies.get(parent.toUpperCase());
            if (parentBody && parentBody.mesh) {
                const parentRadius = parentBody.mesh.geometry.parameters.radius;
                // Need to estimate moon radius (use minimum for orbit calculation)
                const moonRadius = 0.0005; // Minimum moon size
                const minSafeDistance = (parentRadius + moonRadius) * 1.5;

                // Same scale calculation as position with multiplier
                if (this.scaleMode === 'realistic') {
                    const baseScale = 10 * this.scaleMultipliers[this.scaleMode].moonOrbit;
                    const neededScale = minSafeDistance / semiMajorAxis;
                    orbitScale = Math.max(baseScale, neededScale);
                } else {
                    const baseScale = 20 * this.scaleMultipliers[this.scaleMode].moonOrbit;
                    const neededScale = minSafeDistance * 2 / semiMajorAxis;
                    orbitScale = Math.max(baseScale, neededScale);
                }
            } else {
                // Fallback if parent not found
                orbitScale = (this.scaleMode === 'realistic' ? 10 : 20) * this.scaleMultipliers[this.scaleMode].moonOrbit;
            }
        } else {
            // Planet orbits use AU directly
            semiMajorAxis = orbital.semi_major_axis_au || orbital.semi_major_axis_km / 149597870.7;
            orbitScale = this.getScaleForDistance();
        }

        // For planets, use full orbital elements to match actual path
        if (!isMoonOrbit) {
            // Calculate orbit with full orbital elements
            const meanMotion = (2 * Math.PI) / (orbital.period_days || 365.25);

            for (let i = 0; i <= segments; i++) {
                // Create a fake time that covers one complete orbit
                const fakeTime = (i / segments) * (orbital.period_days || 365.25);

                // Use same calculation as planet position
                const position = calculateBodyPosition({
                    semiMajorAxis: semiMajorAxis,
                    eccentricity: orbital.eccentricity || 0,
                    inclination: (orbital.inclination || 0) * Math.PI / 180,
                    longitudeOfAscendingNode: (orbital.longitude_ascending_node || 0) * Math.PI / 180,
                    argumentOfPerihelion: (orbital.argument_perihelion || 0) * Math.PI / 180,
                    orbitalPeriod: orbital.period_days || 365.25,
                    mean_anomaly_epoch: orbital.mean_anomaly_epoch || 0 // Use real J2000.0 positions!
                }, fakeTime);

                points.push(new THREE.Vector3(
                    position.x * orbitScale,
                    position.z * orbitScale, // Swap Y and Z for Three.js
                    -position.y * orbitScale
                ));
            }
        } else {
            // Moons also use full calculation for accuracy
            for (let i = 0; i <= segments; i++) {
                const fakeTime = (i / segments) * (orbital.period_days || 27.3);

                const position = calculateBodyPosition({
                    semiMajorAxis: semiMajorAxis,
                    eccentricity: orbital.eccentricity || 0,
                    inclination: (orbital.inclination || 0) * Math.PI / 180,
                    longitudeOfAscendingNode: (orbital.longitude_ascending_node || 0) * Math.PI / 180,
                    argumentOfPerihelion: (orbital.argument_perihelion || 0) * Math.PI / 180,
                    orbitalPeriod: orbital.period_days || 27.3,
                    mean_anomaly_epoch: orbital.mean_anomaly_epoch || 0 // Use real J2000.0 positions!
                }, fakeTime);

                points.push(new THREE.Vector3(
                    position.x * orbitScale,
                    position.z * orbitScale, // Swap Y and Z for Three.js
                    -position.y * orbitScale
                ));
            }
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: isMoonOrbit ? 0x88ff88 : 0xffffff,  // Green for moons, white for planets
            transparent: true,
            opacity: isMoonOrbit ? 0.6 : 0.4
        });

        const orbitLine = new THREE.Line(geometry, material);

        return orbitLine;
    }

    getBodyColor(key, bodyData) {
        // Define colors for known bodies
        const colors = {
            MERCURY: 0x888888,
            VENUS: 0xffc649,
            EARTH: 0x4444ff,
            MARS: 0xff4444,
            JUPITER: 0xcc9966,
            SATURN: 0xffcc99,
            URANUS: 0x66ffff,
            NEPTUNE: 0x4444ff,
            PLUTO: 0x886644,
            MOON: 0xaaaaaa
        };

        return colors[key] || 0x888888;
    }

    getScaledRadius(radiusKm, type, parentRadiusKm = null) {
        let scale;

        if (this.scaleMode === 'realistic') {
            // Realistic scale with adjustments for visibility
            if (type === 'moon') {
                // Moons should maintain proper ratio but have minimum size
                const baseScale = radiusKm / 1000000; // Same scale as planets
                const minMoonSize = 0.0005; // Minimum visible size
                // Use actual scale but ensure minimum visibility
                scale = Math.max(baseScale, minMoonSize) * this.scaleMultipliers[this.scaleMode].moon;
            } else if (type === 'star') {
                // Sun at reduced scale to fit scene
                scale = (radiusKm / 5000000) * this.scaleMultipliers[this.scaleMode].sun;
            } else {
                // Planets at realistic scale
                scale = (radiusKm / 1000000) * this.scaleMultipliers[this.scaleMode].planet;
            }
        } else {
            // Visible scale - relative sizing
            if (type === 'moon' && parentRadiusKm) {
                // Moon size relative to parent's BASE size (not affected by planet multiplier)
                const ratio = radiusKm / parentRadiusKm;
                const parentBaseScale = Math.log10(parentRadiusKm + 1) * 0.001; // No planet multiplier here!
                // Keep relative size but ensure visibility
                scale = Math.max(parentBaseScale * ratio * 2, 0.0002) * this.scaleMultipliers[this.scaleMode].moon;
            } else if (type === 'star') {
                // Logarithmic but smaller
                scale = Math.log10(radiusKm + 1) * 0.0003 * this.scaleMultipliers[this.scaleMode].sun;
            } else if (type === 'moon') {
                // Fallback for moons without parent reference
                scale = Math.log10(radiusKm + 1) * 0.0008 * this.scaleMultipliers[this.scaleMode].moon;
            } else {
                // Planets - standard logarithmic
                scale = Math.log10(radiusKm + 1) * 0.001 * this.scaleMultipliers[this.scaleMode].planet;
            }
        }

        return scale;
    }

    getScaleForDistance() {
        if (this.scaleMode === 'realistic') {
            return 1; // AU scale
        } else {
            // Compressed distances for visibility
            return 10; // 10x AU scale for visible mode
        }
    }

    initControls() {
        // Orbit controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 0.1;
        this.controls.maxDistance = 1000;

        // Mouse picking
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.renderer.domElement.addEventListener('click', (event) => this.onMouseClick(event), false);
        this.renderer.domElement.addEventListener('mousemove', (event) => this.onMouseMove(event), false);
    }

    initUI() {
        // Time controls
        const timeControls = document.getElementById('time-controls');
        if (timeControls) {
            // Play/Pause button
            const playBtn = document.getElementById('play-pause');
            if (playBtn) {
                playBtn.addEventListener('click', () => {
                    this.isPaused = !this.isPaused;
                    playBtn.textContent = this.isPaused ? '▶' : '⏸';
                });
            }

            // Speed slider
            const speedSlider = document.getElementById('speed-slider');
            if (speedSlider) {
                speedSlider.addEventListener('input', (e) => {
                    this.timeSpeed = parseFloat(e.target.value);
                    const speedDisplay = document.getElementById('speed-display');
                    if (speedDisplay) {
                        speedDisplay.textContent = `${this.timeSpeed}x`;
                    }
                });
            }

            // Scale mode toggle
            const scaleToggle = document.getElementById('scale-mode');
            if (scaleToggle) {
                scaleToggle.addEventListener('change', (e) => {
                    this.scaleMode = e.target.checked ? 'realistic' : 'visible';
                    this.updateScale();
                });
            }
        }

        // Info panel
        this.infoPanel = document.getElementById('info-panel');
    }

    updateBodies(deltaTime) {
        if (!this.isPaused) {
            this.time += deltaTime * this.timeSpeed;
        }

        for (const [key, body] of this.bodies) {
            if (key === 'SUN') continue;

            const { mesh, container, data, material } = body;

            // Update orbital position
            if (data.orbital) {
                const orbital = data.orbital;

                // Check if this is a moon (has a parent that isn't sun)
                if (data.parent && data.parent !== 'sun') {
                    // Calculate position relative to parent
                    const parentBody = this.bodies.get(data.parent.toUpperCase());
                    if (parentBody) {
                        const position = calculateBodyPosition({
                            semiMajorAxis: orbital.semi_major_axis_km / 149597870.7, // Convert km to AU for moons
                            eccentricity: orbital.eccentricity || 0,
                            inclination: (orbital.inclination || 0) * Math.PI / 180,
                            longitudeOfAscendingNode: (orbital.longitude_ascending_node || 0) * Math.PI / 180,
                            argumentOfPerihelion: (orbital.argument_perihelion || 0) * Math.PI / 180,
                            orbitalPeriod: orbital.period_days || 365.25,
                            mean_anomaly_epoch: orbital.mean_anomaly_epoch || 0 // Use real J2000.0 positions!
                        }, this.time);

                        // Scale for moon distances
                        // For realistic mode: use actual astronomical proportions
                        // For visible mode: compress for visibility
                        const parentRadius = parentBody.mesh.geometry.parameters.radius;

                        // Moon orbits need smart scaling
                        // The position is already in AU from calculateBodyPosition
                        // Calculate minimum safe distance from parent
                        const minSafeDistance = (parentRadius + mesh.geometry.parameters.radius) * 1.5;

                        // Calculate actual orbit distance in AU
                        const orbitAU = orbital.semi_major_axis_km / 149597870.7;

                        // Calculate scale that ensures moon clears parent with multiplier
                        let moonOrbitScale;
                        if (this.scaleMode === 'realistic') {
                            // Ensure minimum clearance from parent
                            const baseScale = 10 * this.scaleMultipliers[this.scaleMode].moonOrbit;
                            const neededScale = minSafeDistance / orbitAU;
                            moonOrbitScale = Math.max(baseScale, neededScale);
                        } else {
                            // Visible mode - even more clearance
                            const baseScale = 20 * this.scaleMultipliers[this.scaleMode].moonOrbit;
                            const neededScale = minSafeDistance * 2 / orbitAU;
                            moonOrbitScale = Math.max(baseScale, neededScale);
                        }

                        // Position relative to parent's container (or mesh if no container)
                        const parentObject = parentBody.container || parentBody.mesh;
                        mesh.position.set(
                            parentObject.position.x + position.x * moonOrbitScale,
                            parentObject.position.y + position.z * moonOrbitScale,
                            parentObject.position.z - position.y * moonOrbitScale
                        );
                    }
                } else {
                    // Planet orbiting the sun
                    const position = calculateBodyPosition({
                        semiMajorAxis: orbital.semi_major_axis_au || orbital.semi_major_axis_km / 149597870.7,
                        eccentricity: orbital.eccentricity || 0,
                        inclination: (orbital.inclination || 0) * Math.PI / 180,
                        longitudeOfAscendingNode: (orbital.longitude_ascending_node || 0) * Math.PI / 180,
                        argumentOfPerihelion: (orbital.argument_perihelion || 0) * Math.PI / 180,
                        orbitalPeriod: orbital.period_days || 365.25,
                        mean_anomaly_epoch: orbital.mean_anomaly_epoch || 0 // Use real J2000.0 positions!
                    }, this.time);

                    const scale = this.getScaleForDistance();

                    // Move the container for planets (which holds orbit lines)
                    // Move the mesh directly for moons
                    const objectToMove = container || mesh;
                    objectToMove.position.set(
                        position.x * scale,
                        position.z * scale, // Swap Y and Z for Three.js
                        -position.y * scale
                    );
                }
            }

            // Update rotation (only rotates the mesh, not container)
            if (data.rotation) {
                const rotation = calculateBodyRotation(data.rotation, this.time, 0, data.orbital?.period_days || 365.25);
                // Always rotate the mesh, never the container
                // This way orbit lines stay fixed while planet spins

                // Apply rotation with proper axial tilt
                if (data.rotation.axial_tilt !== undefined && data.rotation.axial_tilt !== 0) {
                    // For planets with extreme tilt (like Uranus), we need to orient the tilt
                    // based on orbital position so poles can point toward/away from sun

                    // 1. Tilt direction should be FIXED in space (not rotating with orbit)
                    // pole_direction defines which direction in space the north pole points
                    // 0° = +X axis, 90° = +Z axis, etc.
                    const poleDirectionRad = (data.rotation.pole_direction || 0) * Math.PI / 180;
                    const tiltDirection = poleDirectionRad; // Fixed in space!

                    // 2. Create quaternion for tilt direction (rotate tilt around Y axis)
                    const tiltDirQuat = new THREE.Quaternion();
                    tiltDirQuat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), tiltDirection);

                    // 3. Create tilt quaternion (rotation around X axis)
                    const tiltRad = (data.rotation.axial_tilt * Math.PI) / 180;
                    const tiltQuat = new THREE.Quaternion();
                    tiltQuat.setFromAxisAngle(new THREE.Vector3(1, 0, 0), tiltRad);

                    // 4. Create rotation quaternion (around Y axis - spin)
                    const rotQuat = new THREE.Quaternion();
                    rotQuat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotation.angle);

                    // 5. Combine: tiltDirection * tilt * rotation
                    const tempQuat = new THREE.Quaternion();
                    tempQuat.multiplyQuaternions(tiltQuat, rotQuat);

                    const finalQuat = new THREE.Quaternion();
                    finalQuat.multiplyQuaternions(tiltDirQuat, tempQuat);

                    mesh.quaternion.copy(finalQuat);
                } else {
                    // Simple Y-axis rotation for bodies without tilt
                    mesh.rotation.x = 0;
                    mesh.rotation.y = rotation.angle;
                    mesh.rotation.z = 0;
                }
            }

            // Update temperature shader for Mercury
            if (key === 'MERCURY' && material.uniforms) {
                mesh.updateMatrixWorld();
                const sunPos = new THREE.Vector3(0, 0, 0);
                const mercuryPos = mesh.position.clone();
                const toSun = sunPos.sub(mercuryPos).normalize();

                // Transform to Mercury's local space
                const mercuryMatrixInverse = new THREE.Matrix4().copy(mesh.matrixWorld).invert();
                const sunDirLocal = toSun.clone().applyMatrix4(mercuryMatrixInverse).normalize();

                material.uniforms.sunDirection.value.copy(sunDirLocal);
            }
        }

        // Moon orbits are now children of their parent planets
        // They move automatically with their parents - no update needed!
    }

    updateScale() {
        // Recreate all bodies with new scale
        // This is a simplified approach - in production you'd update existing geometries
        const gridsWereVisible = this.showGrids;
        const trailsWereVisible = this.showTrails;

        this.clearBodies();
        this.initBodies();

        // Force immediate position update to ensure everything is placed correctly
        this.updateBodies(0);

        // Recreate grids if they were visible
        if (gridsWereVisible) {
            for (const [key, body] of this.bodies) {
                const mesh = body.mesh;
                const radius = mesh.geometry.parameters.radius;
                // IMPORTANT: Always add grid to MESH (not container) so it rotates with the planet
                this.createLatLongGrid(key, radius * 1.01, mesh);
            }
        }

        // Recreate trails if they were visible
        if (trailsWereVisible) {
            for (const [key, body] of this.bodies) {
                if (key !== 'SUN') {
                    this.createTrail(key);
                }
            }
        }
    }

    clearBodies() {
        for (const [key, body] of this.bodies) {
            // Remove the container if it exists (for planets), otherwise remove mesh directly
            if (body.container) {
                // Dispose all children in container (mesh, orbit lines, etc.)
                body.container.traverse((child) => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose();
                });
                this.scene.remove(body.container);
            } else {
                // For moons without containers
                this.scene.remove(body.mesh);
                if (body.mesh.geometry) body.mesh.geometry.dispose();
                if (body.mesh.material) body.mesh.material.dispose();
            }

            // Clean up sun glow if present
            if (body.glow) {
                if (body.glow.geometry) body.glow.geometry.dispose();
                if (body.glow.material) body.glow.material.dispose();
            }
        }
        this.bodies.clear();

        // Also clear any standalone orbit lines (planet orbits)
        this.scene.children.filter(child => child.type === 'Line').forEach(line => {
            if (line.geometry) line.geometry.dispose();
            if (line.material) line.material.dispose();
            this.scene.remove(line);
        });

        // Clear trails
        for (const [key, trail] of this.trails) {
            if (trail.line) {
                if (trail.line.geometry) trail.line.geometry.dispose();
                if (trail.line.material) trail.line.material.dispose();
                this.scene.remove(trail.line);
            }
        }
        this.trails.clear();

        // Clear labels
        for (const [key, label] of this.labels) {
            if (label.material && label.material.map) {
                label.material.map.dispose();
            }
            if (label.material) label.material.dispose();
            // Label is child of container/mesh, so it gets removed automatically
        }
        this.labels.clear();

        // Clear grids
        for (const [key, grid] of this.grids) {
            grid.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
            // Grid is child of container/mesh, so it gets removed automatically
        }
        this.grids.clear();

        // Clear pending moon orbits
        if (this.pendingMoonOrbits) {
            this.pendingMoonOrbits.clear();
        }
    }

    onMouseClick(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        const meshes = Array.from(this.bodies.values()).map(b => b.mesh);
        const intersects = this.raycaster.intersectObjects(meshes);

        if (intersects.length > 0) {
            const selected = intersects[0].object;
            this.showBodyInfo(selected.name);

            // Focus camera on selected body
            this.controls.target.copy(selected.position);
        }
    }

    onMouseMove(event) {
        // Update mouse position for hover effects
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    showBodyInfo(name) {
        if (!this.infoPanel) return;

        // Find body data
        let bodyData = null;
        let bodyKey = null;
        for (const [key, data] of Object.entries(CELESTIAL_BODIES)) {
            if (data.name === name) {
                bodyData = data;
                bodyKey = key;
                break;
            }
        }

        if (!bodyData) return;

        // Build info HTML
        let html = `<h3>${bodyData.name}</h3>`;
        html += `<p>Type: ${bodyData.type}</p>`;

        if (bodyData.radius_km) {
            html += `<p>Radius: ${bodyData.radius_km.toLocaleString()} km</p>`;
        }

        if (bodyData.orbital) {
            const orbital = bodyData.orbital;
            if (orbital.period_days) {
                html += `<p>Orbital Period: ${orbital.period_days.toFixed(2)} days</p>`;
            }
            if (orbital.semi_major_axis_au) {
                html += `<p>Distance: ${orbital.semi_major_axis_au.toFixed(3)} AU</p>`;
            }
            if (orbital.eccentricity) {
                html += `<p>Eccentricity: ${orbital.eccentricity.toFixed(3)}</p>`;
            }
        }

        if (bodyData.rotation) {
            const rotation = bodyData.rotation;
            if (rotation.period_days) {
                html += `<p>Rotation Period: ${Math.abs(rotation.period_days).toFixed(2)} days</p>`;
                if (rotation.period_days < 0) {
                    html += `<p>(Retrograde)</p>`;
                }
            }
            if (rotation.resonance) {
                html += `<p>Resonance: ${rotation.resonance.rotations}:${rotation.resonance.orbits}</p>`;
            }
        }

        if (bodyData.temperature) {
            const temp = bodyData.temperature;
            html += `<p>Temperature: ${temp.min_c}°C to ${temp.max_c}°C</p>`;
        }

        this.infoPanel.innerHTML = html;
        this.infoPanel.style.display = 'block';
    }

    onWindowResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Update physics
        this.updateBodies(0.01); // Fixed timestep for now

        // Update trails
        this.updateTrails();

        // Update date/time display (throttled - only update every 10 frames)
        if (!this.frameCount) this.frameCount = 0;
        this.frameCount++;
        if (this.frameCount % 10 === 0) {
            this.updateDateDisplay();
        }

        // Update controls
        this.controls.update();

        // Render
        this.renderer.render(this.scene, this.camera);
    }

    // Public API
    setTimeSpeed(speed) {
        this.timeSpeed = speed;
    }

    togglePause() {
        this.isPaused = !this.isPaused;
    }

    focusOnBody(bodyKey) {
        const body = this.bodies.get(bodyKey);
        if (body) {
            // Focus on container for planets, mesh for moons
            const targetObject = body.container || body.mesh;
            this.controls.target.copy(targetObject.position);
        }
    }

    setScaleMode(mode) {
        if (mode === 'realistic' || mode === 'visible') {
            this.scaleMode = mode;
            this.updateScale();
        }
    }

    getCurrentTime() {
        return this.time;
    }

    reset() {
        this.time = 0;
        this.updateBodies(0);
    }

    /**
     * Update scale multipliers and refresh all bodies
     */
    updateScaleMultiplier(type, value) {
        this.scaleMultipliers[this.scaleMode][type] = value;

        // Simply call updateScale() which already handles recreating everything
        // including grids, labels, and trails with proper cleanup
        this.updateScale();
    }

    /**
     * Set simulation time (days since J2000.0 epoch)
     * @param {number} timeDays - Days since epoch
     */
    setTime(timeDays) {
        this.time = timeDays;
    }

    /**
     * Get current simulation time
     * @returns {number} Days since J2000.0 epoch
     */
    getTime() {
        return this.time;
    }

    /**
     * Set time by real date
     * @param {Date} date - JavaScript Date object
     */
    setTimeByDate(date) {
        // Import dateToSimulationTime dynamically
        import('./domain/services/DateTimeService.js').then(({ dateToSimulationTime }) => {
            this.time = dateToSimulationTime(date);
            this.updateBodies(0); // Force immediate update
            this.updateDateDisplay();
        });
    }

    /**
     * Get current date corresponding to simulation time
     * @returns {Date} JavaScript Date object
     */
    getCurrentDate() {
        // We'll need to import this dynamically in the method that uses it
        return null; // Placeholder - will be set up in event handlers
    }

    /**
     * Update date/time display in UI
     */
    updateDateDisplay() {
        const currentDateEl = document.getElementById('current-date');
        const daysSinceEpochEl = document.getElementById('days-since-epoch');

        if (currentDateEl && daysSinceEpochEl) {
            import('./domain/services/DateTimeService.js').then(({ simulationTimeToDate, formatDate }) => {
                const currentDate = simulationTimeToDate(this.time);
                currentDateEl.textContent = formatDate(currentDate);
                daysSinceEpochEl.textContent = `Days since J2000.0: ${this.time.toFixed(2)}`;
            });
        }
    }

    /**
     * Get current scale multipliers
     */
    getScaleMultipliers() {
        return { ...this.scaleMultipliers[this.scaleMode] };
    }

    /**
     * Create text label for a celestial body
     */
    createLabel(key, name, parentObject, radius) {
        // Create canvas for text
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;

        // Ensure transparent background
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Draw text
        context.fillStyle = '#00ff00';
        context.font = 'Bold 24px Arial';
        context.textAlign = 'center';
        context.fillText(name, 128, 40);

        // Create texture from canvas with explicit alpha handling
        const texture = new THREE.CanvasTexture(canvas);
        texture.format = THREE.RGBAFormat;
        const spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthWrite: false
        });
        const sprite = new THREE.Sprite(spriteMaterial);

        // Scale and position - relative to object size
        sprite.scale.set(2, 0.5, 1);
        sprite.position.set(0, radius + 0.2, 0); // Slightly above the object

        // Add to parent
        parentObject.add(sprite);

        // Initially hidden
        sprite.visible = this.showLabels;

        // Store reference
        this.labels.set(key, sprite);
    }

    /**
     * Create latitude/longitude grid for a celestial body
     */
    createLatLongGrid(key, radius, parentObject) {
        const latLines = 12; // Every 15 degrees
        const longLines = 24; // Every 15 degrees
        const group = new THREE.Group();

        // Latitude lines (parallels)
        for (let lat = -75; lat <= 75; lat += 15) {
            const latRad = (lat * Math.PI) / 180;
            const circleRadius = radius * Math.cos(latRad);
            const y = radius * Math.sin(latRad);

            const points = [];
            for (let i = 0; i <= 64; i++) {
                const angle = (i / 64) * Math.PI * 2;
                points.push(new THREE.Vector3(
                    circleRadius * Math.cos(angle),
                    y,
                    circleRadius * Math.sin(angle)
                ));
            }

            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({
                color: lat === 0 ? 0x00ff00 : 0x0088ff, // Equator green, others blue
                transparent: true,
                opacity: 0.4
            });
            const line = new THREE.Line(geometry, material);
            group.add(line);
        }

        // Longitude lines (meridians)
        for (let long = 0; long < 360; long += 15) {
            const longRad = (long * Math.PI) / 180;

            const points = [];
            for (let i = 0; i <= 32; i++) {
                const lat = ((i / 32) * 180 - 90) * Math.PI / 180;
                points.push(new THREE.Vector3(
                    radius * Math.cos(lat) * Math.cos(longRad),
                    radius * Math.sin(lat),
                    radius * Math.cos(lat) * Math.sin(longRad)
                ));
            }

            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({
                color: long === 0 ? 0xff0000 : 0x0088ff, // Prime meridian red, others blue
                transparent: true,
                opacity: 0.4
            });
            const line = new THREE.Line(geometry, material);
            group.add(line);
        }

        group.visible = this.showGrids;
        parentObject.add(group);
        this.grids.set(key, group);
    }

    /**
     * Toggle grid visibility
     */
    toggleGrids(visible) {
        this.showGrids = visible;

        if (visible && this.grids.size === 0) {
            // Create grids for all bodies
            for (const [key, body] of this.bodies) {
                const mesh = body.mesh;
                const radius = mesh.geometry.parameters.radius;
                // IMPORTANT: Always add grid to MESH (not container) so it rotates with the planet
                this.createLatLongGrid(key, radius * 1.01, mesh);
            }
        } else {
            // Toggle visibility of existing grids
            for (const [key, grid] of this.grids) {
                grid.visible = visible;
            }
        }
    }

    /**
     * Toggle orbit visibility
     */
    toggleOrbits(visible) {
        this.showOrbits = visible;

        // Toggle all orbit lines
        this.scene.traverse((child) => {
            if (child.type === 'Line') {
                child.visible = visible;
            }
        });

        // Toggle moon orbit lines (children of containers)
        for (const [key, body] of this.bodies) {
            if (body.container) {
                body.container.traverse((child) => {
                    if (child.type === 'Line') {
                        child.visible = visible;
                    }
                });
            }
        }
    }

    /**
     * Toggle label visibility
     */
    toggleLabels(visible) {
        this.showLabels = visible;
        for (const [key, label] of this.labels) {
            label.visible = visible;
        }
    }

    /**
     * Toggle trail visibility
     */
    toggleTrails(visible) {
        this.showTrails = visible;

        if (visible && this.trails.size === 0) {
            // Create trails for all bodies
            for (const [key, body] of this.bodies) {
                if (key !== 'SUN') {
                    this.createTrail(key);
                }
            }
        } else {
            // Toggle visibility of existing trails
            for (const [key, trail] of this.trails) {
                trail.line.visible = visible;
            }
        }
    }

    /**
     * Toggle sun glow visibility
     */
    toggleSunGlow(visible) {
        this.showSunGlow = visible;
        const sunBody = this.bodies.get('SUN');
        if (sunBody && sunBody.glow) {
            sunBody.glow.visible = visible;
        }
    }

    /**
     * Create trail for a body
     */
    createTrail(key) {
        const maxPoints = 500; // Number of points in trail
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(maxPoints * 3);
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.LineBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.5
        });

        const trail = new THREE.Line(geometry, material);
        trail.visible = this.showTrails;
        this.scene.add(trail);

        this.trails.set(key, {
            line: trail,
            positions: [],
            maxPoints: maxPoints
        });
    }

    /**
     * Update trails
     */
    updateTrails() {
        if (!this.showTrails) return;

        for (const [key, body] of this.bodies) {
            if (key === 'SUN') continue;

            const trail = this.trails.get(key);
            if (!trail) continue;

            // Get current position
            const object = body.container || body.mesh;
            const pos = object.position.clone();

            // Add to trail
            trail.positions.push(pos);
            if (trail.positions.length > trail.maxPoints) {
                trail.positions.shift();
            }

            // Update geometry
            const positions = trail.line.geometry.attributes.position.array;
            for (let i = 0; i < trail.positions.length; i++) {
                positions[i * 3] = trail.positions[i].x;
                positions[i * 3 + 1] = trail.positions[i].y;
                positions[i * 3 + 2] = trail.positions[i].z;
            }

            trail.line.geometry.attributes.position.needsUpdate = true;
            trail.line.geometry.setDrawRange(0, trail.positions.length);
        }
    }
}

// Export for module usage
export default SolarSystemApp;