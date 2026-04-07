import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const IMG_DIR = path.join(__dirname, '..', 'assets', 'img')

async function getDominantColor(imagePath) {
  const { data, info } = await sharp(imagePath)
    .resize(50, 50, { fit: 'inside' })
    .raw()
    .toBuffer({ resolveWithObject: true })

  const channels = info.channels
  const buckets = {}

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const a = channels === 4 ? data[i + 3] : 255

    // Skip transparent/near-transparent pixels
    if (a < 128) continue
    // Skip very dark pixels (near black)
    if (r + g + b < 60) continue
    // Skip very light pixels (near white)
    if (r > 230 && g > 230 && b > 230) continue

    // Quantize to reduce noise (bucket by ~16 levels per channel)
    const qr = Math.round(r / 16) * 16
    const qg = Math.round(g / 16) * 16
    const qb = Math.round(b / 16) * 16
    const key = `${qr},${qg},${qb}`

    // Weight by saturation — prefer vibrant colors
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const saturation = max === 0 ? 0 : (max - min) / max
    const weight = 1 + saturation * 3

    buckets[key] = (buckets[key] || 0) + weight
  }

  // Find the most prominent bucket
  let bestKey = null
  let bestCount = 0
  for (const [key, count] of Object.entries(buckets)) {
    if (count > bestCount) {
      bestCount = count
      bestKey = key
    }
  }

  if (!bestKey) return '#b8860b' // fallback gold

  const [r, g, b] = bestKey.split(',').map(Number)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

async function processFile(dataFilePath) {
  let content = fs.readFileSync(dataFilePath, 'utf-8')

  // Find all filename references
  const filenameRegex = /filename:\s*['"]([^'"]+)['"]/g
  const entries = []
  let match
  while ((match = filenameRegex.exec(content)) !== null) {
    entries.push(match[1])
  }

  console.log(`\nProcessing ${path.basename(dataFilePath)} (${entries.length} items)...`)

  for (const filename of entries) {
    const imgPath = path.join(IMG_DIR, filename)
    if (!fs.existsSync(imgPath)) {
      console.log(`  ⚠ Missing: ${filename}`)
      continue
    }

    const color = await getDominantColor(imgPath)
    const filenameEscaped = filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

    // Check if color already exists for this entry
    const hasColor = new RegExp(`filename:\\s*['"]${filenameEscaped}['"][^}]*color:`).test(content)

    if (hasColor) {
      // Update existing color
      content = content.replace(
        new RegExp(`(filename:\\s*['"]${filenameEscaped}['"][^}]*color:\\s*')([^']*)(')`, 's'),
        `$1${color}$3`
      )
    } else {
      // Add color before the closing brace of this entry
      content = content.replace(
        new RegExp(`(\\{[^}]*filename:\\s*['"]${filenameEscaped}['"][^}]*)\\}`, 's'),
        `$1, color: '${color}'}`
      )
    }

    console.log(`  ${filename}: ${color}`)
  }

  fs.writeFileSync(dataFilePath, content, 'utf-8')
  console.log(`  ✓ Updated ${path.basename(dataFilePath)}`)
}

const bossesPath = path.join(__dirname, '..', 'src', 'data', 'bosses.js')
const skillsPath = path.join(__dirname, '..', 'src', 'data', 'skills.js')

await processFile(bossesPath)
await processFile(skillsPath)
console.log('\nDone! Colors extracted and saved.')
