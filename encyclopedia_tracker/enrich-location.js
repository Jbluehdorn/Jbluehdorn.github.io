const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const fetch = require('node-fetch');

const DATA_DIR = path.join(__dirname, 'app', 'public', 'data');
const DELAY_MS = 1200;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeLocationWeather(url, name) {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'ACEncyclopediaTracker/1.0 (educational project)' }
    });
    if (!response.ok) {
      console.error(`  HTTP ${response.status} for ${name}`);
      return null;
    }
    const html = await response.text();
    const $ = cheerio.load(html);

    // Find the "In New Horizons" heading
    let nhSection = null;
    $('h3').each(function () {
      const headingText = $(this).find('.mw-headline').text();
      if (/In\s+New Horizons/i.test(headingText) && !nhSection) {
        nhSection = $(this);
      }
    });
    if (!nhSection) {
      $('h2').each(function () {
        const headingText = $(this).find('.mw-headline').text();
        if (/In\s+New Horizons/i.test(headingText) && !nhSection) {
          nhSection = $(this);
        }
      });
    }
    if (!nhSection) {
      console.error(`  No NH section for ${name}`);
      return null;
    }

    // Find the detail box
    let detailBox = nhSection.nextAll('div.infobox-detail').first();
    if (!detailBox.length) {
      let sibling = nhSection.next();
      while (sibling.length && !sibling.hasClass('infobox-detail')) {
        sibling = sibling.next();
      }
      detailBox = sibling;
    }
    if (!detailBox.length) {
      console.error(`  No detail box for ${name}`);
      return null;
    }

    // Extract Location
    let location = null;
    let weather = null;

    detailBox.find('th#detail-label').each(function () {
      const label = $(this).text().trim();
      if (/^Location$/i.test(label)) {
        const td = $(this).next('td');
        const rawText = td.text().trim();
        // Location may have weather in parentheses, e.g. "Sea (raining)"
        const match = rawText.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
        if (match) {
          location = match[1].trim();
          weather = match[2].trim();
        } else {
          location = rawText;
        }
      }
    });

    return { location: location || 'Unknown', weather: weather || null };
  } catch (err) {
    console.error(`  Error scraping ${name}: ${err.message}`);
    return null;
  }
}

async function enrichFile(filename) {
  const filepath = path.join(DATA_DIR, filename);
  const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));

  console.log(`\n=== ${filename} (${data.length} creatures) ===\n`);

  let updated = 0;
  let skipped = 0;

  for (let i = 0; i < data.length; i++) {
    const creature = data[i];

    if (creature.location) {
      console.log(`  [${i + 1}/${data.length}] ${creature.Name} — already has location, skipping`);
      skipped++;
      continue;
    }

    console.log(`  [${i + 1}/${data.length}] Scraping ${creature.Name}...`);
    const result = await scrapeLocationWeather(creature['Nookipedia Link'], creature.Name);

    if (result) {
      creature.location = result.location;
      if (result.weather) creature.weather = result.weather;
      console.log(`    → location="${result.location}"${result.weather ? ` weather="${result.weather}"` : ''}`);
      updated++;
    } else {
      console.log(`    → FAILED`);
    }

    // Save after each creature (incremental)
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));

    if (i < data.length - 1) await sleep(DELAY_MS);
  }

  console.log(`\n  Done: ${updated} updated, ${skipped} skipped`);
}

async function main() {
  // Sea creatures don't have a Location field on their pages — they're always "Ocean (diving)"
  // Set them manually
  const seaPath = path.join(DATA_DIR, 'sea-creatures.json');
  const seaData = JSON.parse(fs.readFileSync(seaPath, 'utf8'));
  for (const c of seaData) {
    if (!c.location) {
      c.location = 'Ocean';
      c.weather = null;
    }
  }
  fs.writeFileSync(seaPath, JSON.stringify(seaData, null, 2));
  console.log('Sea creatures: all set to "Ocean"');

  await enrichFile('fish.json');
  await enrichFile('insects.json');
}

main().catch(console.error);
