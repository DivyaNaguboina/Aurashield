/**
 * matcher.js — 4-stage matching engine built for OCR-corrupted INCI names
 *
 * Stage 1: Exact match O(1)
 * Stage 2: Normalised match (strip spaces/hyphens/slashes)
 * Stage 3: Custom edit-distance with OCR-aware weights
 * Stage 4: Fuse.js for multi-word ingredient names
 *
 * OCR errors we specifically handle:
 *   - 1 char substitution: MYRISIATE→MYRISTATE, ACELATE→ACETATE
 *   - Missing/extra space: CAPRYLIC CAPRIC→CAPRYLIC/CAPRIC
 *   - Character swap: ATE→AET, OIL→OF
 *   - Prefix OCR errors: GICENYL→GLYCERYL, CAPRYKC→CAPRYLIC
 */

import Fuse from 'fuse.js';

let exactIndex  = null;
let normIndex   = null;  // stripped of spaces/hyphens/slashes
let prefixIndex = null;  // first 6 chars → [keys]
let fuseInstance = null;
let allKeys = [];

export function loadMatchingIndex(ingredientKeys) {
  allKeys = ingredientKeys;

  // Stage 1: exact
  exactIndex = new Map(ingredientKeys.map(k => [k, k]));

  // Stage 2: normalised
  normIndex = new Map();
  for (const k of ingredientKeys) {
    const norm = _norm(k);
    if (!normIndex.has(norm)) normIndex.set(norm, k);
  }

  // Stage 3: prefix index for fast candidate selection
  prefixIndex = new Map();
  for (const k of ingredientKeys) {
    const prefix = k.slice(0, 6).toUpperCase();
    if (!prefixIndex.has(prefix)) prefixIndex.set(prefix, []);
    prefixIndex.get(prefix).push(k);
  }

  // Stage 4: Fuse with higher threshold for multi-word names
  fuseInstance = new Fuse(ingredientKeys, {
    includeScore: true,
    threshold: 0.55,       // higher = more lenient
    minMatchCharLength: 3,
    distance: 300,
    ignoreLocation: true,
    useExtendedSearch: false,
    tokenize: false,
  });

  console.log(`[Matcher] Loaded ${ingredientKeys.length} ingredients`);
}

export function matchIngredient(token) {
  if (!exactIndex) return null;
  const t = token.trim().toUpperCase().replace(/\s+/g, ' ');
  if (t.length < 3) return null;

  // Stage 1 — exact
  if (exactIndex.has(t)) return { name: t, score: 1.0, method: 'exact' };

  // Stage 2 — normalised (handles missing slash, hyphen, space variations)
  const nt = _norm(t);
  if (normIndex.has(nt)) return { name: normIndex.get(nt), score: 0.97, method: 'normalised' };

  // Stage 2b — OCR corrections then exact/normalised
  const corrected = _applyOCRCorrections(t);
  if (corrected !== t) {
    if (exactIndex.has(corrected)) return { name: corrected, score: 0.92, method: 'ocr-exact' };
    const nc = _norm(corrected);
    if (normIndex.has(nc)) return { name: normIndex.get(nc), score: 0.90, method: 'ocr-norm' };
  }

  // Stage 3 — Custom edit-distance on candidates
  // Get candidates by first 3 chars (fast filter)
  const prefix3 = t.slice(0, 3);
  const candidates = new Set();

  // Collect candidates from similar prefixes
  for (const [p, keys] of prefixIndex) {
    if (_editDistance(prefix3, p.slice(0, 3)) <= 1) {
      keys.forEach(k => candidates.add(k));
    }
  }
  // Also add corrected prefix candidates
  if (corrected !== t) {
    const cp3 = corrected.slice(0, 3);
    for (const [p, keys] of prefixIndex) {
      if (_editDistance(cp3, p.slice(0, 3)) <= 1) {
        keys.forEach(k => candidates.add(k));
      }
    }
  }

  let bestED = null, bestEDScore = Infinity;
  const queryLen = t.length;

  for (const cand of candidates) {
    // Quick length filter — skip if too different in length
    if (Math.abs(cand.length - queryLen) > Math.max(4, queryLen * 0.3)) continue;

    const dist = _editDistance(t, cand);
    const maxLen = Math.max(t.length, cand.length);
    const similarity = 1 - dist / maxLen;

    if (similarity > 0.75 && dist < bestEDScore) {
      bestEDScore = dist;
      bestED = { name: cand, score: +similarity.toFixed(3), method: 'edit-distance' };
    }
  }
  if (bestED) return bestED;

  // Also try edit-distance on corrected version
  if (corrected !== t) {
    const corrLen = corrected.length;
    let bestCorrED = null, bestCorrScore = Infinity;

    for (const cand of candidates) {
      if (Math.abs(cand.length - corrLen) > Math.max(4, corrLen * 0.3)) continue;
      const dist = _editDistance(corrected, cand);
      const maxLen = Math.max(corrected.length, cand.length);
      const similarity = 1 - dist / maxLen;
      if (similarity > 0.72 && dist < bestCorrScore) {
        bestCorrScore = dist;
        bestCorrED = { name: cand, score: +similarity.toFixed(3), method: 'ocr-edit' };
      }
    }
    if (bestCorrED) return bestCorrED;
  }

  // Stage 4 — Fuse.js (handles multi-word rearrangements)
  const fuseResults = fuseInstance.search(t, { limit: 5 });
  if (fuseResults.length > 0 && fuseResults[0].score < 0.45) {
    return {
      name: fuseResults[0].item,
      score: +(1 - fuseResults[0].score).toFixed(3),
      method: 'fuse',
    };
  }

  // Stage 4b — Fuse on corrected
  if (corrected !== t) {
    const cf = fuseInstance.search(corrected, { limit: 5 });
    if (cf.length > 0 && cf[0].score < 0.45) {
      return {
        name: cf[0].item,
        score: +(1 - cf[0].score).toFixed(3),
        method: 'fuse-corrected',
      };
    }
  }

  return null;
}

export function matchAllIngredients(tokens) {
  const results = [];
  const seen = new Set();

  for (const token of tokens) {
    const match = matchIngredient(token);
    if (match && !seen.has(match.name)) {
      seen.add(match.name);
      results.push({ ...match, original: token });
    }
  }

  const unmatched = tokens.filter(t => !results.find(r => r.original === t));
  console.log(`[Matcher] ${results.length}/${tokens.length} matched`);
  if (unmatched.length) console.log('[Matcher] Unmatched:', unmatched.slice(0, 8));

  return results;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function _norm(s) {
  return s.toUpperCase()
    .replace(/[\s\-\.\/,]/g, '')  // strip spaces, hyphens, slashes, dots
    .replace(/[^A-Z0-9]/g, '');
}

// Common OCR substitution corrections
function _applyOCRCorrections(s) {
  return s
    // Letter confusions
    .replace(/\bVV/g, 'W')
    .replace(/([A-Z])0([A-Z])/g, '$1O$2')    // 0→O between letters
    .replace(/([A-Z])1([A-Z])/g, '$1I$2')    // 1→I between letters
    .replace(/\brn\b/g, 'M')
    // Common OCR word-level corrections
    .replace(/\bACELATE\b/, 'ACETATE')
    .replace(/\bACETAT\b/, 'ACETATE')
    .replace(/\bMYRISIATE\b/, 'MYRISTATE')
    .replace(/\bSTECROTE\b/, 'STEARATE')
    .replace(/\bTIGYEENDE\b/, 'TRIGLYCERIDE')
    .replace(/\bTRIGLYCERID\b/, 'TRIGLYCERIDE')
    .replace(/\bALCOHOT\b/, 'ALCOHOL')
    .replace(/\bSKECECKS\b/, 'STEARATE')
    .replace(/\bSTEKEATE\b/, 'STEARATE')
    .replace(/\bGICENYL\b/, 'GLYCERYL')
    .replace(/\bCAPRYKC\b/, 'CAPRYLIC')
    .replace(/\bCOPRIC\b/, 'CAPRIC')
    .replace(/\bWKGCRE\b/, 'WHEAT GERM')
    .replace(/\bGEN\b/, 'GERM')
    .replace(/\bOF\b$/, 'OIL')              // trailing OF → OIL
    .replace(/\bGEN\s+OF\b/, 'GERM OIL')
    // "GI IN CET" → "CI CETYL" — CI colour index OCR error
    .replace(/^GI\s+IN\s+CET\b/, 'CETYL')
    .replace(/\bCET\s+ALCOH/, 'CETYL ALCOHOL')
    // SORBIAN → SORBITAN
    .replace(/\bSORBIAN\b/, 'SORBITAN')
    .replace(/\bSORBITAN\s+SKEC/, 'SORBITAN STEAR')
    // VULGARE WHEAT GERM → TRITICUM VULGARE GERM OIL
    .replace(/\bVULGARE\s+WHEAT\s+GERM\b/, 'TRITICUM VULGARE GERM')
    .replace(/\bTRITICUM\s+VULGARE\s+GERM\s+OF\b/, 'TRITICUM VULGARE GERM OIL')
    // Spacing around slashes
    .replace(/\s*\/\s*/g, '/')
    .replace(/\s+/g, ' ')
    .trim();
}

// Standard Levenshtein edit distance
function _editDistance(a, b) {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  if (Math.abs(m - n) > Math.max(m, n) * 0.5) return Math.max(m, n); // quick bail

  const dp = new Uint16Array((m + 1) * (n + 1));
  for (let i = 0; i <= m; i++) dp[i * (n + 1)] = i;
  for (let j = 0; j <= n; j++) dp[j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i * (n + 1) + j] = Math.min(
        dp[(i - 1) * (n + 1) + j] + 1,
        dp[i * (n + 1) + (j - 1)] + 1,
        dp[(i - 1) * (n + 1) + (j - 1)] + cost
      );
    }
  }
  return dp[m * (n + 1) + n];
}

export function isIndexLoaded() { return !!exactIndex; }
export function getIndexSize()  { return allKeys.length; }
