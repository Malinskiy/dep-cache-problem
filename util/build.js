import { generateEmojiHash } from '../src/emoji.js';
import { capitalize } from '../src/lang.js';
import fs from 'fs';

async function doLotsOfWork() {
  // Simulate a time-consuming build process
  return new Promise((resolve) => setTimeout(resolve, 10000));
}

async function generateBuild() {
  console.log('⏳ Generating build file...');
  await doLotsOfWork();
  console.log('😫 This is taking forever...');
  await doLotsOfWork();
  const buildContent = `# auto generated on ${new Date().toISOString()}
${generateEmojiHash(capitalize('build file'), 36)}
  `;
  fs.mkdirSync('dist/', { recursive: true });
  fs.writeFileSync('dist/dep.bin', buildContent, 'utf8');
  console.log('✅ Binary file generated at dist/dep.bin');
}

// generateBuild()

export {
  generateBuild
}
