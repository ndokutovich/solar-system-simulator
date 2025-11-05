import { readdir, rm } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDir = join(__dirname, '..', 'public');

try {
  const files = await readdir(publicDir);

  for (const file of files) {
    const filePath = join(publicDir, file);
    await rm(filePath, { recursive: true, force: true });
  }

  console.log('✓ Public directory cleaned');
} catch (error) {
  if (error.code === 'ENOENT') {
    console.log('✓ Public directory does not exist (skipping clean)');
  } else {
    console.error('Error cleaning public directory:', error);
    process.exit(1);
  }
}
