/**
 * One-time script to fetch all ACNH artwork from the Nookipedia API
 * and save it to app/public/data/artwork.json
 *
 * Usage: node fetch-artwork.js
 * Requires: NOOKIPEDIA_API_KEY in ../.env
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env manually (no dotenv dependency needed)
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^(\w+)=(.*)$/);
  if (match) envVars[match[1]] = match[2].trim();
}

const API_KEY = envVars.NOOKIPEDIA_API_KEY;
if (!API_KEY || API_KEY === 'your_api_key_here') {
  console.error('Error: Set your NOOKIPEDIA_API_KEY in .env first');
  process.exit(1);
}

async function fetchArtwork() {
  console.log('Fetching artwork from Nookipedia API...');

  const res = await fetch('https://api.nookipedia.com/nh/art', {
    headers: {
      'X-API-KEY': API_KEY,
      'Accept-Version': '2.0.0',
    },
  });

  if (!res.ok) {
    console.error(`API error: ${res.status} ${res.statusText}`);
    const body = await res.text();
    console.error(body);
    process.exit(1);
  }

  const data = await res.json();
  console.log(`Received ${data.length} art pieces`);

  const outPath = path.join(__dirname, 'app', 'public', 'data', 'artwork.json');
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
  console.log(`Saved to ${outPath}`);
}

fetchArtwork();
