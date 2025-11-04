/**
 * Simplified version for debugging temperature map
 * Testing with most basic approach
 * Standalone version - no imports needed
 */

console.log('🔍 Running simplified temperature test...');

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000011);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(25, 20, 25);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Lighting
const ambient = new THREE.AmbientLight(0x404040, 0.3);
scene.add(ambient);

// Sun
const sun = new THREE.Mesh(
  new THREE.SphereGeometry(3, 32, 32),
  new THREE.MeshBasicMaterial({ color: 0xffff00 })
);
scene.add(sun);

const sunLight = new THREE.PointLight(0xffffff, 2);
scene.add(sunLight);

// Mercury with SIMPLEST possible shader
const mercuryGeometry = new THREE.SphereGeometry(2, 64, 64);

// Ultra-simple shader - no transforms, just direct calculation
const vertexShader = `
  varying vec3 vNormal;

  void main() {
    vNormal = normal; // Keep in object space
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform vec3 sunDirection; // Direction to sun in object space

  varying vec3 vNormal;

  void main() {
    // Both normal and sunDirection are in object space
    float intensity = dot(normalize(vNormal), normalize(sunDirection));

    // Simple gradient: red (hot) to blue (cold)
    vec3 color;
    if (intensity > 0.0) {
      // Facing sun: red to yellow
      color = mix(vec3(1.0, 0.0, 0.0), vec3(1.0, 1.0, 0.0), intensity);
    } else {
      // Facing away: blue
      color = vec3(0.0, 0.0, 0.3 - intensity * 0.3);
    }

    gl_FragColor = vec4(color, 1.0);
  }
`;

const mercuryMaterial = new THREE.ShaderMaterial({
  uniforms: {
    sunDirection: { value: new THREE.Vector3(-1, 0, 0) }
  },
  vertexShader: vertexShader,
  fragmentShader: fragmentShader
});

const mercury = new THREE.Mesh(mercuryGeometry, mercuryMaterial);
mercury.position.set(15, 0, 0);
scene.add(mercury);

// Add axes to mercury
const axes = new THREE.AxesHelper(3);
mercury.add(axes);

// Orbit line
const orbitCurve = new THREE.EllipseCurve(0, 0, 15, 15, 0, 2 * Math.PI, false, 0);
const orbitPoints = orbitCurve.getPoints(100);
const orbitGeometry = new THREE.BufferGeometry().setFromPoints(
  orbitPoints.map(p => new THREE.Vector3(p.x, 0, p.y))
);
const orbitLine = new THREE.Line(
  orbitGeometry,
  new THREE.LineBasicMaterial({ color: 0x444466, opacity: 0.5, transparent: true })
);
scene.add(orbitLine);

// Arrow helper to visualize sun direction
const arrowHelper = new THREE.ArrowHelper(
  new THREE.Vector3(-1, 0, 0),
  mercury.position,
  5,
  0xffff00
);
scene.add(arrowHelper);

// State
let time = 0;
let isPaused = false;

// UI
document.getElementById('pause-btn')?.addEventListener('click', () => {
  isPaused = !isPaused;
});

document.getElementById('reset-btn')?.addEventListener('click', () => {
  time = 0;
  mercury.position.set(15, 0, 0);
});

// Info display
function updateInfo() {
  const info = document.getElementById('info-panel');
  if (!info) return;

  const angle = (time * 2) % (Math.PI * 2);
  const angleDeg = (angle * 180 / Math.PI).toFixed(1);

  info.innerHTML = `
    <h3 style="color: #0f0;">Debug Info</h3>
    <div>Orbital Angle: ${angleDeg}°</div>
    <div>Mercury Pos: (${mercury.position.x.toFixed(1)}, ${mercury.position.z.toFixed(1)})</div>
    <div>Sun Dir: (${mercuryMaterial.uniforms.sunDirection.value.x.toFixed(2)},
                    ${mercuryMaterial.uniforms.sunDirection.value.y.toFixed(2)},
                    ${mercuryMaterial.uniforms.sunDirection.value.z.toFixed(2)})</div>
    <div style="margin-top: 10px;">
      <div style="color: #f00;">● Red = Hot (facing sun)</div>
      <div style="color: #00f;">● Blue = Cold (facing away)</div>
    </div>
  `;
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  if (!isPaused) {
    time += 0.005;

    // Simple circular orbit
    const angle = time * 2;
    mercury.position.x = Math.cos(angle) * 15;
    mercury.position.z = Math.sin(angle) * 15;

    // CRITICAL: Calculate sun direction (WORKING SOLUTION!)
    const sunPos = new THREE.Vector3(0, 0, 0);
    const mercuryPos = mercury.position.clone();
    const toSunWorld = sunPos.clone().sub(mercuryPos).normalize();

    // Transform to Mercury's local space - THIS IS THE KEY!
    mercury.updateMatrixWorld();
    const mercuryMatrixInverse = new THREE.Matrix4().copy(mercury.matrixWorld).invert();
    const sunDirLocal = toSunWorld.clone().applyMatrix4(mercuryMatrixInverse).normalize();

    // Update shader uniform with LOCAL sun direction
    mercuryMaterial.uniforms.sunDirection.value.copy(sunDirLocal);

    // Update arrow helper
    arrowHelper.position.copy(mercury.position);
    arrowHelper.setDirection(toSunWorld);

    // Log periodically for debugging
    if (Math.floor(time * 100) % 100 === 0) {
      console.log('Sun direction:', sunDirLocal);
      console.log('Mercury at:', mercuryPos);
    }
  }

  updateInfo();
  controls.update();
  renderer.render(scene, camera);
}

// Start
animate();

// Handle resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Hide loading
const loading = document.getElementById('loading');
if (loading) loading.style.display = 'none';

console.log('✅ Simplified test running');
console.log('🔴 Red should always face sun');
console.log('🔵 Blue should always face away');

// Export something to make it a valid ES6 module
export default { version: 'simple' };