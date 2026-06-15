# 🍽 Mealie Today Card

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/hacs/integration)
[![GitHub Release](https://img.shields.io/github/release/enter360/mealie-today-card.svg)](https://github.com/enter360/mealie-today-card/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A custom Lovelace card for [Home Assistant](https://www.home-assistant.io/) that displays today's planned meals from [Mealie](https://mealie.io/) — with a tap-to-expand detail view showing ingredients, step-by-step instructions, recipe image, and prep/cook times.

---

## ✨ Features

- Shows **Breakfast, Lunch, and Dinner** rows for today — only meals that are actually planned appear
- Thumbnail image, meal type label, recipe name, and time summary at a glance
- **Tap any meal** to open a bottom sheet with:
  - Full recipe hero image
  - Prep / Cook / Total time pills
  - Ingredient list with quantities and units
  - Numbered step-by-step instructions
- Auto-refreshes every 30 minutes
- Graceful fallbacks when images are missing
- Respects Home Assistant light/dark theme via CSS variables

---

## Prerequisites

- Home Assistant **2023.8** or later
- [Mealie](https://mealie.io/) **v2.0+** (self-hosted)
- The official [Mealie integration](https://www.home-assistant.io/integrations/mealie/) installed in HA

---

## Installation

### Via HACS (Recommended)

[![Add to HACS](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=enter360&repository=mealie-today-card&category=plugin)

Click the button above, or add manually:

1. Open **HACS** in Home Assistant
2. Go to **Frontend**
3. Click **⋮ → Custom repositories**
4. Add `https://github.com/enter360/mealie-today-card` with category **Dashboard**
5. Click **Install** on the Mealie Today Card entry
6. Reload your browser

### Manual

1. Download `mealie-today-card.js` from the [latest release](https://github.com/enter360/mealie-today-card/releases/latest)
2. Copy it to `config/www/mealie-today-card.js`
3. In Home Assistant go to **Settings → Dashboards → ⋮ → Resources → Add Resource**
   - URL: `/local/mealie-today-card.js`
   - Type: **JavaScript Module**
4. Reload your browser

---

## Configuration

Add the card to your dashboard using the YAML editor:

```yaml
type: custom:mealie-today-card
config_entry_id: YOUR_CONFIG_ENTRY_ID
title: "Today's Meals"           # optional
mealie_url: http://mealie:9000   # optional — only needed for recipe images
debug: false                     # optional — logs raw API responses to console
```

### Options

| Option | Type | Required | Default | Description |
|---|---|---|---|---|
| `config_entry_id` | `string` | ✅ | — | HA Mealie integration entry ID |
| `title` | `string` | ❌ | `Today's Meals` | Card header title |
| `mealie_url` | `string` | ❌ | — | Base URL of your Mealie instance — only used to display recipe images |
| `debug` | `boolean` | ❌ | `false` | Log raw API responses to the browser console |

### Finding your Config Entry ID

1. In Home Assistant go to **Developer Tools → Actions**
2. Select the action `mealie.get_mealplan`
3. Switch to **YAML mode**
4. Copy the value of `config_entry_id`

---

## How it works

The card calls the Mealie integration's HA service actions via the websocket — no direct browser-to-Mealie HTTP calls, so CORS is never an issue:

- **`mealie.get_mealplan`** with today's date — fetches today's meal plan entries
- **`mealie.get_recipe`** with the recipe ID — fetches full recipe details when you tap a meal

---

## Contributing

Issues and pull requests are welcome. Please open an issue first for significant changes.

---

## License

MIT © [YOUR_NAME]
