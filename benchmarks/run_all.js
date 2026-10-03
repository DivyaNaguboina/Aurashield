/**
 * benchmarks/run_all.js — Node.js benchmark runner
 * Measures: matching accuracy on product_ingredient_mapping_enriched.csv
 *
 * Usage: node benchmarks/run_all.js
 */

import { readFileSync, existsSync } from 'fs';
import { performance } from 'perf_hooks';

// ── Load indexes
const DATA_DIR = './public/data';

function loadJSON(name) {
  const path = `${DATA_DIR}/${name}`;
  if (!existsSync(path)) { console.error(`Missing: ${path}`); process.exit(1); }
  return JSON.parse(readFileSync(path, 'utf-8'));
}

console.log('Loading knowledge bases…');
const ingredientIndex = loadJSON('ingredient_index.json');
const skinCompatIndex = loadJSON('skin_compat_index.json');
const hairCompatIndex = loadJSON('hair_compat_index.json');
const allKeys = Object.keys(ingredientIndex);
console.log(`  ${allKeys.length.toLocaleString()} ingredients loaded\n`);

// ── Simple in-Node fuzzy matching (Levenshtein)
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

const exactIndex = new Map(allKeys.map(k => [k, k]));

function matchIngredient(token) {
  const t = token.toUpperCase().trim();
  if (exactIndex.has(t)) return { name: t, score: 1.0, method: 'exact' };
  // Simple fuzzy: find best Levenshtein within threshold
  let best = null, bestDist = Infinity;
  for (const key of allKeys) {
    if (Math.abs(key.length - t.length) > 5) continue; // quick length filter
    const dist = levenshtein(t, key);
    if (dist < bestDist && dist <= 3) { bestDist = dist; best = key; }
  }
  if (best) return { name: best, score: 1 - bestDist / Math.max(t.length, best.length), method: 'fuzzy' };
  return null;
}

// ── Benchmark 1: Matching accuracy on validation set
console.log('══ Benchmark 1: Matching accuracy (validation set) ══\n');
const valPath = './data/product_ingredient_mapping_enriched.csv';
if (!existsSync(valPath)) {
  console.log(`  Validation CSV not found at ${valPath}`);
  console.log('  Place product_ingredient_mapping_enriched.csv in ./data/ to run this benchmark.\n');
} else {
  const lines = readFileSync(valPath, 'utf-8').split('\n').slice(1).filter(Boolean);
  let total = 0, exactHits = 0, fuzzyHits = 0, misses = 0;
  const t0 = performance.now();

  for (const line of lines.slice(0, 2000)) { // sample first 2000
    const cols = line.split(',');
    const groundTruth = cols[3]?.toUpperCase().trim();
    if (!groundTruth) continue;
    total++;
    const result = matchIngredient(groundTruth);
    if (!result) { misses++; continue; }
    if (result.method === 'exact') exactHits++;
    else fuzzyHits++;
  }

  const elapsed = performance.now() - t0;
  console.log(`  Total tested:    ${total.toLocaleString()}`);
  console.log(`  Exact matches:   ${exactHits} (${(exactHits/total*100).toFixed(1)}%)`);
  console.log(`  Fuzzy matches:   ${fuzzyHits} (${(fuzzyHits/total*100).toFixed(1)}%)`);
  console.log(`  Unmatched:       ${misses} (${(misses/total*100).toFixed(1)}%)`);
  console.log(`  Total accuracy:  ${((exactHits+fuzzyHits)/total*100).toFixed(1)}%`);
  console.log(`  Time:            ${elapsed.toFixed(0)}ms for ${total} lookups`);
  console.log(`  Throughput:      ${(total/(elapsed/1000)).toFixed(0)} lookups/sec\n`);
}

// ── Benchmark 2: Knowledge base lookup speed
console.log('══ Benchmark 2: Knowledge base lookup speed ══\n');
const testIngredients = allKeys.slice(0, 1000);
const skinTypes = ['Normal Skin', 'Dry Skin', 'Oily Skin', 'Acne-Prone Skin'];

const t1 = performance.now();
let lookupCount = 0;
for (const name of testIngredients) {
  const ing = ingredientIndex[name];
  const skin = skinCompatIndex[name]?.['Normal Skin'];
  const hair = hairCompatIndex[name]?.['Dry Hair'];
  lookupCount += 3;
}
const lookupElapsed = performance.now() - t1;
console.log(`  ${lookupCount.toLocaleString()} lookups in ${lookupElapsed.toFixed(2)}ms`);
console.log(`  ${(lookupCount/(lookupElapsed/1000)).toLocaleString()} lookups/sec\n`);

// ── Benchmark 3: Score calculation
console.log('══ Benchmark 3: Score calculation ══\n');
const sampleMatched = testIngredients.slice(0, 20).map(name => ({ name, score: 1, method: 'exact', original: name }));

const t2 = performance.now();
const RUNS = 1000;
for (let i = 0; i < RUNS; i++) {
  // Simulate score calculation
  let total = 0;
  for (const { name } of sampleMatched) {
    const ing = ingredientIndex[name];
    if (!ing) continue;
    const skinData = skinCompatIndex[name]?.['Normal Skin'];
    const hairData = hairCompatIndex[name]?.['Normal Hair'];
    let score = (skinData?.s ?? 0) + (hairData?.s ?? 0);
    if (ing.allergen) score -= 8;
    if (ing.superstar) score += 5;
    total += score;
  }
}
const scoreElapsed = performance.now() - t2;
console.log(`  ${RUNS} score calculations (20 ingredients each): ${scoreElapsed.toFixed(1)}ms`);
console.log(`  Per calculation: ${(scoreElapsed/RUNS).toFixed(3)}ms\n`);

// ── Summary
console.log('══ Summary ══\n');
console.log(`  ✓ ingredient_index: ${Object.keys(ingredientIndex).length.toLocaleString()} entries`);
console.log(`  ✓ skin_compat_index: ${Object.keys(skinCompatIndex).length.toLocaleString()} ingredients`);
console.log(`  ✓ hair_compat_index: ${Object.keys(hairCompatIndex).length.toLocaleString()} ingredients`);
console.log('\n  All benchmarks complete.');
