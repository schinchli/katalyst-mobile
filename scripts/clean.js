const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const args = new Set(process.argv.slice(2));

const cacheTargets = [
  '.expo',
  'dist',
  'coverage',
  '.turbo',
  'ios/build',
  'ios/DerivedData',
];

const fullTargets = [...cacheTargets, 'web-build'];

const targets = args.has('--cache-only') ? cacheTargets : fullTargets;

for (const relativeTarget of targets) {
  const absoluteTarget = path.join(projectRoot, relativeTarget);
  fs.rmSync(absoluteTarget, { recursive: true, force: true });
}

console.log(`Removed ${targets.length} generated path(s).`);
