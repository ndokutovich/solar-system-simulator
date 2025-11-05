import { cp, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const solarSystemDir = join(rootDir, 'solar_system');
const publicDir = join(rootDir, 'public');

async function build() {
  try {
    console.log('📦 Building to public/ directory...\n');

    // Ensure public directory exists
    await mkdir(publicDir, { recursive: true });

    // Copy root files
    console.log('  Copying index.html...');
    await cp(join(solarSystemDir, 'index.html'), join(publicDir, 'index.html'));

    console.log('  Copying index.css...');
    await cp(join(solarSystemDir, 'index.css'), join(publicDir, 'index.css'));

    console.log('  Copying manifest.json...');
    await cp(join(solarSystemDir, 'manifest.json'), join(publicDir, 'manifest.json'));

    // Copy icons
    console.log('  Copying favicon.svg...');
    await cp(join(solarSystemDir, 'favicon.svg'), join(publicDir, 'favicon.svg'));

    console.log('  Copying apple-touch-icon.svg...');
    await cp(join(solarSystemDir, 'apple-touch-icon.svg'), join(publicDir, 'apple-touch-icon.svg'));

    console.log('  Copying icon-192x192.svg...');
    await cp(join(solarSystemDir, 'icon-192x192.svg'), join(publicDir, 'icon-192x192.svg'));

    console.log('  Copying icon-512x512.svg...');
    await cp(join(solarSystemDir, 'icon-512x512.svg'), join(publicDir, 'icon-512x512.svg'));

    // Copy directories
    console.log('  Copying src/ directory...');
    await cp(join(solarSystemDir, 'src'), join(publicDir, 'src'), { recursive: true });

    console.log('  Copying lib/ directory...');
    await cp(join(solarSystemDir, 'lib'), join(publicDir, 'lib'), { recursive: true });

    console.log('\n✅ Build complete!\n');
    console.log('Structure:');
    console.log('  public/');
    console.log('    index.html');
    console.log('    index.css');
    console.log('    manifest.json');
    console.log('    *.svg (icons)');
    console.log('    src/');
    console.log('    lib/');

  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();
