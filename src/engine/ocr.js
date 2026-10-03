/**
 * ocr.js — DEPRECATED in v2
 * Graceful integration stub targeting geminiOCR.js endpoints.
 */

import { extractIngredientsWithGemini } from './geminiOCR.js';

export async function loadOCRModel() { 
  return { backend: 'openrouter-vision' }; 
}

export async function runOCR(file, progressCb) {
  console.warn('[Deprecation Warning] runOCR invocation redirected to geminiOCR execution context.');
  return await extractIngredientsWithGemini(file, null, progressCb);
}

export function getOCRBackend() { 
  return 'openrouter-vision'; 
}