#!/usr/bin/env node
/**
 * build.js
 * Fetches Player Handout markdown from the BralStars GitHub repo,
 * converts Obsidian-flavoured markdown to HTML, and writes static pages.
 *
 * Usage: npm run build
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

// ─── Config ──────────────────────────────────────────────────────────────────

const REPO_OWNER = 'Jbluehdorn';
const REPO_NAME  = 'BralStars';
const BRANCH     = 'main';
const RAW_BASE   = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}`;
const API_BASE   = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;

// Folders in the vault to pull from (path within the repo)
const SOURCE_FOLDERS = [
  '3. Player Handouts',
  '3. Player Handouts/Maps',
];

const OUT_DIR = __dirname; // write HTML next to this script

// ─── GitHub helpers ──────────────────────────────────────────────────────────

function get(url) {
  return new Promise((resolve, reject) => {
    const opts = new URL(url);
    https.get({ hostname: opts.hostname, path: opts.pathname + opts.search,
      headers: { 'User-Agent': 'bral-stars-builder', 'Accept': 'application/vnd.github.v3+json' }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(JSON.parse(data)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function getRaw(url) {
  return new Promise((resolve, reject) => {
    const opts = new URL(url);
    https.get({ hostname: opts.hostname, path: opts.pathname + opts.search,
      headers: { 'User-Agent': 'bral-stars-builder' }
    }, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return getRaw(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// ─── Obsidian → HTML preprocessing ──────────────────────────────────────────

// Build a slug from a display name (used for wiki link resolution)
function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// Map of known page titles → their output HTML filenames
const PAGE_MAP = {};

function preprocessObsidian(md, allSlugs) {
  // 1. Obsidian callouts  > [!type] Title\n> content
  md = md.replace(/^> \[!(\w+)\](.*?)\n((?:^>.*\n?)*)/gm, (_, type, title, body) => {
    const content = body.replace(/^> ?/gm, '').trim();
    const t = type.toLowerCase();
    const label = title.trim() || type.charAt(0).toUpperCase() + type.slice(1);
    return `<div class="callout callout-${t}"><div class="callout-title">${label}</div><div class="callout-body">\n\n${content}\n\n</div></div>\n\n`;
  });

  // 2. ![[image]] embeds → <img> using raw GitHub URL
  md = md.replace(/!\[\[([^\]]+?)\]\]/g, (_, file) => {
    const url = `${RAW_BASE}/z_attachments/${encodeURIComponent(file)}`;
    return `![${file}](${url})`;
  });

  // 3. [[Page|Alias]] and [[Page]] wiki links → relative HTML links (or plain text if unresolved)
  md = md.replace(/\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g, (_, target, alias) => {
    const display = alias || target;
    const slug = slugify(target.trim());
    const href = allSlugs[slug] || LINK_OVERRIDES[slug];
    return href ? `[${display}](${href})` : display;
  });

  return md;
}

// ─── HTML template ────────────────────────────────────────────────────────────

function renderPage(title, bodyHtml, breadcrumb = '') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Bral Stars</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
      background: #0e0e1a;
      color: #d8d8e8;
      min-height: 100vh;
      padding: 40px 20px;
      line-height: 1.7;
    }

    .container { max-width: 780px; margin: 0 auto; }

    .site-nav {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 32px;
      font-size: 13px;
      color: #6666a0;
    }
    .site-nav a { color: #8888cc; text-decoration: none; }
    .site-nav a:hover { color: #aaaaee; }
    .site-nav .sep { color: #444466; }

    h1 { font-size: 28px; color: #c8b8f0; margin-bottom: 24px; padding-bottom: 12px; border-bottom: 2px solid #2a2a4a; }
    h2 { font-size: 20px; color: #a090d8; margin: 28px 0 12px; }
    h3 { font-size: 16px; color: #9090c8; margin: 20px 0 8px; }

    p { margin-bottom: 14px; }

    a { color: #8899ee; text-decoration: none; }
    a:hover { color: #aabbff; text-decoration: underline; }

    ul, ol { margin: 0 0 14px 24px; }
    li { margin-bottom: 4px; }

    strong { color: #e8e0ff; }

    hr { border: none; border-top: 1px solid #2a2a4a; margin: 28px 0; }

    table { width: 100%; border-collapse: collapse; margin-bottom: 18px; font-size: 14px; }
    th { background: #1e1e38; color: #a090d8; text-align: left; padding: 8px 12px; border-bottom: 2px solid #2a2a4a; }
    td { padding: 8px 12px; border-bottom: 1px solid #1e1e32; }
    tr:last-child td { border-bottom: none; }

    code { background: #1a1a30; padding: 2px 6px; border-radius: 4px; font-size: 13px; color: #b0a0e8; }
    pre { background: #1a1a30; padding: 16px; border-radius: 8px; overflow-x: auto; margin-bottom: 18px; }
    pre code { padding: 0; background: none; }

    img { max-width: 100%; border-radius: 8px; margin: 16px 0; border: 1px solid #2a2a4a; }

    blockquote { border-left: 3px solid #4a3a8a; padding: 8px 16px; margin: 16px 0; color: #a090c8; background: #16162a; border-radius: 0 6px 6px 0; }

    /* Obsidian callouts */
    .callout { border-radius: 8px; padding: 14px 18px; margin: 18px 0; border-left: 4px solid; }
    .callout-title { font-weight: 700; font-size: 14px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
    .callout-body > p:last-child { margin-bottom: 0; }
    .callout-body ul { margin-bottom: 0; }

    .callout-infobox, .callout-info, .callout-note {
      background: #16203a; border-color: #4a6aaa; }
    .callout-infobox .callout-title, .callout-info .callout-title, .callout-note .callout-title {
      color: #7a9aee; }

    .callout-warning {
      background: #2a1e18; border-color: #aa6a30; }
    .callout-warning .callout-title { color: #e8944a; }

    .callout-cards {
      background: #16162a; border-color: #4a3a8a; border-left: none;
      border-top: 2px solid #4a3a8a; }
    .callout-cards .callout-title { color: #9080c8; }

    /* Index page cards */
    .page-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; margin: 24px 0; }
    .page-card { display: block; background: #16162e; border: 1px solid #2a2a50; border-radius: 10px;
      padding: 20px; text-decoration: none; color: #d8d8e8; transition: background 0.15s, border-color 0.15s, transform 0.1s; }
    .page-card:hover { background: #1e1e3e; border-color: #6655aa; transform: translateY(-2px); text-decoration: none; }
    .page-card .card-title { font-size: 15px; font-weight: 600; color: #c8b8f0; margin-bottom: 4px; }
    .page-card .card-desc { font-size: 12px; color: #7070a0; }

    .hero { text-align: center; margin-bottom: 36px; }
    .hero img { max-height: 280px; width: 100%; object-fit: cover; border-radius: 12px; margin: 0; }
    .hero h1 { margin-top: 20px; border: none; padding: 0; }
    .hero p { color: #8080b0; margin-top: 8px; }

    @media (max-width: 480px) {
      body { padding: 24px 14px; }
      h1 { font-size: 22px; }
      .page-grid { grid-template-columns: 1fr; }
    }

    /* Lightbox */
    #lightbox {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.93);
      z-index: 1000;
      overflow: hidden;
    }
    #lightbox.active { display: flex; align-items: center; justify-content: center; }
    #lightbox-img {
      max-width: 95vw;
      max-height: 95vh;
      border-radius: 8px;
      cursor: grab;
      user-select: none;
      transform-origin: center center;
      border: 1px solid #2a2a4a;
    }
    #lightbox-img.dragging { cursor: grabbing; }
    #lightbox-close {
      position: fixed;
      top: 16px;
      right: 22px;
      color: rgba(255,255,255,0.7);
      font-size: 36px;
      line-height: 1;
      cursor: pointer;
      z-index: 1001;
      transition: color 0.15s;
    }
    #lightbox-close:hover { color: #fff; }
    #lightbox-hint {
      position: fixed;
      bottom: 14px;
      left: 50%;
      transform: translateX(-50%);
      color: rgba(255,255,255,0.3);
      font-size: 12px;
      pointer-events: none;
      white-space: nowrap;
    }
    .container img { cursor: zoom-in; }
    .hero img { cursor: default; }
  </style>
</head>
<body>
  <div class="container">
    <nav class="site-nav">
      <a href="/">jbluehdorn.github.io</a>
      <span class="sep">›</span>
      ${breadcrumb}
    </nav>
    ${bodyHtml}
  </div>

  <!-- Lightbox -->
  <div id="lightbox">
    <span id="lightbox-close">&#x2715;</span>
    <img id="lightbox-img" src="" alt="">
    <div id="lightbox-hint">scroll to zoom &nbsp;·&nbsp; drag to pan &nbsp;·&nbsp; esc to close</div>
  </div>

  <script>
  (function () {
    var lb     = document.getElementById('lightbox');
    var lbImg  = document.getElementById('lightbox-img');
    var lbClose = document.getElementById('lightbox-close');

    var scale = 1, tx = 0, ty = 0;
    var dragging = false, startX = 0, startY = 0, baseX = 0, baseY = 0;

    function applyTransform() {
      lbImg.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + scale + ')';
    }

    function openLightbox(src, alt) {
      lbImg.src = src;
      lbImg.alt = alt || '';
      scale = 1; tx = 0; ty = 0;
      applyTransform();
      lb.classList.add('active');
    }

    function closeLightbox() { lb.classList.remove('active'); }

    // Wire up all content images (exclude hero)
    document.querySelectorAll('.container img').forEach(function (img) {
      img.addEventListener('click', function (e) {
        e.stopPropagation();
        openLightbox(img.src, img.alt);
      });
    });

    lbClose.addEventListener('click', closeLightbox);
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLightbox(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLightbox(); });

    // Mouse drag to pan
    lbImg.addEventListener('mousedown', function (e) {
      e.preventDefault();
      dragging = true;
      startX = e.clientX; startY = e.clientY;
      baseX = tx; baseY = ty;
      lbImg.classList.add('dragging');
    });
    document.addEventListener('mousemove', function (e) {
      if (!dragging) return;
      tx = baseX + (e.clientX - startX);
      ty = baseY + (e.clientY - startY);
      applyTransform();
    });
    document.addEventListener('mouseup', function () {
      dragging = false;
      lbImg.classList.remove('dragging');
    });

    // Scroll to zoom (towards cursor)
    lb.addEventListener('wheel', function (e) {
      e.preventDefault();
      var rect = lbImg.getBoundingClientRect();
      var cx = e.clientX - (rect.left + rect.width  / 2);
      var cy = e.clientY - (rect.top  + rect.height / 2);
      var delta = e.deltaY > 0 ? 0.88 : 1.14;
      var newScale = Math.max(0.3, Math.min(10, scale * delta));
      tx += cx * (1 - newScale / scale);
      ty += cy * (1 - newScale / scale);
      scale = newScale;
      applyTransform();
    }, { passive: false });

    // Touch: drag + pinch-zoom
    var lastDist = null, touchBaseX = 0, touchBaseY = 0, touchStartX = 0, touchStartY = 0;
    lb.addEventListener('touchstart', function (e) {
      if (e.touches.length === 1) {
        dragging = true;
        touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY;
        touchBaseX = tx; touchBaseY = ty;
      }
      lastDist = null;
    }, { passive: true });
    lb.addEventListener('touchmove', function (e) {
      e.preventDefault();
      if (e.touches.length === 1 && dragging) {
        tx = touchBaseX + (e.touches[0].clientX - touchStartX);
        ty = touchBaseY + (e.touches[0].clientY - touchStartY);
        applyTransform();
      } else if (e.touches.length === 2) {
        var dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        if (lastDist) {
          scale = Math.max(0.3, Math.min(10, scale * (dist / lastDist)));
          applyTransform();
        }
        lastDist = dist;
      }
    }, { passive: false });
    lb.addEventListener('touchend', function () { dragging = false; lastDist = null; }, { passive: true });
  })();
  </script>
</body>
</html>`;
}

// ─── Index page ───────────────────────────────────────────────────────────────

function renderIndex(pages) {
  const heroImg = `${RAW_BASE}/z_attachments/RockOfBral_Render.jpg`;
  const cards = pages.map(p => `
    <a href="${p.file}" class="page-card">
      <div class="card-title">${p.title}</div>
      <div class="card-desc">${p.desc}</div>
    </a>`).join('');

  const body = `
    <div class="hero">
      <img src="${heroImg}" alt="The Rock of Bral">
      <h1>✦ Bral Stars ✦</h1>
      <p>A West Marches D&amp;D campaign set on the Rock of Bral</p>
    </div>
    <div class="page-grid">${cards}</div>
    <hr>
    <p style="text-align:center;color:#555580;font-size:13px;">
      Content sourced from the <a href="https://github.com/${REPO_OWNER}/${REPO_NAME}">BralStars vault</a>
    </p>`;

  return renderPage('Bral Stars', body, 'Bral Stars');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

// Files to skip (Obsidian navigation files, empty files)
const SKIP_FILES = ['! map.md', '0. scratch notes.md'];

// Human-readable descriptions for each page
const PAGE_DESCS = {
  'welcome-to-the-rock-of-bral': 'Setting introduction — districts, factions, Wildspace',
  'west-marches-player-guide':   'Schedule, session format, and campaign rules',
  'character-creation':          'Sources, hooks, connections, and leveling',
  'factions-connections':         'Key factions and NPCs to connect your character to',
  'adventurers-board':           'Current jobs, rumors, and completed missions',
  'maps-visuals':                'Official maps and art of the Rock of Bral',
  'important-npcs':              'Key figures — Large Luigi, Prince Andru, and more',
  'important-locations':         'Key places — The Laughing Beholder, the Docks, the Bazaar, and more',
};

// Manual overrides: wiki link slug → published HTML page
// Used for DM-side notes (places, people, factions) that link into a player handout section
const LINK_OVERRIDES = {
  // NPCs → Important NPCs page
  'large-luigi':            'important-npcs.html',
  'prince-andru':           'important-npcs.html',
  // Factions → Factions & Connections page
  'house-traken':           'factions-connections.html',
  'the-arcane':             'factions-connections.html',
  'the-juggler-s-guild':    'factions-connections.html',
  'the-seekers':            'factions-connections.html',
  'neogi-deathspider':      'factions-connections.html',
  // Places → Important Locations page
  'the-docks':              'important-locations.html',
  'the-gambler-s-den':      'important-locations.html',
  'the-grand-bazaar':       'important-locations.html',
  'the-noble-quarter':      'important-locations.html',
  'the-palace-of-bral':     'important-locations.html',
  'the-rat-s-maze':         'important-locations.html',
  'temple-row':             'important-locations.html',
  'the-laughing-beholder':  'important-locations.html',
  // Between-sessions rules → West Marches Player Guide
  'downtime-activities':    'west-marches-player-guide.html',
};

async function main() {
  console.log('🚀 Bral Stars builder starting...\n');

  // Collect all files across source folders
  const allFiles = [];
  for (const folder of SOURCE_FOLDERS) {
    const encoded = encodeURIComponent(folder).replace(/%20/g, '%20');
    const url = `${API_BASE}/contents/${encoded}?ref=${BRANCH}`;
    const items = await get(url);
    if (!Array.isArray(items)) { console.warn(`  ⚠ Could not list ${folder}`); continue; }
    for (const item of items) {
      if (item.type === 'file' && item.name.endsWith('.md')) {
        allFiles.push({ folder, name: item.name, download_url: item.download_url });
      }
    }
  }

  // Build slug → filename map for wiki link resolution
  for (const f of allFiles) {
    const base = f.name.replace(/\.md$/, '');
    const slug = slugify(base);
    if (!SKIP_FILES.includes(f.name.toLowerCase())) {
      PAGE_MAP[slug] = `${slug}.html`;
    }
  }

  const indexPages = [];

  for (const f of allFiles) {
    const baseName = f.name.replace(/\.md$/, '');
    const slug = slugify(baseName);

    if (SKIP_FILES.includes(f.name.toLowerCase())) {
      console.log(`  ⏭  Skipping ${f.name}`);
      continue;
    }

    console.log(`  📄 Processing ${f.name}...`);

    const raw = await getRaw(f.download_url);
    // Strip YAML frontmatter
    const stripped = raw.replace(/^---[\s\S]*?---\n/, '').trim();
    const preprocessed = preprocessObsidian(stripped, PAGE_MAP);
    const html = marked(preprocessed);

    const outFile = `${slug}.html`;
    const breadcrumb = `<a href="/bral_stars/">Bral Stars</a> <span class="sep">›</span> ${baseName}`;
    const page = renderPage(baseName, `<h1>${baseName}</h1>\n${html}`, breadcrumb);
    fs.writeFileSync(path.join(OUT_DIR, outFile), page);
    console.log(`     ✅ Wrote ${outFile}`);

    indexPages.push({
      file: outFile,
      title: baseName,
      desc: PAGE_DESCS[slug] || '',
    });
  }

  // Write index
  const indexHtml = renderIndex(indexPages);
  fs.writeFileSync(path.join(OUT_DIR, 'index.html'), indexHtml);
  console.log('\n  ✅ Wrote index.html');
  console.log(`\n✨ Done! ${indexPages.length} pages + index generated.\n`);
}

main().catch(err => { console.error('Build failed:', err); process.exit(1); });
