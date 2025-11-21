#!/usr/bin/env node
// generate-config.js
// Reads OPENWEATHER_API_KEY from environment and writes config.local.js
const fs = require('fs');
const path = require('path');

const key = process.env.OPENWEATHER_API_KEY || process.env.OPEN_WEATHER_API_KEY;
if (!key) {
  console.error('ERROR: OPENWEATHER_API_KEY environment variable not found.');
  console.error('Set OPENWEATHER_API_KEY and re-run this script.');
  process.exitCode = 2;
  process.exit();
}

const out = `window.OPENWEATHER_API_KEY = ${JSON.stringify(String(key))};\n`;
const dest = path.resolve(process.cwd(), 'config.local.js');
try {
  fs.writeFileSync(dest, out, { encoding: 'utf8', flag: 'w' });
  console.log('Wrote', dest);
} catch (err) {
  console.error('Failed to write config.local.js:', err);
  process.exitCode = 3;
}
