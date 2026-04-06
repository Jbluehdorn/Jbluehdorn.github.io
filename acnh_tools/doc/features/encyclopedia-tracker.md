# Feature: Encyclopedia Tracker

## Overview
A Critterpedia-style collection tracker for Animal Crossing: New Horizons. Allows players to track which fish, insects, and sea creatures they've caught, filter by current availability, and bulk-mark creatures via screenshot upload.

## Core Functionality

### Collection Tracking
- Track caught/uncaught status for all fish, insects, and sea creatures
- Persist collection state in localStorage
- Display progress statistics (total caught, per-category counts)

### Filtering & Display
- **Category tabs**: All / Fish / Insects / Sea Creatures
- **Hemisphere toggle**: Northern / Southern (affects availability calculations)
- **Date/time filter**: Use current date/time or set a custom date/time to check availability
- **Availability filter**: Show all, available now, available later, unavailable
- **Collection filter**: Show all, collected, not collected
- Creatures displayed in a card grid grouped by location (e.g., River, Pond, Ocean)
- Groups are collapsible sections
- Each card shows: icon, name, availability status (color-coded), collected state

### Availability Logic
- Determine creature availability based on hemisphere, month, and time of day
- Status values: `available-now`, `available-later`, `unavailable`, `leaving-soon`
- Fix the unreachable `leaving-soon` branch from v1

### Bulk Operations
- Multi-select mode: tap/click cards to select multiple creatures
- Floating action bar: "Mark as Collected" / "Mark as Uncollected" for selection
- Select all / deselect all within current filtered view

### Screenshot Analyzer (Phase 3 — separate sub-feature)
- Upload a screenshot of the in-game Critterpedia screen
- Canvas-based image analysis detects:
  - Which critter type tab is active (fish / insects / sea creatures)
  - Scroll position within the Critterpedia grid
  - Which cells have creatures vs. empty silhouettes
- Maps detected cells to the canonical Critterpedia grid order
- Shows confirmation UI with detected creatures before applying
- Supports drag-and-drop and file picker upload

## Data Model

### Creature Record
```json
{
  "Name": "Pale chub",
  "Unique Entry ID": "...",
  "iconUrl": "https://...",
  "timeOfYear": "...",
  "timeOfDay": "9 AM - 4 PM",
  "location": "River",
  "weather": "Any",
  "shadow": "1 (Tiny)",
  "sellPrice": 200,
  ...
}
```

### Collection State (localStorage)
```json
{
  "encyclopedia_collected": {
    "fish": ["Pale chub", "Crucian carp", ...],
    "insects": [...],
    "sea_creatures": [...]
  }
}
```

## UI Components
| Component | Description |
|---|---|
| `StatsBar` | Progress bar + category counts |
| `FilterControls` | Hemisphere, date/time, availability, collection filters |
| `CreatureGrid` | Grouped card grid with collapsible location sections |
| `CreatureCard` | Individual creature card with icon, name, status color |
| `CameraCapture` | Screenshot upload + analysis + confirmation (Phase 3) |
| `BulkActionBar` | Floating bar for batch mark collected/uncollected |

## Interactions
- Tapping a card toggles collected status (if not in multi-select mode)
- Long-press or checkbox enters multi-select mode
- Filter changes instantly update the visible grid
- Stats bar updates in real-time as collection changes

## Accessibility
- Color-coded statuses should also have text/icon indicators
- Cards are keyboard-navigable
- Filter controls are labeled with proper aria attributes
