# Feature: Art Tracker

## Overview
A museum art collection tracker for Animal Crossing: New Horizons. Allows players to browse all 43 paintings and statues available from Jolly Redd, compare genuine vs. fake versions, read authenticity tips, and track which pieces they've donated to the museum.

## Core Functionality

### Art Collection Browsing
- Display all 43 art pieces (paintings and statues) in a card grid
- Each card shows: icon image, name, artist, and collected status
- Cards are color-coded by collection status

### Real vs. Fake Comparison
- Expand an art piece to see side-by-side (or stacked) genuine and fake images
- Uses high-res texture images when available, falls back to icon images
- Only shown for pieces that have fakes (`has_fake` field)
- Pieces without fakes are clearly marked as "Always genuine"

### Authenticity Guide
- Each piece displays its `authenticity` text explaining how to spot the fake
- Artist name, year, art style, and description from the real-world artwork

### Filtering & Search
- **Text search**: Filter by art piece name or real-world art name
- **Type filter**: All / Paintings / Statues
- **Collection filter**: All / Collected / Not collected
- Progress bar showing collection completion

### Collection Tracking
- Click/tap to toggle collected status
- Persist in localStorage
- Progress stats: X/43 collected, paintings vs statues breakdown

## Data Model

### Art Record (from Nookipedia API)
```json
{
  "name": "Academic painting",
  "image_url": "https://...",
  "has_fake": true,
  "fake_image_url": "https://...",
  "texture_url": "https://...",
  "fake_texture_url": "https://...",
  "art_name": "Vitruvian Man",
  "art_type": "Painting",
  "author": "Leonardo da Vinci",
  "year": "circa 1487",
  "art_style": "Oil on canvas",
  "description": "...",
  "authenticity": "In the forgery, ...",
  "buy": 4980,
  "sell": 1245
}
```

### Collection State (localStorage)
```json
{
  "acnh_art_collected": ["Academic painting", "Amazing painting", ...]
}
```

## UI Components
| Component | Description |
|---|---|
| `ArtStatsBar` | Progress bar + paintings/statues counts |
| `ArtFilterBar` | Search input, type filter, collection filter |
| `ArtGrid` | Grid of art cards |
| `ArtCard` | Individual art card with icon, name, collected badge |
| `ArtDetail` | Expanded view with real/fake comparison, authenticity tips, artist info |

## Interactions
- Clicking a card expands it to show the detail view below the grid (same pattern as Villager Tracker)
- A collect/uncollect button in the detail view toggles the piece's status
- Filters update the grid in real-time
- Search is case-insensitive and matches both in-game name and real art name

## Data Source
- One-time fetch from Nookipedia API (`/nh/art` endpoint) saved to `app/public/data/artwork.json`
- Fetch script: `fetch-artwork.js` (requires `NOOKIPEDIA_API_KEY` in `.env`)
- Static JSON served at runtime — no API calls from the browser
