import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const libDir = join(__dirname, '..', 'solar_system', 'lib', 'three');

// Disable certificate validation for this download
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function download(url, filename) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading ${filename}...`);
    https.get(url, (response) => {
      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', async () => {
        try {
          await mkdir(libDir, { recursive: true });
          await writeFile(join(libDir, filename), data);
          console.log(`✓ Downloaded ${filename} (${(data.length / 1024).toFixed(1)} KB)`);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

async function downloadThree() {
  try {
    console.log('📦 Downloading Three.js r128...\n');

    // Download three.min.js
    await download(
      'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
      'three.min.js'
    );

    // Download OrbitControls.js
    await download(
      'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js',
      'OrbitControls.js'
    );

    console.log('\n✅ Three.js downloaded successfully!');
    console.log(`   Location: solar_system/lib/three/`);

  } catch (error) {
    console.error('❌ Download failed:', error.message);
    process.exit(1);
  } finally {
    // Re-enable certificate validation
    delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  }
}

downloadThree();
