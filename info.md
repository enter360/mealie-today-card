# Mealie Today Card

Display today's planned meals from your Mealie instance directly on your Home Assistant dashboard.

Tap any meal to open a detail sheet with the recipe image, ingredient list with quantities, step-by-step cooking instructions, and prep/cook times.

## Requirements

- Mealie v2.0+ (self-hosted)
- A Mealie long-lived API token

## Quick config

```yaml
type: custom:mealie-today-card
config_entry_id: YOUR_CONFIG_ENTRY_ID
```

Find your `config_entry_id` in **Developer Tools → Actions → mealie.get_mealplan → YAML mode**.

Full documentation and all config options are in the [README](https://github.com/enter360/mealie-today-card#readme).
