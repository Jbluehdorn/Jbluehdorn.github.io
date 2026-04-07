import { readFileSync, writeFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env file if present
const envPath = join(__dirname, '..', '.env')
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim()
    if (val && !process.env[key]) process.env[key] = val
  }
}

const PLAYLIST_ID = 'PLJ_TJFLc25JR3VZ7Xe-cmt4k3bMKBZ5Tm'
const API_KEY = process.env.YOUTUBE_API_KEY
const DATA_PATH = join(__dirname, '..', 'src', 'data', 'episodes.json')

function categorize(title) {
  const t = title.toLowerCase()
  const types = []
  if (t.includes('black spine') || t.includes('junka')) types.push('black_spine')
  if (t.includes('wheel of the worst') || t.includes('wheel of the black spine')) types.push('wheel')
  if (t.includes('plinketto')) types.push('plinketto')
  if (t.includes('spotlight')) types.push('spotlight')
  if (types.length === 0) types.push('regular')
  return types
}

async function fetchPlaylistPage(pageToken) {
  const params = new URLSearchParams({
    part: 'snippet',
    playlistId: PLAYLIST_ID,
    maxResults: '50',
    key: API_KEY,
  })
  if (pageToken) params.set('pageToken', pageToken)

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?${params}`
  )
  if (!res.ok) {
    throw new Error(`YouTube API error ${res.status}: ${await res.text()}`)
  }
  return res.json()
}

async function fetchAllEpisodes() {
  const episodes = []
  let pageToken = undefined

  do {
    const data = await fetchPlaylistPage(pageToken)
    for (const item of data.items) {
      const snippet = item.snippet
      const videoId = snippet.resourceId?.videoId
      if (!videoId) continue

      // Skip deleted/private videos
      if (['Deleted video', 'Private video'].includes(snippet.title)) continue

      const thumbs = snippet.thumbnails || {}
      const thumbnail =
        thumbs.maxres?.url ||
        thumbs.high?.url ||
        thumbs.medium?.url ||
        thumbs.default?.url ||
        ''

      episodes.push({
        id: videoId,
        title: snippet.title,
        thumbnail,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        types: categorize(snippet.title),
      })
    }
    pageToken = data.nextPageToken
  } while (pageToken)

  return episodes
}

async function main() {
  if (!API_KEY) {
    console.log('No YOUTUBE_API_KEY set — skipping episode scrape.')
    return
  }

  console.log('Fetching Best of the Worst episodes from YouTube...')

  const existing = existsSync(DATA_PATH)
    ? JSON.parse(readFileSync(DATA_PATH, 'utf8'))
    : []
  const existingIds = new Set(existing.map((e) => e.id))

  const fetched = await fetchAllEpisodes()
  let newCount = 0

  for (const ep of fetched) {
    if (!existingIds.has(ep.id)) {
      existing.push(ep)
      existingIds.add(ep.id)
      newCount++
    }
  }

  writeFileSync(DATA_PATH, JSON.stringify(existing, null, 2))
  console.log(
    `Done. ${fetched.length} total in playlist, ${newCount} new episodes added. ${existing.length} total on file.`
  )
}

main().catch((err) => {
  console.error('Scrape failed:', err.message)
  process.exit(1)
})
