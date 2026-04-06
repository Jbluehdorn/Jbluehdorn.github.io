# Feature: Villager Tracker

## Overview
An interactive tracker for managing relationships with your current island villagers in Animal Crossing: New Horizons. Track daily interactions, view detailed villager profiles, and analyze the diversity of your island's residents across species, personality, and other categories.

## Core Functionality

### Island Roster
- Add/remove villagers to your island roster (max 10, matching in-game limit)
- **Shared state**: This roster is the same island resident list used by the Villager Calculator, stored in a common localStorage key
- Each villager displayed as a card showing icon, name, species, and today's chat status

### Daily Chat Tracker
- Mark whether you've talked to each villager today
- Visual indicator (checkmark / highlight) on villagers you've chatted with
- Daily reset: chat status resets at the start of each new day (based on local time, or configurable to match in-game 5 AM rollover)
- Optional: chat streak / history (how many consecutive days you've talked to a villager)

### Villager Detail View
- Expand a villager card to see a detailed profile:
  - **Photo** (full photo image)
  - **Birthday** (with upcoming birthday highlight if within the next 7 days)
  - **Personality type** (Lazy, Jock, Cranky, Smug, Normal, Peppy, Snooty, Uchi/Sisterly)
  - **Species**
  - **Gender**
  - **Catchphrase**
  - **Favorite furniture / style** (if data available)
- Profile can be collapsed back to card view

### Diversity Analysis
- Group and visualize your 10 villagers by:
  - **Species** — e.g., 2 cats, 1 squirrel, 1 eagle... (are species unique or duplicated?)
  - **Personality** — e.g., 3 Normal, 2 Lazy, 0 Jock... (highlights missing personality types)
  - **Gender** — male/female balance
- Visual breakdown (bar chart, pie chart, or grouped pill/tag display)
- Highlight gaps: "You don't have any Cranky villagers" or "You have 3 of the same species"
- Useful for planning who to replace when a villager moves out

## Data Model

### Villager Record (shared with Villager Calculator)
```json
{
  "name": "Marshal",
  "species": "Squirrel",
  "iconImage": "https://...",
  "photoImage": "https://...",
  "gender": "Male",
  "personality": "Smug",
  "birthday": "September 29th",
  "catchphrase": "sulky"
}
```

### Tracker State (localStorage)
```json
{
  "shared_island_residents": ["Marshal", "Judy", "Raymond", ...],
  "villager_tracker_chats": {
    "2026-04-06": ["Marshal", "Judy"],
    "2026-04-05": ["Marshal", "Judy", "Raymond"]
  },
  "villager_tracker_chat_history_days": 30
}
```

Note: `shared_island_residents` is the shared key also read by the Villager Calculator feature.

## UI Components
| Component | Description |
|---|---|
| `RosterGrid` | Grid of villager cards for current island residents |
| `VillagerRosterCard` | Card showing icon, name, species, chat status indicator |
| `VillagerDetail` | Expandable detail panel with full profile info |
| `ChatToggle` | Tap-to-toggle daily chat indicator on each card |
| `DiversityPanel` | Grouped breakdown of villagers by species/personality/gender |
| `DiversityChart` | Visual chart (bars or tags) showing category distribution |
| `GapIndicator` | Highlights missing personality types or duplicate species |

## Interactions
- Tapping the chat bubble/icon on a card toggles today's chat status
- Tapping the card itself expands to detail view
- Tapping again (or a close button) collapses back
- Diversity panel is always visible below the roster (or as a sub-tab)
- Adding/removing a villager here also updates the shared island resident list used by Villager Calculator

## Edge Cases
- Fewer than 10 villagers: show empty slots with "Add villager" prompt
- Birthday today: special highlight or animation on the villager card
- Chat history cleanup: only retain N days of history to keep localStorage manageable (default 30)
- Day rollover: configurable between midnight and 5 AM (ACNH day starts at 5 AM)

## Future Enhancements (potential)
- Friendship level estimation based on days chatted
- Gift tracking (what you gave each villager today)
- Move-out prediction / alerts
- Photo/poster obtained tracking
- Reactions learned tracking
