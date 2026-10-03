/**
 * compatibilityEngine.js — v5.1 Fixed
 * - Hair products get hair-specific metrics (no acne/hydration for hair)
 * - Routines are fully separated: skin AM/PM vs hair wash-day/treatment
 * - Metrics are computed from actual matched ingredient data, not constants
 * - Results vary meaningfully between different ingredient lists
 */

const HEALTH_HAZARDS = [
  { key: 'svhc_ed',     label: 'Endocrine Disruptor (SVHC)',       severity: 'CRITICAL', penalty: -25, description: 'Interferes with hormonal endocrine system pathways.' },
  { key: 'svhc',        label: 'Substance of Very High Concern',    severity: 'HIGH',     penalty: -20, description: 'EU REACH designated carcinogen, mutagen, or bioaccumulative substance.' },
  { key: 'allergen',    label: 'Known Allergen',                     severity: 'HIGH',     penalty: -12, description: 'EU-regulated fragrance allergen or known sensitiser.' },
  { key: 'irritant',    label: 'Skin/Scalp Irritant',                severity: 'MEDIUM',   penalty: -8,  description: 'Clinically verified irritant causing contact dermatitis or scalp inflammation.' },
  { key: 'comedogenic', label: 'Comedogenic',                        severity: 'MEDIUM',   penalty: -6,  description: 'Clogs pores and promotes retention hyperkeratosis.' },
];

function _getSafeAlternative(ingName, functionText) {
  const name = ingName.toLowerCase();
  const func = (functionText || '').toLowerCase();

  if (func.includes('preservative') || name.includes('paraben') || name.includes('benzoate') || name.includes('thiazolinone'))
    return { name: 'Phenoxyethanol / Ethylhexylglycerin', note: 'Broad-spectrum clean preservation with excellent skin and scalp tolerance.' };
  if (func.includes('surfactant') || func.includes('cleansing') || name.includes('sulfate') || name.includes('sulphate'))
    return { name: 'Coco-Glucoside / Lauryl Glucoside', note: 'Ultra-mild plant-derived glucosides that cleanse without stripping natural oils or disrupting scalp barrier.' };
  if (name.includes('myristate') || name.includes('palmitate'))
    return { name: 'Squalane or Caprylic/Capric Triglyceride', note: 'Lightweight, non-comedogenic biomimetic emollients.' };
  if (func.includes('fragrance') || func.includes('perfume') || name.includes('parfum') || name.includes('limonene') || name.includes('linalool'))
    return { name: 'Centella Asiatica Extract (Fragrance-Free)', note: 'Eliminates volatile aromatic triggers — replaced with a safe, biocompatible soothing compound.' };
  if (name.includes('hydroxide') || name.includes('aminomethyl'))
    return { name: 'Citric Acid / Lactic Acid Buffer', note: 'Gentle organic AHA buffer to normalise product pH.' };
  if (func.includes('colorant') || func.includes('pigment') || name.includes('ci '))
    return { name: 'Uncoloured Product Base', note: 'Removing optional dyes eliminates vascular flushing and reactivity risks.' };
  return { name: 'Squalane (Biomimetic Pure Lipid)', note: 'Universal, non-reactive skin-identical emollient for all profiles.' };
}

function _profileAdjustment(ing, userProfile, skinType, hairType, isSkin) {
  if (!userProfile) return { delta: 0, reasons: [] };
  const { concerns = [], allergies = [], sensitivityLevel = 'normal' } = userProfile;
  let delta = 0;
  const reasons = [];
  const ingDesc = (ing.desc || '').toLowerCase();
  const ingFunc = (ing.function || '').toLowerCase();

  // Sensitivity penalty applies to both skin and hair/scalp
  if (sensitivityLevel === 'high' && (ing.allergen || ing.irritant)) {
    delta -= 10;
    reasons.push(isSkin ? 'High skin sensitivity: allergen/irritant penalty applied.' : 'High scalp reactivity: allergen/irritant penalty applied.');
  }

  if (isSkin) {
    if (concerns.includes('Acne and Breakouts')) {
      if (ing.comedogenic) { delta -= 12; reasons.push('Comedogenic — clogs pores for acne-prone skin.'); }
      if (ingDesc.includes('salicyl') || ingDesc.includes('bha')) { delta += 6; reasons.push('BHA — effective for oil-gland clearance on acne-prone skin.'); }
    }
    if (concerns.includes('Wrinkles and Fine Lines') && (ingDesc.includes('retinol') || ingDesc.includes('peptide'))) {
      delta += 6; reasons.push('Supports collagen synthesis — beneficial for anti-ageing concerns.');
    }
    if (concerns.includes('Redness') && (ing.allergen || ing.irritant)) {
      delta -= 12; reasons.push('Vascular reactivity risk — may trigger superficial capillary widening.');
    }
    if (concerns.includes('Dehydration') && (ingFunc.includes('humectant') || ingDesc.includes('hyaluronic'))) {
      delta += 5; reasons.push('Humectant — directly addresses dehydration concern.');
    }
  } else {
    // Hair-specific profile adjustments
    if (concerns.includes('Dandruff') && (ingDesc.includes('zinc') || ingDesc.includes('ketoconazole') || ingDesc.includes('piroctone'))) {
      delta += 7; reasons.push('Antifungal compound — targets scalp Malassezia for dandruff control.');
    }
    if (concerns.includes('Hair Fall') && (ingDesc.includes('biotin') || ingDesc.includes('caffeine') || ingDesc.includes('minoxidil') || ingDesc.includes('peptide'))) {
      delta += 6; reasons.push('Active that supports hair follicle anchoring and scalp circulation.');
    }
    if (concerns.includes('Frizz') && (ingFunc.includes('conditioning') || ingDesc.includes('silicone') || ingDesc.includes('dimethicone'))) {
      delta += 4; reasons.push('Conditioning agent — smooths cuticle for frizz control.');
    }
    if (concerns.includes('Dryness') && (ingFunc.includes('emollient') || ingFunc.includes('humectant') || ingDesc.includes('argan') || ingDesc.includes('jojoba'))) {
      delta += 5; reasons.push('Emollient/humectant — addresses hair dryness and porosity.');
    }
    if (concerns.includes('Scalp Itchiness') && (ing.irritant || ing.allergen)) {
      delta -= 10; reasons.push('Irritant/allergen — likely to worsen scalp itchiness.');
    }
    if (concerns.includes('Breakage and Split Ends') && (ingDesc.includes('protein') || ingDesc.includes('keratin') || ingDesc.includes('amino acid'))) {
      delta += 6; reasons.push('Protein/keratin — strengthens hair shaft and reduces breakage.');
    }
  }

  // Check allergen collisions
  for (const allergy of allergies) {
    const al = allergy.toLowerCase();
    if ((al.includes('fragrance') || al.includes('parfum')) && ing.allergen) {
      delta -= 15; reasons.push('Direct allergen collision: fragrance compound flagged against your allergy profile.');
    }
    if (al.includes('paraben') && ingDesc.includes('paraben')) {
      delta -= 15; reasons.push('Direct allergen collision: paraben structure matches your allergy profile.');
    }
    if (al.includes('sulphate') && (ingDesc.includes('sulfate') || ingDesc.includes('sulphate'))) {
      delta -= 12; reasons.push('Direct allergen collision: sulphate compound matches your allergen profile.');
    }
    if (al.includes('silicone') && (ingDesc.includes('silicone') || ingDesc.includes('dimethicone'))) {
      delta -= 8; reasons.push('Silicone compound flagged against your allergen/sensitivity profile.');
    }
  }

  return { delta: Math.max(-25, Math.min(10, delta)), reasons };
}

function _analyzeInteractions(details) {
  const interactions = [];
  const names = details.map(i => i.name.toUpperCase());
  const hasNiacinamide = names.some(n => n.includes('NIACINAMIDE'));
  const hasZinc = names.some(n => n.includes('ZINC'));
  const hasRetinol = names.some(n => n.includes('RETINOL') || n.includes('RETINYL'));
  const hasAHA = names.some(n => n.includes('GLYCOLIC') || n.includes('SALICYLIC') || n.includes('LACTIC ACID'));
  const hasVitC = names.some(n => n.includes('ASCORBIC') || n.includes('VITAMIN C'));
  const hasPeptides = names.some(n => n.includes('PEPTIDE') || n.includes('PALMITOYL'));
  const hasKeratin = names.some(n => n.includes('KERATIN') || n.includes('HYDROLYZED'));
  const hasProtein = names.some(n => n.includes('PROTEIN') || n.includes('AMINO ACID'));

  if (hasNiacinamide && hasZinc)
    interactions.push({ type: 'SYNERGY', label: 'Niacinamide + Zinc PCA', desc: 'Highly effective pairing for pore minimisation and sebum control.' });
  if (hasRetinol && hasAHA)
    interactions.push({ type: 'CONTRAINDICATION', label: 'Retinol + AHA/BHA Conflict', desc: 'Risk of over-exfoliation. Avoid using simultaneously — alternate AM/PM or separate by days.' });
  if (hasVitC && hasRetinol)
    interactions.push({ type: 'CAUTION', label: 'Vitamin C + Retinol', desc: 'Can cause irritation when layered together. Use Vitamin C in the morning, Retinol at night.' });
  if (hasPeptides && hasAHA)
    interactions.push({ type: 'CAUTION', label: 'Peptides + AHAs', desc: 'Acidic pH of AHAs can deactivate peptides. Apply separately with a gap.' });
  if (hasKeratin && hasProtein)
    interactions.push({ type: 'SYNERGY', label: 'Keratin + Protein Complex', desc: 'Complementary strengthening system — rebuilds hair shaft structure and reduces breakage.' });

  return interactions;
}

/**
 * Build routine — fully separated for skin vs hair
 */
function _buildRoutine(score, avoidCount, isSkin, details, userProfile, skinType, hairType) {
  const hasDandruff = (userProfile?.concerns || []).includes('Dandruff');
  const hasHairFall = (userProfile?.concerns || []).includes('Hair Fall');
  const hasDryHair  = (userProfile?.concerns || []).includes('Dryness') || hairType?.includes('Dry');
  const hasCurly    = hairType?.includes('Curly');
  const isAcne      = skinType?.includes('Acne') || (userProfile?.concerns || []).includes('Acne and Breakouts');
  const isDry       = skinType?.includes('Dry') || (userProfile?.concerns || []).includes('Dehydration');
  const isAntiAge   = (userProfile?.concerns || []).includes('Wrinkles and Fine Lines');
  const isSensitive = skinType?.includes('Sensitive') || (userProfile?.sensitivityLevel === 'high');

  if (!isSkin) {
    // Hair routine
    if (score < 45 || avoidCount > 0) {
      return {
        washDay: [
          'Gentle sulphate-free clarifying shampoo',
          'Deep conditioning mask (5–10 min)',
          'Cold water final rinse to seal cuticle',
        ],
        treatment: [
          'Leave-in moisturising conditioner',
          'Scalp-safe lightweight hair oil (avoid roots if oily)',
        ]
      };
    }
    const washDay = ['Scalp-focused shampoo massage (2–3 min)'];
    if (hasDandruff) washDay.push('Antifungal scalp treatment (zinc or piroctone)');
    if (hasDryHair)  washDay.push('Moisturising conditioner — focus on mid-lengths to ends');
    else              washDay.push('Lightweight conditioner — mid-lengths to ends only');
    washDay.push('Cold or lukewarm rinse to close the hair cuticle');
    if (hasHairFall) washDay.push('Scalp serum with caffeine or peptides (post-wash)');

    const treatment = [];
    if (hasDryHair || hasCurly) treatment.push('Weekly deep conditioning or protein mask');
    treatment.push('Leave-in conditioner or detangler for daily moisture');
    if (hasCurly) treatment.push('Anti-frizz cream or curl-defining cream while damp');
    treatment.push('Heat protectant before any thermal styling');

    return { washDay, treatment };
  }

  // Skin routine
  if (score < 45 || avoidCount > 0) {
    return {
      morning: [
        'Gentle non-ionic hydrating cleanser',
        'Fragrance-free ceramide moisturiser',
        'Broad-spectrum SPF 50 mineral sunscreen',
      ],
      night: [
        'Gentle non-ionic hydrating cleanser',
        'Barrier recovery occlusive cream',
      ]
    };
  }

  const morning = ['Gentle gel or foam cleanser'];
  if (isAcne)      morning.push('Niacinamide + Zinc serum (oil control + pore tightening)');
  else if (isDry)  morning.push('Hyaluronic acid serum on damp skin');
  else              morning.push('Antioxidant serum (Vitamin C or niacinamide)');
  if (isSensitive) morning.push('Fragrance-free ceramide moisturiser');
  else              morning.push('Lightweight emulsion moisturiser');
  morning.push('Broad-spectrum SPF 50 sunscreen (last step)');

  const night = ['Gentle cleanser (or double-cleanse if wearing SPF/makeup)'];
  if (isAntiAge)   night.push('Retinol or peptide serum (start 2x/week, increase gradually)');
  if (isAcne)      night.push('BHA (salicylic acid) exfoliant 2–3x per week');
  if (isDry)       night.push('Rich ceramide or squalane moisturiser');
  else              night.push('Medium-weight barrier repair cream');
  if (isSensitive) night.push('Centella or oat extract calming cream as final layer');

  return { morning, night };
}

/**
 * Compute hair-specific metrics from actual matched ingredient data
 */
function _computeHairMetrics(details, hairType, userProfile, score) {
  const names = details.map(d => d.name.toUpperCase());
  const descs = details.map(d => (d.desc || '').toLowerCase());

  // Scalp Health Score: penalise irritants/allergens, reward antifungals/soothing agents
  const irritantCount    = details.filter(d => d.hazards?.some(h => h.key === 'irritant')).length;
  const allergenCount    = details.filter(d => d.flags?.allergen).length;
  const antifungalCount  = descs.filter(d => d.includes('zinc') || d.includes('ketoconazole') || d.includes('piroctone')).length;
  const scalpHealth = Math.min(100, Math.max(20, Math.round(score * 0.6 + antifungalCount * 12 - irritantCount * 15 - allergenCount * 10 + 20)));

  // Hair Strength Score: protein, keratin, amino acids
  const proteinCount = descs.filter(d => d.includes('protein') || d.includes('keratin') || d.includes('amino')).length;
  const hairStrength = Math.min(100, Math.max(15, Math.round(30 + proteinCount * 20 + score * 0.3)));

  // Moisture Balance: humectants, emollients
  const humectantCount = names.filter(n => n.includes('GLYCERIN') || n.includes('PANTHENOL') || n.includes('HYALURONIC')).length;
  const emollientCount = descs.filter(d => d.includes('emollient') || d.includes('argan') || d.includes('jojoba') || d.includes('oil')).length;
  const moisture = Math.min(100, Math.max(20, Math.round(25 + humectantCount * 18 + emollientCount * 10 + score * 0.2)));

  // Scalp Allergen Risk
  const sensitivityBonus = userProfile?.sensitivityLevel === 'high' ? 25 : userProfile?.sensitivityLevel === 'low' ? 5 : 10;
  const allergenRisk = Math.min(95, Math.max(5, Math.round(allergenCount * 30 + irritantCount * 15 + sensitivityBonus)));

  return {
    scalpHealth,
    hairStrength,
    moisture,
    allergenRisk,
  };
}

/**
 * Compute skin-specific metrics from actual matched ingredient data
 */
function _computeSkinMetrics(details, skinType, userProfile, score) {
  const isAcneProne = skinType?.includes('Acne') || skinType?.includes('Oily') || (userProfile?.concerns || []).includes('Acne and Breakouts');
  const comedogenicCount = details.filter(d => d.flags?.comedogenic).length;
  const allergenCount    = details.filter(d => d.flags?.allergen).length;
  const criticalCount    = details.filter(d => d.hazards?.some(h => h.severity === 'CRITICAL')).length;
  const names = details.map(d => d.name.toUpperCase());
  const descs = details.map(d => (d.desc || '').toLowerCase());

  // Safety Score
  const safetyScore = Math.max(20, Math.round(100 - criticalCount * 30 - details.filter(d => d.hazards?.length > 0).length * 5));

  // Acne Risk — based on actual comedogenic/irritant count
  const acneRisk = Math.min(95, Math.max(5, Math.round(comedogenicCount * 28 + (isAcneProne ? 20 : 5) + allergenCount * 5)));

  // Hydration Score — based on actual humectants/emollients
  const humectantCount = names.filter(n => n.includes('GLYCERIN') || n.includes('HYALURONIC') || n.includes('PANTHENOL') || n.includes('SORBITOL')).length;
  const emollientCount = descs.filter(d => d.includes('emollient') || d.includes('occlusive') || d.includes('squalane') || d.includes('ceramide')).length;
  const hydrationScore = Math.min(100, Math.max(15, Math.round(20 + humectantCount * 22 + emollientCount * 12 + score * 0.25)));

  // Allergen Risk
  const sensitivityBonus = userProfile?.sensitivityLevel === 'high' ? 25 : userProfile?.sensitivityLevel === 'low' ? 5 : 10;
  const allergenRisk = Math.min(95, Math.max(5, Math.round(allergenCount * 32 + sensitivityBonus)));

  return { safetyScore, acneRisk, hydrationScore, allergenRisk };
}

export function calculateProductScore(matchedIngredients, skinType, hairType, productType, indexes, userProfile = null) {
  const { ingredientIndex, skinCompatIndex, hairCompatIndex } = indexes;
  const isSkin = productType === 'skin';

  const details = [];
  let weightedScoreSum = 0;
  let weightSum = 0;
  let runningConfidenceSum = 0;

  const reportedReactions = JSON.parse(localStorage.getItem('auroshield_reaction_history') || '[]');

  for (const { name, score: matchScore, method, original } of matchedIngredients) {
    const ing = ingredientIndex[name];
    if (!ing) continue;

    const baseConfidence = method === 'exact' ? 100 : method === 'normalised' ? 90 : (matchScore || 0.8) * 100;
    runningConfidenceSum += baseConfidence;

    const skinData = skinCompatIndex[name]?.[skinType] ?? null;
    const hairData = hairCompatIndex[name]?.[hairType] ?? null;

    // Weight hair data heavily for hair products, skin data for skin products
    let baseScore = isSkin
      ? (skinData?.s ?? 0) * 0.85 + (hairData?.s ?? 0) * 0.15
      : (hairData?.s ?? 0) * 0.85 + (skinData?.s ?? 0) * 0.15;

    const hazardsFound = [];
    const personalConflicts = [];

    // Personal reaction history
    if (reportedReactions.includes(name.toUpperCase())) {
      baseScore -= 30;
      personalConflicts.push('Historical adverse reaction: you previously marked this ingredient as reactive.');
    }

    // Pregnancy safety (skin only — hair products are generally not absorbed systemically)
    if (isSkin && userProfile?.isPregnant) {
      const lowerName = name.toLowerCase();
      if (lowerName.includes('retinol') || lowerName.includes('retinyl') || lowerName.includes('salicylic acid') || lowerName.includes('hydroquinone')) {
        baseScore -= 25;
        personalConflicts.push('Pregnancy safety flag: this ingredient is not recommended during gestation or nursing.');
      }
    }

    const profileAdj = _profileAdjustment(ing, userProfile, skinType, hairType, isSkin);
    baseScore += profileAdj.delta;
    if (profileAdj.reasons.length) personalConflicts.push(...profileAdj.reasons);

    for (const hazard of HEALTH_HAZARDS) {
      if (ing[hazard.key]) {
        let penalty = hazard.penalty;
        if (hazard.key === 'comedogenic' && isSkin && (skinType?.includes('Oily') || skinType?.includes('Acne') || (userProfile?.concerns || []).includes('Acne and Breakouts'))) {
          penalty = Math.round(penalty * 1.5);
        }
        baseScore += penalty;
        hazardsFound.push({ ...hazard, penalty });
      }
    }

    const finalScore  = Math.round(Math.max(-35, Math.min(25, baseScore)));
    // Use the correct compat label for the product type
    const compatLabel = isSkin ? (skinData?.l ?? 'Neutral') : (hairData?.l ?? 'Neutral');
    const weight = finalScore < 0 ? 2.5 : 1.0;
    weightedScoreSum += finalScore * weight;
    weightSum += weight;

    details.push({
      name,
      original: original || name,
      matchScore,
      matchMethod: method,
      score: finalScore,
      risk: ing.risk || 'LOW',
      compatLabel,
      function: ing.function || 'Cosmetic Adjuvant',
      desc: ing.desc || 'Formulation constituent.',
      hazards: hazardsFound,
      personalConflicts,
      alternative: (finalScore < 0 || compatLabel === 'Avoid') ? _getSafeAlternative(name, ing.function || '') : null,
      flags: {
        allergen:    !!ing.allergen,
        irritant:    !!ing.irritant,
        svhc:        !!ing.svhc,
        comedogenic: !!ing.comedogenic,
        superstar:   finalScore >= 10,
      },
    });
  }

  const matchedCount = details.length;
  const rawMean = weightSum > 0 ? weightedScoreSum / weightSum : 0;
  const score100 = Math.round(Math.max(0, Math.min(100, ((rawMean + 30) / 55) * 100)));

  const avoidIngredients   = details.filter(d => d.compatLabel === 'Avoid' || d.score <= -6 || d.personalConflicts.length > 0);
  const concerns           = details.filter(d => d.score < 0).sort((a, b) => a.score - b.score);
  const beneficial         = details.filter(d => d.score >= 5).sort((a, b) => b.score - a.score);
  const hasHazards         = details.filter(d => d.hazards.length > 0);
  const criticalHazardCount = details.filter(d => d.hazards.some(h => h.severity === 'CRITICAL')).length;

  // Compute product-type-appropriate metrics from actual ingredient data
  const metrics = isSkin
    ? _computeSkinMetrics(details, skinType, userProfile, score100)
    : _computeHairMetrics(details, hairType, userProfile, score100);

  const routine = _buildRoutine(score100, avoidIngredients.length, isSkin, details, userProfile, skinType, hairType);

  return {
    score: score100,
    confidenceScore: matchedCount > 0 ? Math.round(runningConfidenceSum / matchedCount) : 95,
    verdict: score100 >= 75 ? 'Safe to Use' : score100 >= 45 ? 'Patch Test First' : 'Not Recommended',
    metrics,
    routine,
    interactions: _analyzeInteractions(details),
    details,
    concerns,
    beneficial,
    hasHazards,
    avoidIngredients,
    riskBreakdown: {
      HIGH:   details.filter(d => d.risk === 'HIGH').length,
      MEDIUM: details.filter(d => d.risk === 'MEDIUM').length,
      LOW:    details.filter(d => d.risk === 'LOW').length,
    },
    flagSummary: {
      allergens:   details.filter(d => d.flags.allergen).map(d => d.name),
      comedogenic: details.filter(d => d.flags.comedogenic).map(d => d.name),
      svhc:        details.filter(d => d.flags.svhc).map(d => d.name),
    },
    totalDetected: matchedIngredients.length,
    totalMatched:  matchedCount,
    skinType,
    hairType,
    productType,
    criticalHazardCount,
    userProfile,
    safetyStatus: _getSafetyStatus(score100, criticalHazardCount, avoidIngredients.length, isSkin),
  };
}

function _getSafetyStatus(score, criticalCount, avoidCount, isSkin) {
  if (criticalCount > 0) return { level: 'DANGER',  color: 'var(--red)',    message: isSkin ? 'Critical toxicity detected. Do not apply.' : 'Critical ingredient detected. Do not use on scalp/hair.' };
  if (avoidCount >= 1)   return { level: 'CAUTION', color: 'var(--yellow)', message: isSkin ? 'Contains incompatible compounds for your skin profile.' : 'Contains compounds incompatible with your hair/scalp profile.' };
  return                        { level: 'SAFE',    color: 'var(--green)',  message: isSkin ? 'Formulation is safe for your skin profile.' : 'Formulation is compatible with your hair and scalp profile.' };
}
