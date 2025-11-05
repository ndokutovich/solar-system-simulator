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
        this.followBody = null; // Body key to follow with camera

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
        this.terminators = new Map();

        // Visibility flags
        this.showOrbits = true;
        this.showLabels = false;
        this.showTrails = false;
        this.showSunGlow = true;
        this.showGrids = false;
        this.showTemperature = false;
        this.showTerminators = false;
        this.showAxes = false;
        this.showSunRays = false;

        // Three.js components
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;

        // UI elements
        this.stats = null;
        this.infoPanel = null;

        // Performance tracking
        this.lastTime = performance.now();
        this.frameTime = 0;
        this.fps = 0;

        // Selected body tracking
        this.selectedBodyKey = null;

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

        // Add coordinate axes to Sun (X=red, Y=green, Z=blue)
        // Axes size relative to Sun radius
        const axesSize = sunRadius * 3;
        this.axesHelper = new THREE.AxesHelper(axesSize);
        this.axesHelper.visible = this.showAxes;
        sun.add(this.axesHelper);

        this.scene.add(sun);
        this.bodies.set('SUN', {
            mesh: sun,
            glow: glow, // Store reference to glow sphere
            data: sunData,
            type: 'star',
            axes: this.axesHelper
        });

        // Create sun rays
        this.createSunRays(sunRadius);

        // Create label for Sun
        this.createLabel('SUN', sunData.name_en || 'Sun', sun, sunRadius);
    }

    createSunRays(sunRadius) {
        const rayCount = 64; // More rays for better coverage
        const rayLength = 50; // Extend to 50 AU (beyond Neptune at ~30 AU)
        const group = new THREE.Group();

        for (let i = 0; i < rayCount; i++) {
            // Create rays in all directions (spherical distribution)
            const phi = Math.acos(2 * Math.random() - 1); // Polar angle
            const theta = Math.random() * Math.PI * 2; // Azimuthal angle

            const direction = new THREE.Vector3(
                Math.sin(phi) * Math.cos(theta),
                Math.sin(phi) * Math.sin(theta),
                Math.cos(phi)
            );

            const start = direction.clone().multiplyScalar(sunRadius * 1.1);
            const end = direction.clone().multiplyScalar(rayLength);

            // Create gradient with vertex colors (hot yellow/white near sun -> cold blue far away)
            const positions = [];
            const colors = [];
            const segments = 20; // Subdivide ray for smooth gradient

            for (let j = 0; j <= segments; j++) {
                const t = j / segments;
                const point = start.clone().lerp(end, t);
                positions.push(point.x, point.y, point.z);

                // Color gradient based on distance: yellow/white (hot) -> orange -> red -> blue (cold)
                // Represents temperature decrease with distance from sun
                const color = new THREE.Color();
                if (t < 0.05) {
                    // Very close to sun - white hot (5500K+)
                    color.setRGB(1.0, 1.0, 0.95);
                } else if (t < 0.15) {
                    // Inner region - yellow (Mercury zone)
                    color.setRGB(1.0, 1.0, 0.6);
                } else if (t < 0.3) {
                    // Venus-Earth zone - yellow-orange
                    color.setRGB(1.0, 0.8, 0.3);
                } else if (t < 0.5) {
                    // Mars-Jupiter zone - orange-red
                    color.setRGB(1.0, 0.5, 0.2);
                } else if (t < 0.7) {
                    // Outer planets - red-purple
                    color.setRGB(0.8, 0.3, 0.4);
                } else {
                    // Far region - purple-blue (very cold)
                    const blend = (t - 0.7) / 0.3;
                    color.setRGB(0.5 - blend * 0.3, 0.2, 0.5 + blend * 0.3);
                }

                colors.push(color.r, color.g, color.b);
            }

            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

            const material = new THREE.LineBasicMaterial({
                vertexColors: true,
                transparent: true,
                opacity: 0.4,
                linewidth: 2
            });

            const ray = new THREE.Line(geometry, material);
            group.add(ray);
        }

        group.visible = this.showSunRays;
        this.scene.add(group);
        this.sunRays = group;
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

        // Create standard material for all bodies
        const standardMaterial = new THREE.MeshPhongMaterial({
            color: this.getBodyColor(key, bodyData),
            shininess: 30
        });

        // Create temperature material if temperature data exists
        let temperatureMaterial = null;
        if (bodyData.temperature && bodyData.temperature.min_c !== undefined && bodyData.temperature.max_c !== undefined) {
            temperatureMaterial = this.createTemperatureMaterial(bodyData);
        }

        // Use appropriate material based on showTemperature flag
        const material = (this.showTemperature && temperatureMaterial) ? temperatureMaterial : standardMaterial;

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

        // Add coordinate axes to this body (X=red, Y=green, Z=blue)
        // Axes size relative to body radius
        const axesSize = radius * 3;
        const axes = new THREE.AxesHelper(axesSize);
        axes.visible = this.showAxes;
        mesh.add(axes); // Add to mesh so it rotates with the body

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
            material: material,
            standardMaterial: standardMaterial,
            temperatureMaterial: temperatureMaterial,
            axes: axes // Store axes reference
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

        // Populate Follow Body dropdown from config
        this.populateFollowBodyDropdown();

        // Follow Body dropdown
        const followBodySelect = document.getElementById('follow-body');
        if (followBodySelect) {
            followBodySelect.addEventListener('change', (e) => {
                this.followBody = e.target.value || null;
            });
        }
    }

    /**
     * Populate Follow Body dropdown from celestial bodies config
     * Automatically updates when config changes
     */
    populateFollowBodyDropdown() {
        const select = document.getElementById('follow-body');
        if (!select) return;

        // Import celestial bodies config
        import('./config/celestialBodies.js').then(({ CELESTIAL_BODIES }) => {
            // Clear existing options (except "Not following")
            while (select.options.length > 1) {
                select.remove(1);
            }

            // Group bodies by type
            const groups = {
                star: [],
                planet: [],
                dwarf_planet: [],
                moon: []
            };

            // Categorize all bodies
            for (const [key, data] of Object.entries(CELESTIAL_BODIES)) {
                if (data.type && groups[data.type] !== undefined) {
                    groups[data.type].push({ key, data });
                }
            }

            // Add stars group (if any)
            if (groups.star.length > 0) {
                const starGroup = document.createElement('optgroup');
                starGroup.label = 'Stars';
                groups.star.forEach(({ key, data }) => {
                    const option = document.createElement('option');
                    option.value = key;
                    option.textContent = `☀️ ${data.name_en || data.name}`;
                    starGroup.appendChild(option);
                });
                select.appendChild(starGroup);
            }

            // Add planets group
            if (groups.planet.length > 0) {
                const planetGroup = document.createElement('optgroup');
                planetGroup.label = 'Planets';
                groups.planet.forEach(({ key, data }) => {
                    const option = document.createElement('option');
                    option.value = key;
                    // Try to find emoji icon from body list or use default
                    const emoji = this.getBodyEmoji(key);
                    option.textContent = `${emoji} ${data.name_en || data.name}`;
                    planetGroup.appendChild(option);
                });
                select.appendChild(planetGroup);
            }

            // Add dwarf planets group (if any)
            if (groups.dwarf_planet.length > 0) {
                const dwarfGroup = document.createElement('optgroup');
                dwarfGroup.label = 'Dwarf Planets';
                groups.dwarf_planet.forEach(({ key, data }) => {
                    const option = document.createElement('option');
                    option.value = key;
                    option.textContent = `♇ ${data.name_en || data.name}`;
                    dwarfGroup.appendChild(option);
                });
                select.appendChild(dwarfGroup);
            }

            // Add moons group
            if (groups.moon.length > 0) {
                const moonGroup = document.createElement('optgroup');
                moonGroup.label = 'Moons';
                groups.moon.forEach(({ key, data }) => {
                    const option = document.createElement('option');
                    option.value = key;
                    const emoji = key === 'MOON' ? '🌙 ' : '';
                    option.textContent = `${emoji}${data.name_en || data.name}`;
                    moonGroup.appendChild(option);
                });
                select.appendChild(moonGroup);
            }
        });
    }

    /**
     * Get emoji icon for a celestial body
     */
    getBodyEmoji(key) {
        const emojiMap = {
            'MERCURY': '☿',
            'VENUS': '♀',
            'EARTH': '🌍',
            'MARS': '♂',
            'JUPITER': '♃',
            'SATURN': '♄',
            'URANUS': '♅',
            'NEPTUNE': '♆',
            'PLUTO': '♇',
            'MOON': '🌙'
        };
        return emojiMap[key] || '';
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
        const terminatorsWereVisible = this.showTerminators;

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

        // Recreate terminators if they were visible
        if (terminatorsWereVisible) {
            for (const [key, body] of this.bodies) {
                if (key !== 'SUN') {
                    const mesh = body.mesh;
                    const radius = mesh.geometry.parameters.radius;
                    const parentObject = body.container || body.mesh;
                    this.createTerminator(key, radius * 1.01, parentObject);
                }
            }
            this.updateTerminators();
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

            // Find the body key from the mesh name
            let bodyKey = null;
            for (const [key, body] of this.bodies.entries()) {
                if (body.mesh === selected) {
                    bodyKey = key;
                    break;
                }
            }

            if (bodyKey) {
                // Use the same function as clicking in the list - unifies behavior
                this.focusOnBody(bodyKey);

                // Update visual selection in the body list
                document.querySelectorAll('.body-item').forEach(item => {
                    item.classList.remove('selected');
                    if (item.dataset.body === bodyKey) {
                        item.classList.add('selected');
                    }
                });
            }
        }
    }

    onMouseMove(event) {
        // Update mouse position for hover effects
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
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

        // Update temperature shader sun directions (if temperature mode is active)
        if (this.showTemperature) {
            this.updateTemperatureSunDirections();
        }

        // Update terminator orientations (if terminators are visible)
        if (this.showTerminators) {
            this.updateTerminators();
        }

        // Update date/time display (throttled - only update every 10 frames)
        if (!this.frameCount) this.frameCount = 0;
        this.frameCount++;
        if (this.frameCount % 10 === 0) {
            this.updateDateDisplay();
        }

        // Follow selected body (if any)
        if (this.followBody) {
            const body = this.bodies.get(this.followBody);
            if (body) {
                // Follow the container for planets, mesh for moons
                const targetObject = body.container || body.mesh;
                if (targetObject) {
                    this.controls.target.copy(targetObject.position);
                }
            }
        }

        // Update controls
        this.controls.update();

        // Update stats (throttled - every 30 frames for smooth display)
        if (this.frameCount % 30 === 0) {
            this.updateStats();
        }

        // Render
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Update performance stats display
     */
    updateStats() {
        // Calculate FPS
        const currentTime = performance.now();
        this.frameTime = currentTime - this.lastTime;
        this.fps = Math.round(1000 / this.frameTime);
        this.lastTime = currentTime;

        // Update FPS display
        const fpsElement = document.getElementById('fps-value');
        if (fpsElement) {
            fpsElement.textContent = this.fps;
        }

        // Count objects in scene (recursively)
        let objectCount = 0;
        this.scene.traverse(() => {
            objectCount++;
        });

        // Update object count display
        const objectCountElement = document.getElementById('object-count');
        if (objectCountElement) {
            objectCountElement.textContent = objectCount;
        }

        // Count polygons (triangles)
        const polygonCount = this.renderer.info.render.triangles;

        // Update polygon count display
        const polygonCountElement = document.getElementById('polygon-count');
        if (polygonCountElement) {
            polygonCountElement.textContent = polygonCount.toLocaleString();
        }
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
            // Store selected body key
            this.selectedBodyKey = bodyKey;

            // Always point camera to Sun (origin)
            this.controls.target.set(0, 0, 0);

            // Update info panel
            this.updateSelectedObjectInfo(bodyKey);
        }
    }

    /**
     * Update Selected Object Info Panel
     */
    updateSelectedObjectInfo(bodyKey) {
        const infoPanel = document.getElementById('info-panel');
        if (!infoPanel) return;

        const body = this.bodies.get(bodyKey);
        if (!body) {
            infoPanel.style.display = 'none';
            return;
        }

        const data = body.data;
        infoPanel.style.display = 'block';

        // Basic info
        document.getElementById('selected-name').textContent = data.name_en || data.name;
        document.getElementById('selected-type').textContent = data.type || '-';
        document.getElementById('selected-parent').textContent = data.parent
            ? (data.parent.charAt(0).toUpperCase() + data.parent.slice(1))
            : 'None';

        // Physical properties
        document.getElementById('selected-radius').textContent = data.radius_km
            ? data.radius_km.toLocaleString()
            : '-';
        document.getElementById('selected-mass').textContent = data.mass_kg
            ? this.formatMass(data.mass_kg)
            : '-';

        // Orbital elements
        if (data.orbital) {
            const period = data.orbital.period_days;
            document.getElementById('selected-orbital-period').textContent = period
                ? this.formatPeriod(period)
                : '-';
            document.getElementById('selected-eccentricity').textContent = data.orbital.eccentricity
                ? data.orbital.eccentricity.toFixed(4)
                : '-';
            document.getElementById('selected-inclination').textContent = data.orbital.inclination
                ? `${data.orbital.inclination.toFixed(2)}°`
                : '-';

            // Calculate current distance from parent
            const targetObject = body.container || body.mesh;
            if (data.parent && data.parent !== 'sun') {
                const parentBody = this.bodies.get(data.parent.toUpperCase());
                if (parentBody) {
                    const parentPos = (parentBody.container || parentBody.mesh).position;
                    const distance = targetObject.position.distanceTo(parentPos);
                    document.getElementById('selected-distance').textContent =
                        `${(distance * 149597870.7).toLocaleString()} km`;
                }
            } else {
                // Distance from sun
                const distance = targetObject.position.length();
                document.getElementById('selected-distance').textContent =
                    `${distance.toFixed(3)} AU`;
            }
        } else {
            document.getElementById('selected-orbital-period').textContent = '-';
            document.getElementById('selected-eccentricity').textContent = '-';
            document.getElementById('selected-inclination').textContent = '-';
            document.getElementById('selected-distance').textContent = '-';
        }

        // Rotation (handle both nested and flat structures)
        const rotationPeriod = data.rotation?.period_days ?? data.rotation_period_days;
        const axialTilt = data.rotation?.axial_tilt ?? data.axial_tilt_deg;

        if (rotationPeriod !== undefined) {
            const rotPeriod = Math.abs(rotationPeriod);
            document.getElementById('selected-rotation-period').textContent =
                this.formatPeriod(rotPeriod) + (rotationPeriod < 0 ? ' (retrograde)' : '');
        } else {
            document.getElementById('selected-rotation-period').textContent = '-';
        }

        if (axialTilt !== undefined) {
            document.getElementById('selected-axial-tilt').textContent = `${axialTilt.toFixed(2)}°`;
        } else {
            document.getElementById('selected-axial-tilt').textContent = '-';
        }

        // Temperature
        if (data.temperature) {
            document.getElementById('selected-temp-min').textContent = data.temperature.min_c
                ? `${data.temperature.min_c}°C`
                : '-';
            document.getElementById('selected-temp-max').textContent = data.temperature.max_c
                ? `${data.temperature.max_c}°C`
                : '-';
        } else {
            document.getElementById('selected-temp-min').textContent = '-';
            document.getElementById('selected-temp-max').textContent = '-';
        }
    }

    /**
     * Format mass in scientific notation
     */
    formatMass(mass) {
        if (mass >= 1e24) {
            return `${(mass / 1e24).toFixed(2)} × 10²⁴ kg`;
        } else if (mass >= 1e20) {
            return `${(mass / 1e20).toFixed(2)} × 10²⁰ kg`;
        } else {
            return `${mass.toExponential(2)} kg`;
        }
    }

    /**
     * Format orbital/rotation period
     */
    formatPeriod(days) {
        if (days < 1) {
            const hours = days * 24;
            return `${hours.toFixed(2)} hours`;
        } else if (days < 365) {
            return `${days.toFixed(2)} days`;
        } else {
            const years = days / 365.25;
            return `${years.toFixed(2)} years`;
        }
    }

    /**
     * Show detailed planet information modal for currently selected body
     */
    showSelectedBodyDetails() {
        if (this.selectedBodyKey) {
            this.showPlanetDetailsModal(this.selectedBodyKey);
        }
    }

    /**
     * Show detailed planet information modal
     */
    showPlanetDetailsModal(bodyKey) {
        const modal = document.getElementById('planet-details-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalContent = document.getElementById('modal-content');

        if (!modal || !modalTitle || !modalContent) return;

        const body = this.bodies.get(bodyKey);
        if (!body) return;

        const data = body.data;

        // Set title
        modalTitle.textContent = data.name_en || data.name || bodyKey;

        // Build comprehensive content
        let html = '<div style="display: grid; gap: 20px;">';

        // Basic Information
        html += '<div>';
        html += '<h3 style="color: #00ff00; margin-top: 0; border-bottom: 1px solid rgba(0, 255, 0, 0.3); padding-bottom: 5px;">📋 Basic Information</h3>';
        html += `<div><strong>Type:</strong> ${data.type || '-'}</div>`;
        html += `<div><strong>Parent:</strong> ${data.parent || '-'}</div>`;
        if (data.name_ru) html += `<div><strong>Russian Name:</strong> ${data.name_ru}</div>`;
        html += '</div>';

        // Physical Properties
        html += '<div>';
        html += '<h3 style="color: #00ff00; border-bottom: 1px solid rgba(0, 255, 0, 0.3); padding-bottom: 5px;">🌍 Physical Properties</h3>';
        if (data.radius_km) html += `<div><strong>Radius:</strong> ${data.radius_km.toLocaleString()} km</div>`;
        if (data.mass_kg) html += `<div><strong>Mass:</strong> ${this.formatMass(data.mass_kg)}</div>`;
        if (data.density_g_cm3) html += `<div><strong>Density:</strong> ${data.density_g_cm3.toFixed(2)} g/cm³</div>`;
        if (data.surface_gravity_m_s2) html += `<div><strong>Surface Gravity:</strong> ${data.surface_gravity_m_s2.toFixed(2)} m/s²</div>`;
        if (data.escape_velocity_km_s) html += `<div><strong>Escape Velocity:</strong> ${data.escape_velocity_km_s.toFixed(2)} km/s</div>`;
        html += '</div>';

        // Orbital Elements
        if (data.orbital) {
            html += '<div>';
            html += '<h3 style="color: #00ff00; border-bottom: 1px solid rgba(0, 255, 0, 0.3); padding-bottom: 5px;">🛸 Orbital Elements</h3>';
            if (data.orbital.period_days) html += `<div><strong>Orbital Period:</strong> ${this.formatPeriod(data.orbital.period_days)}</div>`;
            if (data.orbital.semi_major_axis_au) html += `<div><strong>Semi-Major Axis:</strong> ${data.orbital.semi_major_axis_au.toFixed(3)} AU</div>`;
            if (data.orbital.semi_major_axis_km) html += `<div style="margin-left: 20px; color: #88ccff;">(${data.orbital.semi_major_axis_km.toLocaleString()} km)</div>`;
            if (data.orbital.eccentricity !== undefined) html += `<div><strong>Eccentricity:</strong> ${data.orbital.eccentricity.toFixed(4)}</div>`;
            if (data.orbital.inclination !== undefined) html += `<div><strong>Inclination:</strong> ${data.orbital.inclination.toFixed(2)}°</div>`;
            if (data.orbital.longitude_ascending_node !== undefined) html += `<div><strong>Longitude of Asc. Node:</strong> ${data.orbital.longitude_ascending_node.toFixed(2)}°</div>`;
            if (data.orbital.argument_perihelion !== undefined) html += `<div><strong>Argument of Perihelion:</strong> ${data.orbital.argument_perihelion.toFixed(2)}°</div>`;
            if (data.orbital.mean_anomaly_epoch !== undefined) html += `<div><strong>Mean Anomaly (J2000):</strong> ${data.orbital.mean_anomaly_epoch.toFixed(2)}°</div>`;
            html += '</div>';
        }

        // Rotation (handle both nested and flat structures)
        html += '<div>';
        html += '<h3 style="color: #00ff00; border-bottom: 1px solid rgba(0, 255, 0, 0.3); padding-bottom: 5px;">🔄 Rotation</h3>';

        const rotationPeriod = data.rotation?.period_days ?? data.rotation_period_days;
        const axialTilt = data.rotation?.axial_tilt ?? data.axial_tilt_deg;

        if (rotationPeriod !== undefined) {
            const rotationLabel = rotationPeriod < 0 ? `${this.formatPeriod(Math.abs(rotationPeriod))} (retrograde)` : this.formatPeriod(rotationPeriod);
            html += `<div><strong>Rotation Period:</strong> ${rotationLabel}</div>`;
        }
        if (axialTilt !== undefined) {
            html += `<div><strong>Axial Tilt:</strong> ${axialTilt.toFixed(2)}°</div>`;
        }
        html += '</div>';

        // Temperature
        if (data.temperature) {
            html += '<div>';
            html += '<h3 style="color: #00ff00; border-bottom: 1px solid rgba(0, 255, 0, 0.3); padding-bottom: 5px;">🌡️ Temperature</h3>';
            if (data.temperature.min_c !== undefined) html += `<div><strong>Minimum:</strong> ${data.temperature.min_c}°C (${(data.temperature.min_c * 9/5 + 32).toFixed(0)}°F)</div>`;
            if (data.temperature.max_c !== undefined) html += `<div><strong>Maximum:</strong> ${data.temperature.max_c}°C (${(data.temperature.max_c * 9/5 + 32).toFixed(0)}°F)</div>`;
            if (data.temperature.mean_c !== undefined) html += `<div><strong>Mean:</strong> ${data.temperature.mean_c}°C (${(data.temperature.mean_c * 9/5 + 32).toFixed(0)}°F)</div>`;
            if (data.temperature.terminator_c !== undefined) html += `<div><strong>Terminator:</strong> ${data.temperature.terminator_c}°C</div>`;
            html += '</div>';
        }

        // Atmosphere (if exists)
        if (data.atmosphere_composition) {
            html += '<div>';
            html += '<h3 style="color: #00ff00; border-bottom: 1px solid rgba(0, 255, 0, 0.3); padding-bottom: 5px;">💨 Atmosphere</h3>';
            for (const [gas, percentage] of Object.entries(data.atmosphere_composition)) {
                html += `<div><strong>${gas}:</strong> ${percentage}</div>`;
            }
            html += '</div>';
        }

        // Interesting Facts (if exist)
        if (data.interesting_facts) {
            html += '<div>';
            html += '<h3 style="color: #00ff00; border-bottom: 1px solid rgba(0, 255, 0, 0.3); padding-bottom: 5px;">💡 Interesting Facts</h3>';
            html += `<ul style="margin: 0; padding-left: 20px;">`;
            for (const fact of data.interesting_facts) {
                html += `<li style="margin-bottom: 8px;">${fact}</li>`;
            }
            html += '</ul>';
            html += '</div>';
        }

        html += '</div>';

        modalContent.innerHTML = html;
        modal.style.display = 'block';
    }

    /**
     * Hide planet details modal
     */
    hidePlanetDetailsModal() {
        const modal = document.getElementById('planet-details-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * Camera View Presets
     */
    viewFullSystem() {
        // View entire solar system from above
        this.camera.position.set(0, 500, 500);
        this.controls.target.set(0, 0, 0);
        this.followBody = null; // Stop following any body
    }

    viewInnerPlanets() {
        // Focus on Mercury, Venus, Earth, Mars
        this.camera.position.set(0, 30, 30);
        this.controls.target.set(0, 0, 0);
        this.followBody = null;
    }

    viewOuterPlanets() {
        // Focus on Jupiter, Saturn, Uranus, Neptune
        this.camera.position.set(0, 400, 400);
        this.controls.target.set(0, 0, 0);
        this.followBody = null;
    }

    viewEarthMoon() {
        // Close-up of Earth-Moon system
        const earth = this.bodies.get('EARTH');
        if (earth) {
            const earthPos = (earth.container || earth.mesh).position;
            this.camera.position.set(
                earthPos.x + 5,
                earthPos.y + 3,
                earthPos.z + 5
            );
            this.controls.target.copy(earthPos);
            this.followBody = 'EARTH'; // Follow Earth
        }
    }

    viewJupiterSystem() {
        // Jupiter and its Galilean moons
        const jupiter = this.bodies.get('JUPITER');
        if (jupiter) {
            const jupiterPos = (jupiter.container || jupiter.mesh).position;
            this.camera.position.set(
                jupiterPos.x + 20,
                jupiterPos.y + 10,
                jupiterPos.z + 20
            );
            this.controls.target.copy(jupiterPos);
            this.followBody = 'JUPITER'; // Follow Jupiter
        }
    }

    viewSaturnSystem() {
        // Saturn and its rings
        const saturn = this.bodies.get('SATURN');
        if (saturn) {
            const saturnPos = (saturn.container || saturn.mesh).position;
            this.camera.position.set(
                saturnPos.x + 25,
                saturnPos.y + 15,
                saturnPos.z + 25
            );
            this.controls.target.copy(saturnPos);
            this.followBody = 'SATURN'; // Follow Saturn
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
     * Create terminator (day/night boundary) for a celestial body
     */
    createTerminator(key, radius, parentObject) {
        // Terminator is a great circle perpendicular to the sun direction
        // We'll create a circle in the XZ plane and rotate it to align with sun direction
        const segments = 128;
        const points = [];

        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            points.push(new THREE.Vector3(
                radius * Math.cos(angle),
                radius * Math.sin(angle),
                0
            ));
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: 0xffaa00, // Orange color for terminator
            transparent: true,
            opacity: 0.8,
            linewidth: 2
        });
        const line = new THREE.Line(geometry, material);
        line.name = 'Terminator';
        line.visible = this.showTerminators;

        parentObject.add(line);
        this.terminators.set(key, line);
    }

    /**
     * Update terminator orientations based on sun direction
     */
    updateTerminators() {
        const sunPosition = new THREE.Vector3(0, 0, 0);

        for (const [key, terminator] of this.terminators) {
            const body = this.bodies.get(key);
            if (!body) continue;

            // Get world position of the body
            const bodyPosition = new THREE.Vector3();
            const targetObject = body.container || body.mesh;
            targetObject.getWorldPosition(bodyPosition);

            // Calculate sun direction (from body to sun)
            const sunDirection = new THREE.Vector3().subVectors(sunPosition, bodyPosition).normalize();

            // The terminator line should be perpendicular to sun direction
            // We need to rotate the terminator circle to face the sun

            // Calculate rotation to align circle's normal (Z-axis) with sun direction
            const up = new THREE.Vector3(0, 1, 0);
            const quaternion = new THREE.Quaternion();

            // If sun direction is along Y axis, use X as up vector
            if (Math.abs(sunDirection.y) > 0.99) {
                up.set(1, 0, 0);
            }

            // Create a basis where Z points toward sun
            const zAxis = sunDirection.clone();
            const xAxis = new THREE.Vector3().crossVectors(up, zAxis).normalize();
            const yAxis = new THREE.Vector3().crossVectors(zAxis, xAxis).normalize();

            // Create rotation matrix
            const matrix = new THREE.Matrix4();
            matrix.makeBasis(xAxis, yAxis, zAxis);
            quaternion.setFromRotationMatrix(matrix);

            // Apply rotation
            terminator.quaternion.copy(quaternion);
        }
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
     * Toggle temperature visualization
     */
    toggleTemperature(visible) {
        this.showTemperature = visible;

        // Switch materials for all bodies that have temperature data
        for (const [key, body] of this.bodies) {
            if (body.temperatureMaterial && body.standardMaterial) {
                const newMaterial = visible ? body.temperatureMaterial : body.standardMaterial;
                body.mesh.material = newMaterial;
            }
        }
    }

    /**
     * Toggle terminator visibility
     */
    toggleTerminators(visible) {
        this.showTerminators = visible;

        if (visible && this.terminators.size === 0) {
            // Create terminators for all bodies (except sun)
            for (const [key, body] of this.bodies) {
                if (key !== 'SUN') {
                    const mesh = body.mesh;
                    const radius = mesh.geometry.parameters.radius;
                    // Add terminator to CONTAINER (not mesh) so it doesn't rotate with planet
                    const parentObject = body.container || body.mesh;
                    this.createTerminator(key, radius * 1.01, parentObject);
                }
            }
            // Update initial positions
            this.updateTerminators();
        } else {
            // Toggle visibility of existing terminators
            for (const [key, terminator] of this.terminators) {
                terminator.visible = visible;
            }
        }
    }

    /**
     * Toggle coordinate axes visibility for all bodies
     */
    toggleAxes(visible) {
        this.showAxes = visible;

        // Toggle axes for all bodies
        for (const [key, body] of this.bodies) {
            if (body.axes) {
                body.axes.visible = visible;
            }
        }
    }

    /**
     * Toggle sun rays visibility
     */
    toggleSunRays(visible) {
        this.showSunRays = visible;
        if (this.sunRays) {
            this.sunRays.visible = visible;
        }
    }

    /**
     * Update sun direction in temperature shaders
     */
    updateTemperatureSunDirections() {
        // Sun is at origin (0, 0, 0)
        const sunPosition = new THREE.Vector3(0, 0, 0);

        for (const [key, body] of this.bodies) {
            if (body.temperatureMaterial && body.mesh) {
                // Get world position of the body
                const bodyPosition = new THREE.Vector3();
                const targetObject = body.container || body.mesh;
                targetObject.getWorldPosition(bodyPosition);

                // Calculate sun direction in world space
                const sunDirection = new THREE.Vector3().subVectors(sunPosition, bodyPosition).normalize();

                // Transform to body's local space (account for rotation)
                const localSunDirection = sunDirection.clone();
                body.mesh.worldToLocal(localSunDirection.add(bodyPosition));
                localSunDirection.sub(new THREE.Vector3()).normalize();

                // Update shader uniform
                body.temperatureMaterial.uniforms.sunDirection.value.copy(localSunDirection);
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