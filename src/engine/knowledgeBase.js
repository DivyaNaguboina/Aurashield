/**
 * knowledgeBase.js — JSON index loader with in-memory caching
 * All data stays in the browser tab. No network calls after initial load.
 */

let _ingredientIndex = null;
let _skinCompatIndex = null;
let _hairCompatIndex = null;
let _loadPromise = null;

/**
 * Load all three knowledge indexes.
 * Safe to call multiple times — returns cached result after first load.
 * @param {Function} [onProgress] — (message, pct) => void
 */
export async function loadKnowledgeBases(onProgress) {
  if (_ingredientIndex && _skinCompatIndex && _hairCompatIndex) {
    return getIndexes();
  }

  if (_loadPromise) return _loadPromise;

  _loadPromise = (async () => {
    onProgress?.('Loading ingredient database…', 10);
    _ingredientIndex = await _fetchJSON('/data/ingredient_index.json');

    onProgress?.('Loading skin compatibility data…', 50);
    _skinCompatIndex = await _fetchJSON('/data/skin_compat_index.json');

    onProgress?.('Loading hair compatibility data…', 80);
    _hairCompatIndex = await _fetchJSON('/data/hair_compat_index.json');

    onProgress?.('Knowledge base ready', 100);
    return getIndexes();
  })();

  return _loadPromise;
}

async function _fetchJSON(url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to load ${url}: ${resp.status}`);
  return resp.json();
}

export function getIndexes() {
  return {
    ingredientIndex: _ingredientIndex,
    skinCompatIndex: _skinCompatIndex,
    hairCompatIndex: _hairCompatIndex,
  };
}

export function isLoaded() {
  return !!(_ingredientIndex && _skinCompatIndex && _hairCompatIndex);
}

/**
 * Direct ingredient lookup by INCI name
 */
export function lookupIngredient(name) {
  return _ingredientIndex?.[name.toUpperCase()] ?? null;
}

/**
 * Get skin compatibility entry
 */
export function lookupSkinCompat(name, skinType) {
  return _skinCompatIndex?.[name.toUpperCase()]?.[skinType] ?? null;
}

/**
 * Get hair compatibility entry
 */
export function lookupHairCompat(name, hairType) {
  return _hairCompatIndex?.[name.toUpperCase()]?.[hairType] ?? null;
}

export function getIngredientCount() { return _ingredientIndex ? Object.keys(_ingredientIndex).length : 0; }
export function getSkinCompatCount() { return _skinCompatIndex ? Object.keys(_skinCompatIndex).length : 0; }
