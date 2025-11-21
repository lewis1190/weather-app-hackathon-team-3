#!/usr/bin/env node
// generate-config.js
// Reads OPENWEATHER_API_KEY from environment and writes config.local.js
const fs = require('fs');
const path = require('path');

let key = process.env.OPENWEATHER_API_KEY || process.env.OPEN_WEATHER_API_KEY;

// If env var not set, try to read a local .env file in project root (simple parser)
if (!key) {
  const envPath = path.resolve(process.cwd(), '.env');
  try {
    if (fs.existsSync(envPath)) {
      const data = fs.readFileSync(envPath, 'utf8');
      const lines = data.split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const m = trimmed.match(/^OPENWEATHER_API_KEY\s*=\s*(.+)$/);
        if (m) {
          // remove optional surrounding quotes
          key = m[1].trim().replace(/^"|"$|^'|'$/g, '');
          break;
        }
      }
    }
  } catch (e) {
    // ignore and fall through to error below
  }
}

if (!key) {
  console.error('ERROR: OPENWEATHER_API_KEY not found in environment or .env file.');
  console.error('Set OPENWEATHER_API_KEY (or add it to .env) and re-run this script.');
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
