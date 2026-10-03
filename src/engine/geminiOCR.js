/**
 * geminiOCR.js — Image scanning via OpenRouter free vision models
 * Uses openrouter/free to dynamically route to an online free vision engine.
 */

function getKey() {
  return (
    window.__OR_KEY__ ||
    sessionStorage.getItem('auroshield_or_key') ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_OPENROUTER_API_KEY) ||
    ''
  );
}

const PROMPT = `You are an expert cosmetic chemist. Extract ONLY the ingredients list from this cosmetic product label photo.

RULES:
1. Find the section labelled "Ingredients:", "INCI:", "Composition:" or similar
2. Extract EVERY ingredient — do not skip any
3. Return each ingredient in INCI format uppercase (AQUA, GLYCERIN, NIACINAMIDE etc.)
4. Fix OCR typos: "AQU4"→"AQUA", numbers replacing letters
5. Preserve PEG numbers, CI numbers, botanical names exactly
6. Ignore directions, warnings, net weight, addresses, batch codes
7. If no ingredients list is visible in the image, set found:false

Return ONLY valid JSON, no markdown, no explanation:
{"found":true,"ingredients":["AQUA","GLYCERIN","NIACINAMIDE"],"confidence":"high","notes":""}`;

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result.split(',')[1]);
    reader.onerror = () => reject(new Error('FileReader failed'));
    reader.readAsDataURL(file);
  });
}

function getMimeType(file) {
  const t = file.type || '';
  if (t.includes('png'))  return 'image/png';
  if (t.includes('webp')) return 'image/webp';
  return 'image/jpeg';
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Try OpenRouter with multiple free vision models
async function tryOpenRouter(base64, mimeType, apiKey) {
  const MODELS = [
    'openrouter/free',                              // Universal dynamic free router (Auto-matches Vision)
    'google/gemma-4-31b-it:free',                   // 2026 Free Vision Model Backup 1
    'google/gemma-4-26b-a4b-it:free',               // 2026 Free Vision Model Backup 2
    'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free' // 2026 Free Vision Model Backup 3
  ];

  for (const model of MODELS) {
    try {
      console.log(`[OCR] Trying model: ${model}`);
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://auroshield.app',
          'X-Title': 'AuroShield',
        },
        body: JSON.stringify({
          model,
          messages: [{
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
              { type: 'text', text: PROMPT }
            ]
          }],
          max_tokens: 2048,
          temperature: 0.1,
        }),
      });

      if (res.status === 429) { await sleep(2000); continue; }
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        const msg = e?.error?.message || '';
        console.warn(`[OCR] ${model} failed: ${msg}`);
        continue;
      }

      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content || '';
      if (text) {
        console.log(`[OCR] Success with ${model}`);
        return { text, model };
      }
    } catch (err) {
      console.warn(`[OCR] ${model} threw:`, err.message);
      continue;
    }
  }
  return null;
}

function parseIngredients(text) {
  try {
    const clean = text.replace(/```json|```/g, '').trim();
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : clean);

    if (parsed.found === false) {
      return { ingredients: [], confidence: 'none', notes: 'No ingredients list found in image' };
    }

    const ingredients = (parsed.ingredients || [])
      .map(i => String(i).toUpperCase().trim())
      .filter(i => i.length > 1 && !/^\d+$/.test(i));

    return {
      ingredients,
      confidence: parsed.confidence || 'high',
      notes: parsed.notes || ''
    };
  } catch {
    // Fallback: split by comma/newline if JSON structures crumble
    const lines = text.split(/[\n,]+/)
      .map(l => l.replace(/["[\]{}:]/g, '').trim().toUpperCase())
      .filter(l => l.length > 2 && !/^\d+$/.test(l) && !l.includes('INGREDIENT'));
    return { ingredients: lines, confidence: 'low', notes: 'fallback parse' };
  }
}

export async function extractIngredientsWithOpenRouter(imageFile, _unused, onProgress) {
  const apiKey = getKey();

  if (!apiKey || apiKey.includes('PASTE_YOUR') || apiKey.length < 10) {
    throw new Error('NO_KEY');
  }

  onProgress?.('Reading label image…');
  const base64   = await fileToBase64(imageFile);
  const mimeType = getMimeType(imageFile);

  onProgress?.('Scanning with AI vision…');
  const result = await tryOpenRouter(base64, mimeType, apiKey);

  if (!result?.text) {
    throw new Error('All vision models failed. Please check your OpenRouter key or use "Type Manually".');
  }

  onProgress?.('Processing ingredients…');
  const parsed = parseIngredients(result.text);

  if (parsed.ingredients.length === 0) {
    if (parsed.notes?.includes('No ingredients')) {
      throw new Error('No ingredients list found in the photo. Please ensure the ingredients section is clearly visible.');
    }
    throw new Error('Could not extract ingredients. Try a clearer photo or use "Type Manually".');
  }

  return { ...parsed, modelUsed: result.model };
}

export function isOpenRouterConfigured() {
  const key = getKey();
  return !!(key && !key.includes('PASTE_YOUR') && key.length > 10);
}

export function isOpenRouterApiKeyAvailable() {
  return getKey();
}