/**
 * Mealie Today Card
 * A custom Lovelace card for Home Assistant that displays today's meals
 * from the Mealie integration, with a tap-to-expand detail view showing
 * ingredients, instructions, recipe image, and prep/cook times.
 *
 * Card YAML config:
 *   type: custom:mealie-today-card
 *   config_entry_id: "abc123..."          # required
 *   title: "Today's Meals"                # optional
 *   mealie_url: "http://192.168.0.x:9000" # optional — only used for recipe images
 *   debug: false                           # optional — logs raw API responses
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

  :host(.modal-open) { overflow: hidden; }

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
  .header-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .card-date {
    font-size: 13px;
    color: var(--mealie-accent);
    font-weight: 500;
  }
  .refresh-btn {
    background: none;
    border: none;
    color: var(--mealie-text-secondary);
    font-size: 18px;
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 6px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.15s;
  }
  .refresh-btn:hover { color: var(--mealie-accent); }
  .refresh-btn:focus-visible { outline: 2px solid var(--mealie-accent); outline-offset: 2px; }
  .refresh-btn.spinning {
    animation: spin 0.7s linear infinite;
    color: var(--mealie-accent);
    pointer-events: none;
  }

  /* ── Meal Rows ── */
  .meals-container { padding: 8px 0; }
  .meal-row {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px 20px;
    cursor: pointer;
    transition: background 0.15s ease;
    position: relative;
  }
  .meal-row:hover { background: var(--mealie-accent-soft); }
  .meal-row:active { background: rgba(232, 149, 109, 0.2); }
  .meal-row:focus-visible {
    outline: 2px solid var(--mealie-accent);
    outline-offset: -2px;
  }
  .meal-row + .meal-row { border-top: 1px solid var(--mealie-divider); }

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
  .meal-image-wrap img { width: 100%; height: 100%; object-fit: cover; }
  .meal-image-placeholder { font-size: 24px; line-height: 1; }

  .meal-info { flex: 1; min-width: 0; }
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
  .meal-meta span { display: flex; align-items: center; gap: 3px; }

  .meal-chevron {
    flex-shrink: 0;
    color: var(--mealie-text-secondary);
    font-size: 18px;
    line-height: 1;
    opacity: 0.5;
    transition: opacity 0.15s;
  }
  .meal-row:hover .meal-chevron,
  .meal-row:focus-visible .meal-chevron { opacity: 1; }

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
  .modal-overlay.open { opacity: 1; pointer-events: all; }

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
  .modal-overlay.open .modal-sheet { transform: translateY(0); }

  /* ── Modal Handle ── */
  .modal-handle { display: flex; justify-content: center; padding: 12px 0 4px; }
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
  .modal-close:focus-visible { outline: 2px solid var(--mealie-accent); outline-offset: 2px; }

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
  .modal-content { padding: 20px 20px 28px; }
  .modal-title {
    font-size: 22px;
    font-weight: 700;
    color: var(--mealie-text-primary);
    line-height: 1.25;
    margin-bottom: 12px;
  }

  /* ── Time Pills ── */
  .time-pills { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 16px; }
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

  /* ── Servings Scaler ── */
  .servings-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
    padding: 10px 14px;
    background: var(--mealie-surface);
    border-radius: var(--mealie-radius-sm);
    border: 1px solid var(--mealie-divider);
  }
  .servings-label {
    font-size: 13px;
    color: var(--mealie-text-secondary);
    flex: 1;
    font-weight: 500;
  }
  .servings-control {
    display: flex;
    align-items: center;
    gap: 0;
    background: var(--mealie-bg);
    border-radius: 20px;
    border: 1px solid var(--mealie-divider);
    overflow: hidden;
  }
  .servings-btn {
    background: none;
    border: none;
    color: var(--mealie-accent);
    font-size: 20px;
    font-weight: 300;
    width: 36px;
    height: 32px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s;
    line-height: 1;
  }
  .servings-btn:hover { background: var(--mealie-accent-soft); }
  .servings-btn:focus-visible { outline: 2px solid var(--mealie-accent); outline-offset: -2px; }
  .servings-btn:disabled { opacity: 0.3; cursor: default; }
  .servings-count {
    font-size: 15px;
    font-weight: 600;
    color: var(--mealie-text-primary);
    min-width: 28px;
    text-align: center;
  }

  /* ── Section ── */
  .modal-section { margin-top: 20px; }
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
  @media (max-width: 360px) { .ingredients-grid { grid-template-columns: 1fr; } }
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
  .ingredient-text { font-size: 13px; color: var(--mealie-text-primary); line-height: 1.4; }
  .ingredient-qty { font-weight: 600; color: var(--mealie-accent); }

  /* ── Instructions ── */
  .instructions-list { display: flex; flex-direction: column; gap: 12px; }
  .instruction-step { display: flex; gap: 12px; align-items: flex-start; }
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
  .step-text { font-size: 14px; color: var(--mealie-text-primary); line-height: 1.6; flex: 1; }

  /* ── Note-only meal ── */
  .note-only {
    padding: 32px 20px 40px;
    text-align: center;
  }
  .note-only .note-emoji { font-size: 48px; display: block; margin-bottom: 14px; }
  .note-only .note-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--mealie-text-primary);
    margin-bottom: 8px;
    line-height: 1.3;
  }
  .note-only .note-sub { font-size: 13px; color: var(--mealie-text-secondary); }

  /* ── Scrollbar ── */
  .modal-sheet::-webkit-scrollbar { width: 4px; }
  .modal-sheet::-webkit-scrollbar-track { background: transparent; }
  .modal-sheet::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }

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

function parseServings(yieldStr) {
  if (!yieldStr) return null;
  const match = String(yieldStr).match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

// ─── Card Class ──────────────────────────────────────────────────────────────

class MealieTodayCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass = null;
    this._meals = {};
    this._initialized = false;
    this._lastFetchDate = null;
    this._modalTrigger = null;
    this._focusTrapHandler = null;
    this._baseServings = null;
    this._currentServings = null;
    this._baseIngredients = [];
  }

  setConfig(config) {
    if (!config.config_entry_id) throw new Error("config_entry_id is required");
    this._config = {
      title: "Today's Meals",
      debug: false,
      ...config,
      mealie_url: config.mealie_url?.replace(/\/$/, "") ?? null,
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
    this._pollInterval = setInterval(() => this._fetchTodayMeals(), 30 * 60 * 1000);
  }

  disconnectedCallback() {
    clearInterval(this._pollInterval);
  }

  // ── API ──────────────────────────────────────────────────────────────────

  async _callMealieAction(action, data) {
    const { config_entry_id } = this._config;
    const result = await this._hass.connection.sendMessagePromise({
      type: "call_service",
      domain: "mealie",
      service: action,
      service_data: { config_entry_id, ...data },
      return_response: true,
    });
    return result?.response ?? result;
  }

  async _fetchTodayMeals() {
    const today = todayISO();
    if (this._lastFetchDate === today && Object.keys(this._meals).length > 0) return;

    this._setRefreshing(true);
    try {
      const data = await this._callMealieAction("get_mealplan", {
        start_date: today,
        end_date: today,
      });

      if (this._config.debug) {
        console.log("[MealieTodayCard] get_mealplan raw response:", data);
      }

      const items = Array.isArray(data)
        ? data
        : (data?.items ?? data?.mealplan ?? []);

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
    } finally {
      this._setRefreshing(false);
    }
  }

  async _fetchRecipeDetails(recipeId) {
    const data = await this._callMealieAction("get_recipe", { recipe_id: recipeId });
    if (this._config.debug) {
      console.log("[MealieTodayCard] get_recipe raw response:", data);
    }
    return data;
  }

  // ── Render ───────────────────────────────────────────────────────────────

  _setRefreshing(on) {
    this.shadowRoot?.getElementById("refresh-btn")?.classList.toggle("spinning", on);
  }

  _render() {
    this.shadowRoot.innerHTML = `
      <style>${CARD_STYLES}</style>
      <ha-card>
        <div class="card-header">
          <span class="card-title">${this._config.title}</span>
          <div class="header-right">
            <span class="card-date">${new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</span>
            <button class="refresh-btn" id="refresh-btn" aria-label="Refresh meals">↻</button>
          </div>
        </div>
        <div class="meals-container" id="meals-container">
          <div class="state-message"><span class="spinner"></span></div>
        </div>
      </ha-card>
      <div class="modal-overlay" id="modal-overlay" role="dialog" aria-modal="true" aria-label="Recipe details">
        <div class="modal-sheet" id="modal-sheet">
          <div class="modal-handle"><div class="modal-handle-bar"></div></div>
          <div class="modal-header">
            <span class="modal-type-tag" id="modal-type-tag"></span>
            <button class="modal-close" id="modal-close" aria-label="Close recipe details">✕</button>
          </div>
          <div id="modal-body"></div>
        </div>
      </div>
    `;

    this.shadowRoot.getElementById("modal-overlay").addEventListener("click", (e) => {
      if (e.target === this.shadowRoot.getElementById("modal-overlay")) this._closeModal();
    });
    this.shadowRoot.getElementById("modal-close").addEventListener("click", () => this._closeModal());
    this.shadowRoot.getElementById("refresh-btn").addEventListener("click", () => {
      this._lastFetchDate = null;
      this._meals = {};
      this._fetchTodayMeals();
    });
    this.shadowRoot.addEventListener("keydown", (e) => {
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

    container.innerHTML = planned.map((type) => this._renderMealRow(type, this._meals[type])).join("");

    container.querySelectorAll(".meal-row").forEach((row) => {
      const type = row.dataset.type;
      const activate = () => this._openModal(type, this._meals[type]);
      row.addEventListener("click", activate);
      row.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activate(); }
      });
    });
  }

  _renderMealRow(type, meal) {
    const recipe = meal.recipe || {};
    const name = recipe.name || meal.title || "Untitled";
    const imgUrl = (this._config.mealie_url && (recipe.id || recipe.slug))
      ? `${this._config.mealie_url}/api/media/recipes/${recipe.id || recipe.slug}/images/min-original.webp`
      : null;

    const prepTime = formatTime(recipe.prepTime ?? recipe.prep_time);
    const totalTime = formatTime(recipe.totalTime ?? recipe.total_time ?? recipe.cookTime ?? recipe.cook_time);
    const metaHtml = [
      prepTime ? `<span>⏱ Prep ${prepTime}</span>` : "",
      totalTime ? `<span>🍳 Total ${totalTime}</span>` : "",
    ].filter(Boolean).join("");

    return `
      <div class="meal-row" data-type="${type}" role="button" tabindex="0" aria-label="View ${name} details">
        <div class="meal-image-wrap">
          ${imgUrl ? `<img src="${imgUrl}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">` : ""}
          <div class="meal-image-placeholder"${imgUrl ? ' style="display:none"' : ""}>${MEAL_ICONS[type]}</div>
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
    this.classList.add("modal-open");

    this._modalTrigger = this.shadowRoot.querySelector(`[data-type="${type}"]`);

    const recipe = meal.recipe || {};
    const recipeId = recipe.id || recipe.slug;

    if (!recipeId) {
      const noteText = meal.title || meal.note || "";
      body.innerHTML = `
        <div class="note-only">
          <span class="note-emoji">📝</span>
          ${noteText ? `<div class="note-title">${noteText}</div>` : ""}
          <div class="note-sub">This meal has no linked recipe.</div>
        </div>`;
      this._focusCloseButton();
      return;
    }

    try {
      const full = await this._fetchRecipeDetails(recipeId);
      if (!overlay.classList.contains("open")) return;
      this._renderModal(body, full);
    } catch (err) {
      if (!overlay.classList.contains("open")) return;
      body.innerHTML = `<div class="modal-content"><div class="error-banner">Failed to load recipe: ${err.message}</div></div>`;
    }
    this._focusCloseButton();
  }

  _focusCloseButton() {
    requestAnimationFrame(() => {
      this.shadowRoot.getElementById("modal-close")?.focus();
      this._setupFocusTrap();
    });
  }

  _setupFocusTrap() {
    if (this._focusTrapHandler) {
      this.shadowRoot.removeEventListener("keydown", this._focusTrapHandler);
    }
    const sheet = this.shadowRoot.getElementById("modal-sheet");
    this._focusTrapHandler = (e) => {
      if (e.key !== "Tab") return;
      const focusable = [...sheet.querySelectorAll(
        "button:not([disabled]), [tabindex]:not([tabindex='-1'])"
      )];
      if (focusable.length < 2) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = this.shadowRoot.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    this.shadowRoot.addEventListener("keydown", this._focusTrapHandler);
  }

  _renderModal(body, recipe) {
    const { mealie_url } = this._config;
    const imgUrl = (mealie_url && recipe.id)
      ? `${mealie_url}/api/media/recipes/${recipe.id}/images/original.webp`
      : null;

    const prepTime = formatTime(recipe.prepTime ?? recipe.prep_time);
    const cookTime = formatTime(recipe.performTime ?? recipe.cook_time ?? recipe.cookTime);
    const totalTime = formatTime(recipe.totalTime ?? recipe.total_time);

    const timePills = [
      prepTime ? `<div class="time-pill"><span class="pill-icon">⏱</span><span class="pill-label">Prep</span>${prepTime}</div>` : "",
      cookTime ? `<div class="time-pill"><span class="pill-icon">🍳</span><span class="pill-label">Cook</span>${cookTime}</div>` : "",
      totalTime ? `<div class="time-pill"><span class="pill-icon">⏰</span><span class="pill-label">Total</span>${totalTime}</div>` : "",
    ].filter(Boolean).join("");

    this._baseServings = parseServings(recipe.recipeYield);
    this._currentServings = this._baseServings;
    this._baseIngredients = recipe.recipeIngredient || [];

    const servingsHtml = this._baseServings ? `
      <div class="servings-row">
        <span class="servings-label">Servings</span>
        <div class="servings-control">
          <button class="servings-btn" id="servings-dec" aria-label="Decrease servings"${this._currentServings <= 1 ? " disabled" : ""}>−</button>
          <span class="servings-count" id="servings-count">${this._currentServings}</span>
          <button class="servings-btn" id="servings-inc" aria-label="Increase servings">+</button>
        </div>
      </div>` : "";

    const instructions = (recipe.recipeInstructions || [])
      .map((step, i) => {
        const text = typeof step === "string" ? step : (step.text || step.title || "");
        return `
          <div class="instruction-step">
            <div class="step-number">${i + 1}</div>
            <div class="step-text">${text}</div>
          </div>`;
      }).join("");

    body.innerHTML = `
      ${imgUrl
        ? `<img class="modal-hero" src="${imgUrl}" alt="" onerror="this.outerHTML='<div class=modal-hero-placeholder>${MEAL_ICONS.dinner}</div>'">`
        : `<div class="modal-hero-placeholder">${MEAL_ICONS.dinner}</div>`
      }
      <div class="modal-content">
        <h2 class="modal-title">${recipe.name || "Recipe"}</h2>
        ${timePills ? `<div class="time-pills">${timePills}</div>` : ""}
        ${servingsHtml}
        ${this._baseIngredients.length ? `
          <div class="modal-section">
            <div class="section-heading">Ingredients</div>
            <div class="ingredients-grid" id="ingredients-grid">
              ${this._renderIngredients(this._baseIngredients, 1)}
            </div>
          </div>` : ""}
        ${instructions ? `
          <div class="modal-section">
            <div class="section-heading">Instructions</div>
            <div class="instructions-list">${instructions}</div>
          </div>` : ""}
      </div>`;

    if (this._baseServings) {
      this.shadowRoot.getElementById("servings-dec").addEventListener("click", () => this._scaleServings(-1));
      this.shadowRoot.getElementById("servings-inc").addEventListener("click", () => this._scaleServings(1));
    }
  }

  _renderIngredients(ingredients, ratio) {
    return ingredients.map((ing) => {
      if (typeof ing === "string") {
        return `<div class="ingredient-item"><div class="ingredient-dot"></div><div class="ingredient-text">${ing}</div></div>`;
      }
      const scaledQty = (ing.quantity && ratio !== 1) ? ing.quantity * ratio : ing.quantity;
      const qty = formatQty(scaledQty, ing.unit, ing.food);
      const note = ing.note ? ` <span style="opacity:0.6;font-size:12px">(${ing.note})</span>` : "";
      return `
        <div class="ingredient-item">
          <div class="ingredient-dot"></div>
          <div class="ingredient-text">
            ${qty ? `<span class="ingredient-qty">${qty}</span>` : ""}${note}
          </div>
        </div>`;
    }).join("");
  }

  _scaleServings(delta) {
    if (!this._baseServings) return;
    this._currentServings = Math.max(1, this._currentServings + delta);
    const ratio = this._currentServings / this._baseServings;

    const countEl = this.shadowRoot.getElementById("servings-count");
    const decBtn = this.shadowRoot.getElementById("servings-dec");
    const grid = this.shadowRoot.getElementById("ingredients-grid");

    if (countEl) countEl.textContent = this._currentServings;
    if (decBtn) decBtn.disabled = this._currentServings <= 1;
    if (grid) grid.innerHTML = this._renderIngredients(this._baseIngredients, ratio);
  }

  _closeModal() {
    const overlay = this.shadowRoot.getElementById("modal-overlay");
    if (!overlay?.classList.contains("open")) return;

    overlay.classList.remove("open");
    this.classList.remove("modal-open");

    if (this._focusTrapHandler) {
      this.shadowRoot.removeEventListener("keydown", this._focusTrapHandler);
      this._focusTrapHandler = null;
    }

    if (this._modalTrigger) {
      this._modalTrigger.focus();
      this._modalTrigger = null;
    }
  }

  // ── HACS / Config ────────────────────────────────────────────────────────

  getCardSize() { return 3; }

  static getConfigElement() {
    return document.createElement("mealie-today-card-editor");
  }

  static getStubConfig() {
    return { config_entry_id: "", title: "Today's Meals" };
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
  .checkbox-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 4px 0;
    font-size: 14px;
    color: var(--primary-text-color);
    cursor: pointer;
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
          label="Config Entry ID"
          data-field="config_entry_id"
          placeholder="abc123..."
          required
          auto-validate
          error-message="Required"
        ></ha-textfield>
        <p class="field-hint">Developer Tools → Actions → mealie.get_mealplan → copy config_entry_id</p>
        <ha-textfield
          label="Card Title"
          data-field="title"
          placeholder="Today's Meals"
        ></ha-textfield>
        <ha-textfield
          label="Mealie URL (for images only)"
          data-field="mealie_url"
          placeholder="http://192.168.0.x:9000"
        ></ha-textfield>
        <p class="field-hint">Optional. Only needed to show recipe thumbnail and hero images.</p>
        <label class="checkbox-row">
          <ha-checkbox id="debug-checkbox"></ha-checkbox>
          Debug mode (log raw API responses to console)
        </label>
      </div>
    `;
    this._updateValues();
    this.shadowRoot.querySelectorAll("ha-textfield").forEach((el) => {
      el.addEventListener("change", this._fieldChanged.bind(this));
    });
    this.shadowRoot.getElementById("debug-checkbox").addEventListener("change", (e) => {
      this._emitConfig({ ...this._config, debug: e.target.checked });
    });
  }

  _updateValues() {
    const map = {
      config_entry_id: this._config.config_entry_id ?? "",
      title: this._config.title ?? "",
      mealie_url: this._config.mealie_url ?? "",
    };
    this.shadowRoot.querySelectorAll("ha-textfield").forEach((el) => {
      el.value = map[el.dataset.field] ?? "";
    });
    const checkbox = this.shadowRoot.getElementById("debug-checkbox");
    if (checkbox) checkbox.checked = !!this._config.debug;
  }

  _fieldChanged(e) {
    const field = e.target.dataset.field;
    const value = e.target.value.trim();
    if (!field) return;
    const newConfig = { ...this._config, [field]: value };
    if (!value && field !== "config_entry_id") delete newConfig[field];
    this._emitConfig(newConfig);
  }

  _emitConfig(config) {
    this._config = config;
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config },
      bubbles: true,
      composed: true,
    }));
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
  "%c MEALIE-TODAY-CARD %c v1.1.0 ",
  "background:#e8956d;color:#fff;font-weight:700;padding:2px 6px;border-radius:4px 0 0 4px",
  "background:#2c2c2e;color:#e8956d;font-weight:600;padding:2px 6px;border-radius:0 4px 4px 0"
);
