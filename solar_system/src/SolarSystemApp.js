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

        // Celestial bodies
        this.bodies = new Map();
        this.trails = new Map();

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
        const sunRadius = this.getScaledRadius(sunData.radius_km, 'sun');
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
        sun.add(glow);

        this.scene.add(sun);
        this.bodies.set('SUN', {
            mesh: sun,
            data: sunData,
            type: 'star'
        });
    }

    createCelestialBody(key, bodyData) {
        const radius = this.getScaledRadius(bodyData.radius_km, bodyData.type);
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

        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = bodyData.name;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Create orbit visualization
        if (bodyData.orbital) {
            const orbit = this.createOrbitLine(bodyData.orbital);
            this.scene.add(orbit);
        }

        // Add to scene
        this.scene.add(mesh);

        // Store in bodies map
        this.bodies.set(key, {
            mesh: mesh,
            data: bodyData,
            type: bodyData.type,
            material: material
        });
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

    createOrbitLine(orbital) {
        const points = [];
        const segments = 128;

        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const position = calculateOrbitalPosition(
                orbital.semi_major_axis_au || orbital.semi_major_axis_km / 149597870.7,
                orbital.eccentricity || 0,
                angle
            );

            const scale = this.getScaleForDistance();
            points.push(new THREE.Vector3(
                position.x * scale,
                position.z * scale, // Swap Y and Z for Three.js
                -position.y * scale
            ));
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: 0x444444,
            transparent: true,
            opacity: 0.3
        });

        return new THREE.Line(geometry, material);
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

    getScaledRadius(radiusKm, type) {
        if (this.scaleMode === 'realistic') {
            // Realistic scale (1:1,000,000 km)
            return radiusKm / 1000000;
        } else {
            // Visible scale with logarithmic scaling
            const baseScale = 0.001;
            const logScale = Math.log10(radiusKm + 1) * baseScale;

            // Special handling for sun
            if (type === 'star') {
                return logScale * 0.5; // Make sun smaller for visibility
            }

            return logScale;
        }
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

            const { mesh, data, material } = body;

            // Update orbital position
            if (data.orbital) {
                const orbital = data.orbital;
                const position = calculateBodyPosition({
                    semiMajorAxis: orbital.semi_major_axis_au || orbital.semi_major_axis_km / 149597870.7,
                    eccentricity: orbital.eccentricity || 0,
                    inclination: (orbital.inclination || 0) * Math.PI / 180,
                    longitudeOfAscendingNode: (orbital.longitude_ascending_node || 0) * Math.PI / 180,
                    argumentOfPerihelion: (orbital.argument_perihelion || 0) * Math.PI / 180,
                    orbitalPeriod: orbital.period_days || 365.25
                }, this.time);

                const scale = this.getScaleForDistance();
                mesh.position.set(
                    position.x * scale,
                    position.z * scale, // Swap Y and Z for Three.js
                    -position.y * scale
                );
            }

            // Update rotation
            if (data.rotation) {
                const rotation = calculateBodyRotation(data.rotation, this.time, 0, data.orbital?.period_days || 365.25);
                mesh.rotation.y = rotation.angle;
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
    }

    updateScale() {
        // Recreate all bodies with new scale
        // This is a simplified approach - in production you'd update existing geometries
        this.clearBodies();
        this.initBodies();
    }

    clearBodies() {
        for (const [key, body] of this.bodies) {
            this.scene.remove(body.mesh);
            if (body.mesh.geometry) body.mesh.geometry.dispose();
            if (body.mesh.material) body.mesh.material.dispose();
        }
        this.bodies.clear();
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
            this.controls.target.copy(body.mesh.position);
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
}

// Export for module usage
export default SolarSystemApp;