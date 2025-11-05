/**
 * Test to verify sun direction calculation is correct
 */

console.log('🔬 Sun Direction Math Test\n');
console.log('='*50);

// Simulate THREE.Vector3
class Vector3 {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    clone() {
        return new Vector3(this.x, this.y, this.z);
    }

    sub(v) {
        this.x -= v.x;
        this.y -= v.y;
        this.z -= v.z;
        return this;
    }

    normalize() {
        const length = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
        if (length > 0) {
            this.x /= length;
            this.y /= length;
            this.z /= length;
        }
        return this;
    }

    dot(v) {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    }

    toString() {
        return `(${this.x.toFixed(2)}, ${this.y.toFixed(2)}, ${this.z.toFixed(2)})`;
    }
}

// Test cases
const tests = [
    {
        name: "Mercury at RIGHT of sun",
        mercuryPos: new Vector3(10, 0, 0),
        sunPos: new Vector3(0, 0, 0),
        expectedDir: new Vector3(-1, 0, 0), // Points LEFT toward sun
        hotSide: "LEFT side of Mercury"
    },
    {
        name: "Mercury at LEFT of sun",
        mercuryPos: new Vector3(-10, 0, 0),
        sunPos: new Vector3(0, 0, 0),
        expectedDir: new Vector3(1, 0, 0), // Points RIGHT toward sun
        hotSide: "RIGHT side of Mercury"
    },
    {
        name: "Mercury at FRONT of sun",
        mercuryPos: new Vector3(0, 0, 10),
        sunPos: new Vector3(0, 0, 0),
        expectedDir: new Vector3(0, 0, -1), // Points BACK toward sun
        hotSide: "BACK side of Mercury"
    },
    {
        name: "Mercury at BACK of sun",
        mercuryPos: new Vector3(0, 0, -10),
        sunPos: new Vector3(0, 0, 0),
        expectedDir: new Vector3(0, 0, 1), // Points FRONT toward sun
        hotSide: "FRONT side of Mercury"
    }
];

// Run tests
let passed = 0;
let failed = 0;

tests.forEach((test, i) => {
    console.log(`\nTest ${i + 1}: ${test.name}`);
    console.log('-'.repeat(40));
    console.log(`Mercury at: ${test.mercuryPos.toString()}`);
    console.log(`Sun at: ${test.sunPos.toString()}`);

    // Calculate sun direction (FROM Mercury TO Sun)
    const toSun = test.sunPos.clone().sub(test.mercuryPos).normalize();
    console.log(`Calculated direction: ${toSun.toString()}`);
    console.log(`Expected direction: ${test.expectedDir.toString()}`);

    // Check if correct
    const correct = Math.abs(toSun.x - test.expectedDir.x) < 0.01 &&
                   Math.abs(toSun.y - test.expectedDir.y) < 0.01 &&
                   Math.abs(toSun.z - test.expectedDir.z) < 0.01;

    if (correct) {
        console.log(`✅ PASS - Direction is correct`);
        console.log(`✅ Hot side should be: ${test.hotSide}`);
        passed++;
    } else {
        console.log(`❌ FAIL - Direction is wrong!`);
        failed++;
    }

    // Test dot product with normals
    console.log('\nNormal dot products:');
    const normals = [
        { name: 'Left (-X)', vec: new Vector3(-1, 0, 0) },
        { name: 'Right (+X)', vec: new Vector3(1, 0, 0) },
        { name: 'Front (+Z)', vec: new Vector3(0, 0, 1) },
        { name: 'Back (-Z)', vec: new Vector3(0, 0, -1) }
    ];

    normals.forEach(n => {
        const dot = n.vec.dot(toSun);
        const temp = dot > 0 ? '🔴 HOT' : '🔵 COLD';
        console.log(`  ${n.name}: dot=${dot.toFixed(2)} → ${temp}`);
    });
});

console.log('\n' + '='.repeat(50));
console.log(`Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
    console.log('✅ All tests passed! Math is correct.');
    console.log('\nThe issue must be in the shader or coordinate transformation.');
} else {
    console.log('❌ Some tests failed! Check the calculation.');
}

// Additional debug for main.js implementation
console.log('\n' + '='.repeat(50));
console.log('Debug: main.js implementation');
console.log('-'.repeat(50));

// Simulate main.js calculation
const mercuryPos = new Vector3(10, 0, 0);
const sunPos = new Vector3(0, 0, 0);
console.log(`\nCode: const toSun = sunPos.clone().sub(mercuryPos).normalize();`);

const toSun = sunPos.clone().sub(mercuryPos).normalize();
console.log(`Result: toSun = ${toSun.toString()}`);
console.log(`\nThis means:`);
console.log(`- X component: ${toSun.x < 0 ? 'Negative (points LEFT)' : 'Positive (points RIGHT)'}`);
console.log(`- The hot side should be on the LEFT when Mercury is on the RIGHT`);

console.log('\n✅ Math verification complete!');