/**
 * PlanetaryRenderer.js
 *
 * Handles rendering of all celestial bodies with appropriate visual effects
 * Manages textures, atmospheres, rings, and special effects
 */

import { CELESTIAL_BODIES } from '../config/celestialBodies.js';

export class PlanetaryRenderer {
    constructor(scene, scaleMode = 'visible') {
        this.scene = scene;
        this.scaleMode = scaleMode;
        this.bodies = new Map();
        this.orbits = new Map();
        this.labels = new Map();
        this.trails = new Map();
    }

    /**
     * Create all celestial bodies
     */
    createAllBodies() {
        // Create Sun first
        this.createSun();

        // Create planets
        this.createPlanets();

        // Create moons
        this.createMoons();
    }

    /**
     * Create the Sun with corona and glow effects
     */
    createSun() {
        const sunData = CELESTIAL_BODIES.SUN;
        const radius = this.getScaledRadius(sunData.radius_km, 'star');

        // Sun core
        const sunGeometry = new THREE.SphereGeometry(radius, 64, 32);
        const sunMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00
            // MeshBasicMaterial doesn't need emissive - it's self-illuminated
        });

        const sun = new THREE.Mesh(sunGeometry, sunMaterial);
        sun.name = 'Sun';

        // Inner glow
        const glowGeometry = new THREE.SphereGeometry(radius * 1.3, 32, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff88,
            transparent: true,
            opacity: 0.4,
            side: THREE.BackSide
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        sun.add(glow);

        // Outer corona
        const coronaGeometry = new THREE.SphereGeometry(radius * 1.8, 16, 8);
        const coronaMaterial = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.15,
            side: THREE.BackSide
        });
        const corona = new THREE.Mesh(coronaGeometry, coronaMaterial);
        sun.add(corona);

        // Add lens flare effect (sprites)
        const lensFlare = this.createLensFlare();
        sun.add(lensFlare);

        this.scene.add(sun);
        this.bodies.set('SUN', {
            mesh: sun,
            data: sunData,
            type: 'star'
        });
    }

    /**
     * Create lens flare effect
     */
    createLensFlare() {
        const flareGroup = new THREE.Group();

        // Main flare
        const flareTexture = this.createFlareTexture();
        const spriteMaterial = new THREE.SpriteMaterial({
            map: flareTexture,
            color: 0xffffff,
            blending: THREE.AdditiveBlending,
            opacity: 0.8
        });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(3, 3, 1);
        flareGroup.add(sprite);

        return flareGroup;
    }

    /**
     * Create a simple flare texture
     */
    createFlareTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.2, 'rgba(255, 255, 200, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 0, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 128, 128);

        return new THREE.CanvasTexture(canvas);
    }

    /**
     * Create all planets
     */
    createPlanets() {
        const planets = ['MERCURY', 'VENUS', 'EARTH', 'MARS', 'JUPITER', 'SATURN', 'URANUS', 'NEPTUNE', 'PLUTO'];

        planets.forEach(key => {
            const data = CELESTIAL_BODIES[key];
            if (data) {
                this.createPlanet(key, data);
            }
        });
    }

    /**
     * Create a planet with appropriate materials and effects
     */
    createPlanet(key, data) {
        const radius = this.getScaledRadius(data.radius_km, 'planet');
        const geometry = new THREE.SphereGeometry(radius, 32, 16);

        let material;
        let group = new THREE.Group();
        group.name = data.name;

        // Create specific materials for each planet
        switch (key) {
            case 'MERCURY':
                // Use standard material like other planets for now
                material = new THREE.MeshPhongMaterial({
                    color: 0x888888,  // Gray like Mercury
                    emissive: 0x222222,
                    emissiveIntensity: 0.05
                });
                break;

            case 'VENUS':
                material = new THREE.MeshPhongMaterial({
                    color: 0xffc649,
                    emissive: 0x332211,
                    emissiveIntensity: 0.1
                });
                // Add thick atmosphere
                this.addAtmosphere(group, radius, 0xffdd88, 0.3, 1.15);
                break;

            case 'EARTH':
                material = new THREE.MeshPhongMaterial({
                    color: 0x2233ff,
                    specular: 0x333333,
                    shininess: 10
                });
                // Add thin atmosphere
                this.addAtmosphere(group, radius, 0x88aaff, 0.2, 1.05);
                // Add clouds
                this.addClouds(group, radius);
                break;

            case 'MARS':
                material = new THREE.MeshPhongMaterial({
                    color: 0xff6644,
                    emissive: 0x220000,
                    emissiveIntensity: 0.05
                });
                // Very thin atmosphere
                this.addAtmosphere(group, radius, 0xff8866, 0.1, 1.02);
                break;

            case 'JUPITER':
                material = new THREE.MeshPhongMaterial({
                    color: 0xcc9966,
                    specular: 0x111111,
                    shininess: 5
                });
                // Add Great Red Spot
                this.addJupiterSpot(group, radius);
                break;

            case 'SATURN':
                material = new THREE.MeshPhongMaterial({
                    color: 0xffcc99,
                    specular: 0x222222,
                    shininess: 8
                });
                // Add rings
                this.addSaturnRings(group, radius);
                break;

            case 'URANUS':
                material = new THREE.MeshPhongMaterial({
                    color: 0x66ffff,
                    emissive: 0x004444,
                    emissiveIntensity: 0.1
                });
                // Add thin rings
                this.addRings(group, radius, 0x88ffff, 1.5, 2.0, 0.3);
                break;

            case 'NEPTUNE':
                material = new THREE.MeshPhongMaterial({
                    color: 0x3366ff,
                    emissive: 0x000033,
                    emissiveIntensity: 0.1
                });
                break;

            case 'PLUTO':
                material = new THREE.MeshPhongMaterial({
                    color: 0xccaa88,
                    specular: 0x111111,
                    shininess: 3
                });
                break;

            default:
                material = new THREE.MeshPhongMaterial({
                    color: 0x888888
                });
        }

        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);

        // Add orbit visualization
        if (data.orbital) {
            this.createOrbit(key, data.orbital);
        }

        // Add to scene
        this.scene.add(group);

        // Store in bodies map
        this.bodies.set(key, {
            mesh: group,
            planet: mesh,
            data: data,
            type: 'planet',
            material: material
        });
    }

    /**
     * Create Mercury's temperature material
     */
    createMercuryMaterial(data) {
        const vertexShader = `
            varying vec3 vNormal;
            varying vec2 vUv;

            void main() {
                vNormal = normalize(normalMatrix * normal);
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        const fragmentShader = `
            uniform vec3 sunDirection;
            uniform float minTemp;
            uniform float maxTemp;
            uniform float terminatorTemp;
            uniform float time;

            varying vec3 vNormal;
            varying vec2 vUv;

            vec3 tempToColor(float temp) {
                float t = (temp - minTemp) / (maxTemp - minTemp);
                t = clamp(t, 0.0, 1.0);

                // Enhanced color gradient
                vec3 nightSide = vec3(0.05, 0.05, 0.15); // Very dark blue
                vec3 terminator = vec3(0.8, 0.3, 0.1);   // Orange-red
                vec3 daySide = vec3(1.0, 0.95, 0.7);     // Bright yellow-white

                if (t < 0.3) {
                    // Night to terminator
                    return mix(nightSide, terminator, t / 0.3);
                } else {
                    // Terminator to day
                    return mix(terminator, daySide, (t - 0.3) / 0.7);
                }
            }

            float calculateTemperature(vec3 normal, vec3 sunDir) {
                float cosAngle = dot(normal, sunDir);

                if (cosAngle > 0.98) {
                    // Subsolar point - hottest
                    return maxTemp;
                } else if (cosAngle > 0.0) {
                    // Day side - temperature falls off with angle
                    float dayTemp = mix(terminatorTemp, maxTemp, pow(cosAngle, 0.3));
                    return dayTemp;
                } else if (cosAngle > -0.1) {
                    // Terminator region
                    float twilight = (cosAngle + 0.1) / 0.1;
                    return mix(minTemp + 50.0, terminatorTemp, twilight);
                } else {
                    // Night side
                    return minTemp;
                }
            }

            void main() {
                float temperature = calculateTemperature(vNormal, sunDirection);
                vec3 color = tempToColor(temperature);

                // Add some surface detail
                float detail = sin(vUv.x * 100.0) * sin(vUv.y * 100.0) * 0.05;
                color = color * (1.0 + detail);

                gl_FragColor = vec4(color, 1.0);
            }
        `;

        return new THREE.ShaderMaterial({
            uniforms: {
                sunDirection: { value: new THREE.Vector3(1, 0, 0) },
                minTemp: { value: data.temperature.min_c },
                maxTemp: { value: data.temperature.max_c },
                terminatorTemp: { value: data.temperature.terminator_c || 100 },
                time: { value: 0 }
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader
        });
    }

    /**
     * Add atmosphere effect
     */
    addAtmosphere(group, planetRadius, color, opacity, scale) {
        const atmosphereGeometry = new THREE.SphereGeometry(planetRadius * scale, 32, 16);
        const atmosphereMaterial = new THREE.MeshPhongMaterial({
            color: color,
            transparent: true,
            opacity: opacity,
            side: THREE.BackSide,
            depthWrite: false
        });

        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        group.add(atmosphere);
    }

    /**
     * Add cloud layer for Earth
     */
    addClouds(group, radius) {
        const cloudGeometry = new THREE.SphereGeometry(radius * 1.01, 32, 16);
        const cloudMaterial = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.4,
            depthWrite: false
        });

        const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
        clouds.name = 'clouds';
        group.add(clouds);
    }

    /**
     * Add Saturn's rings
     */
    addSaturnRings(group, planetRadius) {
        const innerRadius = planetRadius * 1.4;
        const outerRadius = planetRadius * 2.5;

        const ringGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
        const ringMaterial = new THREE.MeshPhongMaterial({
            color: 0xddcc99,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7,
            depthWrite: false
        });

        const rings = new THREE.Mesh(ringGeometry, ringMaterial);
        rings.rotation.x = Math.PI / 2; // Lay flat
        group.add(rings);
    }

    /**
     * Add generic ring system
     */
    addRings(group, planetRadius, color, innerScale, outerScale, opacity) {
        const ringGeometry = new THREE.RingGeometry(
            planetRadius * innerScale,
            planetRadius * outerScale,
            32
        );

        const ringMaterial = new THREE.MeshPhongMaterial({
            color: color,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: opacity,
            depthWrite: false
        });

        const rings = new THREE.Mesh(ringGeometry, ringMaterial);
        rings.rotation.x = Math.PI / 2;
        group.add(rings);
    }

    /**
     * Add Jupiter's Great Red Spot
     */
    addJupiterSpot(group, radius) {
        const spotGeometry = new THREE.SphereGeometry(radius * 1.001, 32, 16);

        // Create a simple spot texture
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = '#cc9966';
        ctx.fillRect(0, 0, 512, 256);

        // Great Red Spot
        ctx.fillStyle = '#aa6644';
        ctx.beginPath();
        ctx.ellipse(350, 140, 40, 25, 0, 0, Math.PI * 2);
        ctx.fill();

        const texture = new THREE.CanvasTexture(canvas);

        const spotMaterial = new THREE.MeshPhongMaterial({
            map: texture,
            transparent: true,
            opacity: 0.8,
            depthWrite: false
        });

        const spot = new THREE.Mesh(spotGeometry, spotMaterial);
        group.add(spot);
    }

    /**
     * Create moons
     */
    createMoons() {
        // Earth's Moon
        this.createMoon('MOON', CELESTIAL_BODIES.MOON, 'EARTH');

        // Mars moons
        if (CELESTIAL_BODIES.PHOBOS) this.createMoon('PHOBOS', CELESTIAL_BODIES.PHOBOS, 'MARS');
        if (CELESTIAL_BODIES.DEIMOS) this.createMoon('DEIMOS', CELESTIAL_BODIES.DEIMOS, 'MARS');

        // Jupiter moons
        const jupiterMoons = ['IO', 'EUROPA', 'GANYMEDE', 'CALLISTO'];
        jupiterMoons.forEach(moon => {
            if (CELESTIAL_BODIES[moon]) {
                this.createMoon(moon, CELESTIAL_BODIES[moon], 'JUPITER');
            }
        });

        // Saturn moons
        const saturnMoons = ['TITAN', 'ENCELADUS', 'RHEA', 'MIMAS'];
        saturnMoons.forEach(moon => {
            if (CELESTIAL_BODIES[moon]) {
                this.createMoon(moon, CELESTIAL_BODIES[moon], 'SATURN');
            }
        });
    }

    /**
     * Create a moon
     */
    createMoon(key, data, parentKey) {
        const radius = this.getScaledRadius(data.radius_km, 'moon');
        const geometry = new THREE.SphereGeometry(radius, 16, 8);

        const material = new THREE.MeshPhongMaterial({
            color: this.getMoonColor(key),
            shininess: 10
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = data.name;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Add to scene
        this.scene.add(mesh);

        // Store in bodies map
        this.bodies.set(key, {
            mesh: mesh,
            data: data,
            type: 'moon',
            parent: parentKey,
            material: material
        });

        // Create orbit around parent
        if (data.orbital && data.orbital.semi_major_axis_km) {
            this.createMoonOrbit(key, data.orbital, parentKey);
        }
    }

    /**
     * Get moon color based on known characteristics
     */
    getMoonColor(key) {
        const moonColors = {
            'MOON': 0xaaaaaa,     // Gray
            'PHOBOS': 0x886644,    // Brown-gray
            'DEIMOS': 0x997755,    // Light brown
            'IO': 0xffdd44,        // Yellow (sulfur)
            'EUROPA': 0xddddcc,    // Ice white
            'GANYMEDE': 0xaa9988,  // Brown-gray
            'CALLISTO': 0x665544,  // Dark brown
            'TITAN': 0xccaa66,     // Orange-brown
            'ENCELADUS': 0xffffff, // White (ice)
            'RHEA': 0xcccccc,      // Light gray
            'MIMAS': 0xbbbbbb      // Gray
        };

        return moonColors[key] || 0x888888;
    }

    /**
     * Create orbit line
     */
    createOrbit(bodyKey, orbital) {
        const points = [];
        const segments = 128;

        const a = orbital.semi_major_axis_au || (orbital.semi_major_axis_km / 149597870.7);
        const e = orbital.eccentricity || 0;

        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const r = a * (1 - e * e) / (1 + e * Math.cos(angle));

            const scale = this.getScaleForDistance();
            points.push(new THREE.Vector3(
                r * Math.cos(angle) * scale,
                0,
                -r * Math.sin(angle) * scale
            ));
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: 0x444444,
            transparent: true,
            opacity: 0.3
        });

        const orbit = new THREE.Line(geometry, material);
        orbit.name = `${bodyKey}_orbit`;
        this.scene.add(orbit);
        this.orbits.set(bodyKey, orbit);
    }

    /**
     * Create moon orbit around parent
     */
    createMoonOrbit(moonKey, orbital, parentKey) {
        // Moon orbits are relative to parent, handled separately
        // This is a placeholder for now
    }

    /**
     * Get scaled radius based on scale mode
     */
    getScaledRadius(radiusKm, type) {
        if (this.scaleMode === 'realistic') {
            // Realistic scale
            const scale = 1 / 10000; // 1:10,000 km scale
            return radiusKm * scale;
        } else {
            // Visible scale with logarithmic scaling
            let scale;

            if (type === 'star') {
                // Even smaller sun for visibility - Mercury needs to orbit outside
                scale = 0.0000025;  // Half of previous size (was 0.000005)
            } else if (type === 'planet') {
                scale = 0.00005 * Math.log10(radiusKm + 1000);
            } else if (type === 'moon') {
                scale = 0.00003 * Math.log10(radiusKm + 100);
            } else {
                scale = 0.00001;
            }

            return radiusKm * scale;
        }
    }

    /**
     * Get scale factor for orbital distances
     */
    getScaleForDistance() {
        if (this.scaleMode === 'realistic') {
            return 1; // AU scale
        } else {
            return 10; // Compressed for visibility
        }
    }

    /**
     * Update scale mode
     */
    setScaleMode(mode) {
        this.scaleMode = mode;
        // Would need to recreate all bodies with new scale
    }

    /**
     * Toggle orbit visibility
     */
    toggleOrbits(visible) {
        this.orbits.forEach(orbit => {
            orbit.visible = visible;
        });
    }

    /**
     * Get body by key
     */
    getBody(key) {
        return this.bodies.get(key);
    }

    /**
     * Update Mercury's sun direction
     */
    updateMercurySunDirection(sunDirection) {
        const mercury = this.bodies.get('MERCURY');
        if (mercury && mercury.material && mercury.material.uniforms) {
            mercury.material.uniforms.sunDirection.value.copy(sunDirection);
        }
    }
}

export default PlanetaryRenderer;