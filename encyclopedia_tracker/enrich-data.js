const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const fetch = require('node-fetch');

const JSON_DIR = path.join(__dirname, 'json');
const DELAY_MS = 1500; // polite delay between requests

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseTimeOfYear(raw) {
  if (!raw) return { north: [], south: [] };
  
  const text = raw.replace(/\s+/g, ' ').trim();
  
  if (/all year/i.test(text)) {
    return {
      north: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      south: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    };
  }

  const monthMap = {
    'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
    'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
  };

  function parseMonthRange(rangeStr) {
    const months = [];
    // Split by commas first (e.g. "Jun – Sep, Dec – Mar")
    const segments = rangeStr.split(/[,&]/).map(s => s.trim()).filter(Boolean);
    
    for (const segment of segments) {
      const rangeMatch = segment.match(/([A-Za-z]+)\s*[–\-]\s*([A-Za-z]+)/);
      if (rangeMatch) {
        const startMonth = monthMap[rangeMatch[1].toLowerCase().substring(0, 3)];
        const endMonth = monthMap[rangeMatch[2].toLowerCase().substring(0, 3)];
        if (startMonth && endMonth) {
          let m = startMonth;
          while (true) {
            months.push(m);
            if (m === endMonth) break;
            m = (m % 12) + 1;
          }
        }
      } else {
        // Single month
        const singleMatch = segment.match(/([A-Za-z]+)/);
        if (singleMatch) {
          const m = monthMap[singleMatch[1].toLowerCase().substring(0, 3)];
          if (m) months.push(m);
        }
      }
    }
    return [...new Set(months)].sort((a, b) => a - b);
  }

  // Check for North:/South: pattern
  const northMatch = text.match(/North:\s*(.+?)(?=South:|$)/i);
  const southMatch = text.match(/South:\s*(.+?)$/i);

  if (northMatch && southMatch) {
    return {
      north: parseMonthRange(northMatch[1].trim()),
      south: parseMonthRange(southMatch[1].trim())
    };
  }

  // If no hemisphere distinction, same months for both
  const months = parseMonthRange(text);
  return { north: months, south: months };
}

function parseTimeOfDay(raw) {
  if (!raw) return { start: 0, end: 24, allDay: true };
  
  const text = raw.replace(/\s+/g, ' ').trim();
  
  if (/all day/i.test(text)) {
    return { start: 0, end: 24, allDay: true };
  }

  // Parse times like "4 AM – 9 PM", "4 PM – 9 AM"
  const timeMatch = text.match(/(\d{1,2})\s*(AM|PM)\s*[–\-]\s*(\d{1,2})\s*(AM|PM)/i);
  if (timeMatch) {
    let startHour = parseInt(timeMatch[1]);
    const startPeriod = timeMatch[2].toUpperCase();
    let endHour = parseInt(timeMatch[3]);
    const endPeriod = timeMatch[4].toUpperCase();

    if (startPeriod === 'PM' && startHour !== 12) startHour += 12;
    if (startPeriod === 'AM' && startHour === 12) startHour = 0;
    if (endPeriod === 'PM' && endHour !== 12) endHour += 12;
    if (endPeriod === 'AM' && endHour === 12) endHour = 0;

    return { start: startHour, end: endHour, allDay: false };
  }

  return { start: 0, end: 24, allDay: true };
}

async function scrapeCreature(url, name) {
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

    // Find the "In New Horizons" section
    let nhSection = null;

    // Look for the h3 heading with "In New Horizons" or "In Pocket Camp" as fallback
    $('h3').each(function () {
      const headingText = $(this).find('.mw-headline').text();
      if (/In\s+New Horizons/i.test(headingText) && !nhSection) {
        nhSection = $(this);
      }
    });

    if (!nhSection) {
      // For sea creatures that might only appear in NH, try h2
      $('h2').each(function () {
        const headingText = $(this).find('.mw-headline').text();
        if (/In\s+New Horizons/i.test(headingText) && !nhSection) {
          nhSection = $(this);
        }
      });
    }

    if (!nhSection) {
      console.error(`  No "In New Horizons" section found for ${name}`);
      return null;
    }

    // Find the infobox-detail div that follows the NH heading
    let detailBox = nhSection.nextAll('div.infobox-detail').first();
    if (!detailBox.length) {
      // Sometimes there's a <p> or other elements between
      let sibling = nhSection.next();
      while (sibling.length && !sibling.hasClass('infobox-detail')) {
        sibling = sibling.next();
      }
      detailBox = sibling;
    }

    if (!detailBox.length) {
      console.error(`  No detail box found for ${name}`);
      return null;
    }

    // Extract icon image URL from the detail box
    let iconUrl = null;
    detailBox.find('img').each(function () {
      const src = $(this).attr('src') || '';
      const alt = $(this).attr('alt') || '';
      // Look for the NH Icon image (128x128 creature icon)
      if ((src.includes('NH_Icon') || src.includes('NH Icon')) && !iconUrl) {
        // Get the full-size version
        const dataSrc = $(this).attr('data-file-width');
        if (dataSrc) {
          iconUrl = src.replace(/\/thumb\//, '/').replace(/\/\d+px-[^/]+$/, '');
        } else {
          iconUrl = src;
        }
      }
    });

    // If no NH Icon found in detail box, check the infobox at the top
    if (!iconUrl) {
      $('table.infobox img').each(function () {
        const src = $(this).attr('src') || '';
        if ((src.includes('NH_Icon') || src.includes('NH Icon')) && !iconUrl) {
          iconUrl = src.replace(/\/thumb\//, '/').replace(/\/\d+px-[^/]+$/, '');
        }
      });
    }

    // Make URL absolute
    if (iconUrl && !iconUrl.startsWith('http')) {
      iconUrl = 'https://dodo.ac' + iconUrl;
    }

    // Extract data from the table rows
    let timeOfYearRaw = null;
    let timeOfDayRaw = null;

    detailBox.find('th#detail-label').each(function () {
      const label = $(this).text().trim();
      const value = $(this).next('td').clone();
      // Remove child elements that aren't text or small
      const valueText = value.text().trim();

      if (/^Time of year/i.test(label)) {
        // Get the HTML to preserve North:/South: <small> tags
        const valueHtml = $(this).next('td').html() || '';
        // Parse structured text from HTML
        const northMatch = valueHtml.match(/<small>North:<\/small>\s*([^<]+)/i);
        const southMatch = valueHtml.match(/<small>South:<\/small>\s*([^<]+)/i);
        
        if (northMatch && southMatch) {
          timeOfYearRaw = `North: ${northMatch[1].trim()} South: ${southMatch[1].trim()}`;
        } else {
          timeOfYearRaw = valueText;
        }
      } else if (/^Time of day/i.test(label)) {
        timeOfDayRaw = valueText;
      }
    });

    const timeOfYear = parseTimeOfYear(timeOfYearRaw);
    const timeOfDay = parseTimeOfDay(timeOfDayRaw);

    return {
      iconUrl,
      timeOfYear,
      timeOfYearRaw: timeOfYearRaw || 'Unknown',
      timeOfDay,
      timeOfDayRaw: timeOfDayRaw || 'Unknown'
    };
  } catch (err) {
    console.error(`  Error scraping ${name}: ${err.message}`);
    return null;
  }
}

async function enrichFile(filename) {
  const filepath = path.join(JSON_DIR, filename);
  const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  
  console.log(`\n=== Processing ${filename} (${data.length} creatures) ===\n`);

  let enrichedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < data.length; i++) {
    const creature = data[i];
    
    // Skip if already enriched
    if (creature.iconUrl && creature.timeOfYear && creature.timeOfDay) {
      console.log(`  [${i + 1}/${data.length}] ${creature.Name} - already enriched, skipping`);
      enrichedCount++;
      continue;
    }

    console.log(`  [${i + 1}/${data.length}] Scraping ${creature.Name}...`);
    
    const result = await scrapeCreature(creature['Nookipedia Link'], creature.Name);
    
    if (result) {
      creature.iconUrl = result.iconUrl;
      creature.timeOfYear = result.timeOfYear;
      creature.timeOfYearRaw = result.timeOfYearRaw;
      creature.timeOfDay = result.timeOfDay;
      creature.timeOfDayRaw = result.timeOfDayRaw;
      enrichedCount++;
      console.log(`    ✓ Icon: ${result.iconUrl ? 'found' : 'MISSING'}`);
      console.log(`    ✓ Year: ${result.timeOfYearRaw}`);
      console.log(`    ✓ Day:  ${result.timeOfDayRaw}`);
    } else {
      failedCount++;
      console.log(`    ✗ FAILED`);
    }

    // Save progress after each creature (in case of interruption)
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    
    // Be polite to the server
    if (i < data.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  console.log(`\n  Done: ${enrichedCount} enriched, ${failedCount} failed out of ${data.length}`);
}

async function main() {
  const files = ['fish.json', 'insects.json', 'sea-creatures.json'];
  
  for (const file of files) {
    await enrichFile(file);
  }
  
  console.log('\n=== All done! ===');
}

main().catch(console.error);
