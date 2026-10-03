/**
 * geminiAnalysis.js — AI ingredient analysis via OpenRouter
 * Fixed: Added automatic 5-second connection abort guards to prevent UI freezing.
 */

function getKey() {
  return (
    window.__OR_KEY__ ||
    sessionStorage.getItem('auroshield_or_key') ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_OPENROUTER_API_KEY) ||
    ''
  );
}

const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
const TEXT_MODELS = [
  'openrouter/free', // Uses the universal free endpoint to ensure high availability
  'meta-llama/llama-3.1-8b-instruct:free',
  'mistralai/mistral-7b-instruct:free',
];

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function callOR(prompt, maxTokens = 1500) {
  const key = getKey();
  if (!key || key.includes('PASTE_YOUR')) return '';

  for (const model of TEXT_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      // Create a strict 5-second timeout controller to guarantee the UI moves forward
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const res = await fetch(ENDPOINT, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
            'HTTP-Referer': 'https://auroshield.app',
            'X-Title': 'AuroShield',
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: maxTokens,
            temperature: 0.2,
          }),
        });
        
        clearTimeout(timeoutId);

        if (res.status === 429) { await sleep(1500); continue; }
        if (!res.ok) break;
        
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content || '';
        if (text) return text;
      } catch (err) {
        clearTimeout(timeoutId);
        console.warn(`[Timeout/Network Guard] Model ${model} skipped:`, err.name === 'AbortError' ? 'Timed out' : err.message);
        break; // Jump straight to next model fallback or fail safely
      }
    }
  }
  return '';
}

export async function batchAnalyseUnknowns(ingredients, userProfile, _unused, onProgress) {
  if (!ingredients.length) return [];
  const { skinType, hairType, productType, concerns, allergies, age, climate, sensitivityLevel } = userProfile;
  const isSkin = productType === 'skin';

  const profileCtx = isSkin
    ? `Skin type: ${skinType}. Concerns: ${(concerns||[]).join(', ')||'none'}. Allergies: ${(allergies||[]).join(', ')||'none'}. Age: ${age||'adult'}. Climate: ${climate||'temperate'}. Sensitivity: ${sensitivityLevel||'normal'}.`
    : `Hair type: ${hairType}. Concerns: ${(concerns||[]).join(', ')||'none'}. Allergies: ${(allergies||[]).join(', ')||'none'}. Sensitivity: ${sensitivityLevel||'normal'}.`;

  const list = ingredients.slice(0, 15).map((ing, i) => `${i+1}. "${ing}"`).join('\n');
  onProgress?.(0, ingredients.length);

  const prompt = `You are a cosmetic safety expert. Analyse these ingredients for a user.
User Profile: ${profileCtx}
Ingredients:
${list}

Return ONLY valid JSON (no markdown):
{"results":[{"ingredient":"NAME","found":true,"commonName":"familiar name","function":"primary function","safetyTier":"safe","safetyScore":85,"suitableForProfile":true,"profileReason":"why suitable/not","benefits":["benefit1"],"generalConcerns":[],"allergenRisk":"none","recommendation":"short advice","confidence":"high"}]}
safetyTier: safe|monitor|caution|avoid  safetyScore: 0-100`;

  try {
    const text = await callOR(prompt, 2000);
    if (!text) return [];
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0] || clean);
    onProgress?.(ingredients.length, ingredients.length);
    return (parsed.results || []).map(r => ({ ...r, source: 'openrouter-ai' }));
  } catch { return []; }
}

export async function getHolisticRecommendation(report, userProfile, _unused) {
  const { skinType, hairType, productType, concerns, allergies, sensitivityLevel } = userProfile;
  const isSkin = productType === 'skin';
  const concernsList = (report.concerns||[]).slice(0,5).map(d => `${d.name}: ${d.compatLabel}`).join('; ');
  const benefitList  = (report.beneficial||[]).slice(0,5).map(d => d.name).join(', ');

  const prompt = `You are a dermatologist-trained cosmetic advisor.
User: ${isSkin ? `Skin: ${skinType}` : `Hair: ${hairType}`}
Concerns: ${(concerns||[]).join(', ')||'none'} | Allergies: ${(allergies||[]).join(', ')||'none'} | Sensitivity: ${sensitivityLevel||'normal'}
Product Score: ${report.score}/100 — ${report.verdict}
Key concerns: ${concernsList||'none'} | Beneficial: ${benefitList||'none'}

Return ONLY valid JSON:
{"personalRecommendation":"2-3 sentence personalised recommendation","reasonsToUse":["reason1"],"reasonsForCaution":["caution1"],"nextStep":"one clear actionable step"}`;

  try {
    const text = await callOR(prompt, 800);
    if (!text) return null;
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0] || clean);
  } catch { return null; }
}

export async function analyseUnknownIngredient() { return null; }