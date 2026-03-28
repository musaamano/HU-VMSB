import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('HU-VMS Diagnostic Tool');
console.log('====================');

// Check if we're in the right directory
console.log('Current directory:', __dirname);
console.log('Available folders:', fs.readdirSync(__dirname).filter(f => fs.statSync(path.join(__dirname, f)).isDirectory()));

// Check main.jsx location
const mainLocations = [
  './src/main.jsx',
  './HU-VMS/src/main.jsx',
  './HU-VMS-clean/src/main.jsx',
  './HU-VMS-fresh/src/main.jsx'
];

mainLocations.forEach(location => {
  if (fs.existsSync(location)) {
    console.log(`✅ Found main.jsx at: ${location}`);
  } else {
    console.log(`❌ Missing: ${location}`);
  }
});

console.log('\nRecommendation: You should run the frontend from one of the HU-VMS folders');
console.log('Example: cd HU-VMS && npm run dev');
