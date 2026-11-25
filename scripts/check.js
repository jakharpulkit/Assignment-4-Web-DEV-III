const path = require('path');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');
const jsFiles = [
  'server.js',
  'config/db.js',
  'events/appEvents.js',
  'middleware/auth.js',
  'routes/authRoutes.js',
  'routes/noteRoutes.js'
];

let failed = false;
for (const file of jsFiles) {
  const result = spawnSync(process.execPath, ['--check', path.join(root, file)], { encoding: 'utf8' });
  if (result.status !== 0) {
    failed = true;
    console.error('FAIL syntax:', file, result.stderr || result.stdout);
  } else {
    console.log('PASS syntax:', file);
  }
}

try {
  const collectionPath = path.join(root, 'postman', 'Secure-Connect-Lab4.postman_collection.json');
  const collection = JSON.parse(require('fs').readFileSync(collectionPath, 'utf8'));
  if (!Array.isArray(collection.item) || collection.item.length < 8) throw new Error('Postman collection has too few requests');
  console.log('PASS Postman collection JSON:', collection.item.length, 'requests');
} catch (error) {
  failed = true;
  console.error('FAIL Postman collection:', error.message);
}

if (failed) process.exit(1);
console.log('All static project checks passed.');
