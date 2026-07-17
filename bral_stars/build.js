#!/usr/bin/env node
/**
 * build.js — Bral Stars site builder
 * Fetches Player Handout markdown from the BralStars GitHub repo, splits
 * aggregate handouts (NPCs / Locations / Factions / Party) into per-entity
 * pages, and emits a static dashboard site with a collapsible sidebar.
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

const SOURCE_FOLDERS = [
  '3. Player Handouts',
  '3. Player Handouts/Maps',
];

const OUT_DIR = __dirname;
const SKIP_FILES = ['! map.md', '0. scratch notes.md'];

// Aggregate handouts to split into per-entity pages.
// prefix = slug prefix for the emitted sub-pages
// groupByH1 = if true, H1 headings within the file become section groups
const AGGREGATES = {
  'important-locations':   { prefix: 'location', groupByH1: true,  label: 'Locations' },
  'important-npcs':        { prefix: 'npc',      groupByH1: false, label: 'NPCs' },
  'factions-connections':  { prefix: 'faction',  groupByH1: false, label: 'Factions' },
  'the-party':             { prefix: 'pc',       groupByH1: false, label: 'The Party' },
};

// ─── HTTP helpers ────────────────────────────────────────────────────────────

function get(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    https.get({
      hostname: u.hostname, path: u.pathname + u.search,
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
    const u = new URL(url);
    https.get({
      hostname: u.hostname, path: u.pathname + u.search,
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

// ─── Slug / naming ───────────────────────────────────────────────────────────

function slugify(name) {
  return name
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, '') // strip emoji
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// PAGE_MAP: base entity slug → HTML file (used for wiki-link resolution)
const PAGE_MAP = {};

// ─── Obsidian → HTML preprocessing ──────────────────────────────────────────

function preprocessObsidian(md) {
  // Obsidian callouts: > [!type] Title\n> body...
  md = md.replace(/^> \[!(\w+)\](.*?)\n((?:^>.*\n?)*)/gm, (_, type, title, body) => {
    const content = body.replace(/^> ?/gm, '').trim();
    const t = type.toLowerCase();
    const label = title.trim() || type.charAt(0).toUpperCase() + type.slice(1);
    return `<div class="callout callout-${t}"><div class="callout-title">${label}</div><div class="callout-body">\n\n${content}\n\n</div></div>\n\n`;
  });

  // ![[image]] embeds
  md = md.replace(/!\[\[([^\]]+?)\]\]/g, (_, file) => {
    const url = `${RAW_BASE}/z_attachments/${encodeURIComponent(file)}`;
    return `![${file}](${url})`;
  });

  // [[Page|Alias]] and [[Page]] wiki links
  md = md.replace(/\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g, (_, target, alias) => {
    const display = alias || target;
    const slug = slugify(target.trim());
    const href = PAGE_MAP[slug];
    return href ? `[${display}](${href})` : display;
  });

  return md;
}

// ─── Aggregate splitter ──────────────────────────────────────────────────────
// Given a markdown blob, split into entities.
// If groupByH1, entities inside an H1 belong to that group.
// Returns: { intro: md, entities: [{name, slug, group, body}] }
function splitAggregate(md, groupByH1) {
  const lines = md.split('\n');
  const entities = [];
  let intro = [];
  let currentGroup = null;
  let currentEntity = null;

  const flushEntity = () => {
    if (currentEntity) {
      currentEntity.body = currentEntity.body.replace(/\s+$/, '');
      entities.push(currentEntity);
      currentEntity = null;
    }
  };

  for (const line of lines) {
    const h1 = line.match(/^# (.+?)\s*$/);
    const h2 = line.match(/^## (.+?)\s*$/);

    if (h1 && !currentEntity && entities.length === 0) {
      // File-level H1 (title); skip
      continue;
    }
    if (h1 && groupByH1) {
      flushEntity();
      currentGroup = h1[1].trim();
      continue;
    }
    if (h2) {
      flushEntity();
      const name = h2[1].trim();
      currentEntity = {
        name,
        slug: slugify(name),
        group: currentGroup,
        body: '',
      };
      continue;
    }
    if (currentEntity) {
      // Stop appending at horizontal rule --- (used as entity separator)
      if (/^-{3,}\s*$/.test(line)) continue;
      currentEntity.body += line + '\n';
    } else {
      if (/^-{3,}\s*$/.test(line)) continue;
      intro.push(line);
    }
  }
  flushEntity();

  return {
    intro: intro.join('\n').trim(),
    entities,
  };
}

// ─── Sidebar model ───────────────────────────────────────────────────────────
// Each item: { title, href, active? }
// Each section: { title, icon, id, items: [items or nested sections] }
const SIDEBAR = [
  { title: 'Home', icon: '', href: 'index.html', items: null },
  {
    title: 'Start Here', icon: '✦', id: 'start',
    items: [
      { title: 'Welcome to the Rock', href: 'welcome-to-the-rock-of-bral.html' },
      { title: 'West Marches Guide',  href: 'west-marches-player-guide.html' },
      { title: 'Character Creation',  href: 'character-creation.html' },
    ],
  },
  {
    title: 'The Campaign', icon: '⚔', id: 'campaign',
    items: [
      { title: 'The Party (overview)', href: 'the-party.html' },
      { title: 'Adventurers\' Board',  href: 'adventurers-board.html' },
    ],
    subsection: {
      title: 'Party Members', id: 'party-members',
      items: [], // filled in by build
    },
  },
  {
    title: 'Locations', icon: '🌐', id: 'locations',
    href: 'important-locations.html',
    items: [], // filled in by build (grouped by district)
  },
  {
    title: 'NPCs', icon: '👤', id: 'npcs',
    href: 'important-npcs.html',
    items: [], // filled in by build
  },
  {
    title: 'Factions', icon: '⚑', id: 'factions',
    href: 'factions-connections.html',
    items: [], // filled in by build
  },
  {
    title: 'Reference', icon: '📖', id: 'reference',
    items: [
      { title: 'Maps & Visuals', href: 'maps-visuals.html' },
    ],
  },
];

function findSection(id) {
  return SIDEBAR.find(s => s.id === id);
}

function renderSidebar(activeFile) {
  const renderItems = (items) =>
    items.map(it => {
      const active = it.href === activeFile ? ' class="active"' : '';
      return `<li><a href="${it.href}"${active}>${it.title}</a></li>`;
    }).join('');

  const renderGroup = (groupTitle, items) => `
    <div class="sidebar-group">
      <div class="sidebar-group-title">${groupTitle}</div>
      <ul>${renderItems(items)}</ul>
    </div>`;

  return SIDEBAR.map((sec, idx) => {
    // Home / single-link entries
    if (!sec.items && sec.href) {
      const active = sec.href === activeFile ? ' class="active"' : '';
      return `<div class="sidebar-section sidebar-single">
        <a href="${sec.href}"${active}>${sec.icon ? sec.icon + ' ' : ''}${sec.title}</a>
      </div>`;
    }

    // Collapsible section
    const hasGroups = sec.items.length && typeof sec.items[0] === 'object' && sec.items[0].group;
    let body = '';
    if (hasGroups) {
      // items are entities with .group set; bucket them
      const buckets = {};
      const order = [];
      for (const it of sec.items) {
        const g = it.group || 'Other';
        if (!buckets[g]) { buckets[g] = []; order.push(g); }
        buckets[g].push(it);
      }
      body = order.map(g => renderGroup(g, buckets[g])).join('');
    } else {
      body = `<ul>${renderItems(sec.items)}</ul>`;
    }

    if (sec.subsection) {
      body += renderGroup(sec.subsection.title, sec.subsection.items);
    }

    // Auto-expand if the active file lives inside this section
    const containsActive = JSON.stringify(sec).includes(`"${activeFile}"`);
    const openAttr = containsActive ? ' open' : '';
    const overviewLink = sec.href
      ? ` <a class="sidebar-overview" href="${sec.href}">overview</a>`
      : '';

    return `<details class="sidebar-section"${openAttr}>
      <summary>${sec.icon ? sec.icon + ' ' : ''}${sec.title}${overviewLink}</summary>
      ${body}
    </details>`;
  }).join('');
}

// ─── HTML template ──────────────────────────────────────────────────────────

function renderPage(title, bodyHtml, opts = {}) {
  const activeFile = opts.activeFile || '';
  const isHome     = opts.isHome || false;
  const sidebar    = renderSidebar(activeFile);

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
      background: #0e0e1a; color: #d8d8e8;
      min-height: 100vh; line-height: 1.65;
    }

    /* ───── Layout ───── */
    .app { display: flex; min-height: 100vh; }
    .sidebar {
      width: 280px; flex-shrink: 0;
      background: #0a0a16; border-right: 1px solid #22223e;
      padding: 24px 0; overflow-y: auto;
      position: sticky; top: 0; height: 100vh;
    }
    .main {
      flex: 1; min-width: 0;
      padding: 40px 48px;
    }
    .content { max-width: 780px; margin: 0 auto; }

    /* ───── Sidebar ───── */
    .sidebar-brand {
      padding: 0 22px 20px;
      border-bottom: 1px solid #22223e;
      margin-bottom: 12px;
    }
    .sidebar-brand a {
      text-decoration: none; color: #c8b8f0;
      font-size: 18px; font-weight: 700; letter-spacing: 0.5px;
    }
    .sidebar-brand .subtitle {
      display: block;
      font-size: 11px; color: #6060a0;
      font-weight: 400; text-transform: uppercase; letter-spacing: 1.5px;
      margin-top: 4px;
    }

    .sidebar-search { padding: 12px 18px 8px; }
    .sidebar-search input {
      width: 100%; padding: 8px 12px;
      background: #14142a; border: 1px solid #2a2a4a; border-radius: 6px;
      color: #d8d8e8; font-size: 13px;
      font-family: inherit;
      outline: none; transition: border-color 0.15s, background 0.15s;
    }
    .sidebar-search input:focus { border-color: #6655aa; background: #1a1a34; }
    .sidebar-search input::placeholder { color: #4a4a6a; }
    .sidebar-search-empty {
      display: none;
      font-size: 12px; color: #6060a0;
      padding: 8px 4px 0; text-align: center;
    }
    .sidebar.searching .sidebar-search-empty.visible { display: block; }
    /* When searching, hide non-matching items and their empty section wrappers */
    .sidebar.searching .sidebar-section.hidden,
    .sidebar.searching li.hidden,
    .sidebar.searching .sidebar-group.hidden { display: none; }
    /* Force sections open while searching */
    .sidebar.searching details[data-was-closed] > *:not(summary) { display: block; }

    .sidebar-section { border-bottom: 1px solid #16162c; }
    .sidebar-section summary {
      list-style: none; cursor: pointer;
      padding: 10px 22px; font-size: 13px;
      color: #a090d8; font-weight: 600;
      text-transform: uppercase; letter-spacing: 1px;
      user-select: none;
      display: flex; align-items: center; gap: 8px;
      transition: background 0.15s;
    }
    .sidebar-section summary::-webkit-details-marker { display: none; }
    .sidebar-section summary::before {
      content: '▸'; font-size: 10px; color: #4a4a80;
      transition: transform 0.15s; display: inline-block;
    }
    .sidebar-section[open] > summary::before { transform: rotate(90deg); }
    .sidebar-section summary:hover { background: #14142a; }
    .sidebar-overview {
      margin-left: auto; font-size: 10px; color: #5555aa;
      text-transform: none; letter-spacing: 0.5px;
      opacity: 0; transition: opacity 0.15s;
    }
    .sidebar-section summary:hover .sidebar-overview { opacity: 1; }

    .sidebar-single {
      padding: 0;
    }
    .sidebar-single a {
      display: block; padding: 10px 22px;
      color: #a090d8; text-decoration: none;
      font-size: 13px; font-weight: 600;
      text-transform: uppercase; letter-spacing: 1px;
    }
    .sidebar-single a:hover { background: #14142a; }
    .sidebar-single a.active { background: #1a1a34; color: #c8b8f0; }

    .sidebar-section ul {
      list-style: none; margin: 0; padding: 4px 0 10px;
    }
    .sidebar-section li a {
      display: block; padding: 6px 22px 6px 42px;
      color: #8080b0; text-decoration: none;
      font-size: 13px; line-height: 1.4;
      transition: background 0.1s, color 0.1s;
    }
    .sidebar-section li a:hover { background: #14142a; color: #b8b8d8; }
    .sidebar-section li a.active {
      background: #1a1a34; color: #c8b8f0; font-weight: 500;
      border-left: 2px solid #6655aa; padding-left: 40px;
    }

    .sidebar-group { margin: 4px 0; }
    .sidebar-group-title {
      padding: 8px 22px 4px;
      font-size: 10px; color: #6060a0;
      text-transform: uppercase; letter-spacing: 1.2px;
      font-weight: 700;
    }

    /* ───── Mobile toggle ───── */
    .mobile-toggle {
      display: none;
      position: fixed; top: 12px; left: 12px;
      z-index: 999;
      background: #1a1a34; border: 1px solid #2a2a50;
      color: #c8b8f0; padding: 8px 12px;
      border-radius: 6px; cursor: pointer;
      font-size: 18px;
    }

    /* ───── Content typography ───── */
    h1 { font-size: 30px; color: #c8b8f0; margin-bottom: 22px; padding-bottom: 12px; border-bottom: 2px solid #2a2a4a; }
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
    img { max-width: 100%; border-radius: 8px; margin: 16px 0; border: 1px solid #2a2a4a; cursor: zoom-in; }
    blockquote { border-left: 3px solid #4a3a8a; padding: 8px 16px; margin: 16px 0; color: #a090c8; background: #16162a; border-radius: 0 6px 6px 0; }

    /* Callouts */
    .callout { border-radius: 8px; padding: 14px 18px; margin: 18px 0; border-left: 4px solid; }
    .callout-title { font-weight: 700; font-size: 14px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
    .callout-body > p:last-child { margin-bottom: 0; }
    .callout-body ul { margin-bottom: 0; }
    .callout-infobox, .callout-info, .callout-note { background: #16203a; border-color: #4a6aaa; }
    .callout-infobox .callout-title, .callout-info .callout-title, .callout-note .callout-title { color: #7a9aee; }
    .callout-warning { background: #2a1e18; border-color: #aa6a30; }
    .callout-warning .callout-title { color: #e8944a; }
    .callout-cards { background: #16162a; border-color: #4a3a8a; border-left: none; border-top: 2px solid #4a3a8a; }
    .callout-cards .callout-title { color: #9080c8; }

    /* Breadcrumb */
    .breadcrumb {
      display: flex; align-items: center; gap: 8px;
      font-size: 12px; color: #6666a0; margin-bottom: 20px;
    }
    .breadcrumb a { color: #8888cc; }
    .breadcrumb .sep { color: #444466; }

    /* Homepage-specific */
    .hero { text-align: center; margin-bottom: 24px; }
    .hero img { max-height: 260px; width: 100%; object-fit: cover; border-radius: 12px; margin: 0; cursor: default; }
    .hero h1 { margin-top: 20px; border: none; padding: 0; font-size: 36px; }
    .hero p { color: #8080b0; margin-top: 8px; }

    .dashboard-status {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 10px; margin: 8px 0 32px; padding: 16px 20px;
      background: linear-gradient(90deg, #16162e 0%, #1a1a34 100%);
      border: 1px solid #2a2a50; border-radius: 10px;
    }
    .status-item .status-label {
      font-size: 11px; text-transform: uppercase; letter-spacing: 1px;
      color: #6666a0; margin-bottom: 4px;
    }
    .status-item .status-value { font-size: 14px; color: #c8b8f0; font-weight: 500; }

    .dashboard-section { margin: 28px 0; }
    .section-heading {
      font-size: 14px; text-transform: uppercase; letter-spacing: 1.2px;
      color: #7080b8; border: none; padding: 0; margin: 0 0 14px;
      display: flex; align-items: center; gap: 10px;
    }
    .section-icon { font-size: 18px; color: #a090d8; }

    .page-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; margin: 0; }
    .page-card {
      display: block; background: #16162e; border: 1px solid #2a2a50; border-radius: 10px;
      padding: 18px 20px; text-decoration: none; color: #d8d8e8;
      transition: background 0.15s, border-color 0.15s, transform 0.1s;
    }
    .page-card:hover { background: #1e1e3e; border-color: #6655aa; transform: translateY(-2px); text-decoration: none; }
    .page-card .card-title { font-size: 15px; font-weight: 600; color: #c8b8f0; margin-bottom: 4px; }
    .page-card .card-desc { font-size: 12px; color: #7070a0; }

    /* Mobile */
    @media (max-width: 900px) {
      .app { display: block; }
      .mobile-toggle { display: block; }
      .sidebar {
        position: fixed; left: -300px; top: 0;
        width: 280px; height: 100vh; z-index: 998;
        transition: left 0.2s ease;
        border-right: 1px solid #22223e;
      }
      .sidebar.open { left: 0; box-shadow: 0 0 30px rgba(0,0,0,0.6); }
      .main { padding: 60px 20px 40px; }
      .hero h1 { font-size: 26px; }
    }

    /* Lightbox */
    #lightbox { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.93); z-index: 1000; overflow: hidden; }
    #lightbox.active { display: flex; align-items: center; justify-content: center; }
    #lightbox-img { max-width: 95vw; max-height: 95vh; border-radius: 8px; cursor: grab; user-select: none; transform-origin: center center; border: 1px solid #2a2a4a; }
    #lightbox-img.dragging { cursor: grabbing; }
    #lightbox-close { position: fixed; top: 16px; right: 22px; color: rgba(255,255,255,0.7); font-size: 36px; line-height: 1; cursor: pointer; z-index: 1001; }
    #lightbox-close:hover { color: #fff; }
    #lightbox-hint { position: fixed; bottom: 14px; left: 50%; transform: translateX(-50%); color: rgba(255,255,255,0.3); font-size: 12px; pointer-events: none; }
    .hero img, .sidebar img { cursor: default !important; }
  </style>
</head>
<body>
  <button class="mobile-toggle" onclick="document.querySelector('.sidebar').classList.toggle('open')">☰</button>

  <div class="app">
    <aside class="sidebar">
      <div class="sidebar-brand">
        <a href="index.html">✦ Bral Stars</a>
        <span class="subtitle">Rock of Bral Campaign</span>
      </div>
      <div class="sidebar-search">
        <input type="search" id="sidebar-search-input" placeholder="Search  (⌘K / Ctrl+K)" autocomplete="off">
        <div id="sidebar-search-empty" class="sidebar-search-empty">No matches</div>
      </div>
      ${sidebar}
    </aside>

    <main class="main">
      <div class="content">
        ${isHome ? '' : `<nav class="breadcrumb"><a href="index.html">Home</a><span class="sep">›</span>${title}</nav>`}
        ${bodyHtml}
      </div>
    </main>
  </div>

  <!-- Lightbox -->
  <div id="lightbox">
    <span id="lightbox-close">&#x2715;</span>
    <img id="lightbox-img" src="" alt="">
    <div id="lightbox-hint">scroll to zoom · drag to pan · esc to close</div>
  </div>

  <script>
  // ───── Sidebar search ─────
  (function () {
    var input = document.getElementById('sidebar-search-input');
    var sidebar = document.querySelector('.sidebar');
    var empty = document.getElementById('sidebar-search-empty');
    if (!input || !sidebar) return;

    // Keyboard shortcut: Ctrl/Cmd+K focuses search
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        input.focus();
        input.select();
      }
      if (e.key === 'Escape' && document.activeElement === input) {
        input.value = '';
        input.dispatchEvent(new Event('input'));
        input.blur();
      }
    });

    // Remember which <details> were closed before search, so we can restore
    var detailsEls = Array.from(sidebar.querySelectorAll('details.sidebar-section'));

    function filter() {
      var q = input.value.trim().toLowerCase();

      if (!q) {
        // Restore original state
        sidebar.classList.remove('searching');
        detailsEls.forEach(function (d) {
          if (d.dataset.wasClosed === 'true') { d.open = false; }
          delete d.dataset.wasClosed;
          d.classList.remove('hidden');
        });
        sidebar.querySelectorAll('.hidden').forEach(function (el) { el.classList.remove('hidden'); });
        empty.classList.remove('visible');
        return;
      }

      sidebar.classList.add('searching');

      // Remember close state on first filter
      detailsEls.forEach(function (d) {
        if (d.dataset.wasClosed === undefined) {
          d.dataset.wasClosed = d.open ? 'false' : 'true';
        }
        d.open = true; // force open during search
      });

      var totalMatches = 0;

      // Filter all leaf links (single sections and li anchors)
      var leaves = sidebar.querySelectorAll('.sidebar-single a, .sidebar-section li a');
      leaves.forEach(function (a) {
        var text = (a.textContent || '').toLowerCase();
        var match = text.indexOf(q) !== -1;
        var wrapper = a.closest('li') || a.parentElement; // li or .sidebar-single div
        if (match) {
          wrapper.classList.remove('hidden');
          totalMatches++;
        } else {
          wrapper.classList.add('hidden');
        }
      });

      // Hide sub-groups (Low City / Middle City / etc.) whose links are all hidden
      sidebar.querySelectorAll('.sidebar-group').forEach(function (g) {
        var visible = g.querySelectorAll('li:not(.hidden)').length;
        g.classList.toggle('hidden', visible === 0);
      });

      // Hide entire <details> sections whose children are all hidden
      detailsEls.forEach(function (d) {
        var visibleLeaves = d.querySelectorAll('li:not(.hidden), .sidebar-group:not(.hidden)').length;
        // Also match against the section title itself
        var summary = d.querySelector('summary');
        var summaryText = summary ? summary.textContent.toLowerCase() : '';
        var summaryMatch = summaryText.indexOf(q) !== -1;
        d.classList.toggle('hidden', visibleLeaves === 0 && !summaryMatch);
      });

      // Also handle single-link sections (Home)
      sidebar.querySelectorAll('.sidebar-single').forEach(function (s) {
        var a = s.querySelector('a');
        var text = (a && a.textContent || '').toLowerCase();
        s.classList.toggle('hidden', text.indexOf(q) === -1);
        if (text.indexOf(q) !== -1) totalMatches++;
      });

      empty.classList.toggle('visible', totalMatches === 0);
    }

    input.addEventListener('input', filter);
  })();
  </script>

  <script>
  (function () {
    var lb = document.getElementById('lightbox');
    var lbImg = document.getElementById('lightbox-img');
    var lbClose = document.getElementById('lightbox-close');
    var scale = 1, tx = 0, ty = 0, dragging = false, startX = 0, startY = 0, baseX = 0, baseY = 0;
    function applyTransform() { lbImg.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + scale + ')'; }
    function openLightbox(src, alt) { lbImg.src = src; lbImg.alt = alt || ''; scale = 1; tx = 0; ty = 0; applyTransform(); lb.classList.add('active'); }
    function closeLightbox() { lb.classList.remove('active'); }
    document.querySelectorAll('.main img').forEach(function (img) {
      if (img.closest('.hero')) return;
      img.addEventListener('click', function (e) { e.stopPropagation(); openLightbox(img.src, img.alt); });
    });
    lbClose.addEventListener('click', closeLightbox);
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLightbox(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLightbox(); });
    lbImg.addEventListener('mousedown', function (e) { e.preventDefault(); dragging = true; startX = e.clientX; startY = e.clientY; baseX = tx; baseY = ty; lbImg.classList.add('dragging'); });
    document.addEventListener('mousemove', function (e) { if (!dragging) return; tx = baseX + (e.clientX - startX); ty = baseY + (e.clientY - startY); applyTransform(); });
    document.addEventListener('mouseup', function () { dragging = false; lbImg.classList.remove('dragging'); });
    lb.addEventListener('wheel', function (e) {
      e.preventDefault();
      var rect = lbImg.getBoundingClientRect();
      var cx = e.clientX - (rect.left + rect.width / 2);
      var cy = e.clientY - (rect.top + rect.height / 2);
      var delta = e.deltaY > 0 ? 0.88 : 1.14;
      var newScale = Math.max(0.3, Math.min(10, scale * delta));
      tx += cx * (1 - newScale / scale);
      ty += cy * (1 - newScale / scale);
      scale = newScale;
      applyTransform();
    }, { passive: false });
  })();
  </script>
</body>
</html>`;
}

// ─── Home page ──────────────────────────────────────────────────────────────

function renderHome() {
  const heroImg = `${RAW_BASE}/z_attachments/RockOfBral_Render.jpg`;

  const startCards = [
    { file: 'welcome-to-the-rock-of-bral.html', title: 'Welcome to the Rock',  desc: 'World facts, districts, and how the Rock works' },
    { file: 'west-marches-player-guide.html',   title: 'West Marches Guide',   desc: 'Schedule, sessions, workshops, downtime' },
    { file: 'character-creation.html',          title: 'Character Creation',   desc: 'Sources, hooks, goals, and leveling' },
  ];
  const campaignCards = [
    { file: 'the-party.html',           title: 'The Party',          desc: 'The crew — 5 PCs, one bar table' },
    { file: 'adventurers-board.html',   title: 'Adventurers\' Board', desc: 'Current jobs, standing gigs, and rumors' },
  ];
  const rockCards = [
    { file: 'important-locations.html', title: 'Locations',   desc: 'Every place on the Rock, grouped by district' },
    { file: 'important-npcs.html',      title: 'NPCs',        desc: 'The people you\'ll meet, deal with, or run from' },
    { file: 'factions-connections.html', title: 'Factions',   desc: 'Every faction on the Rock, plus connection hooks' },
    { file: 'maps-visuals.html',        title: 'Maps',        desc: 'Official maps and reference art' },
  ];

  const cardsHtml = arr => arr.map(c => `
    <a href="${c.file}" class="page-card">
      <div class="card-title">${c.title}</div>
      <div class="card-desc">${c.desc}</div>
    </a>`).join('');

  const body = `
    <div class="hero">
      <img src="${heroImg}" alt="The Rock of Bral">
      <h1>✦ Bral Stars ✦</h1>
      <p>A West Marches D&amp;D campaign on the Rock of Bral</p>
    </div>
    <div class="dashboard-status">
      <div class="status-item"><div class="status-label">Session 0</div><div class="status-value">Complete — world built ✓</div></div>
      <div class="status-item"><div class="status-label">Next session</div><div class="status-value">Session 1 — Rats in the Cellar</div></div>
      <div class="status-item"><div class="status-label">Home base</div><div class="status-value">The Laughing Beholder, Low City</div></div>
    </div>
    <section class="dashboard-section">
      <h2 class="section-heading"><span class="section-icon">✦</span> Start Here</h2>
      <div class="page-grid">${cardsHtml(startCards)}</div>
    </section>
    <section class="dashboard-section">
      <h2 class="section-heading"><span class="section-icon">⚔</span> The Campaign</h2>
      <div class="page-grid">${cardsHtml(campaignCards)}</div>
    </section>
    <section class="dashboard-section">
      <h2 class="section-heading"><span class="section-icon">🌐</span> The Rock</h2>
      <div class="page-grid">${cardsHtml(rockCards)}</div>
    </section>
    <hr>
    <p style="text-align:center;color:#555580;font-size:13px;">
      Content sourced from the <a href="https://github.com/${REPO_OWNER}/${REPO_NAME}">BralStars vault</a>
    </p>`;

  return renderPage('Bral Stars', body, { activeFile: 'index.html', isHome: true });
}

// ─── Main build ─────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Bral Stars builder starting...\n');

  // 1. Discover all markdown files
  const allFiles = [];
  for (const folder of SOURCE_FOLDERS) {
    const url = `${API_BASE}/contents/${encodeURIComponent(folder)}?ref=${BRANCH}`;
    const items = await get(url);
    if (!Array.isArray(items)) { console.warn(`  ⚠ Could not list ${folder}`); continue; }
    for (const item of items) {
      if (item.type === 'file' && item.name.endsWith('.md') && !SKIP_FILES.includes(item.name.toLowerCase())) {
        allFiles.push({ folder, name: item.name, download_url: item.download_url });
      }
    }
  }

  // 2. Fetch content for each
  const rawFiles = {};
  for (const f of allFiles) {
    const base = f.name.replace(/\.md$/, '');
    const slug = slugify(base);
    const raw = await getRaw(f.download_url);
    const stripped = raw.replace(/^---[\s\S]*?---\n/, '').trim();
    rawFiles[slug] = { name: base, slug, md: stripped };
  }

  // 3. Pre-populate PAGE_MAP with top-level pages
  for (const slug of Object.keys(rawFiles)) {
    PAGE_MAP[slug] = `${slug}.html`;
  }

  // 4. Pre-parse aggregates to seed PAGE_MAP with entity slugs
  const aggregateResults = {};
  for (const [aggSlug, cfg] of Object.entries(AGGREGATES)) {
    const raw = rawFiles[aggSlug];
    if (!raw) { console.warn(`  ⚠ Aggregate ${aggSlug} not found`); continue; }
    const split = splitAggregate(raw.md, cfg.groupByH1);
    aggregateResults[aggSlug] = { cfg, split };
    for (const ent of split.entities) {
      const subSlug = `${cfg.prefix}-${ent.slug}`;
      // Base entity slug points to the sub-page (wiki links to entity name will resolve here)
      PAGE_MAP[ent.slug] = `${subSlug}.html`;
    }
    // Populate the sidebar section
    const section = findSection(aggSlug.split('-')[0] === 'the' ? aggSlug.split('-')[1] : (
      aggSlug === 'important-locations' ? 'locations' :
      aggSlug === 'important-npcs' ? 'npcs' :
      aggSlug === 'factions-connections' ? 'factions' :
      aggSlug === 'the-party' ? 'campaign' : null
    ));
    if (section) {
      const items = split.entities.map(ent => ({
        title: ent.name,
        href: `${cfg.prefix}-${ent.slug}.html`,
        group: ent.group,
      }));
      if (aggSlug === 'the-party') {
        section.subsection.items = items;
      } else {
        section.items = items;
      }
    }
  }

  const written = [];

  // 5. Emit top-level (non-aggregate) pages, plus aggregate landing pages
  for (const [slug, raw] of Object.entries(rawFiles)) {
    const file = `${slug}.html`;
    let mdBody;

    if (aggregateResults[slug]) {
      // Aggregate landing page: shows intro + a card grid of entity links
      const { cfg, split } = aggregateResults[slug];
      const introHtml = split.intro ? marked(preprocessObsidian(split.intro)) : '';

      // Build card list, grouped if applicable
      let cardsHtml;
      if (cfg.groupByH1) {
        const buckets = {};
        const order = [];
        for (const ent of split.entities) {
          const g = ent.group || 'Other';
          if (!buckets[g]) { buckets[g] = []; order.push(g); }
          buckets[g].push(ent);
        }
        cardsHtml = order.map(g => `
          <h2 class="section-heading" style="margin-top:28px;">${g}</h2>
          <div class="page-grid">
            ${buckets[g].map(ent => `<a class="page-card" href="${cfg.prefix}-${ent.slug}.html"><div class="card-title">${ent.name}</div></a>`).join('')}
          </div>`).join('');
      } else {
        cardsHtml = `<div class="page-grid">
          ${split.entities.map(ent => `<a class="page-card" href="${cfg.prefix}-${ent.slug}.html"><div class="card-title">${ent.name}</div></a>`).join('')}
        </div>`;
      }

      const bodyHtml = `<h1>${raw.name}</h1>\n${introHtml}\n${cardsHtml}`;
      fs.writeFileSync(path.join(OUT_DIR, file), renderPage(raw.name, bodyHtml, { activeFile: file }));
      written.push(file);
      console.log(`  ✅ ${file}  (landing page for ${split.entities.length} sub-pages)`);
      continue;
    }

    // Plain single-page handout
    const html = marked(preprocessObsidian(raw.md));
    const bodyHtml = `<h1>${raw.name}</h1>\n${html}`;
    fs.writeFileSync(path.join(OUT_DIR, file), renderPage(raw.name, bodyHtml, { activeFile: file }));
    written.push(file);
    console.log(`  ✅ ${file}`);
  }

  // 6. Emit per-entity sub-pages from aggregates
  for (const [aggSlug, { cfg, split }] of Object.entries(aggregateResults)) {
    for (const ent of split.entities) {
      const file = `${cfg.prefix}-${ent.slug}.html`;
      const html = marked(preprocessObsidian(ent.body));
      const parentTitle = rawFiles[aggSlug].name;
      const parentFile = `${aggSlug}.html`;
      const group = ent.group ? `<span class="sep">›</span><a href="${parentFile}">${parentTitle}</a><span class="sep">›</span>${ent.group}<span class="sep">›</span>` : `<span class="sep">›</span><a href="${parentFile}">${parentTitle}</a><span class="sep">›</span>`;
      const bodyHtml = `
        <nav class="breadcrumb" style="margin-top:-10px;margin-bottom:16px;">
          <a href="index.html">Home</a>${group}${ent.name}
        </nav>
        <h1>${ent.name}</h1>
        ${html}`;
      const pageHtml = renderPage(ent.name, bodyHtml, { activeFile: file })
        // Suppress the default breadcrumb since we render our own for entity pages
        .replace(/<nav class="breadcrumb"><a href="index\.html">Home<\/a><span class="sep">›<\/span>[^<]+<\/nav>\s*/, '');
      fs.writeFileSync(path.join(OUT_DIR, file), pageHtml);
      written.push(file);
    }
    console.log(`  ✅ ${split.entities.length} × ${cfg.prefix}-*.html`);
  }

  // 7. Home page
  fs.writeFileSync(path.join(OUT_DIR, 'index.html'), renderHome());
  written.push('index.html');
  console.log('  ✅ index.html\n');

  console.log(`✨ Done! ${written.length} pages generated.\n`);
}

main().catch(err => { console.error('Build failed:', err); process.exit(1); });
