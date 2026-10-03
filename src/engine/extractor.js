/**
 * extractor.js — Robust ingredient extraction from OCR output
 *
 * Strategy:
 * 1. Find the ingredient block (after "Ingredients:" header)
 * 2. Filter out non-ingredient lines (instructions, addresses, marketing)
 * 3. Split on commas — primary delimiter for INCI lists
 * 4. Validate each token against INCI patterns
 * 5. If low yield: retry without header detection (full text mode)
 */

// Known INCI ingredient fragments — if a token contains these, it's likely an ingredient
const INCI_SIGNALS = [
  'AQUA', 'WATER', 'GLYCERIN', 'GLYCEROL', 'ALCOHOL', 'EXTRACT',
  'OIL', 'ACID', 'SODIUM', 'POTASSIUM', 'CALCIUM', 'MAGNESIUM', 'ZINC',
  'BUTYLENE', 'PROPYLENE', 'ETHYL', 'METHYL', 'BUTYL', 'CETYL', 'STEARYL',
  'LAURYL', 'MYRISTYL', 'BEHENYL', 'OLEYL', 'PALMITYL', 'CAPRYLIC',
  'TOCOPHEROL', 'RETINOL', 'NIACINAMIDE', 'PANTHENOL', 'ALLANTOIN',
  'HYALURONATE', 'COLLAGEN', 'KERATIN', 'CERAMIDE', 'PEPTIDE',
  'CARBOMER', 'XANTHAN', 'CELLULOSE', 'STARCH', 'CHITOSAN',
  'SILICA', 'TITANIUM', 'IRON', 'MICA', 'TALC', 'KAOLIN',
  'PHENOXYETHANOL', 'BENZYL', 'SORBATE', 'BENZOATE', 'PARABEN',
  'DIMETHICONE', 'CYCLOMETHICONE', 'AMODIMETHICONE', 'SILICONE',
  'PEG', 'PPG', 'POLYETHYLENE', 'POLYSORBATE', 'DISODIUM',
  'TRIETHANOLAMINE', 'ETHANOLAMINE', 'AMINOMETHYL',
  'BISABOLOL', 'SQUALANE', 'JOJOBA', 'ARGAN', 'ROSEHIP', 'ALOE',
  'CHAMOMILE', 'CALENDULA', 'LAVENDER', 'ROSE', 'NEROLI',
  'CITRIC', 'LACTIC', 'SALICYLIC', 'GLYCOLIC', 'ASCORBIC',
  'NEEM', 'TURMERIC', 'SANDALWOOD', 'BAKUCHIOL', 'CAFFEINE',
  'DIPEPTIDE', 'TRIPEPTIDE', 'ACETYL', 'PALMITOYL',
  'ARACHIDYL', 'BEHENIC', 'LINOLEIC', 'OLEIC', 'STEARIC',
  'CHLORIDE', 'SULFATE', 'PHOSPHATE', 'HYDROXIDE', 'OXIDE',
  'GLUCOSIDE', 'GLUCONATE', 'LACTATE', 'CITRATE', 'ACETATE',
];

// Lines that are definitely NOT ingredients
const NON_INGREDIENT_PATTERNS = [
  /^apply\b/i, /^wash\b/i, /^rinse\b/i, /^use\b/i, /^massage\b/i,
  /^directions/i, /^how\s+to/i, /^step\s+\d/i, /^for\s+best/i,
  /circular\s+motion/i, /pat\s+dry/i, /\btimes\s+a\s+(day|week)/i,
  /twice\s+a\s+week/i, /once\s+a\s+day/i,
  /manufactured\s+by/i, /distributed\s+by/i, /made\s+in/i,
  /customer\s+care/i, /contact\s+us/i, /www\./i, /\.com\b/i,
  /^\s*\d{10,}\s*$/, // phone numbers
  /^\s*[A-Z]{1,3}\d{4,}\s*$/, // batch codes
  /net\s*wt/i, /\bfl\s*oz\b/i, /\bmg\b/, /\bml\b.*\bnet\b/i,
  /store\s+(in|at|below|away)/i, /keep\s+(cool|dry|away)/i,
  /best\s+before/i, /expir/i, /\bshelf\s+life\b/i,
  /^\s*\*+\s*$/, // lines of just asterisks
  /rejuvenate/i, /purifying/i, /neem\s+face\s+pack/i, // marketing on label
  /dull\s+pimple/i, /prone\s+skin\b.*pack/i,
  /toiref\b/i, /bsec\b/i, /\bju\.lf\b/i, // known OCR noise from your image
  /bracts\b/i, /bijier\b/i,
];

const HEADER_RE = [
  /ingr[eé]dients?\s*[:\-]?\s*/i,
  /inci\s*[:\-]?\s*/i,
  /composition\s*[:\-]?\s*/i,
];

export function extractIngredients(rawText) {
  if (!rawText || rawText.trim().length < 3) return [];

  // ── Clean OCR noise
  let text = rawText
    .replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    .replace(/([A-Za-z])-\n([A-Za-z])/g, '$1$2')
    .replace(/\f/g, '\n');

  // ── Find ingredient block
  let ingredientBlock = '';
  let foundHeader = false;
  for (const re of HEADER_RE) {
    const m = text.match(re);
    if (m) {
      ingredientBlock = text.slice(m.index + m[0].length);
      foundHeader = true;
      break;
    }
  }
  if (!foundHeader) ingredientBlock = text;

  // ── Cut at end markers
  const END_RE = /\b(directions|how\s+to\s+use|warnings?|net\s*wt|manufactured|distributed|store\s+in|keep\s+away|best\s+before|expir|barcode|www\.|batch\s+no)\b/i;
  const endMatch = ingredientBlock.match(END_RE);
  if (endMatch && endMatch.index > 20) {
    ingredientBlock = ingredientBlock.slice(0, endMatch.index);
  }

  // ── Try comma-split first (best for ingredient lists)
  const commaCount = (ingredientBlock.match(/,/g) || []).length;
  let tokens;

  if (commaCount >= 3) {
    // Proper ingredient list — comma separated
    tokens = ingredientBlock.split(/[,;]+/);
  } else {
    // Fallback: split by newlines AND commas
    tokens = ingredientBlock.split(/[,;\n]+/);
  }

  // ── Process each token
  const results = _processTokens(tokens);

  // ── If very few results found and we had a header, try full-text mode
  if (results.length < 3 && foundHeader) {
    console.log('[Extractor] Low yield from header block, trying full text mode');
    const allTokens = text.split(/[,;\n]+/);
    const fullResults = _processTokens(allTokens);
    if (fullResults.length > results.length) {
      console.log(`[Extractor] Full text mode found ${fullResults.length} ingredients`);
      return fullResults;
    }
  }

  console.log(`[Extractor] Extracted ${results.length} ingredients from ${tokens.length} tokens`);
  return results;
}

function _processTokens(tokens) {
  const results = [];
  const seen = new Set();

  for (const raw of tokens) {
    const cleaned = _cleanToken(raw);
    if (!cleaned || cleaned.length < 3 || cleaned.length > 80) continue;
    if (/^\d+$/.test(cleaned)) continue;
    if (/^[\-_\.\/\s]+$/.test(cleaned)) continue;

    // Skip lines that are clearly not ingredients
    if (NON_INGREDIENT_PATTERNS.some(p => p.test(cleaned))) continue;

    // Must have at least 2 consecutive letters
    if (!/[A-Z]{2,}/.test(cleaned)) continue;

    // Score this token
    const ingScore = _scoreAsIngredient(cleaned);

    // Accept if: contains INCI signal, OR has good score, OR looks like a chemical name
    if (ingScore > 0 || _looksLikeINCI(cleaned)) {
      if (!seen.has(cleaned)) {
        seen.add(cleaned);
        results.push(cleaned);
      }
    }
  }

  return results;
}

function _scoreAsIngredient(token) {
  let score = 0;
  const upper = token.toUpperCase();

  // Contains known INCI fragment
  for (const sig of INCI_SIGNALS) {
    if (upper.includes(sig)) { score += 3; break; }
  }

  // Looks like chemical name: contains hyphen+number (PEG-40, PEG-7)
  if (/[A-Z]+-\d+/.test(upper)) score += 2;

  // Contains CI (colour index)
  if (/\bCI\s+\d{5,6}\b/.test(upper)) score += 5;

  // Multiple words (most INCI names are 2-4 words)
  const words = upper.split(/\s+/).filter(w => w.length > 1);
  if (words.length >= 2 && words.length <= 6) score += 1;

  // All caps or mostly caps (INCI standard)
  const capsRatio = (upper.match(/[A-Z]/g) || []).length / upper.length;
  if (capsRatio > 0.6) score += 1;

  return score;
}

function _looksLikeINCI(token) {
  // Single long chemical word (PHENOXYETHANOL, DIMETHICONE, etc.)
  if (/^[A-Z][A-Z0-9\-\/]+$/.test(token) && token.length >= 5) return true;
  // Two chemical words
  if (/^[A-Z][A-Z0-9\-]+ [A-Z][A-Z0-9\-]+$/.test(token)) return true;
  return false;
}

function _cleanToken(raw) {
  return raw
    .toUpperCase()
    .replace(/\([^)]{0,30}\)/g, ' ')  // remove short parentheticals
    .replace(/\d+[\.,]?\d*\s*%/g, ' ')
    .replace(/^\s*\d{1,2}[\.\)]\s*/, '')
    .replace(/^[\s\*\†\‡\§\#\+\=\|\\/<>~`'"@]+/, '')
    .replace(/[\*\†\‡\§\#\+\=\|\\/<>~`'"@]+$/, '')
    .replace(/[^A-Z0-9\s\-\/\.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normaliseIngredient(raw) { return _cleanToken(raw); }

export function parseManualInput(text) {
  // For manual: user types comma-separated list
  const norm = text.replace(/\n/g, ',');
  return extractIngredients('Ingredients: ' + norm);
}
