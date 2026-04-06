# Feature: Villager Calculator

## Overview
A probability calculator for island-hopping (Mystery Island Tours) in Animal Crossing: New Horizons. Players build a wishlist of desired villagers, specify their current island residents, enter how many Nook Mile Tickets they plan to use, and see the odds of encountering each wishlist villager.

## Core Functionality

### Wishlist Management
- Search for villagers by name with accent-insensitive prefix matching
- Add villagers to a wishlist via search/autocomplete dropdown
- Remove villagers from the wishlist
- Bulk import wishlist via CSV or text file upload (one name per line)

### Island Residents
- Search and add current island residents (max 10, matching the in-game limit)
- Collapsible residents section
- Island residents are excluded from encounter probability calculations
- Island residents are excluded from wishlist search suggestions

### Ticket Input
- Numeric input for number of Nook Mile Tickets (mystery island visits)
- Increment/decrement buttons (+/-)
- Direct numeric entry

### Probability Engine
The encounter probability model:
1. The game first picks a random species, then a random villager within that species
2. Per-attempt probability for a specific villager = `(1 / totalSpeciesCount) * (1 / villagersInThatSpecies)`
3. Probability over N attempts = `1 - (1 - perAttempt)^N`
4. Combined wishlist probability = probability of encountering *at least one* wishlist villager

### Results Display
- **Most Likely to See**: The wishlist villager with the highest encounter probability
- **Combined Chance**: Probability of seeing at least one wishlist villager across all tickets
- **Per-Villager Table**: Each wishlist villager with:
  - Icon
  - Name
  - Species
  - Per-attempt probability
  - Total probability (over N tickets)

## Data Model

### Villager Record
```json
{
  "name": "Marshal",
  "species": "Squirrel",
  "iconImage": "https://...",
  "photoImage": "https://...",
  "gender": "Male",
  "personality": "Smug",
  "birthday": "September 29th",
  "catchphrase": "sulky",
  "furnitureList": "..."
}
```

### Species Distribution
- 413 total villagers across 35 species
- Species have varying counts (e.g., cats have more villagers than octopi)
- This uneven distribution means rarer species have higher per-villager encounter rates

### State (localStorage)
```json
{
  "villager_calc_wishlist": ["Marshal", "Raymond", ...],
  "villager_calc_residents": ["Tom", "Judy", ...]
}
```

## UI Components
| Component | Description |
|---|---|
| `VillagerSearch` | Autocomplete search with villager icon previews |
| `WishlistPanel` | List of wishlist villagers with remove buttons |
| `ResidentsPanel` | Collapsible list of island residents (max 10) |
| `TicketInput` | Numeric input with +/- stepper buttons |
| `ResultsPanel` | Most likely, combined chance, per-villager odds table |
| `FileUpload` | CSV/text import for bulk wishlist entry |

## Interactions
- Typing in the search field shows a dropdown of matching villagers (filtered by prefix, accent-insensitive)
- Clicking a suggestion adds it to the wishlist (or residents, depending on context)
- Results update automatically when wishlist, residents, or ticket count changes
- On mobile, less-important table columns and file upload are hidden for space

## Edge Cases
- Empty wishlist: show explanatory placeholder, no results
- All wishlist villagers are the same species: combined probability math still correct
- 0 tickets: all probabilities are 0
- Very large ticket counts: probabilities approach but never exceed 1 (capped at display level)

## Future Enhancements (potential)
- Factor in amiibo-excluded villagers
- Show species rarity breakdown
- Shareable wishlist via URL parameters
- Integration with island residents list from other features (shared state)
