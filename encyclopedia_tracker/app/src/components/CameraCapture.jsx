import { useState, useRef, useCallback, useMemo } from 'react';
import { CRITTERPEDIA_ORDER, GRID_ROWS, getColumnCount } from '../utils/critterpediaOrder';
import './CameraCapture.css';

const GRID_TOP = 149;
const CELL_W = 113;
const CELL_H = 95;
const EXPECTED_W = 1280;
const EXPECTED_H = 720;
const GRID_LEFT_DEFAULT = 77;
const GRID_LEFT_SEA = 190;

const TAB_POSITIONS = [
  { type: 'insects',       x: 88,  y: 75 },
  { type: 'fish',          x: 160, y: 75 },
  { type: 'sea-creatures', x: 228, y: 75 },
];

/* ── Pixel helpers ─────────────────────────────────────────── */

function getPixel(data, w, x, y) {
  const i = (y * w + x) * 4;
  return [data[i], data[i+1], data[i+2]];
}
function brightness(r, g, b) { return r * 0.299 + g * 0.587 + b * 0.114; }
function saturation(r, g, b) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  return mx > 0 ? (mx - mn) / mx : 0;
}

/* ── Auto-detect type from header tabs ─────────────────────── */

function detectType(imageData) {
  const { data, width: w } = imageData;
  let best = 'fish', bestW = -Infinity;
  for (const t of TAB_POSITIONS) {
    let sum = 0, n = 0;
    for (let dy = -5; dy < 5; dy++)
      for (let dx = -5; dx < 5; dx++) {
        const [r, g, b] = getPixel(data, w, t.x + dx, t.y + dy);
        sum += r + g - 2 * b; n++;
      }
    if (sum / n > bestW) { bestW = sum / n; best = t.type; }
  }
  return best;
}

/* ── Auto-detect scroll from tooltip position ──────────────── */

function detectScroll(imageData, type) {
  if (type === 'sea-creatures') return 0;
  const { data, width: w } = imageData;

  // Check for dark tooltip text on the right side (x=950-1250, y=110-148)
  let darkCount = 0, total = 0;
  for (let y = 110; y < 148; y += 2)
    for (let x = 950; x < 1250; x += 2) {
      const [r, g, b] = getPixel(data, w, x, y);
      if (brightness(r, g, b) < 160) darkCount++;
      total++;
    }
  return (darkCount / total) > 0.05 ? 6 : 0;
}

/* ── Grid analysis ─────────────────────────────────────────── */

function analyzeGrid(imageData, type) {
  const { data, width: w } = imageData;
  const gridLeft = type === 'sea-creatures' ? GRID_LEFT_SEA : GRID_LEFT_DEFAULT;
  const totalCols = getColumnCount(type);
  const maxCols = Math.min(totalCols, Math.floor((EXPECTED_W - gridLeft) / CELL_W) + 1);
  const cells = [];

  for (let col = 0; col < maxCols; col++) {
    for (let row = 0; row < GRID_ROWS; row++) {
      const cL = gridLeft + col * CELL_W;
      const cR = Math.min(EXPECTED_W, cL + CELL_W);
      const usable = cR - cL;
      if (usable < 40) continue;
      const m = usable > 80 ? 0.15 : 0.05;
      const x0 = Math.round(cL + usable * m);
      const x1 = Math.round(cL + usable * (1 - m));
      const y0 = Math.round(GRID_TOP + row * CELL_H + CELL_H * 0.15);
      const y1 = Math.round(GRID_TOP + row * CELL_H + CELL_H * 0.85);

      let sumB = 0, sumB2 = 0, nC = 0, sumD = 0, n = 0;
      for (let y = y0; y < y1; y += 2)
        for (let x = x0; x < x1; x += 2) {
          const [r, g, b] = getPixel(data, w, x, y);
          const br = brightness(r, g, b);
          sumB += br; sumB2 += br * br;
          if (saturation(r, g, b) > 0.30) nC++;
          sumD += Math.sqrt((r - 222) ** 2 + (g - 216) ** 2 + (b - 200) ** 2);
          n++;
        }
      const avgB = sumB / n;
      const stdB = Math.sqrt(Math.max(0, sumB2 / n - avgB * avgB));
      const pctC = (nC / n) * 100;
      const avgD = sumD / n;
      const hasIcon = stdB > 8 || avgD > 30;
      const likelyCollected = (pctC > 6 && stdB > 15) || (avgD > 45 && stdB > 25);
      cells.push({ col, row, stdB, pctC, avgD, hasIcon, likelyCollected });
    }
  }
  return { cells, gridLeft };
}

/* ── Map cells to creatures ────────────────────────────────── */

function mapCells(cells, type, scroll, allCreatures, collected) {
  const order = CRITTERPEDIA_ORDER[type] || [];
  const results = [];
  for (const c of cells) {
    if (!c.hasIcon) continue;
    const idx = (scroll + c.col) * GRID_ROWS + c.row;
    if (idx < 0 || idx >= order.length) continue;
    const name = order[idx].toLowerCase();
    const cr = allCreatures.find(x => x.Name.toLowerCase() === name);
    if (cr) results.push({
      name, id: cr['Unique Entry ID'],
      already: !!collected[cr['Unique Entry ID']],
      likelyCollected: c.likelyCollected,
      col: c.col, row: c.row, stdB: c.stdB, pctC: c.pctC,
    });
  }
  return results;
}

/* ── Slot label for display ────────────────────────────────── */

function slotLabel(type, scroll) {
  if (type === 'sea-creatures') return 'Sea Creatures';
  const side = scroll === 0 ? 'Left' : 'Right';
  return `${type === 'fish' ? 'Fish' : 'Insects'} \u2014 ${side}`;
}

/* ── Component ─────────────────────────────────────────────── */

export default function CameraCapture({ allCreatures, collected, onDetected }) {
  const [status, setStatus] = useState('idle');
  const [imageAnalyses, setImageAnalyses] = useState([]);
  const [checkedIds, setCheckedIds] = useState(new Set());
  const [previewUrls, setPreviewUrls] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const processImages = useCallback(async (files) => {
    setStatus('analyzing');
    setCheckedIds(new Set());
    setPreviewUrls([]);
    setImageAnalyses([]);

    const canvas = canvasRef.current;
    canvas.width = EXPECTED_W;
    canvas.height = EXPECTED_H;
    const ctx = canvas.getContext('2d');
    const analyses = [];
    const previews = [];

    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      const img = await new Promise((res, rej) => {
        const i = new Image(); i.onload = () => res(i); i.onerror = rej;
        i.src = URL.createObjectURL(file);
      });
      ctx.clearRect(0, 0, EXPECTED_W, EXPECTED_H);
      ctx.drawImage(img, 0, 0, EXPECTED_W, EXPECTED_H);
      previews.push(canvas.toDataURL('image/jpeg', 0.6));
      const imageData = ctx.getImageData(0, 0, EXPECTED_W, EXPECTED_H);
      URL.revokeObjectURL(img.src);

      const type = detectType(imageData);
      const scroll = detectScroll(imageData, type);
      const { cells, gridLeft } = analyzeGrid(imageData, type);
      const results = mapCells(cells, type, scroll, allCreatures, collected);
      analyses.push({ file: file.name, type, scroll, gridLeft, cells, results });
    }

    setImageAnalyses(analyses);
    setPreviewUrls(previews);

    // Pre-check likely collected
    const merged = new Map();
    for (const a of analyses)
      for (const r of a.results)
        if (!merged.has(r.id) || r.likelyCollected) merged.set(r.id, r);
    const nc = new Set();
    for (const r of merged.values())
      if (r.likelyCollected && !r.already) nc.add(r.id);
    setCheckedIds(nc);
    setStatus('confirm');
  }, [allCreatures, collected]);

  // Merge results
  const merged = useMemo(() => {
    const m = new Map();
    for (const a of imageAnalyses)
      for (const r of a.results)
        if (!m.has(r.id) || r.likelyCollected) m.set(r.id, r);
    return [...m.values()];
  }, [imageAnalyses]);

  const likelyCollected = merged.filter(r => r.likelyCollected);
  const likelyUncollected = merged.filter(r => !r.likelyCollected);

  const handleFiles = useCallback((fl) => {
    const files = [...fl].filter(f => f.type.startsWith('image/'));
    if (files.length > 0) processImages(files);
  }, [processImages]);

  const handleConfirm = () => {
    const ids = [...checkedIds];
    if (ids.length > 0) onDetected(ids);
    setStatus('idle'); setImageAnalyses([]); setPreviewUrls([]);
  };

  const toggleCheck = (id) => setCheckedIds(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  return (
    <div className="camera-capture">
      <h3>{'\uD83D\uDCF8'} Upload Critterpedia Screenshots</h3>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {status !== 'confirm' && (
        <>
          <div
            className={`upload-zone${dragOver ? ' dragging' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input ref={fileInputRef} type="file" accept="image/*" multiple
              style={{ display: 'none' }}
              onChange={(e) => handleFiles(e.target.files)} />
            {status === 'analyzing' ? (
              <><div className="upload-icon">{'\u23F3'}</div><div className="upload-text">Analyzing screenshots{'\u2026'}</div></>
            ) : (
              <><div className="upload-icon">{'\uD83D\uDCC1'}</div>
                <div className="upload-text">Drop all 5 screenshots here or click to browse</div>
                <div className="upload-hint">Type and scroll position are detected automatically</div></>
            )}
          </div>

          <div className="instructions-box">
            <p className="instructions-desc">Upload your Critterpedia screenshots to automatically detect and mark your collected creatures.</p>
            <p className="instructions-title">Take 5 screenshots on your Switch:</p>
            <ul className="instructions-list">
              <li><strong>Fish</strong> - cursor on top left (Bitterling)</li>
              <li><strong>Fish</strong> - cursor on top right (Suckerfish)</li>
              <li><strong>Insects</strong> - cursor on top left (Common Butterfly)</li>
              <li><strong>Insects</strong> - cursor on top right (Pill Bug)</li>
              <li><strong>Sea Creatures</strong> - cursor on top left (Seaweed)</li>
            </ul>
          </div>
        </>
      )}

      {/* Preview thumbnails */}
      {previewUrls.length > 0 && status === 'confirm' && (
        <div className="preview-row">
          {previewUrls.map((url, i) => {
            const a = imageAnalyses[i];
            return (
              <div key={i} className="preview-thumb-container">
                <img src={url} alt={a?.file || ''} className="preview-thumb" />
                {a && <div className="preview-label">{slotLabel(a.type, a.scroll)} <span style={{opacity:0.6}}>({a.results.filter(r=>r.likelyCollected).length} collected)</span></div>}
              </div>
            );
          })}
        </div>
      )}

      {/* Results */}
      {status === 'confirm' && merged.length > 0 && (
        <div className="camera-message">
          <p className="camera-info">
            Found <strong>{merged.length}</strong> creatures across {imageAnalyses.length} screenshots.
            {' '}<strong>{likelyCollected.length}</strong> appear collected.
          </p>
          <div className="confirm-list">
            <div className="confirm-actions">
              <button className="confirm-action-btn" onClick={() => setCheckedIds(new Set(merged.filter(d => !d.already && d.likelyCollected).map(d => d.id)))}>Select Collected</button>
              <button className="confirm-action-btn" onClick={() => setCheckedIds(new Set(merged.filter(d => !d.already).map(d => d.id)))}>Select All</button>
              <button className="confirm-action-btn" onClick={() => setCheckedIds(new Set())}>Deselect All</button>
              <span className="confirm-count">{checkedIds.size} selected</span>
            </div>
            {likelyCollected.length > 0 && (<>
              <div className="section-label">{'\uD83C\uDFA8'} Likely Collected ({likelyCollected.length})</div>
              <div className="confirm-grid">
                {likelyCollected.map(d => (
                  <label key={d.id} className={`confirm-item${checkedIds.has(d.id) ? ' checked' : ''}${d.already ? ' already' : ''}`}>
                    <input type="checkbox" checked={checkedIds.has(d.id)} onChange={() => toggleCheck(d.id)} />
                    <span className="confirm-name">{d.name}</span>
                    {d.already && <span className="confirm-badge">already</span>}
                  </label>
                ))}
              </div>
            </>)}
            {likelyUncollected.length > 0 && (<>
              <div className="section-label">{'\uD83D\uDC64'} Likely Uncollected ({likelyUncollected.length})<span className="section-hint"> {'\u2014'} check any that are actually collected</span></div>
              <div className="confirm-grid">
                {likelyUncollected.map(d => (
                  <label key={d.id} className={`confirm-item uncollected${checkedIds.has(d.id) ? ' checked' : ''}${d.already ? ' already' : ''}`}>
                    <input type="checkbox" checked={checkedIds.has(d.id)} onChange={() => toggleCheck(d.id)} />
                    <span className="confirm-name">{d.name}</span>
                    {d.already && <span className="confirm-badge">already</span>}
                  </label>
                ))}
              </div>
            </>)}
            <div className="confirm-buttons">
              <button className="confirm-btn" onClick={handleConfirm} disabled={checkedIds.size === 0}>{'\u2705'} Confirm {checkedIds.size} Creatures</button>
              <button className="rescan-btn" onClick={() => { setStatus('idle'); setImageAnalyses([]); setPreviewUrls([]); }}>{'\u21A9'} Upload Again</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
