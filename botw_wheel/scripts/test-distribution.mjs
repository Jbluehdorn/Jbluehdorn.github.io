// test-distribution.mjs
// Simulates drawFromBag() 10,000 times and reports selection distribution.
// Run with: node scripts/test-distribution.mjs

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const episodes = JSON.parse(readFileSync(join(__dirname, '..', 'src', 'data', 'episodes.json'), 'utf8'))

// ── Shuffle bag logic (mirrors useSpinWheel.js) ──────────────────────────────

function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

let bag = []
let lastPick = null

function drawFromBag(all) {
  if (all.length === 0) return null

  if (bag.length === 0) {
    let newBag = shuffleArray(all.map((e) => e.id))
    if (all.length > 1 && newBag[newBag.length - 1] === lastPick) {
      const swapIdx = Math.floor(Math.random() * (newBag.length - 1))
      ;[newBag[newBag.length - 1], newBag[swapIdx]] = [newBag[swapIdx], newBag[newBag.length - 1]]
    }
    bag = newBag
  }

  const id = bag.pop()
  lastPick = id
  return all.find((e) => e.id === id) || null
}

// ── Run simulation ────────────────────────────────────────────────────────────

const DRAWS = 10_000
const counts = {}
for (const ep of episodes) counts[ep.id] = 0

for (let i = 0; i < DRAWS; i++) {
  const ep = drawFromBag(episodes)
  if (ep) counts[ep.id]++
}

// ── Analyse results ───────────────────────────────────────────────────────────

const values = Object.values(counts)
const expected = DRAWS / episodes.length
const min = Math.min(...values)
const max = Math.max(...values)
const mean = values.reduce((s, v) => s + v, 0) / values.length
const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length
const stdDev = Math.sqrt(variance)
const maxDevPct = (((max - expected) / expected) * 100).toFixed(2)

console.log(`\nEpisodes in pool : ${episodes.length}`)
console.log(`Total draws      : ${DRAWS}`)
console.log(`Expected per ep  : ${expected.toFixed(2)}`)
console.log(`─────────────────────────────`)
console.log(`Min selections   : ${min}`)
console.log(`Max selections   : ${max}`)
console.log(`Mean             : ${mean.toFixed(2)}`)
console.log(`Std deviation    : ${stdDev.toFixed(2)}`)
console.log(`Max dev from exp : ${maxDevPct}%`)
console.log(`─────────────────────────────`)

// Flag any outliers (>20% from expected)
const outliers = Object.entries(counts)
  .filter(([, v]) => Math.abs(v - expected) / expected > 0.2)
  .sort((a, b) => b[1] - a[1])

if (outliers.length === 0) {
  console.log(`✅ Distribution looks even — no outliers beyond 20% of expected.`)
} else {
  console.log(`⚠️  ${outliers.length} outlier(s) beyond 20% of expected:`)
  for (const [id, count] of outliers) {
    const ep = episodes.find((e) => e.id === id)
    const devPct = (((count - expected) / expected) * 100).toFixed(1)
    console.log(`   ${id}  "${ep?.title}"  → ${count} (${devPct > 0 ? '+' : ''}${devPct}%)`)
  }
}
console.log()
