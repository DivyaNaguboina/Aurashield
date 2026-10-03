/**
 * reportGenerator.js — Rule-based recommendation text from report data
 */

/**
 * Generate a full recommendation string for a profile + report
 */
export function generateRecommendation(report) {
  const { score, skinType, hairType, flagSummary, riskBreakdown, concerns } = report;

  const lines = [];

  // ── Overall verdict
  if (score >= 85) {
    lines.push(`This product looks great for ${skinType} and ${hairType}. The formulation is well-suited to your profile with mostly beneficial ingredients.`);
  } else if (score >= 70) {
    lines.push(`This product is generally suitable for ${skinType} and ${hairType}. Most ingredients are compatible with your profile.`);
  } else if (score >= 50) {
    lines.push(`This product has a mixed profile for ${skinType} and ${hairType}. Some ingredients may be less than ideal.`);
  } else if (score >= 30) {
    lines.push(`This product is not recommended for ${skinType} and ${hairType}. Several ingredients have poor compatibility with your profile.`);
  } else {
    lines.push(`Avoid this product if you have ${skinType} and ${hairType}. Multiple high-concern ingredients detected.`);
  }

  // ── Specific warnings
  if (flagSummary.svhc.length > 0) {
    lines.push(`⚠️ SVHC alert: ${flagSummary.svhc.slice(0, 3).join(', ')} — Substances of Very High Concern detected.`);
  }
  if (flagSummary.allergens.length > 0) {
    lines.push(`🚨 Allergen warning: Contains ${flagSummary.allergens.slice(0, 4).join(', ')}.`);
  }
  if (flagSummary.irritants.length > 0) {
    lines.push(`⚡ Irritants present: ${flagSummary.irritants.slice(0, 3).join(', ')} may cause skin reactions.`);
  }
  if (flagSummary.comedogenic.length > 0 && skinType === 'Acne-Prone Skin') {
    lines.push(`🔴 Comedogenic ingredients detected — may clog pores: ${flagSummary.comedogenic.slice(0, 3).join(', ')}.`);
  }

  // ── Positive highlights
  if (flagSummary.superstar.length > 0) {
    lines.push(`⭐ Hero ingredients: ${flagSummary.superstar.slice(0, 4).join(', ')} — top-rated for cosmetic efficacy.`);
  }

  // ── Risk summary
  if (riskBreakdown.HIGH > 0) {
    lines.push(`${riskBreakdown.HIGH} HIGH-risk ingredient${riskBreakdown.HIGH > 1 ? 's' : ''} identified — review before regular use.`);
  }

  return lines.join(' ');
}

/**
 * Short one-line summary for card header
 */
export function generateSummaryLine(report) {
  const { score, totalMatched, totalDetected } = report;
  return `${totalMatched} of ${totalDetected} ingredients analysed · Score ${score}/100`;
}

/**
 * Severity tag for individual ingredient
 */
export function getIngredientTag(ing) {
  if (ing.flags.svhc_ed)    return { label: 'SVHC-ED',     color: '#f87171', bg: '#450a0a' };
  if (ing.flags.svhc)       return { label: 'SVHC',        color: '#f97316', bg: '#431407' };
  if (ing.flags.allergen)   return { label: 'Allergen',    color: '#fbbf24', bg: '#422006' };
  if (ing.flags.irritant)   return { label: 'Irritant',    color: '#fb923c', bg: '#431407' };
  if (ing.flags.comedogenic)return { label: 'Comedogenic', color: '#a78bfa', bg: '#2e1065' };
  if (ing.flags.superstar)  return { label: '⭐ Hero',     color: '#34d399', bg: '#064e3b' };
  if (ing.flags.goodie)     return { label: 'Goodie',      color: '#60a5fa', bg: '#1e3a5f' };
  if (ing.flags.beneficial) return { label: 'Beneficial',  color: '#93c5fd', bg: '#1e3a5f' };
  return null;
}
