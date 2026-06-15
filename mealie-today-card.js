/**
 * Mealie Today Card
 * A custom Lovelace card for Home Assistant that displays today's meals
 * from the official Mealie integration (v2+), with a pop-out detail view
 * showing ingredients, instructions, recipe image, and prep/cook time.
 *
 * Installation:
 *   1. Copy this file to config/www/mealie-today-card.js
 *   2. In HA → Settings → Dashboards → Resources, add:
 *        URL:  /local/mealie-today-card.js
 *        Type: JavaScript Module
 *   3. Add the card to your dashboard (see README block below).
 *
 * Card YAML config:
 *   type: custom:mealie-today-card
 *   entity: calendar.mealie        # your Mealie calendar entity
 *   mealie_url: http://mealie:9000  # base URL of your Mealie instance
 *   api_token: YOUR_API_TOKEN       # long-lived Mealie API token
 *   title: "Today's Meals"          # optional, defaults to "Today's Meals"
 */

const MEAL_TYPES = ["breakfast", "lunch", "dinner"];

const MEAL_LABELS = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
};

const MEAL_ICONS = {
  breakfast: "🌅",
  lunch: "☀️",
  dinner: "🌙",
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const CARD_STYLES = `
  :host {
    --mealie-bg: var(--card-background-color, #1c1c1e);
    --mealie-surface: var(--secondary-background-color, #2c2c2e);
    --mealie-accent: #e8956d;
    --mealie-accent-soft: rgba(232, 149, 109, 0.12);
    --mealie-text-primary: var(--primary-text-color, #f2f2f7);
    --mealie-text-secondary: var(--secondary-text-color, #8e8e93);
    --mealie-divider: rgba(255,255,255,0.08);
    --mealie-radius: 16px;
    --mealie-radius-sm: 10px;
    --mealie-shadow: 0 4px 24px rgba(0,0,0,0.35);
    --mealie-font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  ha-card {
    font-family: var(--mealie-font);
    background: var(--mealie-bg);
    border-radius: var(--mealie-radius);
    overflow: hidden;
    box-shadow: var(--mealie-shadow);
  }

  /* ── Card Header ── */
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 20px 14px;
    border-bottom: 1px solid var(--mealie-divider);
  }
  .card-title {
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--mealie-text-secondary);
  }
  .card-date {
    font-size: 13px;
    color: var(--mealie-accent);
    font-weight: 500;
  }

  /* ── Meal Rows ── */
  .meals-container {
    padding: 8px 0;
  }
  .meal-row {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px 20px;
    cursor: pointer;
    border-radius: 0;
    transition: background 0.15s ease;
    position: relative;
  }
  .meal-row:hover {
    background: var(--mealie-accent-soft);
  }
  .meal-row:active {
    background: rgba(232, 149, 109, 0.2);
  }
  .meal-row + .meal-row {
    border-top: 1px solid var(--mealie-divider);
  }

  .meal-image-wrap {
    flex-shrink: 0;
    width: 56px;
    height: 56px;
    border-radius: var(--mealie-radius-sm);
    overflow: hidden;
    background: var(--mealie-surface);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .meal-image-wrap img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .meal-image-placeholder {
    font-size: 24px;
    line-height: 1;
  }

  .meal-info {
    flex: 1;
    min-width: 0;
  }
  .meal-type-label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--mealie-accent);
    margin-bottom: 3px;
  }
  .meal-name {
    font-size: 15px;
    font-weight: 500;
    color: var(--mealie-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.3;
  }
  .meal-meta {
    font-size: 12px;
    color: var(--mealie-text-secondary);
    margin-top: 3px;
    display: flex;
    gap: 10px;
  }
  .meal-meta span {
    display: flex;
    align-items: center;
    gap: 3px;
  }

  .meal-chevron {
    flex-shrink: 0;
    color: var(--mealie-text-secondary);
    font-size: 18px;
    line-height: 1;
    opacity: 0.5;
    transition: opacity 0.15s;
  }
  .meal-row:hover .meal-chevron { opacity: 1; }

  /* ── Empty / Loading States ── */
  .state-message {
    padding: 28px 20px;
    text-align: center;
    color: var(--mealie-text-secondary);
    font-size: 14px;
  }
  .state-message .emoji { font-size: 32px; margin-bottom: 8px; display: block; }

  /* ── Modal Overlay ── */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.72);
    z-index: 9998;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.25s ease;
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
  }
  .modal-overlay.open {
    opacity: 1;
    pointer-events: all;
  }

  .modal-sheet {
    background: var(--card-background-color, #1c1c1e);
    border-radius: 24px 24px 0 0;
    width: 100%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
    transform: translateY(100%);
    transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
    padding-bottom: env(safe-area-inset-bottom, 16px);
  }
  .modal-overlay.open .modal-sheet {
    transform: translateY(0);
  }

  /* ── Modal Handle ── */
  .modal-handle {
    display: flex;
    justify-content: center;
    padding: 12px 0 4px;
  }
  .modal-handle-bar {
    width: 36px;
    height: 4px;
    border-radius: 2px;
    background: rgba(255,255,255,0.2);
  }

  /* ── Modal Header ── */
  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 20px 16px;
    gap: 12px;
  }
  .modal-type-tag {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--mealie-accent);
    background: var(--mealie-accent-soft);
    padding: 3px 10px;
    border-radius: 20px;
    border: 1px solid rgba(232, 149, 109, 0.25);
    white-space: nowrap;
  }
  .modal-close {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: none;
    background: rgba(255,255,255,0.1);
    color: var(--mealie-text-primary);
    font-size: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.15s;
    line-height: 1;
  }
  .modal-close:hover { background: rgba(255,255,255,0.18); }

  /* ── Modal Hero Image ── */
  .modal-hero {
    width: 100%;
    height: 220px;
    object-fit: cover;
    display: block;
    background: var(--mealie-surface);
  }
  .modal-hero-placeholder {
    width: 100%;
    height: 180px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--mealie-surface);
    font-size: 64px;
    color: var(--mealie-text-secondary);
  }

  /* ── Modal Content ── */
  .modal-content {
    padding: 20px 20px 28px;
  }
  .modal-title {
    font-size: 22px;
    font-weight: 700;
    color: var(--mealie-text-primary);
    line-height: 1.25;
    margin-bottom: 12px;
  }

  /* ── Time Pills ── */
  .time-pills {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 20px;
  }
  .time-pill {
    display: flex;
    align-items: center;
    gap: 5px;
    background: var(--mealie-surface);
    border-radius: 20px;
    padding: 5px 12px;
    font-size: 13px;
    color: var(--mealie-text-primary);
    border: 1px solid var(--mealie-divider);
  }
  .time-pill .pill-icon { font-size: 14px; }
  .time-pill .pill-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--mealie-text-secondary);
    margin-right: 2px;
  }

  /* ── Section ── */
  .modal-section {
    margin-top: 20px;
  }
  .section-heading {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--mealie-accent);
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .section-heading::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--mealie-divider);
  }

  /* ── Ingredients ── */
  .ingredients-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  @media (max-width: 360px) {
    .ingredients-grid { grid-template-columns: 1fr; }
  }
  .ingredient-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    background: var(--mealie-surface);
    border-radius: var(--mealie-radius-sm);
    padding: 9px 11px;
    border: 1px solid var(--mealie-divider);
  }
  .ingredient-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--mealie-accent);
    flex-shrink: 0;
    margin-top: 5px;
  }
  .ingredient-text {
    font-size: 13px;
    color: var(--mealie-text-primary);
    line-height: 1.4;
  }
  .ingredient-qty {
    font-weight: 600;
    color: var(--mealie-accent);
  }

  /* ── Instructions ── */
  .instructions-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .instruction-step {
    display: flex;
    gap: 12px;
    align-items: flex-start;
  }
  .step-number {
    flex-shrink: 0;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: var(--mealie-accent);
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 1px;
  }
  .step-text {
    font-size: 14px;
    color: var(--mealie-text-primary);
    line-height: 1.6;
    flex: 1;
  }

  /* ── Scrollbar ── */
  .modal-sheet::-webkit-scrollbar { width: 4px; }
  .modal-sheet::-webkit-scrollbar-track { background: transparent; }
  .modal-sheet::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.15);
    border-radius: 2px;
  }

  /* ── Loading spinner ── */
  .spinner {
    display: inline-block;
    width: 18px;
    height: 18px;
    border: 2px solid var(--mealie-divider);
    border-top-color: var(--mealie-accent);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    vertical-align: middle;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .modal-loading {
    padding: 40px;
    text-align: center;
    color: var(--mealie-text-secondary);
    font-size: 14px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .error-banner {
    background: rgba(255, 69, 58, 0.12);
    border: 1px solid rgba(255, 69, 58, 0.3);
    border-radius: var(--mealie-radius-sm);
    padding: 10px 14px;
    font-size: 13px;
    color: #ff6b6b;
    margin-bottom: 12px;
  }
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function formatTime(minutes) {
  if (!minutes || minutes <= 0) return null;
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function formatQty(qty, unit, food) {
  const parts = [];
  if (qty) parts.push(qty % 1 === 0 ? qty.toString() : qty.toFixed(1));
  if (unit?.name) parts.push(unit.name);
  if (food?.name) parts.push(food.name);
  return parts.join(" ");
}

// ─── Card Class ──────────────────────────────────────────────────────────────

class MealieTodayCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass = null;
    this._meals = {}; // keyed by meal type
    this._activeRecipe = null;
    this._modalLoading = false;
    this._fetchController = null;
    this._initialized = false;
    this._lastFetchDate = null;
  }

  setConfig(config) {
    if (!config.mealie_url) throw new Error("mealie_url is required");
    if (!config.api_token) throw new Error("api_token is required");
    this._config = {
      title: "Today's Meals",
      ...config,
      mealie_url: config.mealie_url.replace(/\/$/, ""),
    };
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._initialized) {
      this._initialized = true;
      this._render();
      this._fetchTodayMeals();
    }
  }

  connectedCallback() {
    // Poll every 30 minutes for fresh data
    this._pollInterval = setInterval(() => this._fetchTodayMeals(), 30 * 60 * 1000);
  }

  disconnectedCallback() {
    clearInterval(this._pollInterval);
    this._fetchController?.abort();
  }

  // ── API ──────────────────────────────────────────────────────────────────

  async _fetchTodayMeals() {
    const today = todayISO();
    // Don't re-fetch same day unless forced
    if (this._lastFetchDate === today && Object.keys(this._meals).length > 0) return;

    const { mealie_url, api_token } = this._config;
    const headers = { Authorization: `Bearer ${api_token}`, "Content-Type": "application/json" };

    try {
      const res = await fetch(
        `${mealie_url}/api/households/mealplans?start_date=${today}&end_date=${today}&page=1&perPage=20`,
        { headers }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const items = data.items || data || [];

      this._meals = {};
      for (const item of items) {
        const type = (item.entryType || item.entry_type || "dinner").toLowerCase();
        if (MEAL_TYPES.includes(type)) {
          this._meals[type] = item;
        }
      }
      this._lastFetchDate = today;
      this._updateCardContent();
    } catch (err) {
      console.error("[MealieTodayCard] Failed to fetch meal plans:", err);
      this._updateCardContent(err.message);
    }
  }

  async _fetchRecipeDetails(recipeSlug) {
    const { mealie_url, api_token } = this._config;
    const headers = { Authorization: `Bearer ${api_token}`, "Content-Type": "application/json" };

    const res = await fetch(`${mealie_url}/api/recipes/${recipeSlug}`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  // ── Render ───────────────────────────────────────────────────────────────

  _render() {
    this.shadowRoot.innerHTML = `
      <style>${CARD_STYLES}</style>
      <ha-card>
        <div class="card-header">
          <span class="card-title">${this._config.title}</span>
          <span class="card-date">${new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</span>
        </div>
        <div class="meals-container" id="meals-container">
          <div class="state-message">
            <span class="spinner"></span>
          </div>
        </div>
      </ha-card>
      <div class="modal-overlay" id="modal-overlay">
        <div class="modal-sheet" id="modal-sheet">
          <div class="modal-handle"><div class="modal-handle-bar"></div></div>
          <div class="modal-header">
            <span class="modal-type-tag" id="modal-type-tag">Dinner</span>
            <button class="modal-close" id="modal-close" aria-label="Close">✕</button>
          </div>
          <div id="modal-body"></div>
        </div>
      </div>
    `;

    // Close modal on overlay click
    this.shadowRoot.getElementById("modal-overlay").addEventListener("click", (e) => {
      if (e.target === this.shadowRoot.getElementById("modal-overlay")) this._closeModal();
    });
    this.shadowRoot.getElementById("modal-close").addEventListener("click", () => this._closeModal());

    // Close on Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this._closeModal();
    });
  }

  _updateCardContent(error = null) {
    const container = this.shadowRoot.getElementById("meals-container");
    if (!container) return;

    if (error) {
      container.innerHTML = `
        <div class="state-message">
          <span class="emoji">⚠️</span>
          Couldn't load meals.<br><small style="opacity:0.6">${error}</small>
        </div>`;
      return;
    }

    const planned = MEAL_TYPES.filter((t) => this._meals[t]);
    if (planned.length === 0) {
      container.innerHTML = `
        <div class="state-message">
          <span class="emoji">📅</span>
          No meals planned for today.
        </div>`;
      return;
    }

    container.innerHTML = planned
      .map((type) => this._renderMealRow(type, this._meals[type]))
      .join("");

    // Attach click handlers
    container.querySelectorAll(".meal-row").forEach((row) => {
      row.addEventListener("click", () => {
        const type = row.dataset.type;
        this._openModal(type, this._meals[type]);
      });
    });
  }

  _renderMealRow(type, meal) {
    const recipe = meal.recipe || {};
    const name = recipe.name || meal.title || "Untitled";
    const slug = recipe.slug || recipe.id || "";
    const imgUrl = slug
      ? `${this._config.mealie_url}/api/media/recipes/${recipe.id || slug}/images/min-original.webp`
      : null;

    const prepTime = formatTime(recipe.prepTime || recipe.prep_time);
    const totalTime = formatTime(recipe.totalTime || recipe.total_time || recipe.cookTime || recipe.cook_time);

    const metaHtml = [
      prepTime ? `<span>⏱ Prep ${prepTime}</span>` : "",
      totalTime ? `<span>🍳 Total ${totalTime}</span>` : "",
    ]
      .filter(Boolean)
      .join("");

    return `
      <div class="meal-row" data-type="${type}" role="button" tabindex="0" aria-label="View ${name} details">
        <div class="meal-image-wrap">
          ${
            imgUrl
              ? `<img src="${imgUrl}" alt="${name}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
              : ""
          }
          <div class="meal-image-placeholder" style="${imgUrl ? "display:none" : ""}">${MEAL_ICONS[type]}</div>
        </div>
        <div class="meal-info">
          <div class="meal-type-label">${MEAL_ICONS[type]} ${MEAL_LABELS[type]}</div>
          <div class="meal-name">${name}</div>
          ${metaHtml ? `<div class="meal-meta">${metaHtml}</div>` : ""}
        </div>
        <div class="meal-chevron">›</div>
      </div>`;
  }

  // ── Modal ────────────────────────────────────────────────────────────────

  async _openModal(type, meal) {
    const overlay = this.shadowRoot.getElementById("modal-overlay");
    const tag = this.shadowRoot.getElementById("modal-type-tag");
    const body = this.shadowRoot.getElementById("modal-body");

    tag.textContent = `${MEAL_ICONS[type]} ${MEAL_LABELS[type]}`;
    body.innerHTML = `<div class="modal-loading"><div class="spinner"></div>Loading recipe…</div>`;
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";

    const recipe = meal.recipe || {};
    const slug = recipe.slug || recipe.id;

    if (!slug) {
      body.innerHTML = `<div class="modal-content"><div class="error-banner">No recipe linked to this meal.</div></div>`;
      return;
    }

    try {
      const full = await this._fetchRecipeDetails(slug);
      this._renderModal(body, full);
    } catch (err) {
      body.innerHTML = `<div class="modal-content"><div class="error-banner">Failed to load recipe: ${err.message}</div></div>`;
    }
  }

  _renderModal(body, recipe) {
    const { mealie_url } = this._config;
    const imgUrl = recipe.id
      ? `${mealie_url}/api/media/recipes/${recipe.id}/images/original.webp`
      : null;

    const prepTime = formatTime(recipe.prepTime ?? recipe.prep_time);
    const cookTime = formatTime(recipe.performTime ?? recipe.cook_time ?? recipe.cookTime);
    const totalTime = formatTime(recipe.totalTime ?? recipe.total_time);

    const timePills = [
      prepTime ? `<div class="time-pill"><span class="pill-icon">⏱</span><span class="pill-label">Prep</span>${prepTime}</div>` : "",
      cookTime ? `<div class="time-pill"><span class="pill-icon">🍳</span><span class="pill-label">Cook</span>${cookTime}</div>` : "",
      totalTime ? `<div class="time-pill"><span class="pill-icon">⏰</span><span class="pill-label">Total</span>${totalTime}</div>` : "",
      recipe.recipeYield
        ? `<div class="time-pill"><span class="pill-icon">🍽</span><span class="pill-label">Serves</span>${recipe.recipeYield}</div>`
        : "",
    ]
      .filter(Boolean)
      .join("");

    // Ingredients
    const ingredients = (recipe.recipeIngredient || [])
      .map((ing) => {
        if (typeof ing === "string") {
          return `<div class="ingredient-item"><div class="ingredient-dot"></div><div class="ingredient-text">${ing}</div></div>`;
        }
        const qty = formatQty(ing.quantity, ing.unit, ing.food);
        const note = ing.note ? ` <span style="opacity:0.6;font-size:12px">(${ing.note})</span>` : "";
        return `
          <div class="ingredient-item">
            <div class="ingredient-dot"></div>
            <div class="ingredient-text">
              ${qty ? `<span class="ingredient-qty">${qty}</span> ` : ""}${note}
            </div>
          </div>`;
      })
      .join("");

    // Instructions
    const instructions = (recipe.recipeInstructions || [])
      .map((step, i) => {
        const text = typeof step === "string" ? step : step.text || step.title || "";
        return `
          <div class="instruction-step">
            <div class="step-number">${i + 1}</div>
            <div class="step-text">${text}</div>
          </div>`;
      })
      .join("");

    body.innerHTML = `
      ${
        imgUrl
          ? `<img class="modal-hero" src="${imgUrl}" alt="${recipe.name}" onerror="this.outerHTML='<div class=modal-hero-placeholder>${MEAL_ICONS.dinner}</div>'">`
          : `<div class="modal-hero-placeholder">🍽</div>`
      }
      <div class="modal-content">
        <h2 class="modal-title">${recipe.name || "Recipe"}</h2>

        ${timePills ? `<div class="time-pills">${timePills}</div>` : ""}

        ${
          ingredients
            ? `<div class="modal-section">
                <div class="section-heading">Ingredients</div>
                <div class="ingredients-grid">${ingredients}</div>
              </div>`
            : ""
        }

        ${
          instructions
            ? `<div class="modal-section">
                <div class="section-heading">Instructions</div>
                <div class="instructions-list">${instructions}</div>
              </div>`
            : ""
        }
      </div>`;
  }

  _closeModal() {
    const overlay = this.shadowRoot.getElementById("modal-overlay");
    overlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  // ── HACS / Config ────────────────────────────────────────────────────────

  getCardSize() {
    return 3;
  }

  static getConfigElement() {
    return document.createElement("mealie-today-card-editor");
  }

  static getStubConfig() {
    return {
      mealie_url: "http://mealie:9000",
      api_token: "your-api-token-here",
      title: "Today's Meals",
    };
  }
}

// ─── Config Editor ────────────────────────────────────────────────────────────

const EDITOR_STYLES = `
  .editor-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px;
  }
  ha-textfield { width: 100%; }
  .field-hint {
    font-size: 12px;
    color: var(--secondary-text-color);
    margin-top: -8px;
    padding-left: 4px;
  }
`;

class MealieTodayCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
  }

  setConfig(config) {
    this._config = { ...config };
    if (this.shadowRoot.querySelector(".editor-form")) {
      this._updateValues();
    } else {
      this._render();
    }
  }

  _render() {
    this.shadowRoot.innerHTML = `
      <style>${EDITOR_STYLES}</style>
      <div class="editor-form">
        <ha-textfield
          label="Mealie URL"
          data-field="mealie_url"
          placeholder="http://mealie:9000"
          required
          auto-validate
          error-message="Required"
        ></ha-textfield>
        <p class="field-hint">Base URL of your Mealie instance (no trailing slash)</p>
        <ha-textfield
          label="API Token"
          data-field="api_token"
          placeholder="your-long-lived-api-token"
          required
          auto-validate
          error-message="Required"
        ></ha-textfield>
        <p class="field-hint">Generate in Mealie → User Profile → API Tokens</p>
        <ha-textfield
          label="Card Title"
          data-field="title"
          placeholder="Today's Meals"
        ></ha-textfield>
      </div>
    `;
    this._updateValues();
    this.shadowRoot.querySelectorAll("ha-textfield").forEach((el) => {
      el.addEventListener("change", this._valueChanged.bind(this));
    });
  }

  _updateValues() {
    const map = {
      mealie_url: this._config.mealie_url ?? "",
      api_token: this._config.api_token ?? "",
      title: this._config.title ?? "",
    };
    this.shadowRoot.querySelectorAll("ha-textfield").forEach((el) => {
      el.value = map[el.dataset.field] ?? "";
    });
  }

  _valueChanged(e) {
    const field = e.target.dataset.field;
    const value = e.target.value.trim();
    if (!field) return;

    const newConfig = { ...this._config, [field]: value };
    if (!value && field === "title") delete newConfig[field];
    this._config = newConfig;

    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      })
    );
  }
}

// ─── Register ─────────────────────────────────────────────────────────────────

customElements.define("mealie-today-card-editor", MealieTodayCardEditor);
customElements.define("mealie-today-card", MealieTodayCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "mealie-today-card",
  name: "Mealie Today",
  description: "Displays today's breakfast, lunch, and dinner from Mealie with ingredient & instruction pop-outs.",
  preview: true,
});

console.info(
  "%c MEALIE-TODAY-CARD %c v1.0.0 ",
  "background:#e8956d;color:#fff;font-weight:700;padding:2px 6px;border-radius:4px 0 0 4px",
  "background:#2c2c2e;color:#e8956d;font-weight:600;padding:2px 6px;border-radius:0 4px 4px 0"
);
