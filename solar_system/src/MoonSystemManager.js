/**
 * MoonSystemManager.js
 *
 * Comprehensive management system for moons and their relationships
 */

export class MoonSystemManager {
    constructor(scene, scaleMode = 'visible') {
        this.scene = scene;
        this.scaleMode = scaleMode;

        // Hierarchical storage
        this.bodies = new Map();        // All bodies
        this.hierarchy = new Map();     // Parent -> [children]
        this.orbits = new Map();        // Body -> orbit mesh

        // Scale configurations
        this.scaleConfig = {
            realistic: {
                sun: 1 / 1000000,
                planet: 1 / 1000000,
                moon: 1 / 100000,  // 10x larger for visibility
                moonOrbitDistance: 1.0,  // Full scale in AU
                planetOrbitDistance: 1.0,
            },
            visible: {
                sun: 0.5,  // Logarithmic will be applied
                planet: 1.0,  // Logarithmic will be applied
                moon: 0.3,  // Relative to parent
                moonOrbitDistance: 5.0,  // 5x parent radius
                planetOrbitDistance: 10.0,  // Compressed AU
            }
        };
    }

    /**
     * Register a celestial body
     */
    registerBody(key, data, mesh) {
        // Store body info
        this.bodies.set(key, {
            key: key,
            data: data,
            mesh: mesh,
            parent: data.parent ? data.parent.toUpperCase() : null,
            children: []
        });

        // Update hierarchy
        if (data.parent && data.parent !== 'sun') {
            const parentKey = data.parent.toUpperCase();
            if (!this.hierarchy.has(parentKey)) {
                this.hierarchy.set(parentKey, []);
            }
            this.hierarchy.get(parentKey).push(key);
        }
    }

    /**
     * Create orbit visualization for a body
     */
    createOrbit(key, orbital, parent) {
        const isMoon = parent && parent !== 'sun';
        const points = [];
        const segments = 128;

        // Calculate orbit points
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;

            // Use Kepler's equation for elliptical orbit
            const a = orbital.semi_major_axis_au || orbital.semi_major_axis_km / 149597870.7;
            const e = orbital.eccentricity || 0;
            const r = a * (1 - e * e) / (1 + e * Math.cos(angle));

            // Apply appropriate scale
            let scale;
            if (isMoon) {
                // For moons, scale based on parent size
                const parentBody = this.bodies.get(parent.toUpperCase());
                if (parentBody && parentBody.mesh) {
                    // Use parent's radius as base
                    const parentRadius = parentBody.mesh.geometry.parameters.radius;
                    scale = this.scaleConfig[this.scaleMode].moonOrbitDistance * parentRadius;
                } else {
                    scale = 0.01; // Fallback
                }
            } else {
                // For planets, use standard distance scale
                scale = this.scaleConfig[this.scaleMode].planetOrbitDistance;
            }

            points.push(new THREE.Vector3(
                r * Math.cos(angle) * scale,
                0,
                -r * Math.sin(angle) * scale
            ));
        }

        // Create orbit line
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: isMoon ? 0x666666 : 0x444444,
            transparent: true,
            opacity: isMoon ? 0.5 : 0.3
        });

        const orbitLine = new THREE.Line(geometry, material);

        // Important: Add orbit as child of parent for moons
        if (isMoon) {
            const parentBody = this.bodies.get(parent.toUpperCase());
            if (parentBody && parentBody.mesh) {
                parentBody.mesh.add(orbitLine);  // Add as child!
            }
        } else {
            // Planet orbits go directly in scene
            this.scene.add(orbitLine);
        }

        this.orbits.set(key, orbitLine);
        return orbitLine;
    }

    /**
     * Update positions of all bodies
     */
    updatePositions(time, calculatePosition) {
        // First pass: Update all planets
        for (const [key, body] of this.bodies) {
            if (!body.parent || body.parent === 'sun') {
                this.updatePlanetPosition(body, time, calculatePosition);
            }
        }

        // Second pass: Update all moons relative to their parents
        for (const [key, body] of this.bodies) {
            if (body.parent && body.parent !== 'sun') {
                this.updateMoonPosition(body, time, calculatePosition);
            }
        }
    }

    /**
     * Update planet position (relative to sun)
     */
    updatePlanetPosition(body, time, calculatePosition) {
        if (!body.data.orbital) return;

        const position = calculatePosition(body.data.orbital, time);
        const scale = this.scaleConfig[this.scaleMode].planetOrbitDistance;

        body.mesh.position.set(
            position.x * scale,
            position.z * scale,  // Y/Z swap for Three.js
            -position.y * scale
        );
    }

    /**
     * Update moon position (relative to parent)
     */
    updateMoonPosition(body, time, calculatePosition) {
        if (!body.data.orbital) return;

        const parentBody = this.bodies.get(body.parent);
        if (!parentBody || !parentBody.mesh) return;

        // Calculate moon's orbital position
        const position = calculatePosition(body.data.orbital, time);

        // Scale based on parent's size for better visibility
        const parentRadius = parentBody.mesh.geometry.parameters.radius;
        const scale = this.scaleConfig[this.scaleMode].moonOrbitDistance * parentRadius;

        // Position relative to parent
        body.mesh.position.set(
            parentBody.mesh.position.x + position.x * scale,
            parentBody.mesh.position.y + position.z * scale,  // Y/Z swap
            parentBody.mesh.position.z - position.y * scale
        );
    }

    /**
     * Get appropriate scale for a body
     */
    getBodyScale(bodyData) {
        const config = this.scaleConfig[this.scaleMode];

        if (bodyData.type === 'star') {
            if (this.scaleMode === 'realistic') {
                return bodyData.radius_km * config.sun;
            } else {
                // Logarithmic for visible mode
                return Math.log10(bodyData.radius_km + 1) * 0.0005;
            }
        } else if (bodyData.type === 'moon') {
            if (this.scaleMode === 'realistic') {
                // Fixed scale for all moons in realistic
                return bodyData.radius_km * config.moon;
            } else {
                // Relative to parent in visible mode
                const parentKey = bodyData.parent.toUpperCase();
                const parentBody = this.bodies.get(parentKey);
                if (parentBody && parentBody.data) {
                    // Moon is percentage of parent size
                    const ratio = bodyData.radius_km / parentBody.data.radius_km;
                    const parentScale = this.getBodyScale(parentBody.data);
                    return parentScale * ratio * 2;  // 2x boost for visibility
                }
                // Fallback
                return Math.log10(bodyData.radius_km + 1) * 0.0008;
            }
        } else {
            // Planets
            if (this.scaleMode === 'realistic') {
                return bodyData.radius_km * config.planet;
            } else {
                // Logarithmic for visible mode
                return Math.log10(bodyData.radius_km + 1) * 0.001;
            }
        }
    }

    /**
     * Switch scale mode
     */
    setScaleMode(mode) {
        this.scaleMode = mode;
        // Would need to recreate all orbits and rescale all bodies
    }

    /**
     * Get all children of a body
     */
    getChildren(key) {
        return this.hierarchy.get(key) || [];
    }

    /**
     * Debug: Log hierarchy
     */
    logHierarchy() {
        console.log('🌌 Celestial Hierarchy:');
        console.log('SUN');

        for (const [key, body] of this.bodies) {
            if (!body.parent || body.parent === 'sun') {
                console.log(`  ├─ ${key}`);
                const children = this.getChildren(key);
                children.forEach((child, i) => {
                    const isLast = i === children.length - 1;
                    console.log(`  │  ${isLast ? '└' : '├'}─ ${child}`);
                });
            }
        }
    }
}

export default MoonSystemManager;