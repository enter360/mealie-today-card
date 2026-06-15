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
- A Mealie **long-lived API token** (generated in Mealie → User Profile → API Tokens)

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
mealie_url: http://mealie:9000
api_token: YOUR_LONG_LIVED_API_TOKEN
title: "Today's Meals"
```

### Options

| Option | Type | Required | Default | Description |
|---|---|---|---|---|
| `mealie_url` | `string` | ✅ | — | Base URL of your Mealie instance (no trailing slash) |
| `api_token` | `string` | ✅ | — | Mealie long-lived API token |
| `title` | `string` | ❌ | `Today's Meals` | Card header title |

### Getting your API token

1. Sign in to your Mealie instance
2. Go to **User Profile → Manage API Tokens**
3. Enter a name (e.g. `Home Assistant`) and click **Generate**
4. Copy the token and paste it into your card config

---

## How it works

The card calls the Mealie REST API directly using your token:

- **`GET /api/households/mealplans?start_date=TODAY&end_date=TODAY`** — fetches today's meal plan entries
- **`GET /api/recipes/{slug}`** — fetches full recipe details when you tap a meal

This means it works independently of any HA sensor setup — just the official Mealie integration for auth context, and direct API calls for the card data.

---

## Contributing

Issues and pull requests are welcome. Please open an issue first for significant changes.

---

## License

MIT © [YOUR_NAME]
